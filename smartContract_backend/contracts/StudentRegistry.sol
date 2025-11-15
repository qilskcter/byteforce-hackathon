// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StudentRegistry
 * @dev Quản lý thông tin sinh viên và vùng miền để hỗ trợ Local Impact Boost
 * Sinh viên vùng ĐBSCL/miền núi được bonus vote weight
 */
contract StudentRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    
    // Enum cho các vùng miền
    enum Region {
        NONE,           // Chưa đăng ký
        HANOI,          // Hà Nội
        HOCHIMINH,      // TP. Hồ Chí Minh
        CENTRAL,        // Miền Trung
        HIGHLAND,       // Tây Nguyên
        MEKONG,         // Đồng bằng sông Cửu Long (ĐBSCL)
        MOUNTAINOUS     // Miền núi phía Bắc
    }
    
    // Mapping từ student address đến StudentInfo
    mapping(address => StudentInfo) public students;
    
    // Mapping từ student address đến vote weight multiplier (basis points, 10000 = 1x)
    mapping(address => uint256) public voteWeightMultipliers;
    
    // Base multiplier (10000 = 1x = 100%)
    uint256 public constant BASE_MULTIPLIER = 10000;
    
    // Default multiplier cho các vùng
    uint256 public mekongMultiplier = 12000;      // 1.2x cho ĐBSCL
    uint256 public mountainousMultiplier = 12000; // 1.2x cho miền núi
    uint256 public highlandMultiplier = 11500;    // 1.15x cho Tây Nguyên
    uint256 public defaultMultiplier = 10000;      // 1.0x cho các vùng khác
    
    struct StudentInfo {
        address studentAddress;
        string studentId;          // Mã sinh viên
        string name;               // Tên sinh viên
        Region region;             // Vùng miền
        uint256 registeredAt;      // Thời gian đăng ký
        bool isActive;             // Có active không
        string metadataURI;        // URI chứa metadata (DID, etc.)
    }
    
    event StudentRegistered(
        address indexed student,
        string studentId,
        Region region,
        uint256 voteWeightMultiplier
    );
    
    event StudentUpdated(
        address indexed student,
        Region oldRegion,
        Region newRegion
    );
    
    event MultiplierUpdated(
        Region region,
        uint256 oldMultiplier,
        uint256 newMultiplier
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }
    
    /**
     * @dev Đăng ký sinh viên mới
     * @param student Địa chỉ sinh viên
     * @param studentId Mã sinh viên
     * @param name Tên sinh viên
     * @param region Vùng miền
     * @param metadataURI URI chứa metadata
     */
    function registerStudent(
        address student,
        string memory studentId,
        string memory name,
        Region region,
        string memory metadataURI
    ) external onlyRole(REGISTRAR_ROLE) {
        require(student != address(0), "Invalid student address");
        require(students[student].registeredAt == 0, "Student already registered");
        require(region != Region.NONE, "Invalid region");
        
        uint256 multiplier = _getMultiplierForRegion(region);
        
        students[student] = StudentInfo({
            studentAddress: student,
            studentId: studentId,
            name: name,
            region: region,
            registeredAt: block.timestamp,
            isActive: true,
            metadataURI: metadataURI
        });
        
        voteWeightMultipliers[student] = multiplier;
        
        emit StudentRegistered(student, studentId, region, multiplier);
    }
    
    /**
     * @dev Cập nhật thông tin sinh viên (chủ yếu là vùng miền)
     */
    function updateStudentRegion(
        address student,
        Region newRegion
    ) external onlyRole(REGISTRAR_ROLE) {
        require(students[student].registeredAt > 0, "Student not registered");
        require(newRegion != Region.NONE, "Invalid region");
        
        Region oldRegion = students[student].region;
        students[student].region = newRegion;
        
        uint256 newMultiplier = _getMultiplierForRegion(newRegion);
        voteWeightMultipliers[student] = newMultiplier;
        
        emit StudentUpdated(student, oldRegion, newRegion);
    }
    
    /**
     * @dev Batch register nhiều sinh viên (cho import từ CSV/Excel)
     */
    function batchRegisterStudents(
        address[] calldata studentAddresses,
        string[] calldata studentIds,
        string[] calldata names,
        Region[] calldata regions,
        string[] calldata metadataURIs
    ) external onlyRole(REGISTRAR_ROLE) {
        require(
            studentAddresses.length == studentIds.length &&
            studentIds.length == names.length &&
            names.length == regions.length &&
            regions.length == metadataURIs.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < studentAddresses.length; i++) {
            if (students[studentAddresses[i]].registeredAt == 0) {
                registerStudent(
                    studentAddresses[i],
                    studentIds[i],
                    names[i],
                    regions[i],
                    metadataURIs[i]
                );
            }
        }
    }
    
    /**
     * @dev Lấy vote weight multiplier cho một sinh viên
     */
    function getVoteWeightMultiplier(address student) 
        external 
        view 
        returns (uint256) 
    {
        if (students[student].registeredAt == 0) {
            return BASE_MULTIPLIER; // Chưa đăng ký = 1x
        }
        return voteWeightMultipliers[student];
    }
    
    /**
     * @dev Tính vote weight thực tế (token balance * multiplier)
     */
    function calculateVoteWeight(address student, uint256 tokenBalance)
        external
        view
        returns (uint256)
    {
        uint256 multiplier = voteWeightMultipliers[student];
        if (multiplier == 0) {
            multiplier = BASE_MULTIPLIER;
        }
        return (tokenBalance * multiplier) / BASE_MULTIPLIER;
    }
    
    /**
     * @dev Cập nhật multiplier cho một vùng
     */
    function setRegionMultiplier(
        Region region,
        uint256 multiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(region != Region.NONE, "Invalid region");
        require(multiplier >= 10000 && multiplier <= 20000, "Multiplier must be 1x-2x");
        
        uint256 oldMultiplier;
        
        if (region == Region.MEKONG) {
            oldMultiplier = mekongMultiplier;
            mekongMultiplier = multiplier;
        } else if (region == Region.MOUNTAINOUS) {
            oldMultiplier = mountainousMultiplier;
            mountainousMultiplier = multiplier;
        } else if (region == Region.HIGHLAND) {
            oldMultiplier = highlandMultiplier;
            highlandMultiplier = multiplier;
        } else {
            revert("Cannot set multiplier for this region");
        }
        
        emit MultiplierUpdated(region, oldMultiplier, multiplier);
        
        // Cập nhật multiplier cho tất cả sinh viên trong vùng này
        // Note: Trong production, có thể cần thêm logic để update tất cả students
    }
    
    /**
     * @dev Lấy multiplier cho một vùng
     */
    function _getMultiplierForRegion(Region region) 
        internal 
        view 
        returns (uint256) 
    {
        if (region == Region.MEKONG) {
            return mekongMultiplier;
        } else if (region == Region.MOUNTAINOUS) {
            return mountainousMultiplier;
        } else if (region == Region.HIGHLAND) {
            return highlandMultiplier;
        } else {
            return defaultMultiplier;
        }
    }
    
    /**
     * @dev Lấy thông tin sinh viên
     */
    function getStudentInfo(address student)
        external
        view
        returns (StudentInfo memory)
    {
        return students[student];
    }
    
    /**
     * @dev Kiểm tra sinh viên có đăng ký không
     */
    function isStudentRegistered(address student) 
        external 
        view 
        returns (bool) 
    {
        return students[student].registeredAt > 0;
    }
}

