# Migration Guide: Google OAuth to Web3 Wallet Authentication

This project has been migrated from Google OAuth authentication to Web3 wallet-based authentication using RainbowKit, Wagmi, Viem, and WalletConnect v2 on the Celo Alfajores testnet.

## What Changed

### Authentication Flow
- **Before**: Users logged in with Google accounts
- **After**: Users connect their Web3 wallets (MetaMask, WalletConnect, etc.)

### User Identification
- **Before**: Users identified by email address
- **After**: Users identified by wallet address (Ethereum address)

### Technology Stack Updates

#### Added Dependencies:
- `@rainbow-me/rainbowkit` - Wallet connection UI
- `wagmi` - React hooks for Ethereum
- `viem` - TypeScript Ethereum library

#### Removed Dependencies:
- `passport`
- `passport-google-oauth20`
- `@types/passport`
- `@types/passport-google-oauth20`

## Database Schema Changes

### Users Table
A new `walletAddress` field has been added to the users table:

```typescript
{
  id: string,                    // Now stores wallet address
  walletAddress: string,          // Primary identifier (NEW)
  email: string,                  // Optional
  firstName: string,              // Optional
  lastName: string,               // Optional
  profileImageUrl: string,        // Optional
  role: string,                   // 'student' or 'admin'
  studentId: string,              // Auto-generated
  phoneNumber: string,            // Optional
  createdAt: Date,
  updatedAt: Date
}
```

## Setup Instructions

### 1. Get a WalletConnect Project ID
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env` file:
   ```
   WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL` - Your MongoDB connection string
- `ADMIN_PASSWORD` - Password for admin access
- `WALLETCONNECT_PROJECT_ID` - Your WalletConnect project ID

### 3. Database Migration
If you have existing users, you'll need to migrate their data:

```javascript
// Run this migration script in MongoDB
db.users.updateMany(
  { walletAddress: { $exists: false } },
  { 
    $set: { 
      walletAddress: null,
      // You may want to mark these users as inactive
      // until they connect their wallet
    } 
  }
);
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Application
```bash
npm run dev
```

## User Guide

### For Students
1. Navigate to the login page
2. Click "Connect Wallet"
3. Select your preferred wallet (MetaMask, WalletConnect, etc.)
4. Approve the connection request
5. Sign the authentication message
6. You'll be automatically logged in

### For Admins
1. Navigate to the login page
2. Switch to the "Admin" tab
3. Enter the admin password
4. Click "Connect Wallet"
5. Follow the same wallet connection process
6. You'll be logged in as an admin

## Testnet Setup

The application is configured for **Celo Alfajores Testnet**.

### Adding Celo Alfajores to MetaMask
1. Network Name: Celo Alfajores Testnet
2. RPC URL: https://alfajores-forno.celo-testnet.org
3. Chain ID: 44787
4. Currency Symbol: CELO
5. Block Explorer: https://alfajores.celoscan.io

### Getting Test CELO
Visit the [Celo Alfajores Faucet](https://faucet.celo.org/alfajores) to get free test CELO tokens.

## API Changes

### Authentication Endpoints

#### New Endpoints:
- `POST /api/auth/wallet` - Authenticate with wallet signature
  ```json
  {
    "address": "0x...",
    "signature": "0x...",
    "message": "Sign this message...",
    "role": "student" | "admin"
  }
  ```

- `GET /api/auth/user` - Get current user (uses session with wallet address)
- `POST /api/auth/logout` - Logout (destroys session)
- `POST /api/auth/verify-admin-password` - Verify admin password before wallet connection

#### Removed Endpoints:
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback

### Session Structure

#### Before:
```typescript
{
  user: {
    claims: { sub: string },
    access_token: string,
    expires_at: number
  }
}
```

#### After:
```typescript
{
  walletAddress: string,
  user: {
    walletAddress: string,
    role: string
  }
}
```

## Frontend Changes

### New Components:
- `ConnectButton` from RainbowKit - Handles wallet connection UI
- `WagmiProvider` - Provides Wagmi context
- `RainbowKitProvider` - Provides RainbowKit context

### Updated Hooks:
- `useAuth()` - Now uses `useAccount()` from Wagmi and queries by wallet address

### Configuration:
- `client/src/lib/web3Config.ts` - Wagmi and RainbowKit configuration for Celo Alfajores

## Security Considerations

1. **Signature Verification**: All wallet authentications verify the signature server-side using Viem
2. **Session Management**: Sessions are still used to maintain user state
3. **Admin Access**: Admin role still requires password verification before wallet connection
4. **Wallet Address Normalization**: All addresses are stored in lowercase for consistency

## Troubleshooting

### Wallet Connection Issues
- Ensure you're on the Celo Alfajores testnet
- Check that your wallet extension is unlocked
- Try refreshing the page and reconnecting

### Authentication Failures
- Verify your WalletConnect Project ID is correct
- Check browser console for detailed error messages
- Ensure you're signing the authentication message

### Database Issues
- Run database migrations if upgrading from the old system
- Verify MongoDB connection string is correct
- Check that the users collection has the `walletAddress` field

## Support

For issues or questions:
1. Check the GitHub Issues page
2. Review the WalletConnect and RainbowKit documentation
3. Ensure all environment variables are properly set
