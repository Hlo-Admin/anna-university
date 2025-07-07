
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

interface AssignReviewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paperTitle: string;
  reviewerName: string;
  isLoading?: boolean;
}

export const AssignReviewerDialog: React.FC<AssignReviewerDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  paperTitle,
  reviewerName,
  isLoading = false
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Reviewer Assignment</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to assign this paper to the selected reviewer?</p>
            <div className="bg-gray-50 p-3 rounded-lg mt-3">
              <p className="font-medium text-gray-900">Paper: {paperTitle}</p>
              <p className="text-gray-600">Reviewer: {reviewerName}</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              An email notification will be sent to the reviewer.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Assigning..." : "Confirm Assignment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
