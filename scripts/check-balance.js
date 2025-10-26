import hre from "hardhat";
const ethers = hre.ethers;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🔍 Checking Contract Balances...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/food-donation.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment file found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  console.log("📋 Deployed Contracts:");
  console.log("  AdminCertificate:", deployment.adminCertificate);
  console.log("  StudentRewards:", deployment.studentRewards);
  console.log();

  // Check StudentRewards contract balance using provider
  const balance = await ethers.provider.getBalance(deployment.studentRewards);
  console.log("💰 SimpleStudentRewards Balance:", ethers.formatEther(balance), "CELO");
  
  // Get the contract to check internal balance
  const StudentRewards = await ethers.getContractAt(
    "SimpleStudentRewards",
    deployment.studentRewards
  );
  
  const internalBalance = await StudentRewards.getBalance();
  console.log("📊 Internal Balance (from contract):", ethers.formatEther(internalBalance), "CELO");
  
  // Calculate how many students can be rewarded
  const rewardAmount = 0.1; // 0.1 CELO per claim
  const possibleRewards = Math.floor(parseFloat(ethers.formatEther(balance)) / rewardAmount);
  console.log("\n💡 Can reward approximately:", possibleRewards, "students");
  
  // Check admin certificate address
  const adminCertAddress = await StudentRewards.adminCertificateContract();
  console.log("\n🔗 Linked AdminCertificate:", adminCertAddress);
  console.log("   Match:", adminCertAddress.toLowerCase() === deployment.adminCertificate.toLowerCase() ? "✅" : "❌");
  
  console.log("\n🔗 View on Explorer:");
  console.log("  StudentRewards:", `https://alfajores.celoscan.io/address/${deployment.studentRewards}`);
  console.log("  AdminCertificate:", `https://alfajores.celoscan.io/address/${deployment.adminCertificate}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
