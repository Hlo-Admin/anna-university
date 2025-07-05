
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "./PhoneInput";

interface CreateReviewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewerCreated: () => void;
}

export const CreateReviewerDialog: React.FC<CreateReviewerDialogProps> = ({
  isOpen,
  onClose,
  onReviewerCreated
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: ""
  });
  const [selectedCountry, setSelectedCountry] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('reviewers')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: `${selectedCountry}${formData.phone}`,
          username: formData.username,
          password: formData.password
        }]);

      if (error) throw error;

      toast({
        title: "Reviewer Created",
        description: `Account created for ${formData.name}`,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        username: "",
        password: ""
      });
      setSelectedCountry("+91");
      onReviewerCreated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create reviewer",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Reviewer Account</DialogTitle>
          <DialogDescription>
            Add a new reviewer to the system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <PhoneInput
            label="Phone Number"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            onCountryChange={setSelectedCountry}
            selectedCountry={selectedCountry}
            required
          />

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
