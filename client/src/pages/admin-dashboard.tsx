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
import type { FoodItem, FoodItemWithCreator, FoodDonationWithDetails } from "@shared/schema";

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
import { Plus, Utensils, TrendingUp, DollarSign, Edit, Trash2, MoreHorizontal, ShieldCheck, CheckCircle, Heart, Users, Phone, Clock, AlertTriangle, Leaf, Droplets, Recycle, CheckSquare, Package, Calendar } from "lucide-react";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { formatTimeRemaining } from "@/lib/qr-utils";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = insertFoodItemSchema.omit({ createdBy: true }).extend({
  availableUntil: z.string().min(1, "Available until time is required"),
  imageUrl: z.string().optional(),
  canteenLocation: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
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
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

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

  const { data: myItems = [], isLoading: itemsLoading } = useQuery<FoodItemWithCreator[]>({
    queryKey: ["/api/food-items/my"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch donations
  const { data: donations = [], isLoading: donationsLoading } = useQuery<FoodDonationWithDetails[]>({
    queryKey: ["/api/donations"],
    enabled: !!user && user.role === "admin",
  });



  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      canteenName: "",
      canteenLocation: "",
      quantityAvailable: 1,
      imageUrl: "",
      availableUntil: "",
      isActive: true,
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform the data to match the backend schema
      const transformedData = {
        ...data,
        availableUntil: data.availableUntil, // Keep as string for timestamp mode
        imageUrl: data.imageUrl || null,
        canteenLocation: data.canteenLocation || null,
      };
      
      const response = await apiRequest("POST", "/api/food-items", transformedData);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
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
      // Transform the data to match the backend schema
      const transformedData = {
        ...updateData,
        availableUntil: updateData.availableUntil, // Keep as string for timestamp mode
        imageUrl: updateData.imageUrl || null,
        canteenLocation: updateData.canteenLocation || null,
      };
      
      const response = await apiRequest("PUT", `/api/food-items/${id}`, transformedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Food Item Updated",
        description: "Your food item has been updated successfully.",
      });
      setEditingItem(null);
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
        title: "Failed to Update Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
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
      updateItemMutation.mutate({ ...data, id: editingItem.id });
    } else {
      addItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: FoodItem) => {
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
      imageUrl: item.imageUrl || "",
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

  const handleViewDetails = (item: FoodItem) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
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
              Your Performance
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
              Impacts
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
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
            <TabsTrigger value="manage" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Manage Items</TabsTrigger>
            <TabsTrigger value="unclaimed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Unclaimed</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
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
                                className="[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:filter-none"
                                data-testid="input-available-until"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
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
                                onClick={() => handleDelete(item.id)}
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
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Food Item Details
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
                    <Label className="text-sm font-medium text-blue-500">Contact Information</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Canteen Manager: John Doe</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - QR Code */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <Label className="text-sm font-medium text-blue-500">QR Code for Students</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Students can scan this code to claim the food item
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img 
                    src="https://conceptual-aquamarine-dnqstypoxj.edgeone.app/qrcode_266698670_ed9253c81566e7ff70dcd05f36a47480.png" 
                    alt="QR Code for food item"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Scan to claim: {selectedItem.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
