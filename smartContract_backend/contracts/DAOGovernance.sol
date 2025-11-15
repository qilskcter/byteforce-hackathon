// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "./LearnToken.sol";
import "./StudentRegistry.sol";

/**
 * @title DAOGovernance
 * @dev Hệ thống quản trị DAO cho EduDAO Nexus
 * Sinh viên dùng LearnToken để vote các quyết định quan trọng
 * Hỗ trợ Local Impact Boost - weighted voting cho sinh viên vùng ĐBSCL/miền núi
 */
contract DAOGovernance is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    AccessControl
{
    LearnToken public learnToken;
    StudentRegistry public studentRegistry;
    
    // Flag để bật/tắt weighted voting
    bool public weightedVotingEnabled;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Mapping từ proposalId đến ProposalInfo
    mapping(uint256 => ProposalInfo) public proposalInfo;
    
    // Các loại proposal
    enum ProposalType {
        SCHOLARSHIP_FUND,    // Phân bổ quỹ học bổng
        CLUB_FUND,           // Quỹ CLB
        MAJOR_OPEN_CLOSE,    // Mở/đóng ngành
        PROJECT_FUNDING,     // Đầu tư dự án sinh viên
        TEACHER_AWARD,       // Chọn giảng viên xuất sắc
        RESOURCE_ACCESS,     // Cấp độ truy cập tài nguyên
        GENERAL              // Đề xuất chung
    }
    
    struct ProposalInfo {
        ProposalType proposalType;
        address proposer;
        string description;
        uint256 targetAmount;      // Số tiền (nếu là funding proposal)
        address recipient;          // Người nhận (nếu có)
        bool executed;
    }
    
    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        address indexed proposer,
        string description
    );
    
    constructor(
        address _learnToken,
        address _studentRegistry,
        string memory name,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        uint256 quorumNumerator_
    )
        Governor(name)
        GovernorSettings(votingDelay_, votingPeriod_, proposalThreshold_)
        GovernorVotes(IVotes(_learnToken))
        GovernorVotesQuorumFraction(quorumNumerator_)
    {
        learnToken = LearnToken(_learnToken);
        if (_studentRegistry != address(0)) {
            studentRegistry = StudentRegistry(_studentRegistry);
            weightedVotingEnabled = true;
        }
        
        // Grant admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Tạo proposal mới
     * @param targets Địa chỉ contracts sẽ được gọi
     * @param values Số ETH gửi kèm
     * @param calldatas Calldata cho function calls
     * @param description Mô tả proposal
     * @param proposalType Loại proposal
     * @param targetAmount Số tiền (nếu là funding)
     * @param recipient Người nhận (nếu có)
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        uint256 targetAmount,
        address recipient
    ) public override returns (uint256) {
        // Kiểm tra người đề xuất có đủ token không
        require(
            learnToken.balanceOf(msg.sender) >= proposalThreshold(),
            "Insufficient tokens to create proposal"
        );
        
        // Gọi propose từ Governor
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        
        proposalInfo[proposalId] = ProposalInfo({
            proposalType: proposalType,
            proposer: msg.sender,
            description: description,
            targetAmount: targetAmount,
            recipient: recipient,
            executed: false
        });
        
        emit ProposalCreated(proposalId, proposalType, msg.sender, description);
        
        return proposalId;
    }
    
    /**
     * @dev Tạo proposal đơn giản (không cần targets/calldatas)
     */
    function proposeSimple(
        string memory description,
        ProposalType proposalType,
        uint256 targetAmount,
        address recipient
    ) external returns (uint256) {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        
        return propose(
            targets,
            values,
            calldatas,
            description,
            proposalType,
            targetAmount,
            recipient
        );
    }
    
    /**
     * @dev Override để thêm logic khi execute proposal
     */
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
        proposalInfo[proposalId].executed = true;
    }
    
    /**
     * @dev Lấy thông tin proposal
     */
    function getProposalInfo(uint256 proposalId)
        external
        view
        returns (ProposalInfo memory)
    {
        return proposalInfo[proposalId];
    }
    
    // Override required functions
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }
    
    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }
    
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
    
    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
    
    /**
     * @dev Override _getVotes để hỗ trợ weighted voting với Local Impact Boost
     * Nếu weighted voting được bật, vote weight = token balance * multiplier
     */
    function _getVotes(
        address account,
        uint256 blockNumber,
        bytes memory /* params */
    ) internal view override returns (uint256) {
        uint256 tokenBalance = super._getVotes(account, blockNumber, "");
        
        // Nếu weighted voting được bật và có StudentRegistry
        if (weightedVotingEnabled && address(studentRegistry) != address(0)) {
            uint256 multiplier = studentRegistry.getVoteWeightMultiplier(account);
            // Tính weighted vote: tokenBalance * multiplier / BASE_MULTIPLIER
            return (tokenBalance * multiplier) / 10000;
        }
        
        return tokenBalance;
    }
    
    /**
     * @dev Set StudentRegistry (có thể set sau khi deploy)
     */
    function setStudentRegistry(address _studentRegistry) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_studentRegistry != address(0), "Invalid address");
        studentRegistry = StudentRegistry(_studentRegistry);
        weightedVotingEnabled = true;
    }
    
    /**
     * @dev Bật/tắt weighted voting
     */
    function setWeightedVotingEnabled(bool enabled) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        weightedVotingEnabled = enabled;
    }
    
    /**
     * @dev Lấy vote weight của một account (có tính weighted nếu bật)
     */
    function getVoteWeight(address account, uint256 blockNumber)
        external
        view
        returns (uint256)
    {
        return _getVotes(account, blockNumber, "");
    }
}

