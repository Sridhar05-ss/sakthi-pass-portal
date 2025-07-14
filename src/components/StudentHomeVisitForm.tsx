import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Home, User, GraduationCap, Phone, Hash } from "lucide-react";
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
import { useState } from "react";
import React from "react";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  registerNumber: z.string().min(5, "Please enter a valid register number"),
  department: z.string().min(1, "Please select a department"),
  year: z.string().min(1, "Please select a year"),
  dateOfHomeVisit: z.date({
    required_error: "Please select date of home visit",
  }),
  mobileNumber: z.string().min(10, "Please enter a valid 10-digit phone number").max(10, "Phone number should be 10 digits"),
  reasonForHomeVisit: z.string().min(10, "Reason must be at least 10 characters"),
  expectedArrivalDate: z.date({
    required_error: "Please select expected arrival date",
  }),
  numberOfDaysLeave: z.string().min(1, "Please enter number of days"),
  noOfWorkingDays: z.string().min(1, "Please enter number of working days"),
});

type FormData = z.infer<typeof formSchema>;

interface StudentHomeVisitFormProps {
  onSubmit: (data: FormData) => void;
}

const StudentHomeVisitForm = ({ onSubmit }: StudentHomeVisitFormProps) => {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<string>("");
  const [canSubmit, setCanSubmit] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      registerNumber: "",
      department: "",
      year: "",
      mobileNumber: "",
      reasonForHomeVisit: "",
      numberOfDaysLeave: "",
      noOfWorkingDays: "",
    },
  });

  // Watch for changes to working days and leave days
  const noOfWorkingDays = form.watch("noOfWorkingDays");
  const numberOfDaysLeave = form.watch("numberOfDaysLeave");
  React.useEffect(() => {
    const working = parseFloat(noOfWorkingDays);
    const leave = parseFloat(numberOfDaysLeave);
    if (!isNaN(working) && !isNaN(leave) && working > 0 && leave >= 0 && leave <= working) {
      const percent = ((working - leave) / working) * 100;
      setAttendance(percent.toFixed(2) + "%");
      setCanSubmit(percent >= 75);
    } else {
      setAttendance("");
      setCanSubmit(true);
    }
  }, [noOfWorkingDays, numberOfDaysLeave]);

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

  const handleSubmit = async (data: FormData) => {
    try {
      console.log("Home Visit Request Data:", data);
      onSubmit(data);
      
      toast({
        title: "Home Visit Request Submitted!",
        description: "Your home visit request has been submitted to the HOD for initial approval.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit home visit request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full border-college-red/20">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Home Visit Request Form
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Submit a request for visiting home (requires HOD and Warden approval)
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
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Register Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your register number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="dateOfHomeVisit"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Date of Home Visit
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
                            <span>Pick date of home visit</span>
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
                        disabled={(date) => date < new Date()}
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
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Mobile Number
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

            <FormField
              control={form.control}
              name="reasonForHomeVisit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Home Visit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed reason for your home visit (family event, emergency, etc.)..."
                      className="min-h-[120px]"
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
                name="expectedArrivalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Arrival Date</FormLabel>
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
                              <span>Pick return date</span>
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
                          disabled={(date) => date < new Date()}
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
                name="numberOfDaysLeave"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Days Leave so far</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter number of days" 
                        type="number"
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noOfWorkingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No of Working Days</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter no of working days" 
                        type="number"
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {attendance && (
              <div className="mt-2 text-sm font-medium text-blue-700">
                Attendance Percentage: {attendance}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Approval Process:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. HOD will review your request and attendance record</li>
                <li>2. If approved by HOD, request will be forwarded to Warden</li>
                <li>3. Warden will give final approval</li>
                <li>4. SMS notification will be sent to your parents upon final approval</li>
              </ol>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!canSubmit}
            >
              Submit Home Visit Request
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StudentHomeVisitForm;