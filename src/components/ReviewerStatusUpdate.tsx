
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface ReviewerStatusUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  currentStatus: string;
  newStatus: string;
  paperTitle: string;
  submissionId: string;
}

export const ReviewerStatusUpdate: React.FC<ReviewerStatusUpdateProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  paperTitle,
  submissionId
}) => {
  const [remarks, setRemarks] = useState("");

  const handleConfirm = () => {
    onConfirm(remarks);
    setRemarks("");
  };

  const getStatusIcon = () => {
    switch (newStatus) {
      case "selected":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (newStatus) {
      case "selected":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <DialogTitle>Update Submission Status</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Submission ID:</p>
            <p className="font-mono text-sm font-medium">{submissionId}</p>
            
            <p className="text-sm text-gray-600 mb-1 mt-3">Paper Title:</p>
            <p className="font-medium text-sm">{paperTitle}</p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-700">
              Change status from{" "}
              <span className="font-medium capitalize">{currentStatus}</span> to{" "}
              <span className={`font-medium capitalize ${getStatusColor()}`}>
                {newStatus}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">
              Remarks {newStatus === "rejected" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="remarks"
              placeholder="Add your comments about this decision..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              required={newStatus === "rejected"}
            />
            {newStatus === "rejected" && (
              <p className="text-xs text-gray-500">
                Please provide a reason for rejection to help the author improve their submission.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={newStatus === "rejected" && !remarks.trim()}
              className={
                newStatus === "selected"
                  ? "bg-green-600 hover:bg-green-700"
                  : newStatus === "rejected"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Confirm {newStatus === "selected" ? "Selection" : newStatus === "rejected" ? "Rejection" : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
