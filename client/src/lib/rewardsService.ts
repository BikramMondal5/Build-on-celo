import { ethers, BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

// SimpleStudentRewards Contract ABI
const STUDENT_REWARDS_ABI = [
  'function claimFood(address student, address admin) payable',
  'function getBalance() view returns (uint256)',
  'function getStudentStats(address student) view returns (uint256 totalClaims, uint256 totalRewards, uint256 lastClaimTime)',
  'function withdraw(uint256 amount)',
  'function setAdminCertificateContract(address _adminCertificate)',
  'event RewardClaimed(address indexed student, address indexed admin, uint256 amount, uint256 timestamp)',
  'event AdminCertificateMinted(address indexed admin, uint256 timestamp)'
];

// AdminFoodCertificate Contract ABI
const ADMIN_CERTIFICATE_ABI = [
  'function mintCertificate(address admin)',
  'function foodDonations(address admin) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function setStudentRewardsContract(address _studentRewards)',
  'event CertificateMinted(address indexed admin, uint256 tokenId, uint256 totalDonations)'
];

// Legacy ABIs (keeping for backward compatibility if needed)
const IMPACT_CERTIFICATE_ABI = [
  'function issueCertificate(address recipient, string organizationName, uint256 totalPickups, uint256 foodDonatedKg, uint256 co2SavedKg, uint256 mealsProvided, string tokenURI) returns (uint256)',
  'function batchIssueCertificates(address[] recipients, string[] organizationNames, uint256[] totalPickups, uint256[] foodDonatedKgs, uint256[] co2SavedKgs, uint256[] mealsProvidedList, string[] tokenURIs) returns (uint256[])',
  'function getCertificatesForRecipient(address recipient) view returns (tuple(uint256 tokenId, address recipient, uint256 totalPickups, uint256 foodDonatedKg, uint256 co2SavedKg, uint256 mealsProvided, uint256 issuedAt, string organizationName, string achievementLevel)[])',
  'function getCertificate(uint256 tokenId) view returns (tuple(uint256 tokenId, address recipient, uint256 totalPickups, uint256 foodDonatedKg, uint256 co2SavedKg, uint256 mealsProvided, uint256 issuedAt, string organizationName, string achievementLevel))',
  'function totalCertificates() view returns (uint256)',
  'function hasCertificate(address recipient) view returns (bool)',
  'event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string organizationName, uint256 totalPickups, uint256 foodDonatedKg, string achievementLevel)'
];

const CUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const CELO_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Celo Alfajores Testnet addresses
export const CELO_TESTNET_CONFIG = {
  chainId: 44787,
  chainName: 'Celo Alfajores Testnet',
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  blockExplorer: 'https://alfajores.celoscan.io',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18
  },
  // Using native CELO token (wrapped CELO for ERC20 compatibility)
  CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9', // Native CELO on Alfajores
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Keeping for reference
  // Updated with deployed contract addresses
  impactCertificate: '0xca5c934C0E9dedDdF2F6878BBCae3BFF91615E56', // AdminFoodCertificate
  studentRewards: '0x1dB6BA08597b100e9Ba791BaB18aC9BDdB97eCe2'     // SimpleStudentRewards
};

export interface CertificateData {
  tokenId: number;
  recipient: string;
  totalPickups: number;
  foodDonatedKg: number;
  co2SavedKg: number;
  mealsProvided: number;
  issuedAt: number;
  organizationName: string;
  achievementLevel: string;
}

export interface StudentData {
  totalMeals: number;
  totalRewards: number;
  lastClaim: number;
  streak: number;
  active: boolean;
}

export interface RewardStatistics {
  totalStudents: number;
  totalMeals: number;
  totalRewards: number;
  contractBalance: number;
}

/**
 * Service for interacting with RePlate reward contracts on Celo
 */
export class RewardsService {
  private provider: BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private impactCertificateContract: Contract | null = null;
  private studentRewardsContract: Contract | null = null;
  private celoContract: Contract | null = null;
  private cUSDContract: Contract | null = null;

