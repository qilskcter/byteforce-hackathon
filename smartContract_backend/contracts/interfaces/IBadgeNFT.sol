// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBadgeNFT {
    struct BadgeInfo {
        string badgeType;
        uint256 timestamp;
        uint256 impactScore;
        string contributionId;
        bool isVerified;
    }
    
    function getStudentBadges(address student) external view returns (uint256[] memory);
    function getBadgeDetails(uint256 tokenId) external view returns (BadgeInfo memory);
}

