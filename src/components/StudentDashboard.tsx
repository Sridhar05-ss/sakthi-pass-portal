import { useState, useEffect, useCallback } from "react";
import { FileText, Home, Plus, Clock, CheckCircle, XCircle, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentOutingForm from "./StudentOutingForm";
import StudentHomeVisitForm from "./StudentHomeVisitForm";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserPassRequests, savePassRequest, cleanupOldPassRequests, getTimeUntilExpiry, deletePassRequest, filterOutExpiredRequests, deleteExpiredPassRequests } from "@/lib/utils";
import { getTimeUntilPassExpiry } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ref, onValue, off, DataSnapshot } from 'firebase/database';
import { db } from '@/lib/firebase';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { FormData as OutingFormData } from "./StudentOutingForm";
import type { FormData as HomeVisitFormData } from "./StudentHomeVisitForm";

interface PassRequest {
  id: string;
  type: "outing" | "home_visit";
  first_name: string;
  department: string;
  year: string;
  date: string;
  reason: string;
  status: "pending" | "hod_approved" | "warden_approved" | "declined";
  daysRemaining?: number;
  emp_code: string;
  createdAt: string;
  block?: string;
  roomNumber?: string;
  mobileNumber?: string;
  numberOfDaysLeave?: string;
  noOfWorkingDays?: string;
  arrivalTime?: string;
  registerNumber?: string;
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

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showOutingForm, setShowOutingForm] = useState(false);
  const [showHomeVisitForm, setShowHomeVisitForm] = useState(false);
  const [requests, setRequests] = useState<PassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmittingOuting, setIsSubmittingOuting] = useState(false);
  const [isSubmittingHomeVisit, setIsSubmittingHomeVisit] = useState(false);

  // Error handling utility
  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error during ${operation}:`, error);
    setError(errorMessage);
    toast({
      title: "Error",
      description: `Failed to ${operation}: ${errorMessage}`,
      variant: "destructive",
    });
  }, [toast]);

  // Setup real-time listener for pass requests
  useEffect(() => {
    if (!user?.username) return;

    const sanitizedUsername = user.username.replace(/[.#$[\]]/g, '_');
    const requestsRef = ref(db, `passRequests/${sanitizedUsername}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const requestsArray = Object.entries(data)
            .map(([id, request]: [string, PassRequest]) => ({
              id,
              ...request,
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Filter out expired requests before setting state
          const validRequests = filterOutExpiredRequests(requestsArray);
          console.log(`📋 StudentDashboard: Filtered ${requestsArray.length - validRequests.length} expired requests`);
          setRequests(validRequests);
        } else {
          setRequests([]);
        }
        setLoading(false);
        setError(null);
      } catch (error) {
        handleError(error, 'processing pass requests');
      }
    };

    onValue(requestsRef, handleSnapshot, (error) => {
      handleError(error, 'fetching pass requests');
    });

    // Cleanup function
    return () => {
      off(requestsRef);
    };
  }, [user?.username, handleError]);

  // Initial cleanup of old requests
  useEffect(() => {
    const cleanup = async () => {
      try {
        // Delete expired requests immediately from database
        await deleteExpiredPassRequests();
        // Also run general cleanup
        await cleanupOldPassRequests();
      } catch (error) {
        handleError(error, 'cleaning up old requests');
      }
    };
    cleanup();
  }, [handleError]);

  const outingRequests = requests.filter(r => r.type === "outing");
  const homeVisitRequests = requests.filter(r => r.type === "home_visit");

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
      case "warden_approved": return "Approved";
      case "hod_approved": return "Forwarded to Warden";
      case "declined": return "Declined";
      default: return "Pending";
    }
  };

  const handleOutingSubmit = async (data: OutingFormData) => {
    // Prevent multiple submissions
    if (isSubmittingOuting) {
      console.log("⚠️ Outing submission already in progress, ignoring duplicate request");
      toast({
        title: "Please wait",
        description: "Your outing request is already being submitted...",
        variant: "destructive",
      });
      return;
    }

    // Disable form immediately to prevent rapid clicking
    setIsSubmittingOuting(true);
    const sanitizedUsername = user.username.replace(/[.#$[\]]/g, '_');
    const outingTempId = Date.now().toString();

    const newRequest: PassRequest = {
      id: outingTempId,
      type: 'outing' as const,
      first_name: data.fullName,
      department: data.department,
      year: data.yearOfStudy,
      date: data.dateOfOuting.toISOString(),
      reason: data.reasonForOuting,
      status: 'pending',
      emp_code: user.username,
      block: data.block,
      roomNumber: data.roomNumber,
      createdAt: new Date().toISOString()
    };

    // Add temporary request to UI
    setRequests(prev => [newRequest, ...prev]);

    try {
      await savePassRequest({
        type: 'outing' as const,
        first_name: data.fullName,
        department: data.department,
        year: data.yearOfStudy,
        date: data.dateOfOuting.toISOString(),
        reason: data.reasonForOuting,
        emp_code: user.username,
        block: data.block,
        roomNumber: data.roomNumber,
        mobileNumber: data.mobileNumber || '',
        arrivalTime: data.expectedArrivalTime || '',
        status: 'pending'
      });
      
      // Show success message
      toast({
        title: "Outing Request Submitted",
        description: "Your outing request has been submitted successfully!",
      });
      
      // Close the form and return to dashboard
      setShowOutingForm(false);
    } catch (error) {
      // Remove temporary request on error
      setRequests(prev => prev.filter(req => req.id !== outingTempId));
      handleError(error, 'save outing request');
    } finally {
      // Re-enable submission after a delay to prevent rapid clicking
      setTimeout(() => {
        setIsSubmittingOuting(false);
      }, 3000); // 3 second delay to prevent rapid resubmission
    }
  };

  const handleHomeVisitSubmit = async (data: HomeVisitFormData) => {
    // Prevent multiple submissions
    if (isSubmittingHomeVisit) {
      console.log("⚠️ Home visit submission already in progress, ignoring duplicate request");
      toast({
        title: "Please wait",
        description: "Your home visit request is already being submitted...",
        variant: "destructive",
      });
      return;
    }

    // Disable form immediately to prevent rapid clicking
    setIsSubmittingHomeVisit(true);
    const sanitizedUsername = user.username.replace(/[.#$[\]]/g, '_');
    const homeVisitTempId = Date.now().toString();

    const newRequest: PassRequest = {
      id: homeVisitTempId,
      type: 'home_visit' as const,
      first_name: data.fullName,
      department: data.department,
      year: data.year,
      date: data.dateOfHomeVisit.toISOString(),
      reason: data.reasonForHomeVisit,
      status: 'pending',
      emp_code: user.username,
      block: data.block,
      roomNumber: data.roomNumber,
      mobileNumber: data.mobileNumber,
      numberOfDaysLeave: data.numberOfDaysLeave,
      noOfWorkingDays: data.noOfWorkingDays,
      arrivalTime: data.expectedArrivalDate.toISOString(), // Include arrival date
      createdAt: new Date().toISOString()
    };

    // Add temporary request to UI
    setRequests(prev => [newRequest, ...prev]);

    try {
      await savePassRequest({
        type: 'home_visit' as const,
        first_name: data.fullName,
        department: data.department,
        year: data.year,
        date: data.dateOfHomeVisit.toISOString(),
        reason: data.reasonForHomeVisit,
        emp_code: user.username,
        block: data.block,
        roomNumber: data.roomNumber,
        mobileNumber: data.mobileNumber,
        numberOfDaysLeave: data.numberOfDaysLeave,
        noOfWorkingDays: data.noOfWorkingDays,
        arrivalTime: data.expectedArrivalDate.toISOString(), // Save arrival date as arrivalTime for home visit
        status: 'pending'
      });
      
      // Show success message
      toast({
        title: "Home Visit Request Submitted",
        description: "Your home visit request has been submitted successfully!",
      });
      
      // Close the form and return to dashboard
      setShowHomeVisitForm(false);
    } catch (error) {
      // Remove temporary request on error
      setRequests(prev => prev.filter(req => req.id !== homeVisitTempId));
      handleError(error, 'save home visit request');
    } finally {
      // Re-enable submission after a delay to prevent rapid clicking
      setTimeout(() => {
        setIsSubmittingHomeVisit(false);
      }, 3000); // 3 second delay to prevent rapid resubmission
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      const success = await deletePassRequest(id, user?.username);
      if (success) {
        // Remove from local state
        setRequests(prev => prev.filter(req => req.id !== id));
        toast({
          title: "Request Deleted",
          description: "Your request has been deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (showOutingForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowOutingForm(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <StudentOutingForm onSubmit={handleOutingSubmit} isSubmitting={isSubmittingOuting} />
      </div>
    );
  }

  if (showHomeVisitForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowHomeVisitForm(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <StudentHomeVisitForm onSubmit={handleHomeVisitSubmit} isSubmitting={isSubmittingHomeVisit} />
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="max-w-6xl mx-auto space-y-6 mt-8">
        {/* Welcome Section */}
        <Card style={{ borderWidth: 1, borderColor: '#d4145a', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground" style={{ height: 80, minHeight: 80, justifyContent: 'center' }}>
            <CardTitle className="flex items-center gap-2" style={{ fontSize: 22, minHeight: 40, alignItems: 'center' }}>
              <User className="h-7 w-7" />
              <span style={{ fontWeight: 'bold', fontSize: 22 }}>Student Dashboard</span>
            </CardTitle>
            <CardDescription className="text-primary-foreground/80" style={{ fontSize: 14, marginTop: 2 }}>
              Manage your outing and home visit requests
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Submit new pass requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => setShowOutingForm(true)}
                className="h-20 flex-col gap-2 bg-primary hover:bg-primary/90"
              >
                <FileText className="h-6 w-6" />
                New Outing Request
              </Button>
              <Button 
                onClick={() => setShowHomeVisitForm(true)}
                className="h-20 flex-col gap-2 bg-accent hover:bg-accent/90"
              >
                <Home className="h-6 w-6" />
                New Home Visit Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Requests */}
        <Tabs defaultValue="outing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="outing">My Outing Requests</TabsTrigger>
            <TabsTrigger value="home_visit">My Home Visit Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="outing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Outing Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : outingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No outing requests found</p>
                ) : (
                  <div className="space-y-4">
                    {outingRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{request.first_name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{getStatusText(request.status)}</span>
                            </Badge>
                            {/* Expiry Status */}
                            {(() => {
                              const useGrantedExpiry = request.status === "warden_approved" && !!request.expiresAt;
                              const expiryInfo = useGrantedExpiry
                                ? getTimeUntilPassExpiry(request.expiresAt)
                                : getTimeUntilExpiry(request.createdAt);
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`${expiryInfo.color} border-current`}
                                >
                                  {expiryInfo.isExpired ? "Expired" : expiryInfo.timeRemaining}
                                </Badge>
                              );
                            })()}
                            {/* Delete button for pending requests */}
                            {request.status === "pending" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                    onClick={() => setDeleteId(request.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this pending request? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        if (deleteId) {
                                          await handleDeleteRequest(deleteId);
                                          setDeleteId(null);
                                        }
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Date: {request.date}</p>
                          <p>Department: {request.department}</p>
                          <p>Block & Room: {request.block && request.roomNumber ? `Block ${request.block} - Room ${request.roomNumber}` : 'Not specified'}</p>
                          <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                          {request.daysRemaining && (
                            <p className="text-primary font-medium">
                              Days remaining: {request.daysRemaining}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="home_visit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Home Visit Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : homeVisitRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No home visit requests found</p>
                ) : (
                  <div className="space-y-4">
                    {homeVisitRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{request.first_name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{getStatusText(request.status)}</span>
                            </Badge>
                            {/* Expiry Status */}
                            {(() => {
                              const useGrantedExpiry = request.status === "warden_approved" && !!request.expiresAt;
                              const expiryInfo = useGrantedExpiry
                                ? getTimeUntilPassExpiry(request.expiresAt)
                                : getTimeUntilExpiry(request.createdAt);
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`${expiryInfo.color} border-current`}
                                >
                                  {expiryInfo.isExpired ? "Expired" : expiryInfo.timeRemaining}
                                </Badge>
                              );
                            })()}
                            {/* Delete button for pending requests */}
                            {request.status === "pending" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                    onClick={() => setDeleteId(request.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this pending request? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        if (deleteId) {
                                          await handleDeleteRequest(deleteId);
                                          setDeleteId(null);
                                        }
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Date: {request.date}</p>
                          <p>Department: {request.department}</p>
                          <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default StudentDashboard;