import { useState } from "react";
import { FileText, Home, Plus, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentOutingForm from "./StudentOutingForm";
import StudentHomeVisitForm from "./StudentHomeVisitForm";

interface PassRequest {
  id: string;
  type: "outing" | "home_visit";
  name: string;
  department: string;
  year: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  daysRemaining?: number;
}

const StudentDashboard = () => {
  const [showOutingForm, setShowOutingForm] = useState(false);
  const [showHomeVisitForm, setShowHomeVisitForm] = useState(false);
  
  // Mock data for demonstration
  const [requests, setRequests] = useState<PassRequest[]>([
    {
      id: "1",
      type: "outing",
      name: "John Doe",
      department: "CSE",
      year: "III",
      date: "2024-01-15",
      reason: "Medical appointment",
      status: "approved",
      daysRemaining: 2
    },
    {
      id: "2",
      type: "home_visit",
      name: "John Doe",
      department: "CSE",
      year: "III",
      date: "2024-01-20",
      reason: "Family function",
      status: "pending"
    }
  ]);

  const outingRequests = requests.filter(r => r.type === "outing");
  const homeVisitRequests = requests.filter(r => r.type === "home_visit");

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
        <StudentOutingForm onSubmit={(data) => {
          console.log("Outing request:", data);
          setShowOutingForm(false);
        }} />
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
        <StudentHomeVisitForm onSubmit={(data) => {
          console.log("Home visit request:", data);
          setShowHomeVisitForm(false);
        }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <Card className="border-college-red/20">
        <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Dashboard
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
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
              {outingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No outing requests found</p>
              ) : (
                <div className="space-y-4">
                  {outingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{request.reason}</h4>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Date: {request.date}</p>
                        <p>Department: {request.department} - {request.year} Year</p>
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
              {homeVisitRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No home visit requests found</p>
              ) : (
                <div className="space-y-4">
                  {homeVisitRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{request.reason}</h4>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Date: {request.date}</p>
                        <p>Department: {request.department} - {request.year} Year</p>
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
  );
};

export default StudentDashboard;