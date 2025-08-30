import { GraduationCap, Shield, Users, UserCheck, Building, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMode, UserMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";

const AppHeader = () => {
  const { mode, setMode } = useMode();
  const { user, logout } = useAuth();

  const getModeIcon = (mode: UserMode) => {
    switch (mode) {
      case "student": return Users;
      case "warden": return UserCheck;
      case "hod": return Building;
    }
  };

  const getModeLabel = (mode: UserMode) => {
    switch (mode) {
      case "student": return "Student Mode";
      case "warden": return "Warden Mode";
      case "hod": return "HOD Mode";
    }
  };

  const ModeIcon = getModeIcon(mode);

  return (
    <header className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg relative" style={{ minHeight: 180 }}>
      <div className="flex flex-col items-center justify-center py-6">
        <img 
          src="/lovable-uploads/college_logo.png" 
          alt="SSEC Logo" 
          className="h-10 w-auto mb-2" // Reduced size
        />
        <h1 className="text-2xl font-bold tracking-tight text-center">SSEC PASS PORTAL</h1>
      </div>
      <div className="absolute right-6 bottom-4 flex items-center gap-3">
        {user && <span className="font-small text-xl" style={{ fontFamily: 'maiandra gd ' }}>{user.first_name}</span>}
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20 p-2"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button 
          onClick={logout}
          variant="outline"
          className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
        >
          <LogOut className="h-5 w-5 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;