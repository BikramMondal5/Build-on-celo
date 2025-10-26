import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Celo Alfajores Testnet
    celoAlfajores: {
      url: process.env.CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
      gas: 8000000,
      gasPrice: 50000000000, // 50 gwei
      maxPriorityFeePerGas: 5000000000, // 5 gwei tip
    },
    alfajores: {
      url: process.env.CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
      gas: 8000000,
      gasPrice: 50000000000,
      maxPriorityFeePerGas: 5000000000,
    },
    // Celo Mainnet
    celo: {
      url: "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
      gas: 8000000,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || "api-key",
      celo: process.env.CELOSCAN_API_KEY || "api-key"
    }
  }
};
