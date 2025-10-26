import hre from "hardhat";
const ethers = hre.ethers;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("💰 Funding SimpleStudentRewards Contract with Native CELO...\n");

  // Try to load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/food-donation.json");
  let studentRewardsAddress;

  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    studentRewardsAddress = deployment.studentRewards;
    console.log("📄 Loaded contract address from deployment file");
  } else {
    studentRewardsAddress = process.env.STUDENT_REWARDS_ADDRESS || "YOUR_DEPLOYED_ADDRESS";
  }

  const AMOUNT = process.env.FUND_AMOUNT || "2"; // Default: 2 CELO

  if (studentRewardsAddress === "YOUR_DEPLOYED_ADDRESS") {
    console.error("❌ ERROR: Please deploy contracts first or set STUDENT_REWARDS_ADDRESS");
    console.log("   Run: npx hardhat run scripts/deploy-food-donation.js --network celoAlfajores");
    process.exit(1);
  }

  const [funder] = await ethers.getSigners();
  console.log("📝 Funding from account:", funder.address);
  console.log("🎯 Contract to fund:", studentRewardsAddress);
  
  const celoBalance = await ethers.provider.getBalance(funder.address);
  console.log("💰 Your CELO balance:", ethers.formatEther(celoBalance), "CELO");

  const amountWei = ethers.parseEther(AMOUNT);

  if (celoBalance < amountWei) {
    console.error(`❌ ERROR: Insufficient CELO balance`);
    console.log(`   Required: ${AMOUNT} CELO`);
    console.log(`   Available: ${ethers.formatEther(celoBalance)} CELO`);
    console.log("\n💡 To get testnet CELO:");
    console.log("   Visit: https://faucet.celo.org/alfajores");
    process.exit(1);
  }

  // Get contract to check balance before
  const StudentRewards = await ethers.getContractAt(
    [
      "function getBalance() view returns (uint256)"
    ],
    studentRewardsAddress
  );

  // Check current contract balance
  const currentBalance = await StudentRewards.getBalance();
  console.log("📊 Current contract balance:", ethers.formatEther(currentBalance), "CELO\n");

  // Send native CELO to the contract
  console.log(`💸 Sending ${AMOUNT} CELO to contract...`);
  const tx = await funder.sendTransaction({
    to: studentRewardsAddress,
    value: amountWei
  });
  console.log("   Transaction hash:", tx.hash);
  await tx.wait();
  console.log("   ✅ Transfer confirmed\n");

  // Verify new balance
  const newBalance = await StudentRewards.getBalance();
  console.log("=" .repeat(60));
  console.log("🎉 FUNDING SUCCESSFUL!\n");
  console.log("📊 Contract Balance:");
  console.log("   Before:", ethers.formatEther(currentBalance), "CELO");
  console.log("   After:", ethers.formatEther(newBalance), "CELO");
  console.log("   Deposited:", ethers.formatEther(newBalance - currentBalance), "CELO");
  console.log("\n💡 Contract can now reward approximately:");
  console.log("   -", Math.floor(parseFloat(ethers.formatEther(newBalance)) / 0.1), "student meal claims (0.1 CELO each)");
  console.log("\n🔗 View on Explorer:");
  console.log("   https://alfajores.celoscan.io/address/" + studentRewardsAddress);
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