  /**
   * Initialize the service with Web3 provider
   */
  async initialize(): Promise<boolean> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Create provider
      this.provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      await this.provider.send('eth_requestAccounts', []);
      
      // Get signer
      this.signer = await this.provider.getSigner();
      
      // Check if on Celo Alfajores
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== CELO_TESTNET_CONFIG.chainId) {
        await this.switchToCeloTestnet();
      }
      
      // Initialize contracts
      this.impactCertificateContract = new Contract(
        CELO_TESTNET_CONFIG.impactCertificate,
        IMPACT_CERTIFICATE_ABI,
        this.signer
      );
      
      this.studentRewardsContract = new Contract(
        CELO_TESTNET_CONFIG.studentRewards,
        STUDENT_REWARDS_ABI,
        this.signer
      );
      
      this.celoContract = new Contract(
        CELO_TESTNET_CONFIG.CELO,
        CELO_ABI,
        this.signer
      );
      
      this.cUSDContract = new Contract(
        CELO_TESTNET_CONFIG.cUSD,
        CUSD_ABI,
        this.signer
      );
      
      console.log('Rewards service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize rewards service:', error);
      throw error;
    }
  }

  /**
   * Switch to Celo Alfajores testnet
   */
  async switchToCeloTestnet(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CELO_TESTNET_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${CELO_TESTNET_CONFIG.chainId.toString(16)}`,
            chainName: CELO_TESTNET_CONFIG.chainName,
            nativeCurrency: CELO_TESTNET_CONFIG.nativeCurrency,
            rpcUrls: [CELO_TESTNET_CONFIG.rpcUrl],
            blockExplorerUrls: [CELO_TESTNET_CONFIG.blockExplorer]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get current connected address
   */
  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Service not initialized');
    return await this.signer.getAddress();
  }

  /**
   * Get CELO balance for an address
   */
  async getCELOBalance(address?: string): Promise<string> {
    if (!this.celoContract) throw new Error('Service not initialized');
    
    const targetAddress = address || await this.getAddress();
    const balance = await this.celoContract.balanceOf(targetAddress);
    return formatEther(balance);
  }

  /**
   * Get cUSD balance for an address (kept for backward compatibility)
   */
  async getCUSDBalance(address?: string): Promise<string> {
    if (!this.cUSDContract) throw new Error('Service not initialized');
    
    const targetAddress = address || await this.getAddress();
    const balance = await this.cUSDContract.balanceOf(targetAddress);
    return formatEther(balance);
  }

  // ==================== IMPACT CERTIFICATE METHODS ====================

  /**
   * Issue a single impact certificate to an admin
   */
  async issueCertificate(
    recipient: string,
    organizationName: string,
    totalPickups: number,
    foodDonatedKg: number,
    co2SavedKg: number,
    mealsProvided: number,
    tokenURI: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.impactCertificateContract) throw new Error('Service not initialized');
    
    const tx = await this.impactCertificateContract.issueCertificate(
      recipient,
      organizationName,
      totalPickups,
      foodDonatedKg,
      co2SavedKg,
      mealsProvided,
      tokenURI
    );
    
    return tx;
  }

  /**
   * Batch issue certificates to multiple admins
   */
  async batchIssueCertificates(
    recipients: string[],
    organizationNames: string[],
    totalPickups: number[],
    foodDonatedKgs: number[],
    co2SavedKgs: number[],
    mealsProvidedList: number[],
    tokenURIs: string[]
  ): Promise<ethers.ContractTransaction> {
    if (!this.impactCertificateContract) throw new Error('Service not initialized');
    
    const tx = await this.impactCertificateContract.batchIssueCertificates(
      recipients,
      organizationNames,
      totalPickups,
      foodDonatedKgs,
      co2SavedKgs,
      mealsProvidedList,
      tokenURIs
    );
    
    return tx;
  }

  /**
   * Get all certificates for an address
   */
  async getCertificatesForRecipient(recipient: string): Promise<CertificateData[]> {
    if (!this.impactCertificateContract) throw new Error('Service not initialized');
    
    const certs = await this.impactCertificateContract.getCertificatesForRecipient(recipient);
    
    return certs.map((cert: any) => ({
      tokenId: cert.tokenId.toNumber(),
      recipient: cert.recipient,
      totalPickups: cert.totalPickups.toNumber(),
      foodDonatedKg: cert.foodDonatedKg.toNumber(),
      co2SavedKg: cert.co2SavedKg.toNumber(),
      mealsProvided: cert.mealsProvided.toNumber(),
      issuedAt: cert.issuedAt.toNumber(),
      organizationName: cert.organizationName,
      achievementLevel: cert.achievementLevel
    }));
  }

  /**
   * Get certificate by token ID
   */
  async getCertificate(tokenId: number): Promise<CertificateData> {
    if (!this.impactCertificateContract) throw new Error('Service not initialized');
    
    const cert = await this.impactCertificateContract.getCertificate(tokenId);
    
    return {
      tokenId: cert.tokenId.toNumber(),
      recipient: cert.recipient,
      totalPickups: cert.totalPickups.toNumber(),
      foodDonatedKg: cert.foodDonatedKg.toNumber(),
      co2SavedKg: cert.co2SavedKg.toNumber(),
      mealsProvided: cert.mealsProvided.toNumber(),
      issuedAt: cert.issuedAt.toNumber(),
      organizationName: cert.organizationName,
      achievementLevel: cert.achievementLevel
    };
  }

  /**
   * Check if address has a certificate
   */
  async hasCertificate(address: string): Promise<boolean> {
    if (!this.impactCertificateContract) throw new Error('Service not initialized');
    return await this.impactCertificateContract.hasCertificate(address);
  }

  /**
   * Get total certificates minted
   */
  async getTotalCertificates(): Promise<number> {
    if (!this.impactCertificateContract) throw new Error('Service not initialized');
    const total = await this.impactCertificateContract.totalCertificates();
    return total.toNumber();
  }

  // ==================== STUDENT REWARDS METHODS ====================

  /**
   * Reward a single student (legacy function for old contract)
   */
  async rewardStudent(studentAddress: string): Promise<any> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    const tx = await this.studentRewardsContract.rewardStudent(studentAddress);
    return tx;
  }

  /**
   * Claim food reward for student (new SimpleStudentRewards contract)
   * This will:
   * 1. Send 0.1 CELO to the student
   * 2. Mint an NFT certificate to the admin
   */
  async claimFoodReward(studentAddress: string, adminAddress: string): Promise<any> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    console.log('Claiming food reward:', { student: studentAddress, admin: adminAddress });
    
    // Call claimFood function on the contract
    const tx = await this.studentRewardsContract.claimFood(studentAddress, adminAddress);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return {
      transaction: tx,
      receipt: receipt,
      studentAddress,
      adminAddress,
      rewardAmount: '0.1 CELO'
    };
  }

  /**
   * Batch reward multiple students (for testing)
   */
  async batchRewardStudents(studentAddresses: string[]): Promise<any> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    const tx = await this.studentRewardsContract.batchRewardStudents(studentAddresses);
    return tx;
  }

  /**
   * Get student data (updated for SimpleStudentRewards contract)
   */
  async getStudentData(studentAddress: string): Promise<StudentData> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    try {
      // Try new contract method first
      const stats = await this.studentRewardsContract.getStudentStats(studentAddress);
      
      return {
        totalMeals: Number(stats.totalClaims),
        totalRewards: parseFloat(formatEther(stats.totalRewards)),
        lastClaim: Number(stats.lastClaimTime),
        streak: 0, // Not tracked in simple contract
        active: Number(stats.totalClaims) > 0
      };
    } catch (error) {
      // Fallback to old contract method if available
      try {
        const data = await this.studentRewardsContract.getStudentData(studentAddress);
        
        return {
          totalMeals: Number(data.totalMeals),
          totalRewards: parseFloat(formatEther(data.totalRewards)),
          lastClaim: Number(data.lastClaim),
          streak: Number(data.streak),
          active: data.active
        };
      } catch (fallbackError) {
        console.error('Failed to get student data:', error, fallbackError);
        throw error;
      }
    }
  }

  /**
   * Preview next reward for a student
   */
  async previewNextReward(studentAddress: string): Promise<string> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    const reward = await this.studentRewardsContract.previewNextReward(studentAddress);
    return formatEther(reward);
  }

  /**
   * Get reward statistics
   */
  async getRewardStatistics(): Promise<RewardStatistics> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    const stats = await this.studentRewardsContract.getStatistics();
    
    return {
      totalStudents: Number(stats.totalStudents),
      totalMeals: Number(stats.totalMeals),
      totalRewards: parseFloat(formatEther(stats.totalRewards)),
      contractBalance: parseFloat(formatEther(stats.contractBalance))
    };
  }

  /**
   * Get contract balance
   */
  async getContractBalance(): Promise<string> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    const balance = await this.studentRewardsContract.getBalance();
    return formatEther(balance);
  }

  /**
   * Get reward configuration
   */
  async getRewardConfig(): Promise<{
    rewardPerMeal: string;
    bonusThreshold: number;
    bonusAmount: string;
  }> {
    if (!this.studentRewardsContract) throw new Error('Service not initialized');
    
    const [rewardPerMeal, threshold, bonusAmount] = await Promise.all([
      this.studentRewardsContract.rewardPerMeal(),
      this.studentRewardsContract.bonusRewardThreshold(),
      this.studentRewardsContract.bonusRewardAmount()
    ]);
    
    return {
      rewardPerMeal: formatEther(rewardPerMeal),
      bonusThreshold: Number(threshold),
      bonusAmount: formatEther(bonusAmount)
    };
  }

  /**
   * Deposit CELO funds into rewards contract
   */
  async depositFunds(amount: string): Promise<any> {
    if (!this.studentRewardsContract || !this.celoContract) {
      throw new Error('Service not initialized');
    }
    
    const amountWei = parseEther(amount);
    
    // First approve the StudentRewards contract to spend CELO
    const approveTx = await this.celoContract.approve(
      CELO_TESTNET_CONFIG.studentRewards,
      amountWei
    );
    await approveTx.wait();
    
    // Then deposit
    const depositTx = await this.studentRewardsContract.depositFunds(amountWei);
    return depositTx;
  }

  // ==================== TESTING & UTILITY METHODS ====================

  /**
   * Test function to reward all students and issue certificates to all admins
   * This is the main function called by the test button
   */
  async executeTestRewards(
    studentAddresses: string[],
    adminAddresses: string[],
    adminData: Array<{
      organizationName: string;
      totalPickups: number;
      foodDonatedKg: number;
      co2SavedKg: number;
      mealsProvided: number;
    }>
  ): Promise<{
    studentTx: any;
    certificateTx: any;
  }> {
    if (!this.studentRewardsContract || !this.impactCertificateContract || !this.celoContract) {
      throw new Error('Service not initialized');
    }

    console.log('Starting test reward distribution...');
    
    try {
      // Pre-flight checks
      const signerAddress = await this.getAddress();
      console.log('Signer address:', signerAddress);
      
      // Check 1: Contract balance (check CELO balance of StudentRewards contract)
      const contractBalance = await this.celoContract.balanceOf(CELO_TESTNET_CONFIG.studentRewards);
      const contractBalanceFormatted = formatEther(contractBalance);
      console.log('StudentRewards contract CELO balance:', contractBalanceFormatted);
      
      // Estimate required amount (0.5 CELO per student)
      const requiredAmount = studentAddresses.length * 0.5;
      if (parseFloat(contractBalanceFormatted) < requiredAmount) {
        throw new Error(
          `❌ Insufficient contract balance!\n\n` +
          `Contract has: ${contractBalanceFormatted} CELO\n` +
          `Required for ${studentAddresses.length} students: ${requiredAmount} CELO\n\n` +
          `🔧 FIX: Send CELO to the StudentRewards contract:\n` +
          `Address: ${CELO_TESTNET_CONFIG.studentRewards}\n\n` +
          `Get test CELO from: https://faucet.celo.org/alfajores`
        );
      }
      
      console.log(`✅ Contract has sufficient balance: ${contractBalanceFormatted} CELO`);
      
      // Check 2: Signer's CELO balance (just for info)
      const signerBalance = await this.celoContract.balanceOf(signerAddress);
      console.log('Your CELO balance:', formatEther(signerBalance));
      
      // Check 3: Try to estimate gas for the transaction to catch errors early
      console.log('Estimating gas for batch reward transaction...');
      try {
        await this.studentRewardsContract.batchRewardStudents.estimateGas(studentAddresses);
        console.log('✅ Gas estimation successful - transaction should work!');
      } catch (gasError: any) {
        console.error('❌ Gas estimation failed:', gasError);
        
        // Try to provide specific error message
        const errorMessage = gasError.message || gasError.toString();
        
        if (errorMessage.includes('AccessControl') || errorMessage.includes('access')) {
          throw new Error(
            `❌ Missing REWARD_MANAGER_ROLE!\n\n` +
            `Your address: ${signerAddress}\n\n` +
            `🔧 FIX: Grant REWARD_MANAGER_ROLE to your address:\n` +
            `1. Open StudentRewards in Remix: ${CELO_TESTNET_CONFIG.studentRewards}\n` +
            `2. Call REWARD_MANAGER_ROLE() to get the role (copy the bytes32 value)\n` +
            `3. Call grantRole(roleBytes32, "${signerAddress}")`
          );
        }
        
        if (errorMessage.includes('Pausable') || errorMessage.includes('paused')) {
          throw new Error('❌ StudentRewards contract is paused. Please unpause it first.');
        }
        
        if (errorMessage.includes('ERC20: transfer amount exceeds balance')) {
          throw new Error(
            `❌ Contract doesn't have enough CELO!\n\n` +
            `The StudentRewards contract was deployed but has no CELO tokens.\n\n` +
            `🔧 FIX: Send CELO to: ${CELO_TESTNET_CONFIG.studentRewards}`
          );
        }
        
        throw new Error(
          `❌ Transaction will fail!\n\n` +
          `Error: ${errorMessage}\n\n` +
          `Common causes:\n` +
          `1. Missing REWARD_MANAGER_ROLE for your address\n` +
          `2. Contract is paused\n` +
          `3. Contract not funded with CELO\n` +
          `4. Contract deployed incorrectly`
        );
      }
      
      // Step 1: Reward all students
      console.log(`Rewarding ${studentAddresses.length} students...`);
      const studentTx = await this.batchRewardStudents(studentAddresses);
      console.log('Student reward transaction sent:', studentTx);

      // Step 2: Issue certificates to all admins
      console.log(`Issuing certificates to ${adminAddresses.length} admins...`);
      
      // Generate token URIs (in production, these would point to IPFS metadata)
      const tokenURIs = adminData.map((_, index) => 
        `ipfs://QmExample${index}/metadata.json`
      );
      
      const certificateTx = await this.batchIssueCertificates(
        adminAddresses,
        adminData.map(d => d.organizationName),
        adminData.map(d => d.totalPickups),
        adminData.map(d => d.foodDonatedKg),
        adminData.map(d => d.co2SavedKg),
        adminData.map(d => d.mealsProvided),
        tokenURIs
      );
      console.log('Certificate transaction sent:', certificateTx);

      return { studentTx, certificateTx };
    } catch (error: any) {
      console.error('Error in executeTestRewards:', error);
      throw error; // Re-throw to preserve detailed error message
    }
  }

  /**
   * Get transaction receipt and decode events
   */
  async getTransactionEvents(txHash: string): Promise<any[]> {
    if (!this.provider) throw new Error('Service not initialized');
    
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return receipt ? [...receipt.logs] : [];
  }
}

// Export singleton instance
export const rewardsService = new RewardsService();

// Helper functions for easy import
export const claimFoodReward = async (studentAddress: string, adminAddress: string) => {
  return rewardsService.claimFoodReward(studentAddress, adminAddress);
};

export const getStudentStats = async (studentAddress: string) => {
  return rewardsService.getStudentData(studentAddress);
};

export const getContractBalance = async () => {
  return rewardsService.getRewardStatistics();
};
