import AppHeader from "@/components/AppHeader";
import PassTabs from "@/components/PassTabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-college-light">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Student Pass Management System
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Request and manage your outing passes and home visit passes digitally. 
              Track your submissions and get real-time approval status updates.
            </p>
          </div>
          
          <PassTabs />
          
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              For technical support, contact the IT department at{" "}
              <span className="font-medium text-primary">support@ssec.edu.in</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
