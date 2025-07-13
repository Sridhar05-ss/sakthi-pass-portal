import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Home,
  User,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PassEntry {
  id: string;
  name: string;
  department: string;
  year: string;
  departureTime: string;
  arrivalTime: string;
  reason: string;
  type: "outing_pass" | "home_visit_pass";
  timestamp: string;
  status: "pending" | "approved" | "rejected";
}

const PassHistory = () => {
  const [passes, setPasses] = useState<PassEntry[]>([]);
  const [filteredPasses, setFilteredPasses] = useState<PassEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - in real app, this would come from your database
  useEffect(() => {
    const mockData: PassEntry[] = [
      {
        id: "1",
        name: "Rajesh Kumar",
        department: "Computer Science Engineering",
        year: "III",
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
        reason: "Medical appointment in city hospital",
        type: "outing_pass",
        timestamp: new Date().toISOString(),
        status: "pending"
      },
      {
        id: "2",
        name: "Priya Sharma",
        department: "Electronics and Communication Engineering",
        year: "II",
        departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
        reason: "Sister's wedding ceremony at home. Need to help with preparations and attend the function.",
        type: "home_visit_pass",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: "approved"
      },
      {
        id: "3",
        name: "Arjun Patel",
        department: "Mechanical Engineering",
        year: "IV",
        departureTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        reason: "Job interview in Chennai",
        type: "outing_pass",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "approved"
      }
    ];
    setPasses(mockData);
    setFilteredPasses(mockData);
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = passes;

    if (searchTerm) {
      filtered = filtered.filter(pass => 
        pass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pass.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(pass => pass.department === departmentFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(pass => pass.status === statusFilter);
    }

    setFilteredPasses(filtered);
  }, [passes, searchTerm, departmentFilter, statusFilter]);

  const departments = [
    "Computer Science Engineering",
    "Electronics and Communication Engineering", 
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical and Electronics Engineering",
    "Information Technology",
    "Electronics and Instrumentation Engineering"
  ];

  const updatePassStatus = (id: string, newStatus: "approved" | "rejected") => {
    setPasses(prev => prev.map(pass => 
      pass.id === id ? { ...pass, status: newStatus } : pass
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const PassCard = ({ pass }: { pass: PassEntry }) => (
    <Card className="mb-4 border-college-red/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {pass.type === "outing_pass" ? (
              <MapPin className="h-5 w-5 text-primary" />
            ) : (
              <Home className="h-5 w-5 text-primary" />
            )}
            {pass.type === "outing_pass" ? "Outing Pass" : "Home Visit Pass"}
          </CardTitle>
          {getStatusBadge(pass.status)}
        </div>
        <CardDescription>
          Submitted on {format(new Date(pass.timestamp), "PPP 'at' p")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{pass.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span>{pass.department} - {pass.year} Year</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Departure:</strong> {format(new Date(pass.departureTime), "PPP 'at' p")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Return:</strong> {format(new Date(pass.arrivalTime), "PPP 'at' p")}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Reason:</span>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {pass.reason}
          </p>
        </div>

        {pass.status === "pending" && (
          <div className="flex gap-2 pt-4">
            <Button
              size="sm"
              onClick={() => updatePassStatus(pass.id, "approved")}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updatePassStatus(pass.id, "rejected")}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const outingPasses = filteredPasses.filter(pass => pass.type === "outing_pass");
  const homeVisitPasses = filteredPasses.filter(pass => pass.type === "home_visit_pass");

  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Passes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pass History */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Passes ({filteredPasses.length})</TabsTrigger>
          <TabsTrigger value="outing">Outing ({outingPasses.length})</TabsTrigger>
          <TabsTrigger value="home">Home Visit ({homeVisitPasses.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {filteredPasses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No passes found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              filteredPasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="outing" className="mt-6">
          <div className="space-y-4">
            {outingPasses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No outing passes found.</p>
                </CardContent>
              </Card>
            ) : (
              outingPasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="home" className="mt-6">
          <div className="space-y-4">
            {homeVisitPasses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No home visit passes found.</p>
                </CardContent>
              </Card>
            ) : (
              homeVisitPasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PassHistory;