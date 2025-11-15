// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/**
 * @title BadgeNFT
 * @dev Soulbound Token (SBT) - NFT không thể chuyển nhượng
 * Đại diện cho thành tích và huy hiệu của sinh viên
 */
contract BadgeNFT is ERC721, ERC721URIStorage, AccessControl, ERC721Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId;
    
    // Mapping từ tokenId đến thông tin badge
    mapping(uint256 => BadgeInfo) public badgeInfo;
    
    // Mapping từ student address đến danh sách tokenIds
    mapping(address => uint256[]) public studentBadges;
    
    // Mapping từ badgeType đến số lượng đã mint
    mapping(string => uint256) public badgeTypeCount;
    
    // Badge levels
    enum BadgeLevel {
        BRONZE,     // 0
        SILVER,     // 1
        GOLD,       // 2
        PLATINUM,   // 3
        DIAMOND     // 4
    }
    
    // Mapping từ badgeType đến số lượng cần để upgrade
    mapping(string => mapping(BadgeLevel => uint256)) public upgradeRequirements;
    
    // Mapping từ student + badgeType đến level hiện tại
    mapping(address => mapping(string => BadgeLevel)) public studentBadgeLevels;
    
    // Mapping từ student + badgeType đến số lượng badge đã có
    mapping(address => mapping(string => uint256)) public studentBadgeCounts;
    
    struct BadgeInfo {
        string badgeType;        // "quiz", "club", "project", "volunteer", "research", etc.
        uint256 timestamp;       // Thời gian mint
        uint256 impactScore;     // Điểm tác động từ AI
        string contributionId;   // ID của đóng góp liên quan
        bool isVerified;         // Đã được AI xác minh
        BadgeLevel level;        // Level của badge
        uint256 rarity;          // Rarity score (0-1000)
    }
    
    event BadgeMinted(
        address indexed student,
        uint256 indexed tokenId,
        string badgeType,
        uint256 impactScore,
        string contributionId,
        BadgeLevel level
    );
    
    event BadgeUpgraded(
        address indexed student,
        string badgeType,
        BadgeLevel oldLevel,
        BadgeLevel newLevel,
        uint256 tokenId
    );
    
    constructor() ERC721("EduDAO Badge", "EDUBADGE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Thiết lập upgrade requirements mặc định
        // Ví dụ: cần 3 Bronze để upgrade lên Silver
        _setDefaultUpgradeRequirements();
    }
    
    /**
     * @dev Thiết lập upgrade requirements mặc định
     */
    function _setDefaultUpgradeRequirements() internal {
        string[7] memory badgeTypes = ["quiz", "club", "project", "volunteer", "research", "workshop", "seminar"];
        
        for (uint256 i = 0; i < badgeTypes.length; i++) {
            upgradeRequirements[badgeTypes[i]][BadgeLevel.SILVER] = 3;    // 3 Bronze → Silver
            upgradeRequirements[badgeTypes[i]][BadgeLevel.GOLD] = 5;      // 5 Silver → Gold
            upgradeRequirements[badgeTypes[i]][BadgeLevel.PLATINUM] = 7;   // 7 Gold → Platinum
            upgradeRequirements[badgeTypes[i]][BadgeLevel.DIAMOND] = 10;   // 10 Platinum → Diamond
        }
    }
    
    /**
     * @dev Mint badge NFT cho sinh viên (Soulbound - không thể transfer)
     * @param to Địa chỉ sinh viên
     * @param badgeType Loại badge ("quiz", "club", "project", etc.)
     * @param tokenURI URI chứa metadata của badge
     * @param impactScore Điểm tác động từ AI
     * @param contributionId ID của đóng góp
     */
    function mintBadge(
        address to,
        string memory badgeType,
        string memory tokenURI,
        uint256 impactScore,
        string memory contributionId
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Xác định level và rarity dựa trên impact score và số lượng badge hiện có
        BadgeLevel level = _determineBadgeLevel(to, badgeType, impactScore);
        uint256 rarity = _calculateRarity(impactScore, level);
        
        badgeInfo[tokenId] = BadgeInfo({
            badgeType: badgeType,
            timestamp: block.timestamp,
            impactScore: impactScore,
            contributionId: contributionId,
            isVerified: true,
            level: level,
            rarity: rarity
        });
        
        studentBadges[to].push(tokenId);
        badgeTypeCount[badgeType]++;
        studentBadgeCounts[to][badgeType]++;
        
        // Kiểm tra và upgrade badge nếu đủ điều kiện
        _checkAndUpgradeBadge(to, badgeType);
        
        emit BadgeMinted(to, tokenId, badgeType, impactScore, contributionId, level);
        
        return tokenId;
    }
    
    /**
     * @dev Xác định level của badge dựa trên impact score và số lượng badge hiện có
     */
    function _determineBadgeLevel(
        address student,
        string memory badgeType,
        uint256 impactScore
    ) internal view returns (BadgeLevel) {
        BadgeLevel currentLevel = studentBadgeLevels[student][badgeType];
        uint256 count = studentBadgeCounts[student][badgeType];
        
        // Nếu impact score rất cao, có thể skip level
        if (impactScore >= 95 && currentLevel < BadgeLevel.DIAMOND) {
            return BadgeLevel.DIAMOND;
        } else if (impactScore >= 90 && currentLevel < BadgeLevel.PLATINUM) {
            return BadgeLevel.PLATINUM;
        } else if (impactScore >= 85 && currentLevel < BadgeLevel.GOLD) {
            return BadgeLevel.GOLD;
        } else if (impactScore >= 80 && currentLevel < BadgeLevel.SILVER) {
            return BadgeLevel.SILVER;
        }
        
        // Mặc định là Bronze cho badge đầu tiên
        if (count == 0) {
            return BadgeLevel.BRONZE;
        }
        
        return currentLevel;
    }
    
    /**
     * @dev Tính rarity score (0-1000)
     */
    function _calculateRarity(uint256 impactScore, BadgeLevel level) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 baseRarity = impactScore * 10; // 0-1000
        
        // Bonus rarity theo level
        if (level == BadgeLevel.DIAMOND) {
            baseRarity += 200;
        } else if (level == BadgeLevel.PLATINUM) {
            baseRarity += 150;
        } else if (level == BadgeLevel.GOLD) {
            baseRarity += 100;
        } else if (level == BadgeLevel.SILVER) {
            baseRarity += 50;
        }
        
        return baseRarity > 1000 ? 1000 : baseRarity;
    }
    
    /**
     * @dev Kiểm tra và upgrade badge nếu đủ điều kiện
     */
    function _checkAndUpgradeBadge(address student, string memory badgeType) internal {
        BadgeLevel currentLevel = studentBadgeLevels[student][badgeType];
        uint256 count = studentBadgeCounts[student][badgeType];
        
        // Kiểm tra upgrade lên Silver
        if (currentLevel == BadgeLevel.BRONZE && 
            count >= upgradeRequirements[badgeType][BadgeLevel.SILVER]) {
            studentBadgeLevels[student][badgeType] = BadgeLevel.SILVER;
            emit BadgeUpgraded(student, badgeType, BadgeLevel.BRONZE, BadgeLevel.SILVER, 0);
        }
        // Kiểm tra upgrade lên Gold
        else if (currentLevel == BadgeLevel.SILVER && 
                 count >= upgradeRequirements[badgeType][BadgeLevel.GOLD]) {
            studentBadgeLevels[student][badgeType] = BadgeLevel.GOLD;
            emit BadgeUpgraded(student, badgeType, BadgeLevel.SILVER, BadgeLevel.GOLD, 0);
        }
        // Kiểm tra upgrade lên Platinum
        else if (currentLevel == BadgeLevel.GOLD && 
                 count >= upgradeRequirements[badgeType][BadgeLevel.PLATINUM]) {
            studentBadgeLevels[student][badgeType] = BadgeLevel.PLATINUM;
            emit BadgeUpgraded(student, badgeType, BadgeLevel.GOLD, BadgeLevel.PLATINUM, 0);
        }
        // Kiểm tra upgrade lên Diamond
        else if (currentLevel == BadgeLevel.PLATINUM && 
                 count >= upgradeRequirements[badgeType][BadgeLevel.DIAMOND]) {
            studentBadgeLevels[student][badgeType] = BadgeLevel.DIAMOND;
            emit BadgeUpgraded(student, badgeType, BadgeLevel.PLATINUM, BadgeLevel.DIAMOND, 0);
        }
    }
    
    /**
     * @dev Upgrade badge thủ công (admin only, cho special cases)
     */
    function upgradeBadge(
        address student,
        string memory badgeType,
        BadgeLevel newLevel
    ) external onlyRole(MINTER_ROLE) {
        BadgeLevel oldLevel = studentBadgeLevels[student][badgeType];
        require(newLevel > oldLevel, "New level must be higher");
        
        studentBadgeLevels[student][badgeType] = newLevel;
        emit BadgeUpgraded(student, badgeType, oldLevel, newLevel, 0);
    }
    
    /**
     * @dev Lấy level hiện tại của badge type cho student
     */
    function getBadgeLevel(address student, string memory badgeType) 
        external 
        view 
        returns (BadgeLevel) 
    {
        return studentBadgeLevels[student][badgeType];
    }
    
    /**
     * @dev Lấy số lượng badge của một type cho student
     */
    function getBadgeCount(address student, string memory badgeType) 
        external 
        view 
        returns (uint256) 
    {
        return studentBadgeCounts[student][badgeType];
    }
    
    /**
     * @dev Set upgrade requirements cho badge type (admin only)
     */
    function setUpgradeRequirement(
        string memory badgeType,
        BadgeLevel level,
        uint256 requirement
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        upgradeRequirements[badgeType][level] = requirement;
    }
    
    /**
     * @dev Lấy danh sách badge của một sinh viên
     */
    function getStudentBadges(address student) external view returns (uint256[] memory) {
        return studentBadges[student];
    }
    
    /**
     * @dev Lấy thông tin chi tiết của một badge
     */
    function getBadgeDetails(uint256 tokenId) external view returns (BadgeInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        return badgeInfo[tokenId];
    }
    
    /**
     * @dev Override transfer để chặn chuyển nhượng (Soulbound Token)
     */
    function _update(address to, address from, uint256 tokenId) internal override(ERC721) {
        require(
            from == address(0) || to == address(0),
            "BadgeNFT: Token is soulbound and cannot be transferred"
        );
        super._update(to, from, tokenId);
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

