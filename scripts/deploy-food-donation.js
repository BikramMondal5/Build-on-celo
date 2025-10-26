import hre from "hardhat";
const ethers = hre.ethers;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Food Donation Contracts to Celo Alfajores...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO\n");

  // Deploy AdminFoodCertificate (NFT Contract)
  console.log("📜 Deploying AdminFoodCertificate (NFT Contract)...");
  const AdminCertificate = await ethers.getContractFactory("AdminFoodCertificate");
  const adminCert = await AdminCertificate.deploy();
  await adminCert.waitForDeployment();
  const adminCertAddress = await adminCert.getAddress();
  console.log("✅ AdminFoodCertificate deployed to:", adminCertAddress);
  console.log();

  // Deploy SimpleStudentRewards
  console.log("💰 Deploying SimpleStudentRewards (Rewards Contract)...");
  const StudentRewards = await ethers.getContractFactory("SimpleStudentRewards");
  const studentRewards = await StudentRewards.deploy();
  await studentRewards.waitForDeployment();
  const studentRewardsAddress = await studentRewards.getAddress();
  console.log("✅ SimpleStudentRewards deployed to:", studentRewardsAddress);
  console.log();

  // Link contracts
  console.log("🔗 Linking contracts...");
  
  // Set student rewards contract in admin certificate
  const tx1 = await adminCert.setStudentRewardsContract(studentRewardsAddress);
  await tx1.wait();
  console.log("✓ AdminCertificate authorized StudentRewards to mint");
  
  // Set admin certificate contract in student rewards
  const tx2 = await studentRewards.setAdminCertificateContract(adminCertAddress);
  await tx2.wait();
  console.log("✓ StudentRewards linked to AdminCertificate");
  console.log();

  // Get contract balances
  const rewardsBalance = await studentRewards.getBalance();
  console.log("💰 Current Rewards Contract Balance:", ethers.formatEther(rewardsBalance), "CELO");
  console.log();

  // Summary
  console.log("=".repeat(70));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("AdminFoodCertificate (NFT):", adminCertAddress);
  console.log("SimpleStudentRewards:", studentRewardsAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("=".repeat(70));
  console.log();

  console.log("📝 NEXT STEPS:");
  console.log("1. Fund the rewards contract with CELO:");
  console.log(`   npx hardhat run scripts/fund-rewards.js --network celoAlfajores`);
  console.log();
  console.log("2. Verify contracts on Celoscan:");
  console.log(`   AdminCertificate: https://alfajores.celoscan.io/address/${adminCertAddress}`);
  console.log(`   StudentRewards: https://alfajores.celoscan.io/address/${studentRewardsAddress}`);
  console.log();
  console.log("3. Update frontend config:");
  console.log(`   adminCertificate: '${adminCertAddress}'`);
  console.log(`   studentRewards: '${studentRewardsAddress}'`);
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    adminCertificate: adminCertAddress,
    studentRewards: studentRewardsAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    rewardAmount: "0.1 CELO per claim"
  };

  fs.mkdirSync('./deployments', { recursive: true });
  fs.writeFileSync(
    './deployments/food-donation.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to: deployments/food-donation.json");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
