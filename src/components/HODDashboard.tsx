import { useState } from "react";
import { Building, Home, CheckCircle, XCircle, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface HomeVisitRequest {
  id: string;
  name: string;
  registerNumber: string;
  department: string;
  year: string;
  date: string;
  mobileNumber: string;
  reason: string;
  days: number;
  attendance: number;
  status: "pending" | "approved" | "declined";
}

const HODDashboard = () => {
  const { toast } = useToast();
  
  // Mock data
  const [homeVisitRequests, setHomeVisitRequests] = useState<HomeVisitRequest[]>([
    {
      id: "1",
      name: "Alice Johnson",
      registerNumber: "CSE19001",
      department: "CSE",
      year: "IV",
      date: "2024-01-20",
      mobileNumber: "9876543212",
      reason: "Sister's wedding ceremony - need to attend family function",
      days: 3,
      attendance: 85,
      status: "pending"
    },
    {
      id: "2",
      name: "Bob Wilson",
      registerNumber: "CSE19045",
      department: "CSE",
      year: "III",
      date: "2024-01-25",
      mobileNumber: "9876543213",
      reason: "Family medical emergency - father hospitalized",
      days: 2,
      attendance: 92,
      status: "pending"
    },
    {
      id: "3",
      name: "Charlie Brown",
      registerNumber: "CSE19088",
      department: "CSE",
      year: "II",
      date: "2024-01-18",
      mobileNumber: "9876543214",
      reason: "Grandmother's 80th birthday celebration",
      days: 1,
      attendance: 78,
      status: "pending"
    }
  ]);

  const handleApprove = (id: string) => {
    setHomeVisitRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: "approved" as const } : req
    ));
    
    toast({
      title: "Request Approved by HOD",
      description: "Request forwarded to Warden for final approval",
    });
  };

  const handleDecline = (id: string) => {
    setHomeVisitRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: "declined" as const } : req
    ));
    
    toast({
      title: "Request Declined",
      description: "Student has been notified",
      variant: "destructive",
    });
  };

  const handleApproveAll = () => {
    setHomeVisitRequests(prev => prev.map(req => 
      req.status === "pending" ? { ...req, status: "approved" as const } : req
    ));
    
    toast({
      title: "All Pending Requests Approved",
      description: "All requests forwarded to Warden for final approval",
    });
  };

  const handleDeclineAll = () => {
    setHomeVisitRequests(prev => prev.map(req => 
      req.status === "pending" ? { ...req, status: "declined" as const } : req
    ));
    
    toast({
      title: "All Pending Requests Declined",
      description: "Students have been notified",
      variant: "destructive",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 85) return "text-green-600";
    if (attendance >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const pendingRequests = homeVisitRequests.filter(req => req.status === "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Home Visit Requests
              </CardTitle>
              <CardDescription>
                First level approval - Review student attendance and reason before forwarding to Warden
              </CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <div className="flex gap-2">
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
        </CardHeader>
        <CardContent>
          {homeVisitRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No home visit requests found</p>
          ) : (
            <div className="space-y-4">
              {homeVisitRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-lg">{request.name}</h4>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Register No:</p>
                      <p className="text-muted-foreground">{request.registerNumber}</p>
                    </div>
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
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Mobile Number:</p>
                      <p className="text-muted-foreground">{request.mobileNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">Number of Days:</p>
                      <p className="text-muted-foreground">{request.days} day(s)</p>
                    </div>
                    <div>
                      <p className="font-medium">Attendance Percentage:</p>
                      <p className={`font-medium ${getAttendanceColor(request.attendance)}`}>
                        {request.attendance}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">Reason for Home Visit:</p>
                    <p className="text-muted-foreground mt-1">{request.reason}</p>
                  </div>
                  
                  {/* Attendance Warning */}
                  {request.attendance < 75 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm font-medium">
                        ⚠️ Low Attendance Warning: Student has {request.attendance}% attendance (below 75% requirement)
                      </p>
                    </div>
                  )}
                  
                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleApprove(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve & Forward to Warden
                      </Button>
                      <Button 
                        onClick={() => handleDecline(request.id)}
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {request.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Approved by HOD - Forwarded to Warden for final approval
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HODDashboard;