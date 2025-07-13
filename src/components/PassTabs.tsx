import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Home, List } from "lucide-react";
import { useMode } from "@/contexts/ModeContext";
import OutingPassForm from "./OutingPassForm";
import HomeVisitForm from "./HomeVisitForm";
import PassHistory from "./PassHistory";

const PassTabs = () => {
  const { mode } = useMode();
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue={mode === "student" ? "outing" : "history"} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-college-light">
          {mode === "student" && (
            <>
              <TabsTrigger 
                value="outing" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="h-4 w-4" />
                Outing Pass
              </TabsTrigger>
              <TabsTrigger 
                value="home" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Home className="h-4 w-4" />
                Home Visit
              </TabsTrigger>
            </>
          )}
          <TabsTrigger 
            value="history" 
            className={`flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${
              mode !== "student" ? "col-span-3" : ""
            }`}
          >
            <List className="h-4 w-4" />
            {mode === "student" ? "History" : "Pending Approvals"}
          </TabsTrigger>
        </TabsList>
        
        {mode === "student" && (
          <>
            <TabsContent value="outing" className="mt-6">
              <OutingPassForm />
            </TabsContent>
            
            <TabsContent value="home" className="mt-6">
              <HomeVisitForm />
            </TabsContent>
          </>
        )}
        
        <TabsContent value="history" className="mt-6">
          <PassHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PassTabs;