const fs = require("fs");
const path = require("path");

/**
 * Script tạo file CSV mẫu để import sinh viên
 * 
 * Usage:
 * node scripts/createSampleCSV.js [output_file]
 * 
 * Example:
 * node scripts/createSampleCSV.js data/students_sample.csv
 */

function main() {
  const args = process.argv.slice(2);
  const outputFile = args[0] || path.join(__dirname, "../data/students_sample.csv");
  
  // Tạo thư mục nếu chưa có
  const dir = path.dirname(outputFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // CSV header
  const header = "studentAddress,studentId,name,region,metadataURI\n";
  
  // Sample data
  const sampleData = [
    // ĐBSCL (Region 5) - có bonus 1.2x vote weight
    "0x1111111111111111111111111111111111111111,ST001,Nguyen Van A,5,https://ipfs.io/.../student1",
    "0x2222222222222222222222222222222222222222,ST002,Tran Thi B,5,https://ipfs.io/.../student2",
    
    // Miền núi (Region 6) - có bonus 1.2x vote weight
    "0x3333333333333333333333333333333333333333,ST003,Le Van C,6,https://ipfs.io/.../student3",
    
    // Tây Nguyên (Region 4) - có bonus 1.15x vote weight
    "0x4444444444444444444444444444444444444444,ST004,Pham Thi D,4,https://ipfs.io/.../student4",
    
    // Hà Nội (Region 1) - không có bonus
    "0x5555555555555555555555555555555555555555,ST005,Hoang Van E,1,https://ipfs.io/.../student5",
    
    // TP.HCM (Region 2) - không có bonus
    "0x6666666666666666666666666666666666666666,ST006,Vo Thi F,2,https://ipfs.io/.../student6",
  ];
  
  const csvContent = header + sampleData.join("\n");
  
  fs.writeFileSync(outputFile, csvContent, "utf8");
  
  console.log("✅ Sample CSV file created:", outputFile);
  console.log("\n📋 Format:");
  console.log("   studentAddress,studentId,name,region,metadataURI");
  console.log("\n📍 Region codes:");
  console.log("   0 = NONE");
  console.log("   1 = HANOI");
  console.log("   2 = HOCHIMINH");
  console.log("   3 = CENTRAL");
  console.log("   4 = HIGHLAND (Tây Nguyên) - 1.15x vote weight");
  console.log("   5 = MEKONG (ĐBSCL) - 1.2x vote weight");
  console.log("   6 = MOUNTAINOUS (Miền núi) - 1.2x vote weight");
  console.log("\n💡 Note: Replace addresses with real student wallet addresses");
}

main();

