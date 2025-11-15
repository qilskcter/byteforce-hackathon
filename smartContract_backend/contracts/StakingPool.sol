// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LearnToken.sol";

/**
 * @title StakingPool
 * @dev Hệ thống staking LearnToken để nhận rewards và tăng voting power
 * Sinh viên stake token → nhận bonus rewards và có thể tạo proposal
 */
contract StakingPool is AccessControl, ReentrancyGuard {
    bytes32 public constant REWARDER_ROLE = keccak256("REWARDER_ROLE");
    
    LearnToken public learnToken;
    
    // Staking period options (in seconds)
    uint256 public constant STAKING_30_DAYS = 30 days;
    uint256 public constant STAKING_90_DAYS = 90 days;
    uint256 public constant STAKING_180_DAYS = 180 days;
    uint256 public constant STAKING_365_DAYS = 365 days;
    
    // Reward multipliers (basis points, 10000 = 1x)
    uint256 public rewardMultiplier30Days = 10500;   // 1.05x
    uint256 public rewardMultiplier90Days = 11500;   // 1.15x
    uint256 public rewardMultiplier180Days = 13000;  // 1.30x
    uint256 public rewardMultiplier365Days = 15000;  // 1.50x
    
    // Annual Percentage Yield (APY) for each period
    uint256 public apy30Days = 500;   // 5% APY
    uint256 public apy90Days = 1000;  // 10% APY
    uint256 public apy180Days = 1500; // 15% APY
    uint256 public apy365Days = 2000; // 20% APY
    
    struct StakeInfo {
        address staker;
        uint256 amount;
        uint256 stakingPeriod;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardMultiplier;
        uint256 totalRewards;
        bool isActive;
        bool isClaimed;
    }
    
    // Mapping từ staker address đến danh sách stake IDs
    mapping(address => uint256[]) public userStakes;
    
    // Mapping từ stakeId đến StakeInfo
    mapping(uint256 => StakeInfo) public stakes;
    
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 private _nextStakeId;
    
    event Staked(
        address indexed staker,
        uint256 indexed stakeId,
        uint256 amount,
        uint256 stakingPeriod,
        uint256 endTime
    );
    
    event Unstaked(
        address indexed staker,
        uint256 indexed stakeId,
        uint256 amount,
        uint256 rewards
    );
    
    event RewardsClaimed(
        address indexed staker,
        uint256 indexed stakeId,
        uint256 rewards
    );
    
    constructor(address _learnToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARDER_ROLE, msg.sender);
        
        learnToken = LearnToken(_learnToken);
    }
    
    /**
     * @dev Stake LearnToken với thời gian cụ thể
     * @param amount Số lượng token stake
     * @param stakingPeriod Thời gian stake (30, 90, 180, 365 days)
     */
    function stake(uint256 amount, uint256 stakingPeriod) 
        external 
        nonReentrant 
    {
        require(amount > 0, "Amount must be > 0");
        require(_isValidStakingPeriod(stakingPeriod), "Invalid staking period");
        
        // Transfer token từ staker
        require(
            learnToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        uint256 stakeId = _nextStakeId++;
        uint256 rewardMultiplier = _getRewardMultiplier(stakingPeriod);
        
        stakes[stakeId] = StakeInfo({
            staker: msg.sender,
            amount: amount,
            stakingPeriod: stakingPeriod,
            startTime: block.timestamp,
            endTime: block.timestamp + stakingPeriod,
            rewardMultiplier: rewardMultiplier,
            totalRewards: 0,
            isActive: true,
            isClaimed: false
        });
        
        userStakes[msg.sender].push(stakeId);
        totalStaked += amount;
        
        emit Staked(msg.sender, stakeId, amount, stakingPeriod, block.timestamp + stakingPeriod);
    }
    
    /**
     * @dev Unstake và claim rewards
     */
    function unstake(uint256 stakeId) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[stakeId];
        require(stakeInfo.staker == msg.sender, "Not your stake");
        require(stakeInfo.isActive, "Stake not active");
        require(block.timestamp >= stakeInfo.endTime, "Staking period not ended");
        
        uint256 rewards = _calculateRewards(stakeId);
        
        stakeInfo.isActive = false;
        stakeInfo.isClaimed = true;
        stakeInfo.totalRewards = rewards;
        
        totalStaked -= stakeInfo.amount;
        totalRewardsDistributed += rewards;
        
        // Transfer staked amount + rewards
        require(
            learnToken.transfer(msg.sender, stakeInfo.amount + rewards),
            "Transfer failed"
        );
        
        emit Unstaked(msg.sender, stakeId, stakeInfo.amount, rewards);
    }
    
    /**
     * @dev Claim rewards mà không unstake (chỉ claim rewards, giữ stake)
     */
    function claimRewards(uint256 stakeId) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[stakeId];
        require(stakeInfo.staker == msg.sender, "Not your stake");
        require(stakeInfo.isActive, "Stake not active");
        
        uint256 rewards = _calculateRewards(stakeId);
        require(rewards > 0, "No rewards to claim");
        
        stakeInfo.totalRewards += rewards;
        totalRewardsDistributed += rewards;
        
        // Reset start time để tính rewards tiếp theo
        stakeInfo.startTime = block.timestamp;
        
        require(learnToken.transfer(msg.sender, rewards), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, stakeId, rewards);
    }
    
    /**
     * @dev Tính rewards cho một stake
     */
    function _calculateRewards(uint256 stakeId) internal view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[stakeId];
        if (!stakeInfo.isActive) return 0;
        
        uint256 apy = _getAPY(stakeInfo.stakingPeriod);
        uint256 timeStaked = block.timestamp - stakeInfo.startTime;
        uint256 timeInYears = (timeStaked * 1e18) / 365 days;
        
        // Rewards = amount * APY * (time / 1 year)
        uint256 rewards = (stakeInfo.amount * apy * timeInYears) / (10000 * 1e18);
        
        return rewards;
    }
    
    /**
     * @dev Lấy APY cho staking period
     */
    function _getAPY(uint256 stakingPeriod) internal view returns (uint256) {
        if (stakingPeriod == STAKING_30_DAYS) return apy30Days;
        if (stakingPeriod == STAKING_90_DAYS) return apy90Days;
        if (stakingPeriod == STAKING_180_DAYS) return apy180Days;
        if (stakingPeriod == STAKING_365_DAYS) return apy365Days;
        return 0;
    }
    
    /**
     * @dev Lấy reward multiplier cho staking period
     */
    function _getRewardMultiplier(uint256 stakingPeriod) internal view returns (uint256) {
        if (stakingPeriod == STAKING_30_DAYS) return rewardMultiplier30Days;
        if (stakingPeriod == STAKING_90_DAYS) return rewardMultiplier90Days;
        if (stakingPeriod == STAKING_180_DAYS) return rewardMultiplier180Days;
        if (stakingPeriod == STAKING_365_DAYS) return rewardMultiplier365Days;
        return 10000; // 1x default
    }
    
    /**
     * @dev Kiểm tra staking period có hợp lệ không
     */
    function _isValidStakingPeriod(uint256 period) internal pure returns (bool) {
        return period == STAKING_30_DAYS || 
               period == STAKING_90_DAYS || 
               period == STAKING_180_DAYS || 
               period == STAKING_365_DAYS;
    }
    
    /**
     * @dev Lấy tổng số token đang stake của một user
     */
    function getTotalStaked(address user) external view returns (uint256) {
        uint256 total = 0;
        uint256[] memory stakeIds = userStakes[user];
        
        for (uint256 i = 0; i < stakeIds.length; i++) {
            if (stakes[stakeIds[i]].isActive) {
                total += stakes[stakeIds[i]].amount;
            }
        }
        
        return total;
    }
    
    /**
     * @dev Lấy tổng rewards có thể claim của một user
     */
    function getTotalPendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        uint256[] memory stakeIds = userStakes[user];
        
        for (uint256 i = 0; i < stakeIds.length; i++) {
            if (stakes[stakeIds[i]].isActive) {
                total += _calculateRewards(stakeIds[i]);
            }
        }
        
        return total;
    }
    
    /**
     * @dev Lấy danh sách stake IDs của user
     */
    function getUserStakes(address user) external view returns (uint256[] memory) {
        return userStakes[user];
    }
    
    /**
     * @dev Lấy thông tin stake
     */
    function getStakeInfo(uint256 stakeId) external view returns (StakeInfo memory) {
        return stakes[stakeId];
    }
    
    /**
     * @dev Set APY cho các staking periods (admin only)
     */
    function setAPY(
        uint256 stakingPeriod,
        uint256 newAPY
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAPY <= 10000, "APY must be <= 100%");
        
        if (stakingPeriod == STAKING_30_DAYS) {
            apy30Days = newAPY;
        } else if (stakingPeriod == STAKING_90_DAYS) {
            apy90Days = newAPY;
        } else if (stakingPeriod == STAKING_180_DAYS) {
            apy180Days = newAPY;
        } else if (stakingPeriod == STAKING_365_DAYS) {
            apy365Days = newAPY;
        } else {
            revert("Invalid staking period");
        }
    }
    
    /**
     * @dev Deposit rewards vào pool (admin/rewarder)
     */
    function depositRewards(uint256 amount) external onlyRole(REWARDER_ROLE) {
        require(learnToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
}

