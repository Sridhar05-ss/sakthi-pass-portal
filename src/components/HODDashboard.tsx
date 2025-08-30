import { useState, useEffect } from "react";
import { Building, Home, CheckCircle, XCircle, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import { fetchAllPassRequests, cleanupOldPassRequests, getTimeUntilExpiry, filterOutExpiredRequests, deleteExpiredPassRequests } from "@/lib/utils";
import { ref, update, get, set, getDatabase } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface HomeVisitRequest {
  id: string;
  type: "outing" | "home_visit";
  first_name: string;
  registerNumber?: string;
  department: string;
  year: string;
  date: string;
  mobileNumber: string;
  reason: string;
  numberOfDaysLeave?: string;
  noOfWorkingDays?: string;
  arrivalTime?: string;
  status: "pending" | "hod_approved" | "warden_approved" | "declined";
  emp_code: string;
  createdAt: string;
  block?: string;
  roomNumber?: string;
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
}

const HODDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState<HomeVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch all home visit requests on component mount
  useEffect(() => {
    const loadRequests = async () => {
      try {
        // First, delete expired requests immediately from database
        await deleteExpiredPassRequests();
        // Then, cleanup old requests (older than 3 days)
        await cleanupOldPassRequests();
        
        const requests = await fetchAllPassRequests();
        console.log("🔍 HODDashboard: All requests fetched:", requests.length);
        
        // Filter for home visit requests assigned to this HOD (show all statuses for better tracking)
        const homeVisitRequests = requests.filter((req: unknown) => {
          if (!req || typeof req !== 'object') return false;
          
          const request = req as Partial<HomeVisitRequest>;
          
          // Check if it's a home visit request
          if (request.type !== "home_visit") return false;
          
          // Check if it's assigned to this HOD
          if (!request.assignedHod || !request.assignedHod.username) return false;
          if (request.assignedHod.username !== user?.username) return false;
          
          // Show all statuses: pending, hod_approved, warden_approved, declined
          console.log("🔍 HODDashboard: Found request for HOD:", {
            id: request.id,
            first_name: request.first_name,
            status: request.status,
            assignedHod: request.assignedHod.username
          });
          
          return true;
        }) as HomeVisitRequest[];
        
        // Filter out expired requests before setting state
        const validRequests = filterOutExpiredRequests(homeVisitRequests);
        console.log(`📋 HODDashboard: Filtered ${homeVisitRequests.length - validRequests.length} expired requests`);
        console.log("🔍 HODDashboard: Valid requests for HOD", user?.username, ":", validRequests);
        setAllRequests(validRequests);
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

  const filteredRequests = allRequests.filter(req =>
    req.first_name.toLowerCase().includes(search.toLowerCase()) ||
    (req.registerNumber && req.registerNumber.toLowerCase().includes(search.toLowerCase())) ||
    req.reason.toLowerCase().includes(search.toLowerCase())
  );

  // Sort filteredRequests by createdAt descending (most recent first)
  const sortedFilteredRequests = [...filteredRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const updateRequestStatus = async (id: string, status: "hod_approved" | "declined") => {
    try {
      // db is now imported from firebase.ts
      
      // Find the request to get the username
      const request = allRequests.find(req => req.id === id);
      if (!request) {
        console.error("Request not found:", id);
        return false;
      }
      
      console.log("🔍 HOD Updating request:", { id, emp_code: request.emp_code, status });
      
      const updateData: { status: "hod_approved" | "declined"; hodApprovedBy?: { username: string; first_name: string; department: string } } = { status };
      
      // If HOD is approving, record who approved it
      if (status === "hod_approved" && user) {
        updateData.hodApprovedBy = {
          username: user.username,
          first_name: user.first_name,
          department: user.department
        };
      }
      
      console.log("🔍 HOD Update data:", updateData);
      
      // First try to update in the new format (under emp_code)
      if (request.emp_code) {
        const newFormatRef = ref(db, `passRequests/${request.emp_code}/${id}`);
        console.log("🔍 HOD Trying new Firebase path:", `passRequests/${request.emp_code}/${id}`);
        
        // Check if the request exists in the new format
        const newFormatSnapshot = await get(newFormatRef);
        
        if (newFormatSnapshot.exists()) {
          // Update in the new format
          await update(newFormatRef, updateData);
          console.log("🔍 HOD Firebase update successful in new format");
          
          // Verify the update
          const verifySnapshot = await get(newFormatRef);
          if (verifySnapshot.exists()) {
            const updatedData = verifySnapshot.val();
            console.log("🔍 HOD Verification - Updated data in Firebase (new format):", updatedData);
            console.log("🔍 HOD Verification - Status is now:", updatedData.status);
            
            // Check if status was actually updated
            if (updatedData.status === status) {
              console.log("✅ HOD Status update verified successfully");
            } else {
              console.error("❌ HOD Status update failed - expected:", status, "got:", updatedData.status);
            }
          }
          
          // Update local state
          setAllRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status, hodApprovedBy: updateData.hodApprovedBy } : req
          ));
          
          return true;
        }
      }
      
      // Fallback to old format
      const oldFormatRef = ref(db, `passRequests/${id}`);
      console.log("🔍 HOD Falling back to old Firebase path:", `passRequests/${id}`);
      
      try {
        // Use update instead of set to modify only the specified fields
        await update(oldFormatRef, updateData);
        console.log("🔍 HOD Firebase update successful in old format");
        
        // If we're updating in the old format but have username, also update in the new format
        if (request.emp_code) {
          // Get the full request data from the old format
          const oldFormatSnapshot = await get(oldFormatRef);
          if (oldFormatSnapshot.exists()) {
            const fullRequestData = oldFormatSnapshot.val();
            
            // Save the full request data to the new format
            const newFormatRef = ref(db, `passRequests/${request.emp_code}/${id}`);
            await set(newFormatRef, fullRequestData);
            console.log("🔍 HOD Also saved request to new format:", `passRequests/${request.emp_code}/${id}`);
          }
        }
      } catch (updateError) {
        console.error("❌ HOD Firebase update failed:", updateError);
        throw updateError;
      }
      
      // Verify the update by reading back the data
      const verifyRef = ref(db, `passRequests/${id}`);
      const verifySnapshot = await get(verifyRef);
      if (verifySnapshot.exists()) {
        const updatedData = verifySnapshot.val();
        console.log("🔍 HOD Verification - Updated data in Firebase (old format):", updatedData);
        console.log("🔍 HOD Verification - Status is now:", updatedData.status);
        
        // Check if status was actually updated
        if (updatedData.status === status) {
          console.log("✅ HOD Status update verified successfully");
        } else {
          console.error("❌ HOD Status update failed - expected:", status, "got:", updatedData.status);
        }
      } else {
        console.error("❌ HOD Could not verify update - document not found");
      }
      
      // Update local state
      setAllRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status, hodApprovedBy: updateData.hodApprovedBy } : req
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating request status:", error);
      return false;
    }
  };

  const handleApprove = async (id: string) => {
    const success = await updateRequestStatus(id, "hod_approved");
    if (success) {
      toast({
        title: "Request Approved by HOD",
        description: "Request forwarded to Warden for final approval",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (id: string) => {
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

  const handleApproveAll = async () => {
    const pendingRequests = allRequests.filter(req => req.status === "pending");
    
    try {
      const db = getDatabase();
      const updates: Record<string, string | { username: string; name: string; department: string }> = {};
      
      pendingRequests.forEach(req => {
        updates[`passRequests/${req.id}/status`] = "hod_approved";
        updates[`passRequests/${req.id}/hodApprovedBy`] = {
          username: user?.username,
          name: user?.first_name,
          department: user?.department
        };
      });
      
      await update(ref(db), updates);
      
      // Update local state
      setAllRequests(prev => prev.map(req => 
        pendingRequests.some(pending => pending.id === req.id) 
          ? { 
              ...req, 
              status: "hod_approved" as const,
              hodApprovedBy: {
                username: user?.username,
                first_name: user?.first_name,
                department: user?.department
              }
            }
          : req
      ));
      
      toast({
        title: "All Pending Requests Approved",
        description: "All requests forwarded to Warden for final approval",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve all requests",
        variant: "destructive",
      });
    }
  };

  const handleDeclineAll = async () => {
    const pendingRequests = allRequests.filter(req => req.status === "pending");
    
    try {
      const db = getDatabase();
      const updates: Record<string, string> = {};
      
      pendingRequests.forEach(req => {
        updates[`passRequests/${req.id}/status`] = "declined";
      });
      
      await update(ref(db), updates);
      
      // Update local state
      setAllRequests(prev => prev.map(req => 
        pendingRequests.some(pending => pending.id === req.id) 
          ? { ...req, status: "declined" as const }
          : req
      ));
      
      toast({
        title: "All Pending Requests Declined",
        description: "Students have been notified",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline all requests",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "warden_approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "hod_approved": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "warden_approved": return "bg-green-100 text-green-800";
      case "hod_approved": return "bg-blue-100 text-blue-800";
      case "declined": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "warden_approved": return "Warden Approved";
      case "hod_approved": return "Forwarded to Warden";
      case "declined": return "Declined";
      default: return "Pending";
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 85) return "text-green-600";
    if (attendance >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const pendingRequests = allRequests.filter(req => req.status === "pending");
  const hodApprovedRequests = allRequests.filter(req => req.status === "hod_approved");
  const wardenApprovedRequests = allRequests.filter(req => req.status === "warden_approved");
  const declinedRequests = allRequests.filter(req => req.status === "declined");

  return (
    <>
      <AppHeader />
      <div className="max-w-6xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <Card className="border-college-red/20">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              HOD Dashboard
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Review and approve home visit requests before forwarding to Warden
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Home Visit Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 whitespace-nowrap">
                  <Home className="h-5 w-5" />
                  Home Visit Requests
                </CardTitle>
                <CardDescription>
                  First level approval - Review student attendance and reason before forwarding to Warden
                </CardDescription>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-yellow-600">Pending: {pendingRequests.length}</span>
                  <span className="text-blue-600">Forwarded: {hodApprovedRequests.length}</span>
                  <span className="text-green-600">Approved: {wardenApprovedRequests.length}</span>
                  <span className="text-red-600">Declined: {declinedRequests.length}</span>
                </div>
                <input
                  type="text"
                  className="mt-4 mb-2 px-3 py-2 border rounded w-full"
                  placeholder="Search by name or register number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {pendingRequests.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={handleApproveAll}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                    <Button 
                      onClick={handleDeclineAll}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline All
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading requests...</p>
            ) : sortedFilteredRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No home visit requests found</p>
            ) : (
              <div className="space-y-4">
                {sortedFilteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{request.first_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.registerNumber && `${request.registerNumber} • `}
                          {request.department} - {request.year} Year
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </Badge>
                        {/* Expiry Status */}
                        {(() => {
                          const expiryInfo = getTimeUntilExpiry(request.createdAt);
                          return (
                            <Badge 
                              variant="outline" 
                              className={`${expiryInfo.color} border-current`}
                            >
                              {expiryInfo.isExpired ? "Expired" : expiryInfo.timeRemaining}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Date:</strong> {request.date}</p>
                        <p><strong>Arrival Date:</strong> {request.arrivalTime ? new Date(request.arrivalTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not specified'}</p>
                        <p><strong>Days Leave:</strong> {request.numberOfDaysLeave || 'Not specified'}</p>
                        <p><strong>Working Days:</strong> {request.noOfWorkingDays || 'Not specified'}</p>
                        <p><strong>Mobile:</strong> {request.mobileNumber}</p>
                        <p><strong>Block & Room:</strong> {request.block && request.roomNumber ? `Block ${request.block} - Room ${request.roomNumber}` : 'Not specified'}</p>
                      </div>
                      <div>
                        <p><strong>Attendance:</strong> {(() => {
                          const working = parseFloat(request.noOfWorkingDays || '0');
                          const leave = parseFloat(request.numberOfDaysLeave || '0');
                          if (working > 0 && leave >= 0 && leave <= working) {
                            const attendance = ((working - leave) / working) * 100;
                            return <span className={getAttendanceColor(attendance)}>{attendance.toFixed(2)}%</span>;
                          }
                          return <span className="text-gray-500">Not calculated</span>;
                        })()}</p>
                        <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm"><strong>Reason:</strong></p>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    </div>
                    
                    {/* Show HOD approval info if approved */}
                    {request.hodApprovedBy && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Approved by HOD:</strong> {request.hodApprovedBy.first_name} 
                          <span className="text-xs text-blue-600 ml-2">
                            ({new Date(request.createdAt).toLocaleDateString()})
                          </span>
                        </p>
                      </div>
                    )}
                    
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleDecline(request.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default HODDashboard;