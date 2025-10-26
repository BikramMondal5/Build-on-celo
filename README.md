# The Main code present in the `Block-chain-done` branch

# RePlate Campus - Food Waste Reduction Platform

RePlate Campus is a comprehensive web3-enabled platform designed to reduce food waste on university campuses by connecting students with discounted surplus food items from campus canteens. The platform features blockchain-based authentication, real-time food listings, secure claim code system, and smart contract rewards on the Celo blockchain.

## Key Highlights
- 🔗 Web3 Authentication: Wallet-based login using RainbowKit & WalletConnect v2
- 🌍 Celo Integration: Built on Celo Alfajores testnet for sustainable blockchain operations
- 💰 Smart Contract Rewards: Automated cUSD rewards for students and NFT certificates for admins
- 📱 Real-time Updates: Live food availability tracking and instant notifications
- 🔒 Secure Claim System: QR code-based meal verification with 2-hour expiration
- ♻️ Donation Management: Automated expired food transfer to NGO partnerships

## 🌟 Features

**For Students:**
- Browse available discounted meals from campus canteens
- Claim meals with unique claim codes
- Receive cUSD rewards upon verified meal collection
- Track personal savings and environmental impact
- Real-time notifications for claims and approvals

**For Admins (Canteen Staff):**
- Add and manage food items with pricing and quantities
- Approve/reject student meal claims
- Verify claim codes via QR scanning or manual entry
- Monitor expiry status of unclaimed items
- Receive NFT certificates for waste reduction impact
- Transfer expired items to donation pool
- Manage NGO reservations and collections

**Platform Features:**
- Dual authentication system (Student/Admin roles)
- Event calendar for campus food events
- Comprehensive analytics dashboard
- Campus-wide impact tracking (CO₂ saved, waste reduction)
- Mobile-responsive design with dark mode
- Email notifications for claim approvals

## 🛠️ Technologies Used

**Frontend:**
- Framework: React 19 with TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS with custom design system
- UI Components: Radix UI primitives via shadcn/ui
- Web3: RainbowKit, Wagmi, Viem
- State Management: React Query (TanStack Query)
- Form Handling: React Hook Form with Zod validation
- Routing: Wouter

**Backend:**
- Runtime: Node.js with Express
- Database: MongoDB with Mongoose ODM
- Authentication: Web3 wallet signatures (ECDSA)
- Session Management: Express-session with connect-mongo
- File Upload: Multer for image handling
- Email: Nodemailer for notifications

**Blockchain:**
- Network: Celo Alfajores Testnet
- RPC: Celo Forno public RPC
- Wallet Integration: WalletConnect v2
- Smart Contracts: Solidity (StudentRewards, AdminNFT)


## contract addresses:

"network": "celoAlfajores",
"adminCertificate": "0xca5c934C0E9dedDdF2F6878BBCae3BFF91615E56",
"studentRewards": "0x1dB6BA08597b100e9Ba791BaB18aC9BDdB97eCe2",
"deployer": "0x086C05dCa183D2Ee73D1485CF0ECC9dB2A867E15",

