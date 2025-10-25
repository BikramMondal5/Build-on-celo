import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Share2, Copy, Info } from "lucide-react";
import { formatTimeRemaining } from "@/lib/qr-utils";
import { useToast } from "@/hooks/use-toast";
import type { FoodClaim, FoodItem } from "@shared/schema";
import { useState } from "react";

interface ClaimCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: (FoodClaim & { foodItem: FoodItem }) | null;
  onSubmitClaim?: (formData: ClaimFormData) => void;
  isClaimForm?: boolean;
}

export interface ClaimFormData {
  name: string;
  email: string;
  phoneNumber: string;
  organization: string;
  numberOfItems: number;
}

export function ClaimCodeModal({ isOpen, onClose, claim, onSubmitClaim, isClaimForm = false }: ClaimCodeModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ClaimFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    organization: "",
    numberOfItems: 1,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClaimFormData, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ClaimFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }

    if (formData.numberOfItems < 1) {
      newErrors.numberOfItems = "Must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm() && onSubmitClaim) {
      onSubmitClaim(formData);
    }
  };

  const handleInputChange = (field: keyof ClaimFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCopyCode = () => {
    if (!claim?.claimCode) return;

    navigator.clipboard.writeText(claim.claimCode);
    toast({
      title: "Claim Code Copied",
      description: "Your claim code has been copied to clipboard.",
    });
  };

  const handleShare = async () => {
    if (!claim) return;

    const shareData = {
      title: "RePlate Campus - Meal Claim",
      text: `I've claimed a meal: ${claim.foodItem.name}. Claim code: ${claim.claimCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Your meal claim has been shared.",
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copy text
      navigator.clipboard.writeText(shareData.text);
      toast({
        title: "Text Copied",
        description: "Claim details have been copied to clipboard.",
      });
    }
  };

  // Render claim form if isClaimForm is true
  if (isClaimForm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Claim Your Meal
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">
                  Fill in your details to claim this meal
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Important Note */}
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Important:</strong> After claiming, you'll receive a unique claim code. 
                Please store it securely as you'll need it to collect your meal from the canteen.
              </AlertDescription>
            </Alert>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Organization Field */}
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (if any)</Label>
              <Input
                id="organization"
                type="text"
                placeholder="Enter your organization (optional)"
                value={formData.organization}
                onChange={(e) => handleInputChange("organization", e.target.value)}
              />
            </div>

            {/* Number of Items Field */}
            <div className="space-y-2">
              <Label htmlFor="numberOfItems">Number of Order Items <span className="text-red-500">*</span></Label>
              <Input
                id="numberOfItems"
                type="number"
                min="1"
                placeholder="1"
                value={formData.numberOfItems}
                onChange={(e) => handleInputChange("numberOfItems", parseInt(e.target.value) || 1)}
                className={errors.numberOfItems ? "border-red-500" : ""}
              />
              {errors.numberOfItems && (
                <p className="text-sm text-red-500">{errors.numberOfItems}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Original success modal after claim is completed
  // Check if we have valid claim data for the success modal
  if (!claim || !claim.foodItem) return null;

  const timeRemaining = formatTimeRemaining(claim.expiresAt.toString());
  const isExpired = timeRemaining === "Expired";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600 dark:text-green-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Meal Claimed Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">
                Show this claim code to canteen staff to collect your meal
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Claim Code Display */}
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Claim Code</p>
              <div className="text-3xl font-mono font-bold text-forest dark:text-forest-light tracking-widest">
                {claim.claimCode}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Give this code to canteen staff
              </p>
            </div>
          </div>

          {/* Claim Details */}
          <div className="bg-forest/10 dark:bg-forest/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Expires in:</span>
              <Badge variant={isExpired ? "destructive" : "secondary"}>
                {timeRemaining}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Claim ID:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                #{claim.id.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Meal:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {claim.foodItem.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Canteen:</span>
              <span className="text-gray-900 dark:text-white">
                {claim.foodItem.canteenName}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="flex items-center"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy Code
            </Button>
          </div>

          <div className="text-center">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}