# 🚀 Quick Start Guide

## Current Status

The authentication errors you saw were due to missing WalletConnect configuration. I've fixed this!

## What I Fixed

1. ✅ Updated `client/src/lib/web3Config.ts` to use environment variables
2. ✅ Created `client/.env` with a placeholder Project ID
3. ✅ Improved error handling in the login flow
4. ✅ Created setup documentation

## Next Steps

### Option 1: Quick Test (Use Temporary ID)
The app will now work with a temporary WalletConnect ID for testing. Just:

```bash
npm run dev
```

Then test the wallet connection. You'll see a warning in the console, but it should work for basic testing.

### Option 2: Get Your Own WalletConnect Project ID (Recommended)

1. **Go to WalletConnect Cloud**: https://cloud.walletconnect.com
2. **Sign up/Login** (free account)
3. **Create a new project**
4. **Copy your Project ID**
5. **Update `client/.env`**:
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
   ```
6. **Restart the dev server**:
   ```bash
   npm run dev
   ```

## Testing the Flow

### Test Student Login:
1. Go to `http://localhost:5000/login`
2. Stay on "Student" tab
3. Click "Connect Wallet"
4. Choose your wallet (MetaMask, etc.)
5. Approve connection
6. Sign the message
7. ✅ You'll be redirected to `/student`

### Test Admin Login:
1. Go to `http://localhost:5000/login`
2. Switch to "Admin" tab
3. Enter password: `admin123` (default)
4. Click "Verify Password"
5. Click "Connect Wallet"
6. Approve and sign
7. ✅ You'll be redirected to `/admin`

## Important Files

- `client/.env` - WalletConnect Project ID configuration
- `WALLETCONNECT_SETUP.md` - Detailed setup guide
- `client/src/lib/web3Config.ts` - Web3 configuration
- `client/src/pages/login.tsx` - Login page with wallet auth

## Troubleshooting

### Still seeing 403 errors?
- Make sure you restart the dev server after editing `.env`
- Clear your browser cache (Ctrl+Shift+Delete)
- Check that `client/.env` exists (not just `.env.example`)

### Signature errors?
- Make sure you're on Celo Alfajores testnet in your wallet
- Try disconnecting and reconnecting your wallet
- Check console for detailed error messages

### Can't connect to MongoDB?
- Make sure MongoDB is running
- Check `.env` in root directory has correct `DATABASE_URL`

## Environment Variables

### Root `.env` (backend):
```env
DATABASE_URL=mongodb://localhost:27017/campus-food-waste
ADMIN_PASSWORD=admin123
NODE_ENV=development
```

### `client/.env` (frontend):
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Need Help?

Check these docs:
- `WALLETCONNECT_SETUP.md` - WalletConnect setup
- `MIGRATION.md` - Web3 migration guide
- `WEB3_AUTH_SUMMARY.md` - Complete implementation details

---

**Ready to test!** 🎉

Just run `npm run dev` and navigate to `http://localhost:5000/login`
