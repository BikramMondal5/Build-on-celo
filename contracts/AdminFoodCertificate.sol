// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdminFoodCertificate
 * @dev Simple NFT certificate for admins who donate food
 */
contract AdminFoodCertificate is ERC721, Ownable {
    
    // Token ID counter
    uint256 private _tokenIdCounter;
    
    // Student rewards contract address (authorized to mint)
    address public studentRewardsContract;
    
    // Certificate data
    struct Certificate {
        uint256 tokenId;
        address admin;
        uint256 foodDonations;
        uint256 mintedAt;
    }
    
    // Mapping from admin to their certificates
    mapping(address => Certificate) public adminCertificates;
    mapping(uint256 => string) private _tokenURIs;
    
    // Events
    event CertificateMinted(address indexed admin, uint256 indexed tokenId, uint256 timestamp);
    
    constructor() ERC721("Food Donation Certificate", "FDC") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }
    
    /**
     * @dev Set the student rewards contract address (authorized to mint)
     */
    function setStudentRewardsContract(address _contract) external onlyOwner {
        studentRewardsContract = _contract;
    }
    
    /**
     * @dev Mint certificate to admin (called by student rewards contract)
     */
    function mintCertificate(address admin) external {
        require(
            msg.sender == studentRewardsContract || msg.sender == owner(),
            "Not authorized to mint"
        );
        require(admin != address(0), "Invalid admin address");
        
        Certificate storage cert = adminCertificates[admin];
        
        // If admin already has a certificate, just increment donations
        if (cert.tokenId != 0) {
            cert.foodDonations += 1;
        } else {
            // Mint new certificate
            uint256 newTokenId = _tokenIdCounter;
            _tokenIdCounter += 1;
            
            _safeMint(admin, newTokenId);
            
            adminCertificates[admin] = Certificate({
                tokenId: newTokenId,
                admin: admin,
                foodDonations: 1,
                mintedAt: block.timestamp
            });
            
            emit CertificateMinted(admin, newTokenId, block.timestamp);
        }
    }
    
    /**
     * @dev Get certificate data for an admin
     */
    function getCertificate(address admin) external view returns (
        uint256 tokenId,
        uint256 foodDonations,
        uint256 mintedAt
    ) {
        Certificate memory cert = adminCertificates[admin];
        return (cert.tokenId, cert.foodDonations, cert.mintedAt);
    }
    
    /**
     * @dev Check if admin has a certificate
     */
    function hasCertificate(address admin) external view returns (bool) {
        return adminCertificates[admin].tokenId != 0;
    }
    
    /**
     * @dev Get total certificates minted
     */
    function totalCertificates() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Set token URI for a certificate
     */
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = uri;
    }
    
    /**
     * @dev Get token URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If token URI is set, return it
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // Otherwise return default URI
        return string(abi.encodePacked("https://fooddonation.example/certificate/", _toString(tokenId)));
    }
    
    /**
     * @dev Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
