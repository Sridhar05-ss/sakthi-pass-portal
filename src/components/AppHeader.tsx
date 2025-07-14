import { GraduationCap, Shield, Users, UserCheck, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMode, UserMode } from "@/contexts/ModeContext";

const AppHeader = () => {
  const { mode, setMode } = useMode();

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
    <header className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/college_logo.png" 
              alt="SSEC Logo" 
              className="h-16 w-auto"
            />
          </div>
          <div className="flex-1 flex flex-col items-center text-center">
            <center>
            <h1 className="text-3xl font-bold tracking-tight">SSEC PASS PORTAL</h1>
            <p className="text-sm text-primary-foreground/80">
              Sree Sakthi Engineering College
            </p>
            </center>
          </div>  
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              <Shield className="h-3 w-3 mr-1" />
              Secure Portal
            </Badge>
            <Select value={mode} onValueChange={(value: UserMode) => setMode(value)}>
              <SelectTrigger className="w-40 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
                <div className="flex items-center gap-2">
                  <ModeIcon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Student Mode
                  </div>
                </SelectItem>
                <SelectItem value="warden">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Warden Mode
                  </div>
                </SelectItem>
                <SelectItem value="hod">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    HOD Mode
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
  );
};

export default AppHeader;