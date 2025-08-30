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
      {/* Header removed to avoid duplicate */}
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {getDashboardComponent()}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            For technical support, contact the EMTRON department at{" "}
            <span className="font-medium text-primary">emtrondet@gmail.com</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
