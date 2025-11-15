// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LearnToken.sol";
import "./DAOGovernance.sol";

/**
 * @title FundingPool
 * @dev Quỹ tài trợ với Quadratic Funding mechanism
 * Tương tự Gitcoin nhưng dành cho giáo dục
 */
contract FundingPool is AccessControl, ReentrancyGuard {
    bytes32 public constant FUNDER_ROLE = keccak256("FUNDER_ROLE");
    
    IERC20 public fundingToken; // Token dùng để funding (có thể là USDC, DAI, hoặc ETH)
    LearnToken public learnToken;
    DAOGovernance public daoGovernance;
    
    // Mapping từ projectId đến FundingProject
    mapping(string => FundingProject) public projects;
    
    // Mapping từ projectId đến mapping(address => uint256) - số tiền mỗi người đóng góp
    mapping(string => mapping(address => uint256)) public contributions;
    
    // Mapping từ projectId đến danh sách contributors
    mapping(string => address[]) public projectContributors;
    
    // Mapping từ roundId đến FundingRound
    mapping(uint256 => FundingRound) public fundingRounds;
    
    uint256 public currentRoundId;
    
    struct FundingProject {
        string projectId;
        address proposer;
        string title;
        string description;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 quadraticAmount;    // Số tiền tính theo quadratic funding
        uint256 matchingPool;       // Số tiền từ matching pool
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isApproved;
        uint256 voteCount;          // Số vote từ DAO
    }
    
    struct FundingRound {
        uint256 roundId;
        uint256 totalMatchingPool;  // Tổng quỹ matching
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        string[] projectIds;        // Danh sách projects trong round này
    }
    
    event ProjectCreated(
        string indexed projectId,
        address indexed proposer,
        string title,
        uint256 targetAmount
    );
    
    event ProjectApproved(string indexed projectId, bool approved);
    
    event ContributionMade(
        string indexed projectId,
        address indexed contributor,
        uint256 amount,
        uint256 quadraticValue
    );
    
    event RoundCreated(
        uint256 indexed roundId,
        uint256 matchingPool,
        uint256 startTime,
        uint256 endTime
    );
    
    event FundsDistributed(
        string indexed projectId,
        uint256 totalAmount,
        uint256 matchingAmount
    );
    
    constructor(
        address _fundingToken,
        address _learnToken,
        address _daoGovernance
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FUNDER_ROLE, msg.sender);
        
        fundingToken = IERC20(_fundingToken);
        learnToken = LearnToken(_learnToken);
        daoGovernance = DAOGovernance(_daoGovernance);
    }
    
    /**
     * @dev Tạo funding project mới
     */
    function createProject(
        string memory projectId,
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 durationDays
    ) external {
        require(
            projects[projectId].startTime == 0,
            "Project already exists"
        );
        require(targetAmount > 0, "Target amount must be > 0");
        
        projects[projectId] = FundingProject({
            projectId: projectId,
            proposer: msg.sender,
            title: title,
            description: description,
            targetAmount: targetAmount,
            currentAmount: 0,
            quadraticAmount: 0,
            matchingPool: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            isActive: true,
            isApproved: false,
            voteCount: 0
        });
        
        emit ProjectCreated(projectId, msg.sender, title, targetAmount);
    }
    
    /**
     * @dev Duyệt project (cần vote từ DAO hoặc admin)
     */
    function approveProject(string memory projectId, bool approved)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        FundingProject storage project = projects[projectId];
        require(project.startTime > 0, "Project does not exist");
        
        project.isApproved = approved;
        emit ProjectApproved(projectId, approved);
    }
    
    /**
     * @dev Đóng góp cho project (Quadratic Funding)
     */
    function contribute(
        string memory projectId,
        uint256 amount
    ) external nonReentrant {
        FundingProject storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(project.isApproved, "Project not approved");
        require(block.timestamp < project.endTime, "Funding ended");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer token từ contributor
        require(
            fundingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Cập nhật contribution
        if (contributions[projectId][msg.sender] == 0) {
            projectContributors[projectId].push(msg.sender);
        }
        contributions[projectId][msg.sender] += amount;
        project.currentAmount += amount;
        
        // Tính quadratic value: sqrt(amount)
        uint256 quadraticValue = _sqrt(amount);
        project.quadraticAmount += quadraticValue;
        
        emit ContributionMade(projectId, msg.sender, amount, quadraticValue);
    }
    
    /**
     * @dev Tạo funding round mới
     */
    function createFundingRound(
        uint256 matchingPool,
        uint256 durationDays
    ) external onlyRole(FUNDER_ROLE) returns (uint256) {
        currentRoundId++;
        
        fundingRounds[currentRoundId] = FundingRound({
            roundId: currentRoundId,
            totalMatchingPool: matchingPool,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            isActive: true,
            projectIds: new string[](0)
        });
        
        // Transfer matching pool vào contract
        require(
            fundingToken.transferFrom(msg.sender, address(this), matchingPool),
            "Matching pool transfer failed"
        );
        
        emit RoundCreated(
            currentRoundId,
            matchingPool,
            block.timestamp,
            block.timestamp + (durationDays * 1 days)
        );
        
        return currentRoundId;
    }
    
    /**
     * @dev Thêm project vào funding round
     */
    function addProjectToRound(
        uint256 roundId,
        string memory projectId
    ) external onlyRole(FUNDER_ROLE) {
        FundingRound storage round = fundingRounds[roundId];
        require(round.isActive, "Round not active");
        
        FundingProject storage project = projects[projectId];
        require(project.isApproved, "Project not approved");
        
        round.projectIds.push(projectId);
    }
    
    /**
     * @dev Phân phối matching funds sau khi round kết thúc (Quadratic Funding)
     */
    function distributeMatchingFunds(uint256 roundId)
        external
        onlyRole(FUNDER_ROLE)
        nonReentrant
    {
        FundingRound storage round = fundingRounds[roundId];
        require(block.timestamp >= round.endTime, "Round not ended");
        require(round.isActive, "Round already closed");
        
        uint256 totalQuadratic = 0;
        
        // Tính tổng quadratic amount của tất cả projects
        for (uint256 i = 0; i < round.projectIds.length; i++) {
            FundingProject storage project = projects[round.projectIds[i]];
            totalQuadratic += project.quadraticAmount;
        }
        
        if (totalQuadratic == 0) {
            round.isActive = false;
            return;
        }
        
        // Phân phối matching pool theo tỷ lệ quadratic
        for (uint256 i = 0; i < round.projectIds.length; i++) {
            FundingProject storage project = projects[round.projectIds[i]];
            
            if (project.quadraticAmount > 0) {
                uint256 matchingAmount = (round.totalMatchingPool * project.quadraticAmount) / totalQuadratic;
                project.matchingPool += matchingAmount;
                
                // Transfer cho proposer
                require(
                    fundingToken.transfer(project.proposer, matchingAmount),
                    "Matching transfer failed"
                );
                
                emit FundsDistributed(
                    project.projectId,
                    project.currentAmount + matchingAmount,
                    matchingAmount
                );
            }
        }
        
        round.isActive = false;
    }
    
    /**
     * @dev Tính căn bậc hai (đơn giản, dùng cho quadratic funding)
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    /**
     * @dev Lấy thông tin project
     */
    function getProject(string memory projectId)
        external
        view
        returns (FundingProject memory)
    {
        return projects[projectId];
    }
    
    /**
     * @dev Lấy danh sách contributors của project
     */
    function getProjectContributors(string memory projectId)
        external
        view
        returns (address[] memory)
    {
        return projectContributors[projectId];
    }
}

