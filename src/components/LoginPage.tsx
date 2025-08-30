import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User, LogIn, Wifi, WifiOff, Signal, SignalHigh, SignalMedium, SignalLow, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof formSchema>;

// Network Information interface for TypeScript
interface NetworkInformation {
  effectiveType?: string;
  type?: string;
  downlink?: number;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
}

const LoginPage = () => {
  const { login, user } = useAuth(); // <-- Move this here!
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{
    isOnline: boolean;
    isSlow: boolean;
    connectionType: string;
    signalQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  }>({
    isOnline: navigator.onLine,
    isSlow: false,
    connectionType: 'unknown',
    signalQuality: navigator.onLine ? 'good' : 'offline'
  });
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Ensure form is cleared on mount
  useEffect(() => {
    form.reset({ username: "", password: "" });
  }, [form]);

  // Network monitoring effect
  useEffect(() => {
    const checkNetworkStatus = () => {
      const isOnline = navigator.onLine;
      let connectionType = 'unknown';
      let isSlow = false;
      let signalQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = isOnline ? 'good' : 'offline';

      // Check connection type and speed if available
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
        if (connection) {
          connectionType = connection.effectiveType || connection.type || 'unknown';
          
          // Determine signal quality based on connection type and speed
          if (connection.effectiveType === '4g' && connection.downlink && connection.downlink > 10) {
            signalQuality = 'excellent';
          } else if (connection.effectiveType === '4g' || (connection.downlink && connection.downlink > 5)) {
            signalQuality = 'good';
          } else if (connection.effectiveType === '3g' || (connection.downlink && connection.downlink > 1)) {
            signalQuality = 'fair';
          } else if (['slow-2g', '2g'].includes(connection.effectiveType || '') || (connection.downlink && connection.downlink <= 1)) {
            signalQuality = 'poor';
            isSlow = true;
          }
          
          // Also check if the connection is slow based on downlink
          if (connection.downlink && connection.downlink < 1) {
            isSlow = true;
          }
        }
      }

      setNetworkStatus({
        isOnline,
        isSlow,
        connectionType,
        signalQuality
      });

             // Show toast notification only for critical network issues
       if (!isOnline) {
         toast({
           title: "⚠️ No Internet Connection",
           description: "Please check your WiFi or mobile data connection.",
           variant: "destructive",
         });
       } else if (signalQuality === 'poor') {
         toast({
           title: "🐌 Very Slow Connection",
           description: "Your internet is very slow. Login might take a while.",
           variant: "destructive",
         });
       }
       // No toast for 'fair', 'good' or 'excellent' signal quality
    };

    // Initial check
    checkNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    // Listen for connection changes if available
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      if (connection) {
        connection.addEventListener('change', checkNetworkStatus);
      }
    }

    // Periodic network quality check
    const networkCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        // Test network speed with a small request
        const startTime = Date.now();
        fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        .then(() => {
          const responseTime = Date.now() - startTime;
          const isSlowResponse = responseTime > 3000; // 3 seconds threshold
          
          setNetworkStatus(prev => ({
            ...prev,
            isSlow: prev.isSlow || isSlowResponse,
            signalQuality: isSlowResponse ? 'poor' : prev.signalQuality
          }));
        })
        .catch(() => {
          // If even favicon request fails, mark as poor
          setNetworkStatus(prev => ({
            ...prev,
            isSlow: true,
            signalQuality: 'poor'
          }));
        });
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
      
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
        if (connection) {
          connection.removeEventListener('change', checkNetworkStatus);
        }
      }
      
      clearInterval(networkCheckInterval);
    };
  }, [toast]);

  // Helper functions for network status display
  const getSignalIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4 text-green-600" />;
      case 'good':
        return <Signal className="h-4 w-4 text-green-500" />;
      case 'fair':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <SignalLow className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSignalColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSignalText = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const success = await login(data.username, data.password);
      if (success) {
        if (user?.role === "student") {
          navigate("/student-dashboard");
        } else if (user?.role === "warden") {
          navigate("/warden-dashboard");
        } else if (user?.role === "hod") {
          navigate("/hod-dashboard");
        } else {
          navigate("/dashboard"); // fallback
        }
        toast({
          title: "Login Successful",
          description: "Welcome to SSEC Pass Portal!",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials or access denied. Only hostel students can access this portal.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-college-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* College Header */}
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/college_logo.png" 
            alt="SSEC Logo" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">SSEC PASS PORTAL</h1>
          <p className="text-muted-foreground">
            Sree Sakthi Engineering College
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Hostel Management System
          </p>
        </div>

                 {/* Network Status Indicator - Only show for critical issues */}
         {(!networkStatus.isOnline || networkStatus.signalQuality === 'poor') && (
           <div className="mb-6 flex justify-center">
             <Badge 
               variant="outline" 
               className={`${getSignalColor(networkStatus.signalQuality)} flex items-center gap-2 px-3 py-2 animate-pulse`}
             >
               {getSignalIcon(networkStatus.signalQuality)}
               <span className="text-sm font-medium">
                 {networkStatus.isOnline ? '⚠️ Slow Connection' : '🚫 No Internet'}
               </span>
               {networkStatus.connectionType !== 'unknown' && networkStatus.isOnline && (
                 <span className="text-xs opacity-75">
                   ({networkStatus.connectionType.toUpperCase()})
                 </span>
               )}
             </Badge>
           </div>
         )}

         {/* Network Alert for Critical Issues Only */}
         {!networkStatus.isOnline && (
           <Alert className="mb-6 border-l-4 border-red-500 bg-red-50">
             <div className="flex items-center gap-2">
               <WifiOff className="h-4 w-4 text-red-500" />
               <AlertDescription className="font-medium text-sm">
                 📱 No internet connection detected. Please check your WiFi or mobile data.
               </AlertDescription>
             </div>
           </Alert>
         )}

         {/* Network Alert for Very Poor Connection */}
         {networkStatus.signalQuality === 'poor' && networkStatus.isOnline && (
           <Alert className="mb-6 border-l-4 border-orange-500 bg-orange-50">
             <div className="flex items-center gap-2">
               <AlertTriangle className="h-4 w-4 text-orange-500" />
               <AlertDescription className="font-medium text-sm">
                 🐌 Very slow internet detected. Login might take longer than usual.
               </AlertDescription>
             </div>
           </Alert>
         )}

        <Card className="border-college-red/20">
                     <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground relative">
             {/* Network Status Indicator in Header - Only show for critical issues */}
             {(!networkStatus.isOnline || networkStatus.signalQuality === 'poor') && (
               <div className="absolute top-3 right-3">
                 <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-full">
                   {getSignalIcon(networkStatus.signalQuality)}
                   <span className="text-xs text-primary-foreground/90 font-medium">
                     {networkStatus.isOnline ? 'SLOW' : 'OFFLINE'}
                   </span>
                 </div>
               </div>
             )}
            <CardTitle className="flex items-center gap-2 justify-center">
              <LogIn className="h-5 w-5" />
              Login to Portal
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 text-center">
              Enter your credentials to access the pass management system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form autoComplete="off" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username 
                      </FormLabel>
                      <FormControl>
                        <Input autoComplete="new-username" placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password 
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            autoComplete="new-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="DD-MM-YYYY (DOB)" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

           
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Ooty Main Road, Karamadai, Coimbatore - 641104</p>
          <p className="mt-1">Affiliated to Anna University • Approved by AICTE</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;