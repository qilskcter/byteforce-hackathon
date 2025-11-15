// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LearnToken.sol";
import "./BadgeNFT.sol";
import "./interfaces/IBadgeNFT.sol";
import "./ContributionVerifier.sol";
import "./DAOGovernance.sol";

/**
 * @title ReputationSystem
 * @dev Hệ thống tính toán và lưu trữ hồ sơ uy tín on-chain
 * Tạo profile minh bạch, không thể làm giả cho sinh viên
 */
contract ReputationSystem is AccessControl {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    LearnToken public learnToken;
    BadgeNFT public badgeNFT;
    ContributionVerifier public contributionVerifier;
    DAOGovernance public daoGovernance;
    
    // Mapping từ student address đến StudentProfile
    mapping(address => StudentProfile) public studentProfiles;
    
    // Mapping từ student address đến danh sách projectIds
    mapping(address => string[]) public studentProjects;
    
    struct StudentProfile {
        uint256 contributionScore;    // Tổng điểm đóng góp
        uint256 governanceScore;     // Mức độ tham gia quản trị DAO
        uint256 learnScore;          // Điểm học tập
        uint256 projectIndex;        // Số lượng dự án đã làm
        uint256 leadershipIndex;      // Số lần làm leader
        uint256 totalBadges;         // Tổng số badge
        uint256 totalContributions;  // Tổng số đóng góp
        uint256 lastUpdated;         // Lần cập nhật cuối
        bool isActive;               // Profile có active không
    }
    
    struct ProjectRecord {
        string projectId;
        address student;
        string projectType;          // "research", "startup", "open-source", etc.
        uint256 impactScore;
        bool isLeader;
        uint256 timestamp;
    }
    
    mapping(string => ProjectRecord) public projects;
    
    // Leaderboard system
    address[] public leaderboard; // Top students by reputation score
    uint256 public leaderboardSize = 100; // Top 100
    mapping(address => uint256) public leaderboardPosition; // Position in leaderboard (0 = not in top)
    
    // Achievement system
    mapping(address => string[]) public studentAchievements; // Danh sách achievements đã unlock
    mapping(string => Achievement) public achievements; // Achievement definitions
    
    struct Achievement {
        string achievementId;
        string name;
        string description;
        uint256 requirement; // Requirement để unlock (reputation score, contribution count, etc.)
        string requirementType; // "reputation", "contributions", "badges", "projects"
        bool isActive;
    }
    
    event ProfileUpdated(
        address indexed student,
        uint256 contributionScore,
        uint256 governanceScore,
        uint256 learnScore
    );
    
    event ProjectRecorded(
        string indexed projectId,
        address indexed student,
        string projectType,
        bool isLeader
    );
    
    event AchievementUnlocked(
        address indexed student,
        string indexed achievementId,
        string name
    );
    
    event LeaderboardUpdated(
        address indexed student,
        uint256 newPosition,
        uint256 oldPosition
    );
    
    constructor(
        address _learnToken,
        address _badgeNFT,
        address _contributionVerifier,
        address _daoGovernance
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        
        learnToken = LearnToken(_learnToken);
        badgeNFT = BadgeNFT(_badgeNFT);
        contributionVerifier = ContributionVerifier(_contributionVerifier);
        daoGovernance = DAOGovernance(_daoGovernance);
    }
    
    /**
     * @dev Cập nhật profile của sinh viên (gọi tự động khi có đóng góp mới)
     */
    function updateStudentProfile(address student) 
        external 
        onlyRole(UPDATER_ROLE) 
    {
        StudentProfile storage profile = studentProfiles[student];
        
        // Tính ContributionScore từ số token đã kiếm được
        uint256 totalEarned = learnToken.studentTotalEarned(student);
        profile.contributionScore = totalEarned / 10**18; // Convert từ wei
        
        // Tính LearnScore từ số badge và loại badge
        uint256[] memory badges = badgeNFT.getStudentBadges(student);
        profile.totalBadges = badges.length;
        profile.learnScore = _calculateLearnScore(badges);
        
        // Tính GovernanceScore từ số lần vote và proposal
        profile.governanceScore = _calculateGovernanceScore(student);
        
        // Đếm số đóng góp
        string[] memory contributions = contributionVerifier.getStudentContributions(student);
        profile.totalContributions = contributions.length;
        
        // Đếm số dự án
        profile.projectIndex = studentProjects[student].length;
        
        profile.lastUpdated = block.timestamp;
        profile.isActive = true;
        
        // Cập nhật leaderboard
        _updateLeaderboard(student);
        
        // Kiểm tra và unlock achievements
        _checkAchievements(student);
        
        emit ProfileUpdated(
            student,
            profile.contributionScore,
            profile.governanceScore,
            profile.learnScore
        );
    }
    
    /**
     * @dev Cập nhật leaderboard
     */
    function _updateLeaderboard(address student) internal {
        uint256 totalScore = getTotalReputationScore(student);
        uint256 currentPosition = leaderboardPosition[student];
        
        // Nếu chưa có trong leaderboard
        if (currentPosition == 0) {
            // Thêm vào nếu đủ điểm
            if (leaderboard.length < leaderboardSize) {
                leaderboard.push(student);
                leaderboardPosition[student] = leaderboard.length;
            } else {
                // Tìm student có điểm thấp nhất trong leaderboard
                address lowestStudent = leaderboard[leaderboard.length - 1];
                uint256 lowestScore = getTotalReputationScore(lowestStudent);
                
                if (totalScore > lowestScore) {
                    // Thay thế
                    leaderboardPosition[lowestStudent] = 0;
                    leaderboard[leaderboard.length - 1] = student;
                    leaderboardPosition[student] = leaderboard.length;
                }
            }
        } else {
            // Đã có trong leaderboard, sắp xếp lại
            _sortLeaderboard();
        }
    }
    
    /**
     * @dev Sắp xếp leaderboard theo reputation score
     */
    function _sortLeaderboard() internal {
        // Bubble sort (đơn giản, có thể optimize sau)
        for (uint256 i = 0; i < leaderboard.length; i++) {
            for (uint256 j = 0; j < leaderboard.length - i - 1; j++) {
                uint256 score1 = getTotalReputationScore(leaderboard[j]);
                uint256 score2 = getTotalReputationScore(leaderboard[j + 1]);
                
                if (score1 < score2) {
                    address temp = leaderboard[j];
                    leaderboard[j] = leaderboard[j + 1];
                    leaderboard[j + 1] = temp;
                    
                    leaderboardPosition[leaderboard[j]] = j + 1;
                    leaderboardPosition[leaderboard[j + 1]] = j + 2;
                }
            }
        }
    }
    
    /**
     * @dev Kiểm tra và unlock achievements
     */
    function _checkAchievements(address student) internal {
        StudentProfile memory profile = studentProfiles[student];
        uint256 totalScore = getTotalReputationScore(student);
        
        // Kiểm tra các achievements
        // Achievement 1: First Contribution
        if (profile.totalContributions >= 1 && !_hasAchievement(student, "first_contribution")) {
            _unlockAchievement(student, "first_contribution");
        }
        
        // Achievement 2: 10 Contributions
        if (profile.totalContributions >= 10 && !_hasAchievement(student, "contributor_10")) {
            _unlockAchievement(student, "contributor_10");
        }
        
        // Achievement 3: 100 Contributions
        if (profile.totalContributions >= 100 && !_hasAchievement(student, "contributor_100")) {
            _unlockAchievement(student, "contributor_100");
        }
        
        // Achievement 4: First Badge
        if (profile.totalBadges >= 1 && !_hasAchievement(student, "first_badge")) {
            _unlockAchievement(student, "first_badge");
        }
        
        // Achievement 5: Badge Collector (10 badges)
        if (profile.totalBadges >= 10 && !_hasAchievement(student, "badge_collector")) {
            _unlockAchievement(student, "badge_collector");
        }
        
        // Achievement 6: Project Leader
        if (profile.leadershipIndex >= 1 && !_hasAchievement(student, "project_leader")) {
            _unlockAchievement(student, "project_leader");
        }
        
        // Achievement 7: Top 10 Reputation
        if (totalScore >= 10000 && leaderboardPosition[student] <= 10 && !_hasAchievement(student, "top_10")) {
            _unlockAchievement(student, "top_10");
        }
        
        // Achievement 8: Top 1 Reputation
        if (leaderboardPosition[student] == 1 && !_hasAchievement(student, "top_1")) {
            _unlockAchievement(student, "top_1");
        }
    }
    
    /**
     * @dev Unlock achievement
     */
    function _unlockAchievement(address student, string memory achievementId) internal {
        studentAchievements[student].push(achievementId);
        emit AchievementUnlocked(student, achievementId, achievementId);
    }
    
    /**
     * @dev Kiểm tra student đã có achievement chưa
     */
    function _hasAchievement(address student, string memory achievementId) 
        internal 
        view 
        returns (bool) 
    {
        string[] memory achievements = studentAchievements[student];
        for (uint256 i = 0; i < achievements.length; i++) {
            if (keccak256(bytes(achievements[i])) == keccak256(bytes(achievementId))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Lấy leaderboard (top N students)
     */
    function getLeaderboard(uint256 limit) 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        uint256 size = limit > leaderboard.length ? leaderboard.length : limit;
        address[] memory topStudents = new address[](size);
        uint256[] memory scores = new uint256[](size);
        
        for (uint256 i = 0; i < size; i++) {
            topStudents[i] = leaderboard[i];
            scores[i] = getTotalReputationScore(leaderboard[i]);
        }
        
        return (topStudents, scores);
    }
    
    /**
     * @dev Lấy position trong leaderboard
     */
    function getLeaderboardPosition(address student) 
        external 
        view 
        returns (uint256) 
    {
        return leaderboardPosition[student];
    }
    
    /**
     * @dev Lấy achievements của student
     */
    function getStudentAchievements(address student) 
        external 
        view 
        returns (string[] memory) 
    {
        return studentAchievements[student];
    }
    
    /**
     * @dev Tạo achievement mới (admin only)
     */
    function createAchievement(
        string memory achievementId,
        string memory name,
        string memory description,
        uint256 requirement,
        string memory requirementType
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        achievements[achievementId] = Achievement({
            achievementId: achievementId,
            name: name,
            description: description,
            requirement: requirement,
            requirementType: requirementType,
            isActive: true
        });
    }
    
    /**
     * @dev Set leaderboard size (admin only)
     */
    function setLeaderboardSize(uint256 size) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(size > 0 && size <= 1000, "Size must be 1-1000");
        leaderboardSize = size;
    }
    
    /**
     * @dev Ghi nhận dự án của sinh viên
     */
    function recordProject(
        string memory projectId,
        address student,
        string memory projectType,
        uint256 impactScore,
        bool isLeader
    ) external onlyRole(UPDATER_ROLE) {
        require(
            projects[projectId].timestamp == 0,
            "Project already recorded"
        );
        
        projects[projectId] = ProjectRecord({
            projectId: projectId,
            student: student,
            projectType: projectType,
            impactScore: impactScore,
            isLeader: isLeader,
            timestamp: block.timestamp
        });
        
        studentProjects[student].push(projectId);
        
        if (isLeader) {
            studentProfiles[student].leadershipIndex++;
        }
        
        emit ProjectRecorded(projectId, student, projectType, isLeader);
    }
    
    /**
     * @dev Tính LearnScore dựa trên badges
     */
    function _calculateLearnScore(uint256[] memory badgeIds) 
        internal 
        view 
        returns (uint256) 
    {
        uint256 score = 0;
        
        for (uint256 i = 0; i < badgeIds.length; i++) {
            IBadgeNFT.BadgeInfo memory badge = badgeNFT.getBadgeDetails(badgeIds[i]);
            score += badge.impactScore; // Tổng impact score của tất cả badges
        }
        
        return score;
    }
    
    /**
     * @dev Tính GovernanceScore dựa trên tham gia DAO
     * (Simplified - trong thực tế cần query từ Governor contract)
     */
    function _calculateGovernanceScore(address student) 
        internal 
        view 
        returns (uint256) 
    {
        // Base score từ số token hold (có thể vote)
        uint256 tokenBalance = learnToken.balanceOf(student);
        uint256 baseScore = tokenBalance / 10**18;
        
        // TODO: Thêm logic query số lần đã vote và tạo proposal
        // Có thể cần thêm events hoặc storage trong DAOGovernance
        
        return baseScore;
    }
    
    /**
     * @dev Lấy profile đầy đủ của sinh viên
     */
    function getStudentProfile(address student)
        external
        view
        returns (StudentProfile memory)
    {
        return studentProfiles[student];
    }
    
    /**
     * @dev Lấy danh sách dự án của sinh viên
     */
    function getStudentProjects(address student)
        external
        view
        returns (string[] memory)
    {
        return studentProjects[student];
    }
    
    /**
     * @dev Lấy thông tin chi tiết của một dự án
     */
    function getProjectInfo(string memory projectId)
        external
        view
        returns (ProjectRecord memory)
    {
        return projects[projectId];
    }
    
    /**
     * @dev Tính tổng điểm uy tín (composite score)
     */
    function getTotalReputationScore(address student)
        external
        view
        returns (uint256)
    {
        StudentProfile memory profile = studentProfiles[student];
        
        // Weighted composite score
        uint256 totalScore = 
            (profile.contributionScore * 3) +      // 30%
            (profile.governanceScore * 2) +        // 20%
            (profile.learnScore * 3) +             // 30%
            (profile.projectIndex * 50) +         // 15%
            (profile.leadershipIndex * 100);      // 5%
        
        return totalScore;
    }
}

