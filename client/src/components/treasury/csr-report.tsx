import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Download,
  TrendingUp,
  Leaf,
  Users2,
  DollarSign,
  Award,
  Calendar,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CSRMetrics {
  donorAddress: string;
  donorName: string;
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  
  // Impact Metrics
  totalPickups: number;
  totalFoodDonatedKg: number;
  totalMealsProvided: number;
  co2SavedKg: number;
  
  // Financial Metrics
  wasteDisposalSavings: number;
  platformFeesPaid: number;
  netSavings: number;
  
  // Subscription Info
  planType: string;
  subscriptionStartDate: Date;
  
  // Additional Data
  impactNFTTokenId?: string;
}

export function CSRReportDashboard({ donorAddress }: { donorAddress: string }) {
  const [metrics, setMetrics] = useState<CSRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadCSRData();
  }, [donorAddress, period]);

  const loadCSRData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/csr-reports/${donorAddress}?period=${period}`
      );
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load CSR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    if (!metrics) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text('Corporate Social Responsibility Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('RePlate - Food Waste Reduction Platform', pageWidth / 2, 30, { align: 'center' });
    
    // Period
    doc.setFontSize(10);
    const periodStr = `${metrics.reportPeriodStart.toLocaleDateString()} - ${metrics.reportPeriodEnd.toLocaleDateString()}`;
    doc.text(periodStr, pageWidth / 2, 40, { align: 'center' });
    
    // Company Info
    doc.setFontSize(14);
    doc.text(`Company: ${metrics.donorName}`, 20, 60);
    
    // Environmental Impact
    doc.setFontSize(16);
    doc.text('Environmental Impact', 20, 80);
    doc.setFontSize(12);
    doc.text(`Total Food Rescued: ${metrics.totalFoodDonatedKg.toFixed(2)} kg`, 20, 95);
    doc.text(`CO2 Emissions Prevented: ${metrics.co2SavedKg.toFixed(2)} kg`, 20, 105);
    doc.text(`Equivalent to planting ${Math.floor(metrics.co2SavedKg / 20)} trees`, 30, 115);
    
    // Social Impact
    doc.setFontSize(16);
    doc.text('Social Impact', 20, 135);
    doc.setFontSize(12);
    doc.text(`Meals Provided to Communities: ${metrics.totalMealsProvided}`, 20, 150);
    doc.text(`Total Pickups Completed: ${metrics.totalPickups}`, 20, 160);
    doc.text(`NGO Partners Supported: Multiple local organizations`, 20, 170);
    
    // Financial Analysis
    doc.setFontSize(16);
    doc.text('Financial Analysis', 20, 190);
    doc.setFontSize(12);
    doc.text(`Waste Disposal Savings: $${metrics.wasteDisposalSavings.toFixed(2)}`, 20, 205);
    doc.text(`Platform Investment: $${metrics.platformFeesPaid.toFixed(2)}`, 20, 215);
    doc.text(`Net Financial Benefit: $${metrics.netSavings.toFixed(2)}`, 20, 225);
    
    // ROI
    const roi = ((metrics.netSavings / metrics.platformFeesPaid) * 100).toFixed(1);
    doc.text(`Return on Investment: ${roi}%`, 20, 235);
    
    // Blockchain Verification
    if (metrics.impactNFTTokenId) {
      doc.setFontSize(16);
      doc.text('Blockchain Verification', 20, 255);
      doc.setFontSize(10);
      doc.text(`Impact NFT Token: ${metrics.impactNFTTokenId}`, 20, 268);
      doc.text('Verified on Celo Blockchain', 20, 278);
    }
    
    // Save PDF
    doc.save(`CSR-Report-${metrics.donorName}-${period}.pdf`);
  };

  if (loading) {
    return <div>Loading CSR report...</div>;
  }

  if (!metrics) {
    return <div>No data available</div>;
  }

  const roi = ((metrics.netSavings / metrics.platformFeesPaid) * 100);
  const treesEquivalent = Math.floor(metrics.co2SavedKg / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Corporate Social Responsibility Report
          </h2>
          <p className="text-muted-foreground">
            {metrics.donorName} - Environmental & Social Impact
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCSRData}>
            Refresh
          </Button>
          <Button onClick={generatePDFReport}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          onClick={() => setPeriod('month')}
        >
          Last Month
        </Button>
        <Button
          variant={period === 'quarter' ? 'default' : 'outline'}
          onClick={() => setPeriod('quarter')}
        >
          Last Quarter
        </Button>
        <Button
          variant={period === 'year' ? 'default' : 'outline'}
          onClick={() => setPeriod('year')}
        >
          Last Year
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Rescued</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalFoodDonatedKg.toFixed(0)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalPickups} successful pickups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meals Provided</CardTitle>
            <Users2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalMealsProvided.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              To local communities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Prevented</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.co2SavedKg.toFixed(0)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              ~{treesEquivalent} trees planted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.netSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {roi.toFixed(0)}% ROI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Impact</CardTitle>
          <CardDescription>
            Your contribution to reducing environmental waste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Food Waste Diverted from Landfills</span>
              <span className="font-bold">{metrics.totalFoodDonatedKg.toFixed(2)} kg</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>CO₂ Emissions Prevented</span>
              <span className="font-bold">{metrics.co2SavedKg.toFixed(2)} kg</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Equivalent to:
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• {treesEquivalent} trees planted and grown for 10 years</li>
              <li>• {(metrics.co2SavedKg / 411).toFixed(1)} fewer smartphone charges</li>
              <li>• {(metrics.co2SavedKg / 8.89).toFixed(1)} fewer miles driven by car</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Social Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Social Impact</CardTitle>
          <CardDescription>
            Community support and food security contributions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Meals Provided</span>
              </div>
              <p className="text-3xl font-bold">{metrics.totalMealsProvided.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Nourishing families in need
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">NGO Partnerships</span>
              </div>
              <p className="text-3xl font-bold">{metrics.totalPickups}</p>
              <p className="text-sm text-muted-foreground">
                Successful collaborations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Analysis</CardTitle>
          <CardDescription>
            Cost savings and return on investment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Waste Disposal Cost Savings</span>
              <span className="font-bold text-green-600">
                +${metrics.wasteDisposalSavings.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">RePlate Platform Investment</span>
              <span className="font-bold text-orange-600">
                -${metrics.platformFeesPaid.toLocaleString()}
              </span>
            </div>
            
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-medium">Net Financial Benefit</span>
              <span className="text-2xl font-bold text-green-600">
                ${metrics.netSavings.toLocaleString()}
              </span>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Return on Investment</span>
                <Badge variant="default" className="text-lg px-4 py-1">
                  {roi.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                For every $1 spent on RePlate, you saved ${(roi / 100 + 1).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Verification */}
      {metrics.impactNFTTokenId && (
        <Card>
          <CardHeader>
            <CardTitle>Blockchain Verification</CardTitle>
            <CardDescription>
              Proof of Impact - Verified on Celo Blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium">Impact NFT Issued</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your impact has been permanently recorded on the blockchain
              </p>
              <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                Token ID: {metrics.impactNFTTokenId}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View on Blockchain Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
