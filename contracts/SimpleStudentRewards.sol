// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleStudentRewards
 * @dev Simple contract to reward students with CELO when they claim food
 */
contract SimpleStudentRewards {
    
    // Reward amount per meal claim (0.1 CELO)
    uint256 public constant REWARD_AMOUNT = 0.1 ether;
    
    // Owner of the contract
    address public owner;
    
    // Track student claims
    mapping(address => uint256) public studentClaims;
    mapping(address => uint256) public studentRewards;
    
    // Admin NFT contract address
    address public adminCertificateContract;
    
    // Events
    event FoodClaimed(address indexed student, uint256 rewardAmount, uint256 timestamp);
    event ContractFunded(address indexed funder, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    /**
     * @dev Set the admin certificate contract address
     */
    function setAdminCertificateContract(address _contract) external onlyOwner {
        adminCertificateContract = _contract;
    }
    
    /**
     * @dev Student claims food and gets CELO reward
     * @param student Address of the student claiming food
     * @param admin Address of the admin who donated the food
     */
    function claimFood(address student, address admin) external onlyOwner {
        require(student != address(0), "Invalid student address");
        require(admin != address(0), "Invalid admin address");
        require(address(this).balance >= REWARD_AMOUNT, "Insufficient contract balance");
        
        // Update student data
        studentClaims[student] += 1;
        studentRewards[student] += REWARD_AMOUNT;
        
        // Send CELO reward to student
        (bool success, ) = student.call{value: REWARD_AMOUNT}("");
        require(success, "CELO transfer failed");
        
        // Mint NFT certificate to admin
        if (adminCertificateContract != address(0)) {
            (bool nftSuccess, ) = adminCertificateContract.call(
                abi.encodeWithSignature("mintCertificate(address)", admin)
            );
            require(nftSuccess, "NFT minting failed");
        }
        
        emit FoodClaimed(student, REWARD_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Get student statistics
     */
    function getStudentStats(address student) external view returns (uint256 claims, uint256 rewards) {
        return (studentClaims[student], studentRewards[student]);
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Fund the contract with CELO
     */
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw CELO from contract (owner only)
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Withdrawal failed");
    }
}
