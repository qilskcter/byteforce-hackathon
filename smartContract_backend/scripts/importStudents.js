const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script để import sinh viên từ CSV/Excel vào StudentRegistry
 * Format CSV: studentAddress,studentId,name,region,metadataURI
 * 
 * Region mapping:
 * 0 = NONE
 * 1 = HANOI
 * 2 = HOCHIMINH
 * 3 = CENTRAL
 * 4 = HIGHLAND
 * 5 = MEKONG (ĐBSCL)
 * 6 = MOUNTAINOUS (Miền núi)
 * 
 * Usage:
 * node scripts/importStudents.js <csv_file_path> [network]
 * 
 * Example:
 * node scripts/importStudents.js data/students.csv localhost
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("❌ Usage: node scripts/importStudents.js <csv_file_path> [network]");
    console.error("   Example: node scripts/importStudents.js data/students.csv localhost");
    process.exit(1);
  }
  
  const csvFilePath = args[0];
  const network = args[1] || "localhost";
  
  // Load deployment addresses
  const deploymentFile = path.join(__dirname, `../deployments/${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.error("   Please deploy contracts first using: npm run deploy:local");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const studentRegistryAddress = deployment.contracts.StudentRegistry;
  
  if (!studentRegistryAddress) {
    console.error("❌ StudentRegistry address not found in deployment file");
    process.exit(1);
  }
  
  console.log("📋 Loading StudentRegistry from:", studentRegistryAddress);
  
  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  // Load contract
  const StudentRegistry = await hre.ethers.getContractFactory("StudentRegistry");
  const studentRegistry = StudentRegistry.attach(studentRegistryAddress);
  
  // Read CSV file
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvFilePath, "utf8");
  const lines = csvContent.split("\n").filter(line => line.trim() !== "");
  
  if (lines.length < 2) {
    console.error("❌ CSV file must have at least a header and one data row");
    process.exit(1);
  }
  
  // Parse CSV (simple parser, không dùng library để tránh dependency)
  const students = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (assumes no commas in values)
    const parts = line.split(",").map(p => p.trim());
    
    if (parts.length < 4) {
      console.warn(`⚠️  Skipping line ${i + 1}: insufficient columns`);
      continue;
    }
    
    const [address, studentId, name, regionStr, metadataURI] = parts;
    
    // Validate address
    if (!hre.ethers.isAddress(address)) {
      console.warn(`⚠️  Skipping line ${i + 1}: invalid address: ${address}`);
      continue;
    }
    
    // Parse region
    const region = parseInt(regionStr);
    if (isNaN(region) || region < 0 || region > 6) {
      console.warn(`⚠️  Skipping line ${i + 1}: invalid region: ${regionStr}`);
      continue;
    }
    
    students.push({
      address: address,
      studentId: studentId || "",
      name: name || "",
      region: region,
      metadataURI: metadataURI || ""
    });
  }
  
  if (students.length === 0) {
    console.error("❌ No valid students found in CSV file");
    process.exit(1);
  }
  
  console.log(`\n📊 Found ${students.length} students to import\n`);
  
  // Batch register (process in batches of 50 to avoid gas limit)
  const BATCH_SIZE = 50;
  let totalRegistered = 0;
  
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)} (${batch.length} students)...`);
    
    const addresses = batch.map(s => s.address);
    const studentIds = batch.map(s => s.studentId);
    const names = batch.map(s => s.name);
    const regions = batch.map(s => s.region);
    const metadataURIs = batch.map(s => s.metadataURI);
    
    try {
      const tx = await studentRegistry.batchRegisterStudents(
        addresses,
        studentIds,
        names,
        regions,
        metadataURIs
      );
      
      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      await tx.wait();
      
      totalRegistered += batch.length;
      console.log(`   ✅ Batch registered! (${totalRegistered}/${students.length} total)\n`);
    } catch (error) {
      console.error(`   ❌ Error registering batch:`, error.message);
      
      // Try individual registration as fallback
      console.log(`   🔄 Trying individual registration...`);
      
      for (const student of batch) {
        try {
          const tx = await studentRegistry.registerStudent(
            student.address,
            student.studentId,
            student.name,
            student.region,
            student.metadataURI
          );
          await tx.wait();
          totalRegistered++;
          console.log(`   ✅ Registered: ${student.name} (${student.address})`);
        } catch (err) {
          console.error(`   ❌ Failed to register ${student.name}:`, err.message);
        }
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ IMPORT COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total students processed: ${students.length}`);
  console.log(`Successfully registered: ${totalRegistered}`);
  console.log(`Failed: ${students.length - totalRegistered}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

