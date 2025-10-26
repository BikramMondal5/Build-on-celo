import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertFoodItemSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CheckCircle, XCircle, User } from "lucide-react";
import type { FoodItem, FoodItemWithCreator, FoodDonationWithDetails } from "@shared/schema";
import { TestRewardsButton } from "@/components/rewards/test-rewards-button";
interface FoodItemWithId extends FoodItemWithCreator {
  _id?: string;
}
interface CampusStats {
  totalMealsSaved: number;
  activeStudents: number;
  partnerCanteens: number;
  totalSavings: number;
  foodProvided: number;
  wastedFood: number;
  claimedFood: number;
  carbonFootprintSaved: number;
  waterFootprintSaved: number;
  currentlyActiveItems: number;
  totalQuantityAvailable: number;
}
interface PendingClaim {
  id: string;
  userId: string;
  foodItemId: string;
  quantityClaimed: number;
  status: string;
  createdAt: Date;
  user: {
    walletAddress: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  foodItem: {
    name: string;
    canteenName: string;
    imageUrl?: string;
  };
}
import { Plus, Utensils, TrendingUp, DollarSign, Edit, Trash2, MoreHorizontal, ShieldCheck, Heart, Users, Phone, Clock, AlertTriangle, Leaf, Droplets, Recycle, CheckSquare, Package, Calendar, Coins, QrCode, Camera } from "lucide-react";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { formatTimeRemaining } from "@/lib/qr-utils";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";

const formSchema = insertFoodItemSchema.omit({ createdBy: true }).extend({
  availableUntil: z.string().min(1, "Available until time is required"),
  image: z.any().optional(),
  canteenLocation: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemWithId | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [ngoModalOpen, setNgoModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<FoodDonationWithDetails | null>(null);
  const [ngoForm, setNgoForm] = useState({
    ngoName: "",
    ngoContactPerson: "",
    ngoPhoneNumber: "",
  });
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItemWithId | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedClaimForReward, setSelectedClaimForReward] = useState<any>(null);

  // Redirect if not admin or pending approval
  if (!authLoading && (!user || (user.role !== "admin" && user.role !== null))) {
    setTimeout(() => {
      window.location.href = "/student";
    }, 500);
    return null;
  }

  // If user has null role (pending admin approval), redirect to pending page
  if (!authLoading && user && user.role === null) {
    setTimeout(() => {
      window.location.href = "/admin-pending";
    }, 500);
    return null;
  }

  const { data: myItems = [], isLoading: itemsLoading } = useQuery<FoodItemWithId[]>({
    queryKey: ["/api/food-items/my"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch donations
  const { data: donations = [], isLoading: donationsLoading } = useQuery<FoodDonationWithDetails[]>({
    queryKey: ["/api/donations"],
    enabled: !!user && user.role === "admin",
  });

  const { data: pendingClaims = [], isLoading: pendingClaimsLoading } = useQuery<PendingClaim[]>({
    queryKey: ["/api/food-claims/pending"],
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Add these mutations (put with other mutations):
  const approveClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await apiRequest("PUT", `/api/food-claims/${claimId}/approve`, {});
      if (!response.ok) {
        throw new Error("Failed to approve claim");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Approved",
        description: "The student will receive an email with their claim code.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-claims/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-claims/approved"] });
      refetchApprovedClaims(); // Force refetch of approved claims
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve claim.",
        variant: "destructive",
      });
    },
  });

