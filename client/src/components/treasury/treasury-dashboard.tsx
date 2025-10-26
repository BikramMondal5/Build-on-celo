import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  DollarSign,
  TrendingUp,
  Users,
  Award,
  PieChart,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface TreasuryMetrics {
  totalBalance: string;
  breakdown: {
    subscription: string;
    pickupFee: string;
    grant: string;
    sponsorship: string;
    platformFee: string;
  };
  totalDisbursed: string;
  activeSubscribers: number;
  totalSponsors: number;
}

export function TreasuryDashboard() {
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreasuryData();
  }, []);

  const loadTreasuryData = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from treasury service
      const response = await fetch('/api/treasury/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalBalance = parseFloat(metrics?.totalBalance || '0');
  const subscriptionRevenue = parseFloat(metrics?.breakdown.subscription || '0');
  const pickupFeeRevenue = parseFloat(metrics?.breakdown.pickupFee || '0');
  const grantFunding = parseFloat(metrics?.breakdown.grant || '0');
  const sponsorshipRevenue = parseFloat(metrics?.breakdown.sponsorship || '0');

  const subscriptionPercentage = totalBalance > 0 ? (subscriptionRevenue / totalBalance) * 100 : 0;
  const pickupFeePercentage = totalBalance > 0 ? (pickupFeeRevenue / totalBalance) * 100 : 0;
  const grantPercentage = totalBalance > 0 ? (grantFunding / totalBalance) * 100 : 0;
  const sponsorshipPercentage = totalBalance > 0 ? (sponsorshipRevenue / totalBalance) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Treasury Management</h2>
          <p className="text-muted-foreground">
            RePlate Impact Pool - Funding sustainable food waste reduction
          </p>
        </div>
        <Button onClick={loadTreasuryData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available in Impact Pool</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeSubscribers || 0}</div>
            <p className="text-xs text-muted-foreground">Hotels & Restaurants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSponsors || 0}</div>
            <p className="text-xs text-muted-foreground">Corporate Partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(metrics?.totalDisbursed || '0').toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">To NGOs for pickups</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Sources Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Sources</CardTitle>
          <CardDescription>
            Breakdown of funding sources for the Impact Pool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Revenue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">SaaS Subscriptions</span>
                <Badge variant="secondary">Primary Revenue</Badge>
              </div>
              <span className="text-sm font-bold">
                ${subscriptionRevenue.toLocaleString()} ({subscriptionPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={subscriptionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Monthly/yearly fees from hotels and restaurants using the platform
            </p>
          </div>

          {/* Pickup Fees */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Per-Pickup Fees</span>
              </div>
              <span className="text-sm font-bold">
                ${pickupFeeRevenue.toLocaleString()} ({pickupFeePercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={pickupFeePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Transaction-based fees charged for each successful pickup
            </p>
          </div>

          {/* Grant Funding */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm font-medium">Blockchain Grants</span>
                <Badge variant="outline">Celo Foundation</Badge>
              </div>
              <span className="text-sm font-bold">
                ${grantFunding.toLocaleString()} ({grantPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={grantPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Grants from Celo Foundation, Celo Camp, and other ReFi programs
            </p>
          </div>

          {/* Sponsorships */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm font-medium">CSR Sponsorships</span>
              </div>
              <span className="text-sm font-bold">
                ${sponsorshipRevenue.toLocaleString()} ({sponsorshipPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={sponsorshipPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Corporate sponsorships for social responsibility initiatives
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="grants">Grants</TabsTrigger>
          <TabsTrigger value="disbursements">Disbursements</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsView />
        </TabsContent>

        <TabsContent value="sponsors" className="space-y-4">
          <SponsorsView />
        </TabsContent>

        <TabsContent value="grants" className="space-y-4">
          <GrantsView />
        </TabsContent>

        <TabsContent value="disbursements" className="space-y-4">
          <DisbursementsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Subscription Management View
function SubscriptionsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Subscriptions</CardTitle>
        <CardDescription>Hotels and restaurants using RePlate platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Subscription list will go here */}
          <p className="text-sm text-muted-foreground">
            Loading subscription data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Sponsors View
function SponsorsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Corporate Sponsors</CardTitle>
        <CardDescription>Companies supporting our mission</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sponsor list will go here */}
          <p className="text-sm text-muted-foreground">
            Loading sponsor data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Grants View
function GrantsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant Funding</CardTitle>
        <CardDescription>Blockchain and institutional grants received</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Grant list will go here */}
          <p className="text-sm text-muted-foreground">
            Loading grant data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Disbursements View
function DisbursementsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>NGO Reward Disbursements</CardTitle>
        <CardDescription>Payments made to NGOs for successful pickups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Disbursement list will go here */}
          <p className="text-sm text-muted-foreground">
            Loading disbursement data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
