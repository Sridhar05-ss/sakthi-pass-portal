import { useState } from "react";
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
import ApprovalWorkflow, { ApprovalStatus } from "./ApprovalWorkflow";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(1, "Please select a department"),
  year: z.string().min(1, "Please select a year"),
  parentPhone: z.string().min(10, "Please enter a valid 10-digit phone number").max(10, "Phone number should be 10 digits"),
  departureTime: z.date({
    required_error: "Please select departure time",
  }),
  arrivalTime: z.string().min(1, "Please enter expected arrival time"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

type FormData = z.infer<typeof formSchema>;

const OutingPassForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("pending");
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: "",
      year: "",
      parentPhone: "",
      reason: "",
    },
  });

  const departments = [
    "AIML",
    "CYBER",
    "IT",
    "AIDSCSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL"
  ];

  const years = ["I", "II", "III", "IV"];

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call - in real app, this would connect to your backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Outing Pass Data:", {
        ...data,
        type: "outing_pass",
        timestamp: new Date().toISOString(),
        status: "pending"
      });

      setSubmittedData(data);
      setApprovalStatus("pending");

      toast({
        title: "Outing Pass Submitted!",
        description: "Your outing pass request has been submitted for approval.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit outing pass. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-college-red/20">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Outing Pass Form
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Fill out this form to request permission for going out during college hours
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Student Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
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
              name="parentPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Parent/Guardian Contact Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 10-digit mobile number" 
                      type="tel"
                      maxLength={10}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Departure Time
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
                              <span>Pick departure date</span>
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

              <FormField
                control={form.control}
                name="arrivalTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Arrival Time</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expected arrival time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
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

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Outing Pass"}
            </Button>
          </form>
        </Form>

        {submittedData && (
          <ApprovalWorkflow
            passType="outing"
            currentStatus={approvalStatus}
            onStatusChange={setApprovalStatus}
            studentName={submittedData.name}
            parentNumber={submittedData.parentPhone}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default OutingPassForm;