# WalletConnect Setup Guide

## Getting Your WalletConnect Project ID

The application requires a WalletConnect Project ID to enable wallet connections. Follow these steps:

### Step 1: Create a WalletConnect Account

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Click "Sign Up" or "Get Started"
3. Sign up using your email or GitHub account

### Step 2: Create a New Project

1. Once logged in, click "Create New Project"
2. Enter project details:
   - **Project Name**: Campus Food Waste Reduction (or any name you prefer)
   - **Project Description**: Web3 authentication for campus food waste reduction app
   - **Project Homepage URL**: Your app URL (can use `http://localhost:5000` for development)

3. Click "Create"

### Step 3: Get Your Project ID

1. After creating the project, you'll see your **Project ID** on the project dashboard
2. Copy the Project ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Step 4: Configure Your Application

#### For Development:

1. Create a `client/.env` file in your project:
   ```bash
   # From the project root
   cd client
   cp .env.example .env
   ```

2. Edit `client/.env` and add your Project ID:
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
   ```

3. Save the file

#### For Production:

Set the environment variable in your hosting platform:
- **Vercel/Netlify**: Add `VITE_WALLETCONNECT_PROJECT_ID` in project settings
- **Docker**: Add to your docker-compose.yml or Dockerfile
- **Server**: Export the variable in your shell profile

### Step 5: Restart Your Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 6: Verify Setup

1. Open your browser console (F12)
2. Navigate to your login page
3. You should NOT see the warning: "⚠️ Using default WalletConnect Project ID"
4. When you click "Connect Wallet", the WalletConnect modal should work properly

## Troubleshooting

### Issue: Still seeing 403 errors

**Solution**: 
- Double-check your Project ID is correct
- Make sure the `.env` file is in the `client/` directory (not the root)
- Ensure the variable name is exactly `VITE_WALLETCONNECT_PROJECT_ID`
- Restart the dev server after adding the env variable

### Issue: Environment variable not loading

**Solution**:
- Vite requires the `VITE_` prefix for environment variables
- Make sure you're using `import.meta.env.VITE_WALLETCONNECT_PROJECT_ID` in the code
- Clear your browser cache and restart dev server

### Issue: WalletConnect not working in production

**Solution**:
- Add your production domain to the WalletConnect project settings
- Verify the environment variable is set in your deployment platform
- Check build logs to ensure the variable is available during build time

## Free Tier Limits

WalletConnect's free tier includes:
- ✅ 1 million monthly requests
- ✅ Unlimited projects
- ✅ All core features
- ✅ Community support

This is more than enough for development and small to medium production apps.

## Need Help?

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [WalletConnect Cloud Dashboard](https://cloud.walletconnect.com)
- [Discord Community](https://discord.walletconnect.com)
