import { useState } from "react";
import { Shield, FileText, Home, CheckCircle, XCircle, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface PassRequest {
  id: string;
  type: "outing" | "home_visit";
  name: string;
  registerNumber?: string;
  department: string;
  year: string;
  date: string;
  arrivalTime?: string;
  mobileNumber: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  hodApproved?: boolean;
  attendance?: number;
  days?: number;
}

const WardenDashboard = () => {
  const { toast } = useToast();
  
  // Mock data
  const [outingRequests, setOutingRequests] = useState<PassRequest[]>([
    {
      id: "1",
      type: "outing",
      name: "John Doe",
      department: "CSE",
      year: "III",
      date: "2024-01-15",
      arrivalTime: "18:00",
      mobileNumber: "9876543210",
      reason: "Medical appointment",
      status: "pending"
    },
    {
      id: "2",
      type: "outing",
      name: "Jane Smith",
      department: "ECE",
      year: "II",
      date: "2024-01-16",
      arrivalTime: "20:00",
      mobileNumber: "9876543211",
      reason: "Family visit",
      status: "pending"
    }
  ]);

  const [homeVisitRequests, setHomeVisitRequests] = useState<PassRequest[]>([
    {
      id: "3",
      type: "home_visit",
      name: "Alice Johnson",
      registerNumber: "CSE19001",
      department: "CSE",
      year: "IV",
      date: "2024-01-20",
      mobileNumber: "9876543212",
      reason: "Sister's wedding",
      status: "pending",
      hodApproved: true,
      attendance: 85,
      days: 3
    },
    {
      id: "4",
      type: "home_visit",
      name: "Bob Wilson",
      registerNumber: "MECH19045",
      department: "MECH",
      year: "III",
      date: "2024-01-25",
      mobileNumber: "9876543213",
      reason: "Family emergency",
      status: "pending",
      hodApproved: true,
      attendance: 92,
      days: 2
    }
  ]);

  const handleApprove = (id: string, type: "outing" | "home_visit") => {
    if (type === "outing") {
      setOutingRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: "approved" as const } : req
      ));
    } else {
      setHomeVisitRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: "approved" as const } : req
      ));
    }
    
    toast({
      title: "Request Approved",
      description: "SMS notification sent to parent/guardian",
    });
  };

  const handleDecline = (id: string, type: "outing" | "home_visit") => {
    if (type === "outing") {
      setOutingRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: "declined" as const } : req
      ));
    } else {
      setHomeVisitRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: "declined" as const } : req
      ));
    }
    
    toast({
      title: "Request Declined",
      description: "Student has been notified",
      variant: "destructive",
    });
  };

  const handleApproveAll = (type: "outing" | "home_visit") => {
    if (type === "outing") {
      setOutingRequests(prev => prev.map(req => ({ ...req, status: "approved" as const })));
    } else {
      setHomeVisitRequests(prev => prev.map(req => ({ ...req, status: "approved" as const })));
    }
    
    toast({
      title: "All Requests Approved",
      description: "SMS notifications sent to all parents/guardians",
    });
  };

  const handleDeclineAll = (type: "outing" | "home_visit") => {
    if (type === "outing") {
      setOutingRequests(prev => prev.map(req => ({ ...req, status: "declined" as const })));
    } else {
      setHomeVisitRequests(prev => prev.map(req => ({ ...req, status: "declined" as const })));
    }
    
    toast({
      title: "All Requests Declined",
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      {/* Requests Tabs */}
      <Tabs defaultValue="outing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Outing Requests
          </TabsTrigger>
          <TabsTrigger value="home_visit" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home Visit Requests
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="outing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outing Requests</CardTitle>
                  <CardDescription>Approve or decline student outing requests</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleApproveAll("outing")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button 
                    onClick={() => handleDeclineAll("outing")}
                    variant="destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {outingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No outing requests pending</p>
              ) : (
                <div className="space-y-4">
                  {outingRequests.map((request) => (
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
                      
                      <div>
                        <p className="font-medium">Mobile Number:</p>
                        <p className="text-muted-foreground">{request.mobileNumber}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Reason:</p>
                        <p className="text-muted-foreground">{request.reason}</p>
                      </div>
                      
                      {request.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleApprove(request.id, "outing")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleDecline(request.id, "outing")}
                            variant="destructive"
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
        </TabsContent>
        
        <TabsContent value="home_visit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Home Visit Requests</CardTitle>
                  <CardDescription>
                    Review HOD-approved home visit requests (Final approval)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleApproveAll("home_visit")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button 
                    onClick={() => handleDeclineAll("home_visit")}
                    variant="destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {homeVisitRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No home visit requests pending</p>
              ) : (
                <div className="space-y-4">
                  {homeVisitRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg">{request.name}</h4>
                        <div className="flex items-center gap-2">
                          {request.hodApproved && (
                            <Badge className="bg-blue-100 text-blue-800">
                              HOD Approved
                            </Badge>
                          )}
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                        </div>
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
                          <p className="font-medium">Date:</p>
                          <p className="text-muted-foreground">{request.date}</p>
                        </div>
                        <div>
                          <p className="font-medium">Days:</p>
                          <p className="text-muted-foreground">{request.days}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Mobile Number:</p>
                          <p className="text-muted-foreground">{request.mobileNumber}</p>
                        </div>
                        <div>
                          <p className="font-medium">Attendance:</p>
                          <p className="text-muted-foreground">{request.attendance}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium">Reason:</p>
                        <p className="text-muted-foreground">{request.reason}</p>
                      </div>
                      
                      {request.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleApprove(request.id, "home_visit")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Final Approve
                          </Button>
                          <Button 
                            onClick={() => handleDecline(request.id, "home_visit")}
                            variant="destructive"
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WardenDashboard;