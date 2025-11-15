// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LearnToken.sol";
import "./BadgeNFT.sol";

/**
 * @title ContributionVerifier
 * @dev Contract xác minh đóng góp từ AI và mint token/NFT
 * AI backend sẽ gọi contract này sau khi xác minh thành công
 */
contract ContributionVerifier is AccessControl {
    bytes32 public constant AI_VERIFIER_ROLE = keccak256("AI_VERIFIER_ROLE");
    
    LearnToken public learnToken;
    BadgeNFT public badgeNFT;
    
    // Mapping từ contributionId đến ContributionRecord
    mapping(string => ContributionRecord) public contributions;
    
    // Mapping từ student đến danh sách contributionIds
    mapping(address => string[]) public studentContributions;
    
    // Cấu hình token reward theo loại đóng góp
    mapping(string => uint256) public contributionTypeReward;
    
    // Cấu hình điểm impact tối thiểu để mint badge
    uint256 public minImpactScoreForBadge = 70; // 0-100 scale
    
    // Streak system - thưởng cho đóng góp liên tục
    mapping(address => uint256) public contributionStreaks; // Số ngày đóng góp liên tục
    mapping(address => uint256) public lastContributionDate; // Ngày đóng góp cuối cùng
    mapping(string => uint256) public streakBonusMultipliers; // Multiplier cho streak
    
    // Referral system
    mapping(address => address) public referrers; // referrer của mỗi student
    mapping(address => uint256) public referralCounts; // Số người được refer
    mapping(address => uint256) public referralRewards; // Tổng rewards từ referral
    uint256 public referralRewardPercent = 500; // 5% reward cho referrer (basis points)
    
    // Time-based bonuses
    uint256 public weekendBonusPercent = 200; // 2% bonus cho đóng góp cuối tuần
    uint256 public holidayBonusPercent = 500; // 5% bonus cho đóng góp ngày lễ
    
    struct ContributionRecord {
        address student;
        string contributionType;  // "quiz", "club", "project", "volunteer", "research", "workshop"
        uint256 impactScore;      // 0-100, từ AI
        uint256 tokenReward;      // Số token đã mint
        uint256 badgeTokenId;     // TokenId của badge (nếu có)
        bool hasBadge;            // Đã mint badge chưa
        uint256 timestamp;        // Thời gian xác minh
        bool isVerified;          // Đã được AI xác minh
        string metadataURI;       // URI chứa metadata (ảnh, video, etc.)
    }
    
    event ContributionVerified(
        string indexed contributionId,
        address indexed student,
        string contributionType,
        uint256 impactScore,
        uint256 tokenReward,
        bool badgeMinted
    );
    
    constructor(address _learnToken, address _badgeNFT) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AI_VERIFIER_ROLE, msg.sender);
        
        learnToken = LearnToken(_learnToken);
        badgeNFT = BadgeNFT(_badgeNFT);
        
        // Thiết lập reward mặc định cho từng loại đóng góp
        contributionTypeReward["quiz"] = 10 * 10**18;        // 10 tokens
        contributionTypeReward["club"] = 20 * 10**18;         // 20 tokens
        contributionTypeReward["project"] = 50 * 10**18;      // 50 tokens
        contributionTypeReward["volunteer"] = 30 * 10**18;    // 30 tokens
        contributionTypeReward["research"] = 100 * 10**18;    // 100 tokens
        contributionTypeReward["workshop"] = 25 * 10**18;     // 25 tokens
        contributionTypeReward["seminar"] = 15 * 10**18;      // 15 tokens
        
        // Thiết lập streak bonus multipliers
        streakBonusMultipliers["7"] = 11000;   // 1.1x cho 7 ngày streak
        streakBonusMultipliers["14"] = 12000;  // 1.2x cho 14 ngày streak
        streakBonusMultipliers["30"] = 15000;  // 1.5x cho 30 ngày streak
        streakBonusMultipliers["60"] = 20000;  // 2.0x cho 60 ngày streak
        streakBonusMultipliers["90"] = 25000;  // 2.5x cho 90 ngày streak
    }
    
    /**
     * @dev AI backend gọi hàm này để xác minh và thưởng đóng góp
     * @param contributionId ID duy nhất của đóng góp
     * @param student Địa chỉ sinh viên
     * @param contributionType Loại đóng góp
     * @param impactScore Điểm tác động từ AI (0-100)
     * @param metadataURI URI chứa metadata (ảnh, video, documents)
     */
    function verifyContribution(
        string memory contributionId,
        address student,
        string memory contributionType,
        uint256 impactScore,
        string memory metadataURI
    ) external onlyRole(AI_VERIFIER_ROLE) {
        require(
            contributions[contributionId].timestamp == 0,
            "Contribution already verified"
        );
        require(impactScore <= 100, "Impact score must be <= 100");
        require(student != address(0), "Invalid student address");
        
        // Tính token reward dựa trên loại và impact score
        uint256 baseReward = contributionTypeReward[contributionType];
        require(baseReward > 0, "Invalid contribution type");
        
        // Token reward = baseReward * (impactScore / 100)
        uint256 tokenReward = (baseReward * impactScore) / 100;
        
        // Áp dụng streak bonus
        uint256 streakBonus = _calculateStreakBonus(student);
        tokenReward = (tokenReward * streakBonus) / 10000;
        
        // Áp dụng time-based bonuses
        uint256 timeBonus = _calculateTimeBonus();
        tokenReward = (tokenReward * (10000 + timeBonus)) / 10000;
        
        // Cập nhật streak
        _updateStreak(student);
        
        // Mint LearnToken
        learnToken.mint(student, tokenReward, contributionId);
        
        // Mint Badge NFT nếu impact score đủ cao
        uint256 badgeTokenId = 0;
        bool hasBadge = false;
        
        if (impactScore >= minImpactScoreForBadge) {
            string memory badgeURI = string(abi.encodePacked(
                "https://edudao.nexus/api/badge/",
                contributionId
            ));
            
            badgeTokenId = badgeNFT.mintBadge(
                student,
                contributionType,
                badgeURI,
                impactScore,
                contributionId
            );
            hasBadge = true;
        }
        
        // Lưu contribution record
        contributions[contributionId] = ContributionRecord({
            student: student,
            contributionType: contributionType,
            impactScore: impactScore,
            tokenReward: tokenReward,
            badgeTokenId: badgeTokenId,
            hasBadge: hasBadge,
            timestamp: block.timestamp,
            isVerified: true,
            metadataURI: metadataURI
        });
        
        studentContributions[student].push(contributionId);
        
        // Xử lý referral rewards
        if (referrers[student] != address(0)) {
            uint256 referralReward = (tokenReward * referralRewardPercent) / 10000;
            learnToken.mint(referrers[student], referralReward, string(abi.encodePacked("referral_", contributionId)));
            referralRewards[referrers[student]] += referralReward;
        }
        
        emit ContributionVerified(
            contributionId,
            student,
            contributionType,
            impactScore,
            tokenReward,
            hasBadge
        );
    }
    
    /**
     * @dev Đăng ký referral (sinh viên mới được refer bởi sinh viên cũ)
     */
    function registerReferral(address referrer) external {
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrers[msg.sender] == address(0), "Already referred");
        
        // Kiểm tra referrer đã có đóng góp chưa
        require(
            studentContributions[referrer].length > 0,
            "Referrer must have at least one contribution"
        );
        
        referrers[msg.sender] = referrer;
        referralCounts[referrer]++;
    }
    
    /**
     * @dev Tính streak bonus
     */
    function _calculateStreakBonus(address student) internal view returns (uint256) {
        uint256 streak = contributionStreaks[student];
        
        if (streak >= 90) {
            return streakBonusMultipliers["90"];
        } else if (streak >= 60) {
            return streakBonusMultipliers["60"];
        } else if (streak >= 30) {
            return streakBonusMultipliers["30"];
        } else if (streak >= 14) {
            return streakBonusMultipliers["14"];
        } else if (streak >= 7) {
            return streakBonusMultipliers["7"];
        }
        
        return 10000; // 1x (no bonus)
    }
    
    /**
     * @dev Cập nhật streak
     */
    function _updateStreak(address student) internal {
        uint256 today = block.timestamp / 1 days;
        uint256 lastDate = lastContributionDate[student];
        
        if (lastDate == 0) {
            // Lần đầu đóng góp
            contributionStreaks[student] = 1;
        } else if (today == lastDate) {
            // Đã đóng góp hôm nay rồi, không tăng streak
            // Nhưng vẫn giữ streak
        } else if (today == lastDate + 1) {
            // Đóng góp liên tục
            contributionStreaks[student]++;
        } else {
            // Bị break streak
            contributionStreaks[student] = 1;
        }
        
        lastContributionDate[student] = today;
    }
    
    /**
     * @dev Tính time-based bonus (weekend, holiday)
     */
    function _calculateTimeBonus() internal view returns (uint256) {
        uint256 bonus = 0;
        
        // Kiểm tra cuối tuần (Saturday = 5, Sunday = 6)
        uint256 dayOfWeek = (block.timestamp / 1 days + 4) % 7;
        if (dayOfWeek == 5 || dayOfWeek == 6) {
            bonus += weekendBonusPercent;
        }
        
        // TODO: Thêm logic kiểm tra ngày lễ
        // Có thể dùng mapping để lưu danh sách ngày lễ
        
        return bonus;
    }
    
    /**
     * @dev Lấy streak hiện tại của student
     */
    function getStreak(address student) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 lastDate = lastContributionDate[student];
        
        // Nếu đã quá 1 ngày không đóng góp, streak = 0
        if (today > lastDate + 1) {
            return 0;
        }
        
        return contributionStreaks[student];
    }
    
    /**
     * @dev Set streak bonus multiplier (admin only)
     */
    function setStreakBonusMultiplier(
        string memory streakDays,
        uint256 multiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        streakBonusMultipliers[streakDays] = multiplier;
    }
    
    /**
     * @dev Set referral reward percent (admin only)
     */
    function setReferralRewardPercent(uint256 percent) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(percent <= 1000, "Percent must be <= 10%");
        referralRewardPercent = percent;
    }
    
    /**
     * @dev Lấy thông tin referral của student
     */
    function getReferralInfo(address student) 
        external 
        view 
        returns (
            address referrer,
            uint256 referralCount,
            uint256 totalReferralRewards
        ) 
    {
        return (
            referrers[student],
            referralCounts[student],
            referralRewards[student]
        );
    }
    
    /**
     * @dev Cập nhật reward cho loại đóng góp
     */
    function setContributionTypeReward(
        string memory contributionType,
        uint256 reward
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contributionTypeReward[contributionType] = reward;
    }
    
    /**
     * @dev Cập nhật điểm impact tối thiểu để mint badge
     */
    function setMinImpactScoreForBadge(uint256 minScore) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(minScore <= 100, "Score must be <= 100");
        minImpactScoreForBadge = minScore;
    }
    
    /**
     * @dev Lấy thông tin contribution
     */
    function getContribution(string memory contributionId)
        external
        view
        returns (ContributionRecord memory)
    {
        return contributions[contributionId];
    }
    
    /**
     * @dev Lấy danh sách contributions của một sinh viên
     */
    function getStudentContributions(address student)
        external
        view
        returns (string[] memory)
    {
        return studentContributions[student];
    }
}

