import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ArrowLeft, Wallet, Shield, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = React.useState("student");
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  
  // Admin password verification states
  const [adminPassword, setAdminPassword] = React.useState("");
  const [isPasswordVerified, setIsPasswordVerified] = React.useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState("");
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  // Check for tab parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    if (tabParam === 'admin') {
      setActiveTab('admin');
    }
  }, []);

  // Handle wallet authentication when connected
  const handleWalletAuth = React.useCallback(async () => {
    if (!address || !isConnected) return;
    
    // For admin, require password verification first
    if (activeTab === 'admin' && !isPasswordVerified) {
      toast({
        title: "Password Required",
        description: "Please verify admin password before connecting wallet",
        variant: "destructive",
      });
      disconnect();
      return;
    }
    
    setIsAuthenticating(true);
    
    try {
      // Create a message to sign
      const message = `Sign this message to authenticate with Campus Food Waste Reduction.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Request signature
      const signature = await signMessageAsync({ message });
      
      // Send authentication request to backend
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          signature,
          message,
          role: activeTab === 'admin' && isPasswordVerified ? 'admin' : 'student',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Success!",
          description: "Wallet authenticated successfully",
        });
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          setLocation('/admin');
        } else {
          setLocation('/student');
        }
      } else {
        const error = await response.json();
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to authenticate wallet",
          variant: "destructive",
        });
        disconnect();
      }
    } catch (error: any) {
      console.error('Wallet authentication error:', error);
      
      if (error.message?.includes('User rejected')) {
        toast({
          title: "Signature Rejected",
          description: "You need to sign the message to authenticate",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication Error",
          description: error.message || "An error occurred during authentication",
          variant: "destructive",
        });
      }
      
      disconnect();
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, isConnected, activeTab, isPasswordVerified, signMessageAsync, disconnect, setLocation, toast]);

  // Trigger authentication when wallet connects
  React.useEffect(() => {
    if (isConnected && address && !isAuthenticating) {
      handleWalletAuth();
    }
  }, [isConnected, address]);

  const handlePasswordVerification = async () => {
    if (!adminPassword.trim()) {
      setPasswordError("Please enter the admin password");
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError("");

    try {
      const response = await fetch("/api/auth/verify-admin-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (response.ok) {
        setIsPasswordVerified(true);
        setPasswordError("");
        toast({
          title: "Password Verified",
          description: "Now connect your wallet to continue",
        });
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.message || "Invalid admin password");
      }
    } catch (error) {
      setPasswordError("Failed to verify password. Please try again.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const resetAdminLogin = () => {
    setIsPasswordVerified(false);
    setAdminPassword("");
    setPasswordError("");
    if (isConnected) {
      disconnect();
    }
  };

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-forest/3 to-forest/8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <Navbar />
      
      {/* Back button positioned at top left */}
      <div className="px-4 pt-4">
        <Button
          variant="ghost"
          onClick={handleBackToLanding}
          className="text-gray-600 dark:text-gray-400 hover:text-forest dark:hover:text-forest-light"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 pt-4">
        <div className="w-full max-w-2xl">

          {/* Login Card with Tabs */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-forest to-forest-dark rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Campus Login
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Connect your wallet to access the campus food claiming system
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 py-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="student" className="flex items-center gap-2 data-[state=active]:bg-forest data-[state=active]:text-white">
                    <Users className="w-4 h-4" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-forest data-[state=active]:text-white">
                    <Shield className="w-4 h-4" />
                    Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="space-y-6">
                  {/* Student Wallet Connection */}
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect your wallet to sign in as a student
                    </p>
                    
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                    
                    {isAuthenticating && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest"></div>
                        Authenticating...
                      </div>
                    )}
                  </div>

                  {/* Student Features */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span>Access to discounted campus meals</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span>Real-time meal availability</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span>Secure claim code system</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="space-y-6">
                  {/* Admin Password Verification Section */}
                  {!isPasswordVerified ? (
                    <>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Enter admin password to proceed
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Admin Password
                          </Label>
                          <Input
                            id="admin-password"
                            type="password"
                            placeholder="Enter admin password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerification()}
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-forest focus:ring-forest"
                          />
                        </div>

                        {passwordError && (
                          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            {passwordError}
                          </div>
                        )}

                        <Button
                          onClick={handlePasswordVerification}
                          disabled={isVerifyingPassword || !adminPassword.trim()}
                          className="w-full bg-forest hover:bg-forest-dark text-white py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isVerifyingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Verifying...
                            </>
                          ) : (
                            "Verify Password"
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Admin Wallet Connection */}
                      <div className="text-center space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Password Verified ✓
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Now connect your wallet to continue as admin
                          </p>
                          <Button
                            variant="outline"
                            onClick={resetAdminLogin}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Use different password
                          </Button>
                        </div>
                        
                        <div className="flex justify-center">
                          <ConnectButton />
                        </div>
                        
                        {isAuthenticating && (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest"></div>
                            Authenticating...
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Admin Features */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-forest rounded-full mr-3"></div>
                      <span>Add and manage food items</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-forest rounded-full mr-3"></div>
                      <span>Verify student claim codes</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-forest rounded-full mr-3"></div>
                      <span>Monitor food waste and analytics</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer note */}
          <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
            Powered by Celo Blockchain
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
