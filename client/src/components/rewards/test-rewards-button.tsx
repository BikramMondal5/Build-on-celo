import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Award, 
  Coins, 
  Users, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  TrendingUp,
  Medal
} from 'lucide-react';
import { rewardsService, CELO_TESTNET_CONFIG, claimFoodReward } from '@/lib/rewardsService';
import { useAccount } from 'wagmi';

interface TestRewardsProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface RewardResult {
  studentAddress: string;
  adminAddress: string;
  rewardAmount: string;
  transactionHash?: string;
}

export function TestRewardsButton({ onSuccess, onError }: TestRewardsProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [result, setResult] = useState<RewardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  // Test student address - replace with actual student wallet
  const [testStudentAddress, setTestStudentAddress] = useState('0x1234567890123456789012345678901234567890');
  
  // Admin address will be the connected wallet
  const adminAddress = connectedAddress || '0x0000000000000000000000000000000000000000';

  // Initialize the rewards service
  const handleInitialize = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      setCurrentStep('Connecting to Celo network...');
      await rewardsService.initialize();
      setIsInitialized(true);
      setCurrentStep('Connected successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsInitializing(false);
    }
  };

  // Execute test rewards distribution using the new simple contract
  const handleTestRewards = async () => {
    if (!isInitialized) {
      setError('Please initialize the service first');
      return;
    }

    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Claim food reward (sends CELO to student + mints NFT to admin)
      setCurrentStep('Processing food claim - sending CELO to student and minting NFT to admin...');
      
      console.log('Claiming food reward for:', {
        student: testStudentAddress,
        admin: connectedAddress
      });

      const rewardResult = await claimFoodReward(testStudentAddress, connectedAddress);
      
      setCurrentStep('Transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      if (rewardResult.receipt) {
        setCurrentStep('Transaction confirmed! Reward distributed successfully.');
        
        setResult({
          studentAddress: testStudentAddress,
          adminAddress: connectedAddress,
          rewardAmount: rewardResult.rewardAmount,
          transactionHash: rewardResult.transaction.hash
        });

        onSuccess?.();
      }

    } catch (err: any) {
      console.error('Error distributing rewards:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to distribute rewards';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      setCurrentStep('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Test Reward Distribution
            </CardTitle>
            <CardDescription>
              Test smart contracts by distributing rewards to students and certificates to admins
            </CardDescription>
          </div>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Alert */}
        {currentStep && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              {(isInitializing || isProcessing) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {currentStep}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Test Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-blue-500" />
              Test Student
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-xs text-muted-foreground font-mono break-all">
                {testStudentAddress}
              </p>
              <p className="text-xs text-muted-foreground">
                Will receive 0.1 CELO
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4 text-purple-500" />
              Admin (You)
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-xs text-muted-foreground font-mono break-all">
                {connectedAddress || 'Not connected'}
              </p>
              <p className="text-xs text-muted-foreground">
                Will receive NFT certificate
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contract Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Smart Contract Details</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm font-medium">SimpleStudentRewards</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {CELO_TESTNET_CONFIG.studentRewards}
                </p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm font-medium">AdminFoodCertificate</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {CELO_TESTNET_CONFIG.impactCertificate}
                </p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isInitialized ? (
            <Button 
              onClick={handleInitialize} 
              disabled={isInitializing}
              className="flex-1"
              size="lg"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Connect to Celo Testnet
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleTestRewards} 
              disabled={isProcessing}
              className="flex-1"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Distribute Test Rewards
                </>
              )}
            </Button>
          )}
        </div>

        {/* Success Result */}
        {result && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <h4 className="font-semibold">Distribution Successful!</h4>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Coins className="h-4 w-4 text-blue-500" />
                    Student Reward
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-mono text-xs">{result.studentAddress.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Received:</span>
                    <span className="font-medium">{result.rewardAmount}</span>
                  </div>
                  {result.transactionHash && (
                    <a
                      href={`${CELO_TESTNET_CONFIG.blockExplorer}/tx/${result.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      View Transaction
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Medal className="h-4 w-4 text-purple-500" />
                    Admin Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Admin:</span>
                    <span className="font-mono text-xs">{result.adminAddress.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NFT:</span>
                    <span className="font-medium">Minted ✅</span>
                  </div>
                  {result.transactionHash && (
                    <a
                      href={`${CELO_TESTNET_CONFIG.blockExplorer}/tx/${result.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
                    >
                      View Transaction
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Both the CELO reward and NFT certificate were processed in the same transaction! View on <a 
                  href={CELO_TESTNET_CONFIG.blockExplorer} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Celo Alfajores Explorer
                </a> to verify on-chain data.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Network Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Network: Celo Alfajores Testnet</span>
            <span>Chain ID: {CELO_TESTNET_CONFIG.chainId}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
