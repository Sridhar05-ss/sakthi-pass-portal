import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, X, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMode } from "@/contexts/ModeContext";

export type ApprovalStatus = "pending" | "hod_approved" | "warden_approved" | "rejected";

interface ApprovalWorkflowProps {
  passType: "outing" | "home_visit";
  currentStatus: ApprovalStatus;
  onStatusChange: (status: ApprovalStatus) => void;
  studentName: string;
  parentNumber?: string;
}

const ApprovalWorkflow = ({ 
  passType, 
  currentStatus, 
  onStatusChange, 
  studentName,
  parentNumber 
}: ApprovalWorkflowProps) => {
  const { mode } = useMode();
  const { toast } = useToast();
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  const sendSMSToParent = async (message: string) => {
    if (!parentNumber) {
      toast({
        title: "No Parent Number",
        description: "Parent contact number not provided",
        variant: "destructive",
      });
      return;
    }

    setIsSendingSMS(true);
    try {
      // Simulate SMS sending (will be replaced with actual SMS service)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "SMS Sent",
        description: `Message sent to parent (${parentNumber})`,
      });
      
      console.log("SMS sent to:", parentNumber, "Message:", message);
    } catch (error) {
      toast({
        title: "SMS Failed",
        description: "Failed to send SMS to parent",
        variant: "destructive",
      });
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleApproval = async (newStatus: ApprovalStatus) => {
    onStatusChange(newStatus);
    
    if (newStatus === "warden_approved") {
      const passTypeLabel = passType === "outing" ? "outing" : "home visit";
      const message = `Your son/daughter ${studentName} has been approved for ${passTypeLabel}. Approved by college authorities.`;
      await sendSMSToParent(message);
    }
    
    toast({
      title: "Status Updated",
      description: `Pass ${newStatus === "rejected" ? "rejected" : "approved"}`,
      variant: newStatus === "rejected" ? "destructive" : "default",
    });
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "hod_approved": return "bg-secondary text-secondary-foreground";
      case "warden_approved": return "bg-success text-success-foreground";
      case "rejected": return "bg-destructive text-destructive-foreground";
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "hod_approved": case "warden_approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
    }
  };

  const canApprove = () => {
    if (passType === "outing") {
      return mode === "warden" && currentStatus === "pending";
    } else {
      return (mode === "hod" && currentStatus === "pending") || 
             (mode === "warden" && currentStatus === "hod_approved");
    }
  };

  const getNextAction = () => {
    if (passType === "outing" && mode === "warden" && currentStatus === "pending") {
      return "warden_approved";
    } else if (passType === "home_visit") {
      if (mode === "hod" && currentStatus === "pending") {
        return "hod_approved";
      } else if (mode === "warden" && currentStatus === "hod_approved") {
        return "warden_approved";
      }
    }
    return null;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Approval Status
          <Badge className={getStatusColor(currentStatus)}>
            {getStatusIcon(currentStatus)}
            {currentStatus.replace("_", " ").toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {passType === "home_visit" && (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ["hod_approved", "warden_approved"].includes(currentStatus) 
                  ? "bg-success text-success-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">HOD Approval</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStatus === "warden_approved" 
                ? "bg-success text-success-foreground" 
                : "bg-muted text-muted-foreground"
            }`}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Warden Approval</span>
          </div>

          {canApprove() && (
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => handleApproval(getNextAction()!)}
                className="flex-1"
              >
                Approve
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleApproval("rejected")}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          )}

          {currentStatus === "warden_approved" && parentNumber && (
            <Button
              variant="outline"
              onClick={() => {
                const passTypeLabel = passType === "outing" ? "outing" : "home visit";
                const message = `Your son/daughter ${studentName} has been approved for ${passTypeLabel}. Approved by college authorities.`;
                sendSMSToParent(message);
              }}
              disabled={isSendingSMS}
              className="w-full mt-2"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isSendingSMS ? "Sending SMS..." : "Send SMS to Parent"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalWorkflow;