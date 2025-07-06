
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  newStatus: string;
  paperTitle: string;
}

export const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  paperTitle
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "text-blue-600";
      case "selected": return "text-green-600";
      case "rejected": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Are you sure you want to update the status of this paper?</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Paper: {paperTitle}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Status change:</span>
                  <span className={`font-medium ${getStatusColor(currentStatus)}`}>
                    {currentStatus.toUpperCase()}
                  </span>
                  <span>→</span>
                  <span className={`font-medium ${getStatusColor(newStatus)}`}>
                    {newStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Update Status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
