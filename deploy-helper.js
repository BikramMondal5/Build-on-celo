#!/usr/bin/env node

/**
 * Interactive Deployment Helper
 * This script will guide you through deploying the contracts
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n🚀 RePlate Contracts Deployment Helper\n');
  console.log('This helper will guide you through deploying your contracts.\n');

  // Check if .env exists
  const envExists = fs.existsSync('.env');
  
  if (!envExists) {
    console.log('❌ No .env file found!\n');
    console.log('You have two options:\n');
    console.log('1. Deploy via Remix (Recommended - Safer)');
    console.log('2. Deploy via Hardhat (Requires private key)\n');
    
    const choice = await ask('Which method do you prefer? (1 or 2): ');
    
    if (choice === '1') {
      console.log('\n✅ Great choice! Using Remix is safer.\n');
      console.log('📚 Follow these steps:\n');
      console.log('1. Open REMIX_DEPLOYMENT_GUIDE.md for detailed instructions');
      console.log('2. Or follow this quick guide:\n');
      console.log('   a. Visit: https://remix.ethereum.org');
      console.log('   b. Copy contracts/ImpactCertificate.sol to Remix');
      console.log('   c. Copy contracts/StudentRewards.sol to Remix');
      console.log('   d. Compile with Solidity 0.8.19');
      console.log('   e. Deploy using MetaMask (Celo Alfajores network)');
      console.log('   f. Save the contract addresses');
      console.log('   g. Update client/src/lib/rewardsService.ts\n');
      console.log('📖 See REMIX_DEPLOYMENT_GUIDE.md for step-by-step instructions!\n');
      rl.close();
      return;
    }
    
    console.log('\n⚠️  For Hardhat deployment, you need to:\n');
    console.log('1. Create a .env file');
    console.log('2. Add your testnet private key\n');
    
    const createEnv = await ask('Do you want to create .env now? (yes/no): ');
    
    if (createEnv.toLowerCase() === 'yes') {
      console.log('\n📝 Creating .env file...\n');
      
      const privateKey = await ask('Enter your testnet private key (or press Enter to skip): ');
      
      if (!privateKey || privateKey.trim() === '') {
        console.log('\n⚠️  Skipped. You can manually create .env later.\n');
        console.log('Copy .env.example to .env and add your private key.\n');
      } else {
        const envContent = `# RePlate Rewards - Environment Variables
# TESTNET ONLY - Never use mainnet private keys!

PRIVATE_KEY=${privateKey.trim()}

# Celo Network Configuration
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org

# Token Addresses (Alfajores Testnet)
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# Deployed Contract Addresses (update after deployment)
STUDENT_REWARDS_ADDRESS=
IMPACT_CERTIFICATE_ADDRESS=

# Funding Configuration
FUND_AMOUNT=100
`;
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file created!\n');
      }
    }
  }
  
  // Check if ready to deploy
  if (fs.existsSync('.env')) {
    console.log('\n✅ .env file exists!\n');
    console.log('Ready to deploy! Run these commands:\n');
    console.log('1. npx hardhat compile');
    console.log('2. npx hardhat run scripts/deploy-rewards.js --network alfajores\n');
    console.log('Make sure you have testnet CELO in your wallet!');
    console.log('Get it from: https://faucet.celo.org/alfajores\n');
    
    const deploy = await ask('Do you want to compile and deploy now? (yes/no): ');
    
    if (deploy.toLowerCase() === 'yes') {
      console.log('\n🔨 Starting compilation and deployment...\n');
      rl.close();
      
      // Import and run deployment
      const { exec } = require('child_process');
      
      console.log('Step 1: Compiling contracts...\n');
      exec('npx hardhat compile', (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Compilation failed: ${error.message}`);
          return;
        }
        console.log(stdout);
        
        console.log('\nStep 2: Deploying to Celo Alfajores...\n');
        exec('npx hardhat run scripts/deploy-rewards.js --network alfajores', (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Deployment failed: ${error.message}`);
            console.log('\n💡 Make sure you have:');
            console.log('- Testnet CELO in your wallet');
            console.log('- Correct private key in .env');
            console.log('- MetaMask connected to Celo Alfajores\n');
            return;
          }
          console.log(stdout);
          console.log('\n🎉 Deployment complete!');
          console.log('\n📝 Next steps:');
          console.log('1. Copy the contract addresses from above');
          console.log('2. Update client/src/lib/rewardsService.ts');
          console.log('3. Run: npm run dev');
          console.log('4. Test via Admin Dashboard\n');
        });
      });
      return;
    }
  }
  
  console.log('\n👋 Deployment helper finished!\n');
  console.log('📖 For more help, see:');
  console.log('- DEPLOYMENT_QUICK_START.md');
  console.log('- REMIX_DEPLOYMENT_GUIDE.md');
  console.log('- REWARDS_DEPLOYMENT_GUIDE.md\n');
  
  rl.close();
}

main().catch(console.error);
