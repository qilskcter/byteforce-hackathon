// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

/**
 * @title LearnToken
 * @dev ERC-20 token dùng để thưởng cho sinh viên khi đóng góp
 * Token có thể dùng để vote DAO, đổi quà, đổi tài nguyên
 */
contract LearnToken is ERC20, ERC20Burnable, AccessControl, ERC20Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Mapping để track token đã mint cho mỗi student
    mapping(address => uint256) public studentTotalEarned;
    
    // Event khi mint token cho student
    event TokensMinted(address indexed student, uint256 amount, string contributionId);
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint token cho sinh viên khi đóng góp được xác minh
     * @param to Địa chỉ sinh viên
     * @param amount Số lượng token
     * @param contributionId ID của đóng góp (để tracking)
     */
    function mint(
        address to,
        uint256 amount,
        string memory contributionId
    ) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        studentTotalEarned[to] += amount;
        emit TokensMinted(to, amount, contributionId);
    }
    
    /**
     * @dev Batch mint cho nhiều sinh viên cùng lúc
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata contributionIds
    ) external onlyRole(MINTER_ROLE) {
        require(
            recipients.length == amounts.length && amounts.length == contributionIds.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], amounts[i], contributionIds[i]);
        }
    }
    
    /**
     * @dev Pause token transfers (trong trường hợp khẩn cấp)
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // Override required by Solidity
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}

