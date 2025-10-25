import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { QrCode, Camera, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function QrScanner() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerInitialized = useRef(false);

  // Get claim data from sessionStorage (passed from student dashboard)
  const claimDataStr = sessionStorage.getItem('qr_scan_claim');
  const claimData = claimDataStr ? JSON.parse(claimDataStr) : null;

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
          })
          .catch((err) => console.error('Error stopping scanner:', err));
      }
    };
  }, [isScanning]);

  const requestCameraPermission = async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      toast({
        title: "Camera Access Granted",
        description: "You can now scan QR codes.",
      });
    } catch (err) {
      console.error('Camera permission error:', err);
      setPermissionDenied(true);
      setError('Camera permission denied. Please allow camera access to scan QR codes.');
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access in your browser settings to scan QR codes.",
        variant: "destructive",
      });
    }
  };

  const startScanning = async () => {
    if (scannerInitialized.current) return;

    try {
      setError(null);
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      scannerInitialized.current = true;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText) => {
          // QR Code successfully scanned
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Scan error (expected when no QR code in frame)
          // We can ignore these errors as they're normal
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please make sure your camera is not being used by another application.');
      scannerInitialized.current = false;
      toast({
        title: "Scanner Error",
        description: "Failed to start the QR code scanner.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setIsScanning(false);
        scannerInitialized.current = false;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Stop scanning immediately after successful scan
    await stopScanning();
    
    setScannedData(decodedText);
    
    toast({
      title: "QR Code Scanned!",
      description: "Processing your scanned code...",
    });

    // Here you can add logic to verify the scanned QR code
    // For example, check if it matches the claim code
    if (claimData?.claimCode) {
      if (decodedText === claimData.claimCode) {
        toast({
          title: "Verification Successful!",
          description: "QR code matches your claim.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "QR code does not match your claim.",
          variant: "destructive",
        });
      }
    }

    // Navigate back after a short delay
    setTimeout(() => {
      sessionStorage.removeItem('qr_scan_claim');
      navigate('/student');
    }, 2000);
  };

  const handleClose = () => {
    stopScanning();
    sessionStorage.removeItem('qr_scan_claim');
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest/10 to-surface dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <QrCode className="w-6 h-6 text-forest dark:text-forest-light" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              QR Code Scanner
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Claim Info Card */}
        {claimData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Claim Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Meal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {claimData.foodItem?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Claim Code:</span>
                  <span className="font-mono font-medium text-forest dark:text-forest-light">
                    {claimData.claimCode || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {claimData.status || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permission Request */}
        {!permissionGranted && !permissionDenied && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-forest/10 dark:bg-forest/20 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-forest dark:text-forest-light" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Camera Permission Required
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    To scan QR codes, we need access to your camera. Your privacy is important to us,
                    and the camera will only be used for scanning QR codes.
                  </p>
                </div>
                <Button
                  onClick={requestCameraPermission}
                  className="bg-forest hover:bg-forest/90 text-white"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Grant Camera Access
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permission Denied */}
        {permissionDenied && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                onClick={requestCameraPermission}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Scanner Area */}
        {permissionGranted && !scannedData && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* QR Reader Container */}
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden border-2 border-forest/20 dark:border-forest/40"></div>

                {/* Instructions */}
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Position the QR code within the frame. The scanner will automatically detect and read it.
                  </AlertDescription>
                </Alert>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Scanner Controls */}
                <div className="flex gap-2">
                  {!isScanning ? (
                    <Button
                      onClick={startScanning}
                      className="flex-1 bg-forest hover:bg-forest/90 text-white"
                      size="lg"
                    >
                      <QrCode className="w-5 h-5 mr-2" />
                      Start Scanning
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanning}
                      variant="destructive"
                      className="flex-1"
                      size="lg"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Stop Scanning
                    </Button>
                  )}
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {scannedData && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    QR Code Scanned!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Successfully scanned QR code
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                      {scannedData}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClose}
                  className="bg-forest hover:bg-forest/90 text-white"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
