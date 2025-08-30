import { useState, useEffect } from "react";
import React, { useRef } from "react";
import ReactToPrint from 'react-to-print';
import { Shield, FileText, Home, CheckCircle, XCircle, Clock, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import { fetchAllPassRequests, cleanupOldPassRequests, getTimeUntilExpiry, filterUrgentPasses, getUrgentPassStats, filterOutExpiredRequests, deleteExpiredPassRequests } from "@/lib/utils";
import { getTimeUntilPassExpiry } from "@/lib/utils";
import { ref, update, get, set, getDatabase } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { ForwardedRef } from "react";

interface PassRequest {
  id: string;
  type: "outing" | "home_visit";
  first_name: string;
  registerNumber?: string;
  department: string;
  year: string;
  date: string;
  arrivalTime?: string;
  mobileNumber: string;
  reason: string;
  status: "pending" | "hod_approved" | "warden_approved" | "declined";
  hodApproved?: boolean;
  attendance?: number;
  days?: number;
  emp_code: string;
  createdAt: string;
  block?: string;
  roomNumber?: string;
  assignedWarden?: {
    username: string;
    first_name: string;
    block: string;
  };
  assignedHod?: {
    username: string;
    first_name: string;
    department: string;
  };
  hodApprovedBy?: {
    username: string;
    first_name: string;
    department: string;
  };
  wardenApprovedBy?: {
    username: string;
    first_name: string;
    block: string;
  };
  grantedAt?: string;
  expiresAt?: string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "warden_approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "hod_approved": return <CheckCircle className="h-4 w-4 text-blue-600" />;
    case "declined": return <XCircle className="h-4 w-4 text-red-600" />;
    default: return <Clock className="h-4 w-4 text-yellow-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "warden_approved": return "bg-green-100 text-green-800";
    case "hod_approved": return "bg-blue-100 text-blue-800";
    case "declined": return "bg-red-100 text-red-800";
    default: return "bg-yellow-100 text-yellow-800";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "warden_approved": return "Warden Approved";
    case "hod_approved": return "Forwarded to Warden";
    case "declined": return "Declined";
    default: return "Pending";
  }
}

// Helper to check if a request is older than 3 days (for local filtering)
function isOlderThan3Days(createdAt: string) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created > 3 * 24 * 60 * 60 * 1000;
}

const WardenDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState<PassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOuting, setSearchOuting] = useState("");
  const [searchHomeVisit, setSearchHomeVisit] = useState("");
  // Remove outingStatusTab, homeVisitStatusTab, and all sub-tab logic.
  // In each main tab, show a single Section with all requests for that type (outing or home_visit).
  // For Outing: <Section title="Outing Requests" requests={outingRequests} type="outing" showActions handleApprove={handleApprove} handleDecline={handleDecline} />
  // For Home Visit: <Section title="Home Visit Requests" requests={homeVisitRequests} type="home_visit" showActions handleApprove={handleApprove} handleDecline={handleDecline} />

  // Fetch all pass requests on component mount
  useEffect(() => {
    const loadRequests = async () => {
      try {
        console.log("🔍 WardenDashboard: Loading requests for user:", user?.username);
        
        // First, delete expired requests immediately from database
        await deleteExpiredPassRequests();
        // Then, cleanup old requests (older than 3 days)
        await cleanupOldPassRequests();
        
        const requestsRaw = await fetchAllPassRequests();
        // Type guard: filter only PassRequest objects
        const requests: PassRequest[] = Array.isArray(requestsRaw)
          ? requestsRaw.filter((r): r is PassRequest => r && typeof r === 'object' && 'id' in r && 'status' in r)
          : [];
        console.log("📋 WardenDashboard: All requests fetched:", requests);
        
        // Filter requests assigned to this warden
        const wardenRequests = requests.filter((request) =>
          request.assignedWarden && request.assignedWarden.username === user?.username
        );
        
        // Filter out expired requests before setting state
        const validRequests = filterOutExpiredRequests(wardenRequests);
        console.log(`📋 WardenDashboard: Filtered ${wardenRequests.length - validRequests.length} expired requests`);
        setAllRequests(validRequests);
        
        // Check for urgent passes and show notification
        const urgentPassesCount = filterUrgentPasses(wardenRequests).length;
        if (urgentPassesCount > 0) {
          toast({
            title: "🚨 Urgent Passes Detected!",
            description: `${urgentPassesCount} pass${urgentPassesCount > 1 ? 'es' : ''} expiring within 24 hours require immediate attention.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading requests:", error);
        toast({
          title: "Error",
          description: "Failed to load requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      loadRequests();
    }
  }, [user?.username, toast]);

  const outingRequests = allRequests.filter(r => r.type === "outing");
  const homeVisitRequests = allRequests.filter(r => r.type === "home_visit");

  // Filter urgent passes (expiring within 24 hours)
  const urgentPasses = filterUrgentPasses(allRequests);
  const urgentOutingPasses = urgentPasses.filter(r => r.type === "outing");
  const urgentHomeVisitPasses = urgentPasses.filter(r => r.type === "home_visit");
  const urgentStats = getUrgentPassStats(allRequests);

  const outingPending = outingRequests.filter(r => r.status === "pending");
  const outingApproved = outingRequests.filter(r => r.status === "warden_approved");
  const outingDeclined = outingRequests.filter(r => r.status === "declined");

  const homeVisitPending = homeVisitRequests.filter(r => r.status === "hod_approved");
  const homeVisitApproved = homeVisitRequests.filter(r => r.status === "warden_approved");
  const homeVisitDeclined = homeVisitRequests.filter(r => r.status === "declined");

  const filteredOutingRequests = outingRequests.filter(req =>
    req.first_name.toLowerCase().includes(searchOuting.toLowerCase()) ||
    req.department.toLowerCase().includes(searchOuting.toLowerCase()) ||
    req.reason.toLowerCase().includes(searchOuting.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredHomeVisitRequests = homeVisitRequests.filter(req =>
    req.first_name.toLowerCase().includes(searchHomeVisit.toLowerCase()) ||
    req.department.toLowerCase().includes(searchHomeVisit.toLowerCase()) ||
    req.reason.toLowerCase().includes(searchHomeVisit.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const updateRequestStatus = async (id: string, status: "warden_approved" | "declined") => {
    try {
      // db is now imported from firebase.ts
      
      // Find the request to get the username
      const request = allRequests.find(req => req.id === id);
      if (!request) {
        console.error("Request not found:", id);
        return false;
      }
      
      console.log("🔍 Updating request:", { id, emp_code: request.emp_code, status });
      
      const updateData: { status: "warden_approved" | "declined"; wardenApprovedBy?: { username: string; first_name: string; block: string }; grantedAt?: string; expiresAt?: string } = { status };
      
      // If Warden is approving, record who approved it
      if (status === "warden_approved" && user) {
        updateData.wardenApprovedBy = {
          username: user.username,
          first_name: user.first_name,
          block: user.block || ""
        };
        // Set 1-day expiry from now
        const nowIso = new Date().toISOString();
        const expiresIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        updateData.grantedAt = nowIso;
        updateData.expiresAt = expiresIso;
      }
      
      console.log("🔍 Update data:", updateData);
      
      // First try to update in the new format (under emp_code)
      if (request.emp_code) {
        const newFormatRef = ref(db, `passRequests/${request.emp_code}/${id}`);
        console.log("🔍 Trying new Firebase path:", `passRequests/${request.emp_code}/${id}`);
        
        // Check if the request exists in the new format
        const newFormatSnapshot = await get(newFormatRef);
        
        if (newFormatSnapshot.exists()) {
          // Update in the new format
          await update(newFormatRef, updateData);
          console.log("🔍 Firebase update successful in new format");
          
          // Verify the update
          const verifySnapshot = await get(newFormatRef);
          if (verifySnapshot.exists()) {
            const updatedData = verifySnapshot.val();
            console.log("🔍 Verification - Updated data in Firebase (new format):", updatedData);
            console.log("🔍 Verification - Status is now:", updatedData.status);
            
            // Check if status was actually updated
            if (updatedData.status === status) {
              console.log("✅ Status update verified successfully");
            } else {
              console.error("❌ Status update failed - expected:", status, "got:", updatedData.status);
            }
          }
          
          // Update local state
          setAllRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status, wardenApprovedBy: updateData.wardenApprovedBy, grantedAt: updateData.grantedAt, expiresAt: updateData.expiresAt } : req
          ));
          
          return true;
        }
      }
      
      // Fallback to old format
      const oldFormatRef = ref(db, `passRequests/${id}`);
      console.log("🔍 Falling back to old Firebase path:", `passRequests/${id}`);
      
      try {
        // Use update instead of set to modify only the specified fields
        await update(oldFormatRef, updateData);
        console.log("🔍 Firebase update successful in old format");
      } catch (updateError) {
        console.error("❌ Firebase update failed:", updateError);
        throw updateError;
      }
      
      // Verify the update by reading back the data
      const verifyRef = ref(db, `passRequests/${id}`);
      const verifySnapshot = await get(verifyRef);
      if (verifySnapshot.exists()) {
        const updatedData = verifySnapshot.val();
        console.log("🔍 Verification - Updated data in Firebase (old format):", updatedData);
        console.log("🔍 Verification - Status is now:", updatedData.status);
        
        // Check if status was actually updated
        if (updatedData.status === status) {
          console.log("✅ Status update verified successfully");
        } else {
          console.error("❌ Status update failed - expected:", status, "got:", updatedData.status);
        }
      } else {
        console.error("❌ Could not verify update - document not found");
      }
      
      // Update local state
      setAllRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status, wardenApprovedBy: updateData.wardenApprovedBy, grantedAt: updateData.grantedAt, expiresAt: updateData.expiresAt } : req
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating request status:", error);
      return false;
    }
  };

    const handleApprove = async (id: string, type: "outing" | "home_visit") => {
    const success = await updateRequestStatus(id, "warden_approved");
    if (success) {
      toast({
        title: "Request Approved",
        description: "SMS notification sent to parent/guardian",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (id: string, type: "outing" | "home_visit") => {
    const success = await updateRequestStatus(id, "declined");
    if (success) {
    toast({
      title: "Request Declined",
      description: "Student has been notified",
      variant: "destructive",
    });
    } else {
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async (type: "outing" | "home_visit") => {
    const requests = type === "outing" ? outingRequests : homeVisitRequests;
    // For outing requests, filter pending ones
    // For home visit requests, filter hod_approved ones that need warden approval
    const pendingRequests = type === "outing" 
      ? requests.filter(req => req.status === "pending")
      : requests.filter(req => req.status === "hod_approved");
    
    try {
      const db = getDatabase();
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Process each request individually to handle both old and new format
      for (const req of pendingRequests) {
        const wardenApprovalData = {
          status: "warden_approved" as const,
          wardenApprovedBy: {
            username: user?.username,
            first_name: user?.first_name,
            block: user?.block || ""
          },
          grantedAt: nowIso,
          expiresAt: expiresIso,
        };
        
        // First try to update in the new format (under emp_code)
        if (req.emp_code) {
          const newFormatRef = ref(db, `passRequests/${req.emp_code}/${req.id}`);
          const newFormatSnapshot = await get(newFormatRef);
          
          if (newFormatSnapshot.exists()) {
            // Update in the new format
            await update(newFormatRef, wardenApprovalData);
            console.log(`✅ Updated request ${req.id} for user ${req.emp_code} in new format`);
            continue; // Skip to next request if successful
          }
        }
        
        // Fallback to old format
        const oldFormatRef = ref(db, `passRequests/${req.id}`);
        await update(oldFormatRef, wardenApprovalData);
        console.log(`✅ Updated request ${req.id} in old format`);
        
        // If we're updating in the old format but have emp_code, also update in the new format
        if (req.emp_code) {
          // Get the full request data from the old format
          const oldFormatSnapshot = await get(oldFormatRef);
          if (oldFormatSnapshot.exists()) {
            const fullRequestData = oldFormatSnapshot.val();
            
            // Save the full request data to the new format
            const newFormatRef = ref(db, `passRequests/${req.emp_code}/${req.id}`);
            await set(newFormatRef, fullRequestData);
            console.log(`✅ Also saved request ${req.id} to new format: passRequests/${req.emp_code}/${req.id}`);
          }
        }
      }
      
      // Update local state
      setAllRequests(prev => prev.map(req => 
        pendingRequests.some(pending => pending.id === req.id) 
          ? { 
              ...req, 
              status: "warden_approved" as const,
              wardenApprovedBy: {
                username: user?.username,
                first_name: user?.first_name,
                block: user?.block || ""
              },
              grantedAt: nowIso,
              expiresAt: expiresIso,
            }
          : req
      ));
    
      toast({
        title: "All Requests Approved",
        description: "SMS notifications sent to all parents/guardians",
      });
    } catch (error) {
      console.error("Error approving all requests:", error);
      toast({
        title: "Error",
        description: "Failed to approve all requests",
        variant: "destructive",
      });
    }
  };

  const handleDeclineAll = async (type: "outing" | "home_visit") => {
    const requests = type === "outing" ? outingRequests : homeVisitRequests;
    // For outing requests, filter pending ones
    // For home visit requests, filter hod_approved ones that need warden approval
    const pendingRequests = type === "outing" 
      ? requests.filter(req => req.status === "pending")
      : requests.filter(req => req.status === "hod_approved");
    
    try {
      const db = getDatabase();
      
      // Process each request individually to handle both old and new format
      for (const req of pendingRequests) {
        const declineData = {
          status: "declined" as const
        };
        
        // First try to update in the new format (under username)
        if (req.emp_code) {
          const newFormatRef = ref(db, `passRequests/${req.emp_code}/${req.id}`);
          const newFormatSnapshot = await get(newFormatRef);
          
          if (newFormatSnapshot.exists()) {
            // Update in the new format
            await update(newFormatRef, declineData);
            console.log(`✅ Declined request ${req.id} for user ${req.emp_code} in new format`);
            continue; // Skip to next request if successful
          }
        }
        
        // Fallback to old format
        const oldFormatRef = ref(db, `passRequests/${req.id}`);
        await update(oldFormatRef, declineData);
        console.log(`✅ Declined request ${req.id} in old format`);
        
        // If we're updating in the old format but have username, also update in the new format
        if (req.emp_code) {
          // Get the full request data from the old format
          const oldFormatSnapshot = await get(oldFormatRef);
          if (oldFormatSnapshot.exists()) {
            const fullRequestData = oldFormatSnapshot.val();
            
            // Save the full request data to the new format
            const newFormatRef = ref(db, `passRequests/${req.emp_code}/${req.id}`);
            await set(newFormatRef, fullRequestData);
            console.log(`✅ Also saved declined request ${req.id} to new format: passRequests/${req.emp_code}/${req.id}`);
          }
        }
      }
      
      // Update local state
      setAllRequests(prev => prev.map(req => 
        pendingRequests.some(pending => pending.id === req.id) 
          ? { ...req, status: "declined" as const }
          : req
      ));
    
      toast({
        title: "All Requests Declined",
        description: "Students have been notified",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error declining all requests:", error);
      toast({
        title: "Error",
        description: "Failed to decline all requests",
        variant: "destructive",
      });
    }
  };

  // Sort requests by createdAt descending (most recent first)
  const sortedOutingRequests = [...outingRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedHomeVisitRequests = [...homeVisitRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <AppHeader />
      <div className="max-w-6xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <Card className="border-college-red/20">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Warden Dashboard
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Review and approve student pass requests
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Urgent - Expiring Soon Section */}
        {urgentPasses.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                🚨 Urgent - Expiring Soon (Within 24 Hours)
              </CardTitle>
              <CardDescription className="text-red-100">
                {urgentStats.totalUrgent} passes expiring within 24 hours - Immediate action required!
              </CardDescription>
              <div className="flex gap-4 mt-2 text-sm text-red-100">
                <span>Outing: {urgentStats.urgentOuting}</span>
                <span>Home Visit: {urgentStats.urgentHomeVisit}</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {urgentOutingPasses.length > 0 && (
                <Section
                  title="🏃 Urgent Outing Passes"
                  requests={urgentOutingPasses}
                  type="outing"
                  showActions
                  handleApprove={handleApprove}
                  handleDecline={handleDecline}
                  isUrgent={true}
                />
              )}
              {urgentHomeVisitPasses.length > 0 && (
                <Section
                  title="🏠 Urgent Home Visit Passes"
                  requests={urgentHomeVisitPasses}
                  type="home_visit"
                  showActions
                  handleApprove={handleApprove}
                  handleDecline={handleDecline}
                  isUrgent={true}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Tabs: Outing vs Home Visit */}
        <Tabs defaultValue="outing" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="outing">Outing Requests</TabsTrigger>
            <TabsTrigger value="home_visit">Home Visit Requests</TabsTrigger>
          </TabsList>
          
          {/* Outing Requests Tab */}
          <TabsContent value="outing">
            <Card>
              <CardHeader>
                    <CardTitle>Outing Requests</CardTitle>
                    <CardDescription>Approve or decline student outing requests</CardDescription>
                <input
                  type="text"
                  className="mt-4 mb-2 px-3 py-2 border rounded w-full"
                  placeholder="Search by name..."
                  value={searchOuting}
                  onChange={e => setSearchOuting(e.target.value)}
                />
                {/* Bulk Action Buttons for Pending Requests */}
                {outingPending.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={() => handleApproveAll("outing")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve All Pending
                    </Button>
                    <Button 
                      onClick={() => handleDeclineAll("outing")}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-1" /> Decline All Pending
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading requests...</p>
                ) : (
                  <>
                    <Section title="Outing Requests" requests={filteredOutingRequests} type="outing" showActions handleApprove={handleApprove} handleDecline={handleDecline} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Home Visit Requests Tab */}
          <TabsContent value="home_visit">
            <Card>
              <CardHeader>
                <CardTitle>Home Visit Requests</CardTitle>
                <CardDescription>Review HOD-approved home visit requests (Final approval)</CardDescription>
                <input
                  type="text"
                  className="mt-4 mb-2 px-3 py-2 border rounded w-full"
                  placeholder="Search by name or register number..."
                  value={searchHomeVisit}
                  onChange={e => setSearchHomeVisit(e.target.value)}
                />
                                {/* Bulk Action Buttons for HOD Approved Requests */}
                {homeVisitPending.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={() => handleApproveAll("home_visit")} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" /> Final Approve All
                    </Button>
                    <Button 
                      onClick={() => handleDeclineAll("home_visit")} 
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-1" /> Decline All
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading requests...</p>
                ) : (
                  <>
                    <Section title="Home Visit Requests" requests={filteredHomeVisitRequests} type="home_visit" showActions handleApprove={handleApprove} handleDecline={handleDecline} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// Section component for rendering each status group
function Section({ title, requests, type, showActions, handleApprove, handleDecline, isUrgent = false }: {
  title: string,
  requests: PassRequest[],
  type: "outing" | "home_visit",
  showActions?: boolean,
  handleApprove?: (id: string, type: "outing" | "home_visit") => void,
  handleDecline?: (id: string, type: "outing" | "home_visit") => void,
  isUrgent?: boolean,
}) {
  return (
    <div className="mb-8">
      <h3 className={`font-bold text-lg mb-2 ${isUrgent ? 'text-red-700' : 'text-college-red'}`}>{title}</h3>
      {requests.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No {title.toLowerCase()}.</p>
                ) : (
                  <div className="space-y-4">
          {requests.map((request) => {
            return (
                      <div key={request.id} className={`border rounded-lg p-4 space-y-3 ${isUrgent ? 'border-red-300 bg-red-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-lg">{request.first_name}</h4>
                  <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{getStatusText(request.status)}</span>
                  </Badge>
                    {/* Expiry Status */}
                    {(() => {
                      // Show 1-day expiry for granted passes using expiresAt; otherwise show request-age expiry
                      const useGrantedExpiry = request.status === "warden_approved" && !!request.expiresAt;
                      const expiryInfo = useGrantedExpiry
                        ? getTimeUntilPassExpiry(request.expiresAt)
                        : getTimeUntilExpiry(request.createdAt);
                      return (
                        <Badge
                          variant="outline"
                          className={`${isUrgent ? 'bg-red-100 text-red-800 border-red-300' : expiryInfo.color} border-current`}
                        >
                          {isUrgent && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {expiryInfo.isExpired ? "Expired" : expiryInfo.timeRemaining}
                        </Badge>
                      );
                    })()}
                  </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Department:</p>
                            <p className="text-muted-foreground">{request.department}</p>
                          </div>
                          <div>
                            <p className="font-medium">Year:</p>
                            <p className="text-muted-foreground">{request.year}</p>
                          </div>
                          <div>
                            <p className="font-medium">Date:</p>
                            <p className="text-muted-foreground">{request.date}</p>
                          </div>
                          <div>
                            <p className="font-medium">Arrival Time:</p>
                            <p className="text-muted-foreground">{request.arrivalTime}</p>
                          </div>
                        </div>
                        
                <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Mobile Number:</p>
                          <p className="text-muted-foreground">{request.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Block & Room:</p>
                    <p className="text-muted-foreground">
                      {request.block && request.roomNumber ? `Block ${request.block} - Room ${request.roomNumber}` : 'Not specified'}
                    </p>
                          </div>
                        </div>
                        
                                {request.assignedWarden && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm font-medium">
                      ✅ Assigned to: {request.assignedWarden.first_name} (Block {request.assignedWarden.block})
                    </p>
                  </div>
                )}
                
                {request.assignedHod && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ HOD Approved by: {request.assignedHod.first_name} ({request.assignedHod.department})
                    </p>
                  </div>
                )}
                        
                        <div>
                          <p className="font-medium">Reason:</p>
                          <p className="text-muted-foreground">{request.reason}</p>
                        </div>
                        
                                {showActions && ((type === "outing" && request.status === "pending") || (type === "home_visit" && request.status === "hod_approved")) && handleApprove && handleDecline && (
                   <div className="flex gap-2 pt-2">
                     <Button
                       onClick={() => handleApprove(request.id, type)}
                       className={`${isUrgent ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`}
                     >
                       <Check className="h-4 w-4 mr-1" />
                       {isUrgent ? '🚨 URGENT ' : ''}{type === "home_visit" ? "Final Approve" : "Approve"}
                     </Button>
                     <Button onClick={() => handleDecline(request.id, type)} variant="destructive">
                       <X className="h-4 w-4 mr-1" /> Decline
                     </Button>
                   </div>
                 )}
                      </div>
            );
          })}
                  </div>
                )}
      </div>
  );
}

export default WardenDashboard;