  const rejectClaimMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason?: string }) => {
      const response = await apiRequest("PUT", `/api/food-claims/${claimId}/reject`, { reason });
      if (!response.ok) {
        throw new Error("Failed to reject claim");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Rejected",
        description: "The student has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-claims/pending"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject claim.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      canteenName: "",
      canteenLocation: "",
      quantityAvailable: 1,
      imageUrl: undefined,
      availableUntil: "",
      isActive: true,
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append all fields
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('canteenName', data.canteenName);
      formData.append('canteenLocation', data.canteenLocation || '');
      formData.append('quantityAvailable', (data.quantityAvailable ?? 1).toString()); 
      formData.append('availableUntil', data.availableUntil);
      formData.append('isActive', (data.isActive ?? true).toString()); 
      
      // Append image file if exists
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0]);
      }
      
      const response = await fetch('/api/food-items', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create food item");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Food Item Added",
        description: "Your food item has been added successfully.",
      });
      setAddItemModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Add Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: FormData & { id: string }) => {
      const { id, ...updateData } = data;
      
      const formData = new FormData();
      
      // Append all fields
      if (updateData.name) formData.append('name', updateData.name);
      if (updateData.description) formData.append('description', updateData.description);
      if (updateData.canteenName) formData.append('canteenName', updateData.canteenName);
      if (updateData.canteenLocation) formData.append('canteenLocation', updateData.canteenLocation);
      if (updateData.quantityAvailable !== undefined) {
        formData.append('quantityAvailable', updateData.quantityAvailable.toString());
      }
      if (updateData.availableUntil) formData.append('availableUntil', updateData.availableUntil);
      if (updateData.isActive !== undefined) {
        formData.append('isActive', updateData.isActive.toString());
      }
      
      // Append image file if exists
      if (updateData.image && updateData.image[0]) {
        formData.append('image', updateData.image[0]);
      }
      
      const response = await fetch(`/api/food-items/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update food item");
      }
      return response.json();
    },
    onSuccess: () => {
      // Close modal and reset form BEFORE showing toast
      setAddItemModalOpen(false);
      setEditingItem(null);
      form.reset();
      
      // Then show toast
      toast({
        title: "Food Item Updated",
        description: "Your food item has been updated successfully.",
        duration: 3000,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Update Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/food-items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Food Item Deleted",
        description: "The food item has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Delete Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyClaimMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/food-claims/verify", { claimCode: code });
      return response.json();
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      if (result.success) {
        toast({
          title: "Claim Verified",
          description: `Meal "${result.claim.foodItem.name}" verified for student.`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Donation mutations
  const transferExpiredMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/donations/transfer-expired", {});
      if (!response.ok) {
        throw new Error("Failed to transfer expired items");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Expired Items Transferred",
        description: `${data.transferredCount} expired food items have been transferred to donations.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to transfer expired items.",
        variant: "destructive",
      });
    },
  });

  const reserveDonationMutation = useMutation({
    mutationFn: async ({ id, ngoInfo }: { id: string; ngoInfo: any }) => {
      const response = await apiRequest("PUT", `/api/donations/${id}/reserve`, ngoInfo);
      if (!response.ok) {
        throw new Error("Failed to reserve donation");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Donation Reserved",
        description: "The food item has been reserved for NGO collection.",
      });
      setNgoModalOpen(false);
      setSelectedDonation(null);
      setNgoForm({ ngoName: "", ngoContactPerson: "", ngoPhoneNumber: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reserve donation.",
        variant: "destructive",
      });
    },
  });

  const collectDonationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/donations/${id}/collect`, {});
      if (!response.ok) {
        throw new Error("Failed to mark donation as collected");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Donation Collected",
        description: "The food item has been marked as collected by NGO.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark donation as collected.",
        variant: "destructive",
      });
    },
  });



  const completeClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await apiRequest("POST", `/api/food-claims/${claimId}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      setVerificationResult(null);
      setClaimCode("");
      toast({
        title: "Meal Collected",
        description: "Student has successfully collected their meal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete claim.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingItem) {
      const itemId = editingItem.id || (editingItem as any)._id;
      updateItemMutation.mutate({ ...data, id: itemId });
    } else {
      addItemMutation.mutate(data);
    }
  };
  const handleEdit = (item: FoodItemWithId) => {
    setEditingItem(item);
    const availableUntil = new Date(item.availableUntil);
    const localDateTime = new Date(availableUntil.getTime() - availableUntil.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    form.reset({
      name: item.name,
      description: item.description || "",
      canteenName: item.canteenName,
      canteenLocation: item.canteenLocation || "",
      quantityAvailable: item.quantityAvailable,
      image: undefined,
      availableUntil: localDateTime,
      isActive: item.isActive,
    });
    setAddItemModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this food item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setAddItemModalOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const handleViewDetails = (item: FoodItemWithId) => {
    console.log('🔍 ========== OPENING VIEW DETAILS ==========');
    console.log('📝 Item object:', item);
    console.log('📝 Item.id:', item.id);
    console.log('📝 Item._id:', (item as any)._id);
    console.log('📝 Item name:', item.name);
    console.log('=======================================');
    setSelectedItem(item);
    setDetailsModalOpen(true);
    setQrCodeDataURL(""); // Reset QR code
    setScannedCode(""); // Reset scanned code
    setSelectedClaimForReward(null); // Reset selected claim
  };

  // Fetch ALL approved claims for the admin (not just for specific food item)
  // This allows verifying any student's code from any food item
  const { data: allApprovedClaims = [], refetch: refetchApprovedClaims } = useQuery<any[]>({
    queryKey: ['/api/food-claims/approved'],
    enabled: !!user && user.role === "admin",
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Log when approved claims change
  useEffect(() => {
    if (allApprovedClaims) {
      console.log('📋 ALL Approved claims received:', allApprovedClaims);
      console.log('📊 Total approved claims:', allApprovedClaims.length);
      if (allApprovedClaims.length > 0) {
        console.log('✅ Available claim codes:', allApprovedClaims.map(c => c.claimCode));
      }
    }
  }, [allApprovedClaims]);

  // Generate QR code when approved claims are loaded
  useEffect(() => {
    if (allApprovedClaims.length > 0 && detailsModalOpen && selectedItem) {
      // Find claims for the selected food item
      const itemClaims = allApprovedClaims.filter(claim => {
        const claimFoodId = claim.foodItemId?.toString();
        const selectedItemId = (selectedItem as any)._id?.toString() || selectedItem.id;
        return claimFoodId === selectedItemId;
      });

      if (itemClaims.length > 0) {
        const latestClaim = itemClaims[0];
        if (latestClaim.claimCode) {
          // Generate QR code from claim code
          QRCode.toDataURL(latestClaim.claimCode, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          })
            .then((url: string) => {
              setQrCodeDataURL(url);
            })
            .catch((err: Error) => {
              console.error('Error generating QR code:', err);
            });
        }
      }
    }
  }, [allApprovedClaims, detailsModalOpen, selectedItem]);

  // Handle code verification from QR scan
  const handleVerifyCode = () => {
    if (!scannedCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a claim code",
        variant: "destructive",
      });
      return;
    }

    const normalizedCode = scannedCode.trim().toUpperCase();
    
    console.log('🔍 Verifying code:', normalizedCode);
    console.log('📋 Checking against all approved claims:', allApprovedClaims.length);
    
    if (!allApprovedClaims || allApprovedClaims.length === 0) {
      toast({
        title: "No Approved Claims",
        description: "There are no approved claims yet. Please approve a student's request first.",
        variant: "destructive",
      });
      return;
    }

    // Find matching claim from ALL approved claims
    const matchingClaim = allApprovedClaims.find((claim) => {
      const claimCodeNormalized = claim.claimCode?.toUpperCase();
      console.log('Comparing:', claimCodeNormalized, 'with', normalizedCode);
      return claimCodeNormalized === normalizedCode;
    });

    console.log('Match result:', matchingClaim);

    if (matchingClaim) {
      setSelectedClaimForReward(matchingClaim);
      toast({
        title: "Code Verified! ✅",
        description: `Claim code matched for ${matchingClaim.user?.firstName || 'student'}!`,
      });
    } else {
      // Show available codes for debugging
      const availableCodes = allApprovedClaims.map(c => c.claimCode).join(', ');
      console.error('No match found. Available codes:', availableCodes);
      toast({
        title: "Invalid Code",
        description: `The code "${normalizedCode}" doesn't match any approved claims.`,
        variant: "destructive",
      });
    }
  };

  // Fetch comprehensive stats
  const { data: stats, isLoading: statsLoading } = useQuery<CampusStats>({
    queryKey: ["/api/stats"],
    enabled: !!user && user.role === "admin",
  });

  // Use server-provided stats for accurate data
  const activeItems = stats?.currentlyActiveItems || 0;
  const totalQuantity = stats?.totalQuantityAvailable || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
        {/* Header */}
       
        

        {/* Comprehensive Stats Dashboard */}
        <div className="space-y-6 mb-6">
          {/* Personal Canteen Stats */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-3">
              Your Canteen Performance
            </h2>
          </div>
          
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-bold text-2xl mb-2">{myItems.length}</p>
                <p className="text-gray-300 text-sm">Your Items Added</p>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-bold text-2xl mb-2">{myItems.reduce((total, item) => total + (item.claimCount || 0), 0)}</p>
                <p className="text-gray-300 text-sm">Total Claims</p>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-bold text-2xl mb-2">{myItems.filter(item => item.isActive).length}</p>
                <p className="text-gray-300 text-sm">Active Items</p>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-bold text-2xl mb-2">{myItems.reduce((total, item) => total + item.quantityAvailable, 0)}</p>
                <p className="text-gray-300 text-sm">Available Quantity</p>
              </div>
            </div>
          </div>

          {/* Campus-wide Stats */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">
              Campus-wide Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-2">{stats?.foodProvided || 0}</p>
                  <p className="text-gray-300 text-sm">Total Food Provided</p>
                </div>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-2">{stats?.claimedFood || 0}</p>
                  <p className="text-gray-300 text-sm">Successfully Claimed</p>
                </div>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-2">{(stats?.carbonFootprintSaved || 0).toFixed(1)} kg</p>
                  <p className="text-gray-300 text-sm">CO₂ Saved</p>
                </div>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Recycle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-2">{((stats?.wastedFood || 0) === 0 ? 100 : Math.max(0, 100 - ((stats?.wastedFood || 0) / (stats?.foodProvided || 1)) * 100)).toFixed(0)}%</p>
                  <p className="text-gray-300 text-sm">Waste Reduction</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="manage" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
            <TabsTrigger value="manage" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Manage Items
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Pending Approval
              {pendingClaims.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingClaims.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unclaimed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Unclaimed
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Coins className="h-4 w-4 mr-2" />
              Test Rewards
            </TabsTrigger>
          </TabsList>


          <TabsContent value="manage" className="space-y-6">
            {/* Add Item Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => setAddItemModalOpen(true)}
                className="bg-forest hover:bg-forest-dark text-white"
                data-testid="button-add-new-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Item
              </Button>
              
              <Dialog open={addItemModalOpen} onOpenChange={handleModalClose}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Food Item" : "Add New Food Item"}
                  </DialogTitle>
                  <p id="dialog-description" className="text-sm text-gray-600 dark:text-gray-400">
                    {editingItem ? "Update the details for this food item" : "Fill in the details to add a new food item to your canteen"}
                  </p>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Food Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Grilled Chicken Sandwich" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="canteenName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canteen Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., North Campus Dining" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the food item..."
                              className="min-h-[80px]"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantityAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity Available</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="5" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="availableUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Until</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field}
                                className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert dark:bg-gray-800 dark:text-white"
                                data-testid="input-available-until"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Food Image (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => onChange(e.target.files)}
                                {...fieldProps}
                                data-testid="input-image-upload"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500 mt-1">
                              Max size: 5MB. Formats: JPG, PNG, GIF, WebP
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="canteenLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canteen Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Building A, Floor 1" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleModalClose}
                        disabled={addItemMutation.isPending || updateItemMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-forest hover:bg-forest-dark text-white"
                        disabled={addItemMutation.isPending || updateItemMutation.isPending}
                        data-testid="button-submit-item"

                      >
                        {addItemMutation.isPending || updateItemMutation.isPending 
                          ? "Saving..." 
                          : editingItem 
                            ? "Update Item" 
                            : "Add Item"
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>

            {/* Food Items Table */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Your Canteen's Food Items</h3>
                <p className="text-gray-300">
                  Manage the food items you've added to the system
                </p>
              </div>
              <div>
            {itemsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : myItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Utensils className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No food items yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by adding your first food item to the system.
                </p>
                <Button 
                  onClick={() => setAddItemModalOpen(true)}
                  className="bg-forest hover:bg-forest-dark text-white"
                  data-testid="button-add-first-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] text-sm">Food Item</TableHead>
                        <TableHead className="w-[120px] text-sm">Canteen</TableHead>
                        <TableHead className="w-[100px] text-sm">Quantity</TableHead>
                        <TableHead className="w-[100px] text-sm">Expires</TableHead>
                        <TableHead className="w-[80px] text-sm">Status</TableHead>
                        <TableHead className="w-[100px] text-sm">Details</TableHead>
                        <TableHead className="w-[60px] text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {myItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-[200px]">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0 flex items-center justify-center">
                               {item.imageUrl ? (
                                 <img
                                   src={item.imageUrl}
                                   alt={item.name}
                                   className="w-full h-full object-cover rounded"
                                 />
                               ) : (
                                 <Utensils className="w-4 h-4 text-gray-400" />
                               )}
                             </div>
                             <div className="min-w-0 flex-1">
                               <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                 {item.name}
                               </p>
                               <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                 {item.description}
                               </p>
                             </div>
                           </div>
                         </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="truncate block max-w-[120px]">{item.canteenName}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {item.quantityAvailable}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="truncate block max-w-[100px]">{formatTimeRemaining(item.availableUntil.toString())}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={item.isActive ? "default" : "secondary"} className="text-xs px-2 py-0">
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleViewDetails(item)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  const itemId = item.id || item._id;
                                  if (itemId) handleDelete(itemId);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="pending" className="space-y-6">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Pending Claim Approvals
                    {pendingClaims.length > 0 && (
                      <Badge className="ml-2 bg-yellow-500 text-white">
                        {pendingClaims.length} pending
                      </Badge>
                    )}
                  </h3>
                  <p className="text-gray-300">
                    Review and approve or reject student meal claims. Students will be notified via email and in-app.
                  </p>
                </div>
                
                {/* Auto-refresh indicator */}
                {pendingClaims.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Auto-refreshing every 30s
                  </div>
                )}
              </div>

              {pendingClaimsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading pending claims...</p>
                </div>
              ) : pendingClaims.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    All Caught Up!
                  </h3>
                  <p className="text-gray-400">
                    No pending claims to review at the moment.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    New claims will appear here automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop view - Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Student</TableHead>
                          <TableHead className="w-[200px]">Food Item</TableHead>
                          <TableHead className="w-[150px]">Canteen</TableHead>
                          <TableHead className="w-[80px] text-center">Qty</TableHead>
                          <TableHead className="w-[150px]">Requested</TableHead>
                          <TableHead className="w-[250px] text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingClaims.map((claim) => (
                          <TableRow key={claim.id} className="hover:bg-gray-700/50">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-yellow-500">
                                  {claim.user.profileImageUrl ? (
                                    <img
                                      src={claim.user.profileImageUrl}
                                      alt={`${claim.user.firstName} ${claim.user.lastName}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                          '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                                      }}
                                    />
                                  ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-white truncate">
                                    {claim.user.firstName || claim.user.walletAddress.slice(0, 8) + '...'} {claim.user.lastName || ''}
                                  </p>
                                  {claim.user.email ? (
                                    <p className="text-xs text-gray-400 truncate">
                                      {claim.user.email}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500 truncate font-mono">
                                      {claim.user.walletAddress?.slice(0, 12)}...
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  {claim.foodItem.imageUrl ? (
                                    <img
                                      src={claim.foodItem.imageUrl}
                                      alt={claim.foodItem.name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  ) : (
                                    <Utensils className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <p className="font-medium text-white truncate">
                                  {claim.foodItem.name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300 text-sm">
                              {claim.foodItem.canteenName}
                            </TableCell>
                            <TableCell className="text-white font-medium text-center">
                              {claim.quantityClaimed}
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              <div className="flex flex-col">
                                <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(claim.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveClaimMutation.mutate(claim.id)}
                                  disabled={approveClaimMutation.isPending || rejectClaimMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Reason for rejection (optional):");
                                    rejectClaimMutation.mutate({ 
                                      claimId: claim.id, 
                                      reason: reason || undefined 
                                    });
                                  }}
                                  disabled={approveClaimMutation.isPending || rejectClaimMutation.isPending}
                                  className="px-4 py-2"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile view - Cards */}
                  <div className="md:hidden space-y-4">
                    {pendingClaims.map((claim) => (
                      <Card key={claim.id} className="bg-gray-700/50 border-yellow-500/30">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Student Info */}
                            <div className="flex items-center space-x-3 pb-3 border-b border-gray-600">
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-500">
                                {claim.user.profileImageUrl ? (
                                  <img
                                    src={claim.user.profileImageUrl}
                                    alt={`${claim.user.firstName} ${claim.user.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">
                                  {claim.user.firstName || claim.user.walletAddress.slice(0, 8) + '...'} {claim.user.lastName || ''}
                                </p>
                                {claim.user.email ? (
                                  <p className="text-xs text-gray-400 truncate">
                                    {claim.user.email}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-500 font-mono">
                                    {claim.user.walletAddress?.slice(0, 16)}...
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Food Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                                {claim.foodItem.imageUrl ? (
                                  <img
                                    src={claim.foodItem.imageUrl}
                                    alt={claim.foodItem.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Utensils className="w-6 h-6 text-gray-400 m-auto" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{claim.foodItem.name}</p>
                                <p className="text-sm text-gray-400">{claim.foodItem.canteenName}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Qty: {claim.quantityClaimed} • {new Date(claim.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-gray-600">
                              <Button
                                size="sm"
                                onClick={() => approveClaimMutation.mutate(claim.id)}
                                disabled={approveClaimMutation.isPending || rejectClaimMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const reason = prompt("Reason for rejection (optional):");
                                  rejectClaimMutation.mutate({ 
                                    claimId: claim.id, 
                                    reason: reason || undefined 
                                  });
                                }}
                                disabled={approveClaimMutation.isPending || rejectClaimMutation.isPending}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unclaimed" className="space-y-6">
            {/* Expiry Status */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Expiry Status Monitor
                </h3>
                <p className="text-gray-300">
                  Monitor unclaimed food items approaching expiry. Items automatically transfer to waste after expiry time.
                </p>
              </div>
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200 text-sm">Expired</span>
                    </div>
                    <p className="text-xl font-bold text-red-800 dark:text-red-200">
                      {myItems.filter(item => new Date(item.availableUntil) < new Date()).length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-800 dark:text-orange-200 text-sm">Critical</span>
                    </div>
                    <p className="text-xl font-bold text-orange-800 dark:text-orange-200">
                      {myItems.filter(item => {
                        const now = new Date();
                        const expiryTime = new Date(item.availableUntil);
                        const timeDiff = expiryTime.getTime() - now.getTime();
                        return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30 minutes
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">Warning</span>
                    </div>
                    <p className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                      {myItems.filter(item => {
                        const now = new Date();
                        const expiryTime = new Date(item.availableUntil);
                        const timeDiff = expiryTime.getTime() - now.getTime();
                        return timeDiff > 30 * 60 * 1000 && timeDiff <= 2 * 60 * 60 * 1000; // 30 min to 2 hours
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200 text-sm">Active</span>
                    </div>
                    <p className="text-xl font-bold text-green-800 dark:text-green-200">
                      {myItems.filter(item => {
                        const now = new Date();
                        const expiryTime = new Date(item.availableUntil);
                        const timeDiff = expiryTime.getTime() - now.getTime();
                        return timeDiff > 2 * 60 * 60 * 1000; // More than 2 hours
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unclaimed Items List */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Your Unclaimed Food Items
                </h3>
                <p className="text-gray-300">
                  Monitor your items that haven't been claimed. They will automatically transfer to waste after expiry time.
                </p>
              </div>
              <div>
                {itemsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading items...</p>
                  </div>
                ) : myItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Items Added Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add food items to monitor their expiry status
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px] text-sm">Food Item</TableHead>
                          <TableHead className="w-[100px] text-sm">Quantity</TableHead>
                          <TableHead className="w-[120px] text-sm">Time Until Expiry</TableHead>
                          <TableHead className="w-[100px] text-sm">Status</TableHead>
                          <TableHead className="w-[150px] text-sm">Auto Transfer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myItems.map((item) => {
                          const now = new Date();
                          const expiryTime = new Date(item.availableUntil);
                          const timeDiff = expiryTime.getTime() - now.getTime();
                          const isExpired = timeDiff <= 0;
                          const isExpiringSoon = timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000; // 2 hours
                          const isExpiringCritical = timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30 minutes
                          const isExpiringWarning = timeDiff > 30 * 60 * 1000 && timeDiff <= 60 * 60 * 1000; // 1 hour
                          
                          // Determine status and variant based on actual item status
                          let status = item.isActive ? "Active" : "Inactive";
                          let statusVariant: "default" | "secondary" | "destructive" | "outline" = item.isActive ? "default" : "secondary";
                          let statusColor = "text-green-600";
                          
                          if (isExpired) {
                            status = item.isActive ? "Active" : "Inactive";
                            statusVariant = item.isActive ? "default" : "secondary";
                            statusColor = item.isActive ? "text-green-600" : "text-gray-600";
                          } else if (isExpiringCritical) {
                            status = "Critical - 30min";
                            statusVariant = "destructive";
                            statusColor = "text-red-600";
                          } else if (isExpiringWarning) {
                            status = "Warning - 1hr";
                            statusVariant = "secondary";
                            statusColor = "text-yellow-600";
                          } else if (isExpiringSoon) {
                            status = "Expiring Soon";
                            statusVariant = "secondary";
                            statusColor = "text-yellow-600";
                          }
                          
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="max-w-[200px]">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0 flex items-center justify-center">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded"
                                      />
                                    ) : (
                                      <Utensils className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {item.canteenName}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-col">
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {item.quantityAvailable}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <span className={`font-medium ${statusColor} truncate block max-w-[100px]`}>
                                  {formatTimeRemaining(item.availableUntil.toString())}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                <Badge variant={statusVariant} className="text-xs px-2 py-0">
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1">
                                  {isExpired ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-red-600 border-red-600 text-xs px-2 py-0">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Auto-transferred
                                      </Badge>
                                    </div>
                                  ) : isExpiringCritical ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-red-600 border-red-600 text-xs px-2 py-0">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        {Math.ceil(timeDiff / (60 * 1000))}min
                                      </Badge>
                                    </div>
                                  ) : isExpiringWarning ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs px-2 py-0">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {Math.ceil(timeDiff / (60 * 1000))}min
                                      </Badge>

                                    </div>
                                  ) : isExpiringSoon ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs px-2 py-0">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {Math.ceil(timeDiff / (60 * 60 * 1000))}hr
                                      </Badge>

                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs px-2 py-0">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Enabled
                                      </Badge>

                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <EventCalendar />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Test Smart Contracts
                </h2>
                <p className="text-gray-400">
                  Verify that your RePlate reward contracts are working correctly on Celo Alfajores testnet. 
                  This will distribute cUSD rewards to students and mint NFT certificates for admins.
                </p>
              </div>
              
              <TestRewardsButton 
                onSuccess={() => {
                  toast({
                    title: "Rewards Distributed!",
                    description: "Students have received cUSD and admins received NFT certificates.",
                  });
                }}
                onError={(error) => {
                  toast({
                    title: "Distribution Failed",
                    description: error.message,
                    variant: "destructive",
                  });
                }}
              />

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Important Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-300">
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Before Testing:</h4>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Ensure you have testnet CELO in your wallet for gas fees</li>
                      <li>Make sure contracts are deployed to Alfajores testnet</li>
                      <li>Update contract addresses in rewardsService.ts</li>
                      <li>Fund the StudentRewards contract with testnet cUSD</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">What This Does:</h4>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li><strong>Students:</strong> Receive ~0.5-1.5 cUSD per meal claim</li>
                      <li><strong>Admins:</strong> Receive NFT certificates showing their impact</li>
                      <li><strong>On-Chain:</strong> All transactions recorded on Celo blockchain</li>
                      <li><strong>Verifiable:</strong> View on CeloScan explorer</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Get Testnet Tokens:</h4>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>CELO: <a href="https://faucet.celo.org/alfajores" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Celo Faucet</a></li>
                      <li>cUSD: Use <a href="https://app.ubeswap.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ubeswap</a> to swap CELO for cUSD</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      {/* NGO Reservation Modal */}
      <Dialog open={ngoModalOpen} onOpenChange={setNgoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Reserve for NGO Collection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDonation && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{selectedDonation.foodItem?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quantity: {selectedDonation.quantityDonated} items
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="ngoName">NGO Name</Label>
                <Input
                  id="ngoName"
                  placeholder="Enter NGO name"
                  value={ngoForm.ngoName}
                  onChange={(e) => setNgoForm(prev => ({ ...prev, ngoName: e.target.value }))}
                  data-testid="input-ngo-name"
                />
              </div>
              
              <div>
                <Label htmlFor="ngoContactPerson">Contact Person</Label>
                <Input
                  id="ngoContactPerson"
                  placeholder="Enter contact person name"
                  value={ngoForm.ngoContactPerson}
                  onChange={(e) => setNgoForm(prev => ({ ...prev, ngoContactPerson: e.target.value }))}
                  data-testid="input-ngo-contact"
                />
              </div>
              
              <div>
                <Label htmlFor="ngoPhoneNumber">Phone Number</Label>
                <Input
                  id="ngoPhoneNumber"
                  placeholder="Enter phone number"
                  value={ngoForm.ngoPhoneNumber}
                  onChange={(e) => setNgoForm(prev => ({ ...prev, ngoPhoneNumber: e.target.value }))}
                  data-testid="input-ngo-phone"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNgoModalOpen(false);
                  setSelectedDonation(null);
                  setNgoForm({ ngoName: "", ngoContactPerson: "", ngoPhoneNumber: "" });
                }}
                className="flex-1"
                data-testid="button-cancel-ngo"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedDonation) {
                    reserveDonationMutation.mutate({
                      id: selectedDonation.id,
                      ngoInfo: ngoForm,
                    });
                  }
                }}
                disabled={!ngoForm.ngoName || !ngoForm.ngoContactPerson || !ngoForm.ngoPhoneNumber || reserveDonationMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-confirm-ngo"
              >
                {reserveDonationMutation.isPending ? "Reserving..." : "Reserve for NGO"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={(open) => {
        setDetailsModalOpen(open);
        if (!open) {
          setQrCodeDataURL("");
          setScannedCode("");
          setSelectedClaimForReward(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Food Item Details & Claim Verification
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side - Details */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-blue-500">Food Item Name</Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedItem.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-blue-500">Description</Label>
                    <p className="text-gray-600 dark:text-gray-400">{selectedItem.description || "No description provided"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-blue-500">Canteen Name</Label>
                      <p className="text-gray-900 dark:text-white">{selectedItem.canteenName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-blue-500">Quantity Available</Label>
                      <p className="text-gray-900 dark:text-white">{selectedItem.quantityAvailable}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-500">Canteen Location</Label>
                    <p className="text-gray-600 dark:text-gray-400">{selectedItem.canteenLocation || "Location not specified"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-blue-500">Available Until</Label>
                      <p className="text-gray-900 dark:text-white">{formatTimeRemaining(selectedItem.availableUntil.toString())}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-blue-500">Status</Label>
                      <div className="mt-1">
                        <Badge variant={selectedItem.isActive ? "default" : "secondary"} className="text-xs">
                          {selectedItem.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-500">Approved Claims</Label>
                    <p className="text-gray-900 dark:text-white">
                      {(() => {
                        if (!selectedItem) return '0 claims approved';
                        const itemClaims = allApprovedClaims.filter(claim => {
                          const claimFoodId = claim.foodItemId?.toString();
                          const selectedItemId = (selectedItem as any)._id?.toString() || selectedItem.id;
                          return claimFoodId === selectedItemId;
                        });
                        return `${itemClaims.length} claim${itemClaims.length !== 1 ? 's' : ''} approved for this item`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side - QR Code & Verification */}
              <div className="flex flex-col space-y-4">
                {/* Code Verification Section - Now Primary */}
                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
                  <Label className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Verify Student's Claim Code
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Enter the claim code that the student received via email to verify their meal claim
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter claim code (e.g., ABC-XYZ)"
                        value={scannedCode}
                        onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                        className="flex-1 font-mono text-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleVerifyCode();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleVerifyCode}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                        disabled={!scannedCode.trim()}
                      >
                        Verify
                      </Button>
                    </div>

                    {/* Show available claims info */}
                    {allApprovedClaims.length > 0 && (
                      <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs">
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>{allApprovedClaims.length}</strong> total approved claim{allApprovedClaims.length !== 1 ? 's' : ''} in system
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 mt-1">
                          You can verify any approved claim code here
                        </p>
                      </div>
                    )}

                    {selectedClaimForReward && (
                      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-600 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Code Verified Successfully!</span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <p><strong>Student:</strong> {selectedClaimForReward.user?.firstName || 'N/A'} {selectedClaimForReward.user?.lastName || ''}</p>
                          <p><strong>Email:</strong> {selectedClaimForReward.user?.email || 'N/A'}</p>
                          <p><strong>Claim Code:</strong> <span className="font-mono text-green-600 dark:text-green-400">{selectedClaimForReward.claimCode}</span></p>
                          <p><strong>Quantity:</strong> {selectedClaimForReward.quantityClaimed}</p>
                        </div>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                          onClick={() => {
                            toast({
                              title: "Reward Distribution",
                              description: "This will trigger the blockchain reward distribution. Feature coming soon!",
                            });
                          }}
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Distribute Rewards
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Display - Now Secondary */}
                {qrCodeDataURL && selectedItem && (
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-400 flex items-center justify-center gap-2">
                          <QrCode className="w-4 h-4" />
                          Reference QR Code (Latest for this item)
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Most recent approved claim for {selectedItem.name}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-lg">
                        <img 
                          src={qrCodeDataURL} 
                          alt="QR Code for claim verification"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      {(() => {
                        const itemClaims = allApprovedClaims.filter(claim => {
                          const claimFoodId = claim.foodItemId?.toString();
                          const selectedItemId = (selectedItem as any)._id?.toString() || selectedItem.id;
                          return claimFoodId === selectedItemId;
                        });
                        const latestClaim = itemClaims[0];
                        
                        return latestClaim ? (
                          <div className="text-center bg-gray-800 p-3 rounded-lg w-full">
                            <p className="text-xs text-gray-400 mb-1">Latest Claim Code:</p>
                            <p className="text-base font-mono font-bold text-green-400">
                              {latestClaim.claimCode}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Student: {latestClaim.user?.firstName || 'Unknown'} {latestClaim.user?.lastName || ''}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}

                {!allApprovedClaims.length && (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-gray-700 rounded-lg">
                    <AlertTriangle className="w-16 h-16 text-yellow-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                      No approved claims yet
                    </p>
                    <p className="text-gray-600 dark:text-gray-500 text-xs mt-2">
                      Approve a student's claim request first to verify their code
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
