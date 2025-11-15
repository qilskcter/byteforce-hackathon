const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EduDAO Nexus Smart Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // 1. Deploy LearnToken
  console.log("1️⃣ Deploying LearnToken...");
  const LearnToken = await hre.ethers.getContractFactory("LearnToken");
  const learnToken = await LearnToken.deploy(
    "EduDAO Learn Token",
    "LEARN"
  );
  await learnToken.waitForDeployment();
  const learnTokenAddress = await learnToken.getAddress();
  console.log("✅ LearnToken deployed to:", learnTokenAddress, "\n");

  // 2. Deploy BadgeNFT
  console.log("2️⃣ Deploying BadgeNFT...");
  const BadgeNFT = await hre.ethers.getContractFactory("BadgeNFT");
  const badgeNFT = await BadgeNFT.deploy();
  await badgeNFT.waitForDeployment();
  const badgeNFTAddress = await badgeNFT.getAddress();
  console.log("✅ BadgeNFT deployed to:", badgeNFTAddress, "\n");

  // 3. Deploy ContributionVerifier
  console.log("3️⃣ Deploying ContributionVerifier...");
  const ContributionVerifier = await hre.ethers.getContractFactory("ContributionVerifier");
  const contributionVerifier = await ContributionVerifier.deploy(
    learnTokenAddress,
    badgeNFTAddress
  );
  await contributionVerifier.waitForDeployment();
  const contributionVerifierAddress = await contributionVerifier.getAddress();
  console.log("✅ ContributionVerifier deployed to:", contributionVerifierAddress, "\n");

  // Grant MINTER_ROLE to ContributionVerifier
  console.log("🔐 Granting MINTER_ROLE to ContributionVerifier...");
  await learnToken.grantRole(await learnToken.MINTER_ROLE(), contributionVerifierAddress);
  await badgeNFT.grantRole(await badgeNFT.MINTER_ROLE(), contributionVerifierAddress);
  console.log("✅ Roles granted\n");

  // 4. Deploy StudentRegistry (cho Local Impact Boost)
  console.log("4️⃣ Deploying StudentRegistry...");
  const StudentRegistry = await hre.ethers.getContractFactory("StudentRegistry");
  const studentRegistry = await StudentRegistry.deploy();
  await studentRegistry.waitForDeployment();
  const studentRegistryAddress = await studentRegistry.getAddress();
  console.log("✅ StudentRegistry deployed to:", studentRegistryAddress, "\n");

  // 5. Deploy DAOGovernance (với StudentRegistry để hỗ trợ weighted voting)
  console.log("5️⃣ Deploying DAOGovernance...");
  const DAOGovernance = await hre.ethers.getContractFactory("DAOGovernance");
  const daoGovernance = await DAOGovernance.deploy(
    learnTokenAddress,
    studentRegistryAddress,  // StudentRegistry cho Local Impact Boost
    "EduDAO Governance",
    1,      // votingDelay: 1 block
    100,    // votingPeriod: 100 blocks
    hre.ethers.parseEther("100"),  // proposalThreshold: 100 tokens
    4       // quorumNumerator: 4% (400 basis points)
  );
  await daoGovernance.waitForDeployment();
  const daoGovernanceAddress = await daoGovernance.getAddress();
  console.log("✅ DAOGovernance deployed to:", daoGovernanceAddress, "\n");

  // 6. Deploy ReputationSystem
  console.log("6️⃣ Deploying ReputationSystem...");
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy(
    learnTokenAddress,
    badgeNFTAddress,
    contributionVerifierAddress,
    daoGovernanceAddress
  );
  await reputationSystem.waitForDeployment();
  const reputationSystemAddress = await reputationSystem.getAddress();
  console.log("✅ ReputationSystem deployed to:", reputationSystemAddress, "\n");

  // 7. Deploy FundingPool (sử dụng LearnToken làm funding token cho demo)
  console.log("7️⃣ Deploying FundingPool...");
  const FundingPool = await hre.ethers.getContractFactory("FundingPool");
  const fundingPool = await FundingPool.deploy(
    learnTokenAddress,  // fundingToken (trong thực tế có thể dùng USDC, DAI)
    learnTokenAddress,  // learnToken
    daoGovernanceAddress
  );
  await fundingPool.waitForDeployment();
  const fundingPoolAddress = await fundingPool.getAddress();
  console.log("✅ FundingPool deployed to:", fundingPoolAddress, "\n");

  // Summary
  console.log("=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("LearnToken:", learnTokenAddress);
  console.log("BadgeNFT:", badgeNFTAddress);
  console.log("ContributionVerifier:", contributionVerifierAddress);
  console.log("StudentRegistry:", studentRegistryAddress);
  console.log("DAOGovernance:", daoGovernanceAddress);
  console.log("ReputationSystem:", reputationSystemAddress);
  console.log("FundingPool:", fundingPoolAddress);
  console.log("=".repeat(60));

  // Save addresses to file (optional)
  const fs = require("fs");
  const addresses = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      LearnToken: learnTokenAddress,
      BadgeNFT: badgeNFTAddress,
      ContributionVerifier: contributionVerifierAddress,
      StudentRegistry: studentRegistryAddress,
      DAOGovernance: daoGovernanceAddress,
      ReputationSystem: reputationSystemAddress,
      FundingPool: fundingPoolAddress
    },
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployments/" + hre.network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

