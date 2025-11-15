const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EduDAO Nexus", function () {
  let learnToken, badgeNFT, contributionVerifier;
  let owner, aiVerifier, student1, student2;

  beforeEach(async function () {
    [owner, aiVerifier, student1, student2] = await ethers.getSigners();

    // Deploy LearnToken
    const LearnToken = await ethers.getContractFactory("LearnToken");
    learnToken = await LearnToken.deploy("EduDAO Learn Token", "LEARN");
    await learnToken.waitForDeployment();

    // Deploy BadgeNFT
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badgeNFT = await BadgeNFT.deploy();
    await badgeNFT.waitForDeployment();

    // Deploy ContributionVerifier
    const ContributionVerifier = await ethers.getContractFactory("ContributionVerifier");
    contributionVerifier = await ContributionVerifier.deploy(
      await learnToken.getAddress(),
      await badgeNFT.getAddress()
    );
    await contributionVerifier.waitForDeployment();

    // Grant roles
    const MINTER_ROLE = await learnToken.MINTER_ROLE();
    await learnToken.grantRole(MINTER_ROLE, await contributionVerifier.getAddress());
    
    const BADGE_MINTER_ROLE = await badgeNFT.MINTER_ROLE();
    await badgeNFT.grantRole(BADGE_MINTER_ROLE, await contributionVerifier.getAddress());

    // Grant AI_VERIFIER_ROLE
    const AI_VERIFIER_ROLE = await contributionVerifier.AI_VERIFIER_ROLE();
    await contributionVerifier.grantRole(AI_VERIFIER_ROLE, aiVerifier.address);
  });

  describe("LearnToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await learnToken.name()).to.equal("EduDAO Learn Token");
      expect(await learnToken.symbol()).to.equal("LEARN");
    });

    it("Should mint tokens when contribution is verified", async function () {
      await contributionVerifier.connect(aiVerifier).verifyContribution(
        "contribution_1",
        student1.address,
        "project",
        85,
        "https://ipfs.io/.../metadata"
      );

      const balance = await learnToken.balanceOf(student1.address);
      expect(balance).to.be.gt(0);
    });
  });

  describe("ContributionVerifier", function () {
    it("Should verify contribution and mint token", async function () {
      await expect(
        contributionVerifier.connect(aiVerifier).verifyContribution(
          "contribution_1",
          student1.address,
          "project",
          85,
          "https://ipfs.io/.../metadata"
        )
      ).to.emit(contributionVerifier, "ContributionVerified");

      const balance = await learnToken.balanceOf(student1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should mint badge if impact score >= 70", async function () {
      await contributionVerifier.connect(aiVerifier).verifyContribution(
        "contribution_high_score",
        student1.address,
        "research",
        85,
        "https://ipfs.io/.../metadata"
      );

      const badges = await badgeNFT.getStudentBadges(student1.address);
      expect(badges.length).to.equal(1);
    });

    it("Should not mint badge if impact score < 70", async function () {
      await contributionVerifier.connect(aiVerifier).verifyContribution(
        "contribution_low_score",
        student1.address,
        "quiz",
        60,
        "https://ipfs.io/.../metadata"
      );

      const badges = await badgeNFT.getStudentBadges(student1.address);
      expect(badges.length).to.equal(0);
    });

    it("Should reject duplicate contribution", async function () {
      await contributionVerifier.connect(aiVerifier).verifyContribution(
        "contribution_duplicate",
        student1.address,
        "project",
        80,
        "https://ipfs.io/.../metadata"
      );

      await expect(
        contributionVerifier.connect(aiVerifier).verifyContribution(
          "contribution_duplicate",
          student1.address,
          "project",
          80,
          "https://ipfs.io/.../metadata"
        )
      ).to.be.revertedWith("Contribution already verified");
    });
  });

  describe("BadgeNFT", function () {
    it("Should mint soulbound badge", async function () {
      await contributionVerifier.connect(aiVerifier).verifyContribution(
        "contribution_badge",
        student1.address,
        "research",
        90,
        "https://ipfs.io/.../metadata"
      );

      const badges = await badgeNFT.getStudentBadges(student1.address);
      expect(badges.length).to.equal(1);

      const badgeInfo = await badgeNFT.getBadgeDetails(badges[0]);
      expect(badgeInfo.badgeType).to.equal("research");
      expect(badgeInfo.impactScore).to.equal(90);
    });

    it("Should not allow transfer of soulbound token", async function () {
      await contributionVerifier.connect(aiVerifier).verifyContribution(
        "contribution_transfer_test",
        student1.address,
        "project",
        85,
        "https://ipfs.io/.../metadata"
      );

      const badges = await badgeNFT.getStudentBadges(student1.address);
      const tokenId = badges[0];

      await expect(
        badgeNFT.connect(student1).transferFrom(student1.address, student2.address, tokenId)
      ).to.be.revertedWith("BadgeNFT: Token is soulbound and cannot be transferred");
    });
  });
});

