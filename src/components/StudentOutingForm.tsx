import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, User, GraduationCap, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  department: z.string().min(1, "Please select a department"),
  yearOfStudy: z.string().min(1, "Please select year of study"),
  dateOfOuting: z.date({
    required_error: "Please select date of outing",
  }),
  reasonForOuting: z.string().min(5, "Reason must be at least 5 characters"),
  expectedArrivalTime: z.string().optional(),
  mobileNumber: z.string().min(10, "Please enter a valid 10-digit phone number").max(10, "Phone number should be 10 digits").optional(),
  parentMobileNumber: z.string().min(10, "Please enter a valid 10-digit parent mobile number").max(10, "Phone number should be 10 digits"),
  block: z.string().min(1, "Please select a block"),
  roomNumber: z.string()
    .regex(/^\d{3}$/, "Room number must be exactly 3 digits"),
});

export type FormData = z.infer<typeof formSchema>;

interface StudentOutingFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isSubmitting?: boolean;
}

const StudentOutingForm = ({ onSubmit, isSubmitting: externalIsSubmitting }: StudentOutingFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use external submission state if provided, otherwise use internal state
  const finalIsSubmitting = externalIsSubmitting !== undefined ? externalIsSubmitting : isSubmitting;

  // Debug logging to see what's in the user object
  console.log("StudentOutingForm - User object:", user);
  console.log("StudentOutingForm - parentsMobileNumber:", user?.parentsMobileNumber);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.first_name || "",
      department: user?.department || "",
      yearOfStudy: "",
      dateOfOuting: undefined,
      reasonForOuting: "",
      expectedArrivalTime: "",
      mobileNumber: "",
      parentMobileNumber: String(user?.parentsMobileNumber || ""),
      block: "",
      roomNumber: "",
    },
  });

  // Reset form when user data changes to ensure proper pre-filling
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.first_name || "",
        department: user.department || "",
        yearOfStudy: "",
        dateOfOuting: undefined,
        reasonForOuting: "",
        expectedArrivalTime: "",
        mobileNumber: "",
        parentMobileNumber: String(user.parentsMobileNumber || ""),
        block: "",
        roomNumber: "",
      });
    }
  }, [user, form]);

  const departments = [
    "AIML",
    "CYBER",
    "IT",
    "AIDS",
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL"
  ];

  const years = ["I", "II", "III", "IV"];
  const blocks = ["A(Boys)", "B(Boys)", "G(Girls)"];

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    // Prevent multiple submissions
    if (finalIsSubmitting) {
      console.log("⚠️ Submission already in progress, ignoring duplicate request");
      toast({
        title: "Please wait",
        description: "Your request is already being submitted...",
        variant: "destructive",
      });
      return;
    }

    // Only set internal state if not using external state
    if (externalIsSubmitting === undefined) {
      setIsSubmitting(true);
    }
    
    try {
      console.log("Outing Request Data:", data);
      
      // Call the onSubmit function
      await onSubmit(data);
      
      toast({
        title: "Outing Request Submitted!",
        description: "Your outing request has been submitted to the Warden for approval.",
      });
      
      // Reset form after successful submission
      form.reset();
      
    } catch (error) {
      console.error("Error submitting outing request:", error);
      toast({
        title: "Error",
        description: "Failed to submit outing request. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Re-enable button after a delay to prevent rapid clicking (only if using internal state)
      if (externalIsSubmitting === undefined) {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 3000); // 3 second delay to prevent rapid resubmission
      }
    }
  };

  return (
    <Card className="w-full border-college-red/20">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Outing Request Form
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Submit a request for going out during college hours
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Department
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Department" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Study</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year} Year
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dateOfOuting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Date of Outing
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick date of outing</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="block"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Block
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select block" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {blocks.map((block) => (
                          <SelectItem key={block} value={block}>
                            Block {block}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Room Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your room number" maxLength={3} inputMode="numeric" pattern="[0-9]{3}" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reasonForOuting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Outing</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed reason for your outing..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedArrivalTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Arrival Time</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter expected arrival time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Student's Mobile Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 10-digit student's mobile number" 
                      type="tel"
                      maxLength={10}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
              )}
            />

            <FormField
              control={form.control}
              name="parentMobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Parent's Mobile Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 10-digit parent's mobile number" 
                      type="tel"
                      maxLength={10}
                      {...field} 
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={finalIsSubmitting}
            >
              {finalIsSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                "Submit Outing Request"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StudentOutingForm;