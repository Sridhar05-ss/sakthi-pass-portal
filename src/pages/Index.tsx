import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
import StudentDashboard from "@/components/StudentDashboard";
import WardenDashboard from "@/components/WardenDashboard";
import HODDashboard from "@/components/HODDashboard";

const Index = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getDashboardComponent = () => {
    switch (user?.role) {
      case "student":
        return <StudentDashboard />;
      case "warden":
        return <WardenDashboard />;
      case "hod":
        return <HODDashboard />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-college-light">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/college_logo.png" 
                  alt="SSEC Logo" 
                  className="h-16 w-auto"
                />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">SSEC PASS PORTAL</h1>
                  <p className="text-sm text-primary-foreground/80">
                    Sree Sakthi Engineering College
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-primary-foreground/80 capitalize">{user?.role}</p>
              </div>
              <Button 
                onClick={logout}
                variant="outline"
                className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-primary-foreground/90">
              Ooty Main Road, Karamadai, Coimbatore - 641104
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">
              Affiliated to Anna University • Approved by AICTE • Accredited by NAAC
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {getDashboardComponent()}
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            For technical support, contact the IT department at{" "}
            <span className="font-medium text-primary">support@ssec.edu.in</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
