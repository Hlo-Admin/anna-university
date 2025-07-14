
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { FormSubmission } from "@/types/submission";

interface SubmissionSearchFilterProps {
  submissions: FormSubmission[];
  onFilteredResults: (filtered: FormSubmission[]) => void;
  className?: string;
}

export const SubmissionSearchFilter: React.FC<SubmissionSearchFilterProps> = ({
  submissions,
  onFilteredResults,
  className
}) => {
  const [filters, setFilters] = useState({
    name: "",
    submissionId: "",
    phone: "",
    email: ""
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (currentFilters: typeof filters) => {
    let filtered = submissions;

    if (currentFilters.name.trim()) {
      filtered = filtered.filter(submission =>
        submission.author_name.toLowerCase().includes(currentFilters.name.toLowerCase()) ||
        submission.co_author_name.toLowerCase().includes(currentFilters.name.toLowerCase())
      );
    }

    if (currentFilters.submissionId.trim()) {
      filtered = filtered.filter(submission =>
        submission.submission_id?.toLowerCase().includes(currentFilters.submissionId.toLowerCase())
      );
    }

    if (currentFilters.phone.trim()) {
      filtered = filtered.filter(submission =>
        submission.phone_number.includes(currentFilters.phone) ||
        (submission.whatsapp_number && submission.whatsapp_number.includes(currentFilters.phone))
      );
    }

    if (currentFilters.email.trim()) {
      filtered = filtered.filter(submission =>
        submission.email.toLowerCase().includes(currentFilters.email.toLowerCase())
      );
    }

    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    const emptyFilters = { name: "", submissionId: "", phone: "", email: "" };
    setFilters(emptyFilters);
    onFilteredResults(submissions);
  };

  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== "");

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filter
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden"
            >
              {isExpanded ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-4 ${!isExpanded ? "hidden lg:block" : ""}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name-filter">Author Name</Label>
            <Input
              id="name-filter"
              placeholder="Search by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submission-id-filter">Submission ID</Label>
            <Input
              id="submission-id-filter"
              placeholder="Search by ID..."
              value={filters.submissionId}
              onChange={(e) => handleFilterChange("submissionId", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone-filter">Phone Number</Label>
            <Input
              id="phone-filter"
              placeholder="Search by phone..."
              value={filters.phone}
              onChange={(e) => handleFilterChange("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-filter">Email</Label>
            <Input
              id="email-filter"
              placeholder="Search by email..."
              value={filters.email}
              onChange={(e) => handleFilterChange("email", e.target.value)}
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="text-sm text-gray-600">
            Showing {onFilteredResults.length} of {submissions.length} submissions
          </div>
        )}
      </CardContent>
    </Card>
  );
};
