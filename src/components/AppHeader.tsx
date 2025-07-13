import { GraduationCap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AppHeader = () => {
  return (
    <header className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/10 rounded-full">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SSEC Pass Portal</h1>
                <p className="text-sm text-primary-foreground/80">
                  Sree Sakthi Engineering College
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              <Shield className="h-3 w-3 mr-1" />
              Secure Portal
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Users className="h-4 w-4 mr-1" />
              Student Mode
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
  );
};

export default AppHeader;