import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celoAlfajores } from 'wagmi/chains';
import { http } from 'viem';

// Get WalletConnect Project ID from environment or use a placeholder
// Get your own from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c1c9a92e0c94b4f2f9d8e3f1a2b3c4d5';

// Deployed Smart Contract Addresses on Celo Alfajores
export const STUDENT_REWARDS_ADDRESS = "0x1dB6BA08597b100e9Ba791BaB18aC9BDdB97eCe2";
export const ADMIN_CERTIFICATE_ADDRESS = "0xca5c934C0E9dedDdF2F6878BBCae3BFF91615E56";
export const CELO_ALFAJORES_CHAIN_ID = 44787;

// Celo Alfajores testnet configuration
export const config = getDefaultConfig({
  appName: 'Campus Food Waste Reduction',
  projectId,
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org')
  },
  ssr: false,
});

