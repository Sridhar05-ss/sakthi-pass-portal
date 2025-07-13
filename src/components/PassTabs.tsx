import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Home, List } from "lucide-react";
import OutingPassForm from "./OutingPassForm";
import HomeVisitForm from "./HomeVisitForm";
import PassHistory from "./PassHistory";

const PassTabs = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs defaultValue="outing" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-college-light">
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
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <List className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="outing" className="mt-6">
          <OutingPassForm />
        </TabsContent>
        
        <TabsContent value="home" className="mt-6">
          <HomeVisitForm />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <PassHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PassTabs;