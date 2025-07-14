
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface SubmissionTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SubmissionTypeFilter: React.FC<SubmissionTypeFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Submissions</SelectItem>
          <SelectItem value="extended-abstract">Extended Abstract</SelectItem>
          <SelectItem value="fullpaper">Full Paper</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
