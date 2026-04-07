import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@shared/schema-types";

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Template;
}

const TEMPLATE_TYPES = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "page", label: "Page" },
  { value: "post", label: "Post" },
  { value: "popup", label: "Popup" },
];

/**
 * Modal for creating or editing templates.
 * When initialData is provided, switches to edit mode.
 * Uses key-based reset via formKey to sync state when initialData changes.
 */
export function TemplateModal({ open, onOpenChange, initialData }: TemplateModalProps) {
  // Key-based reset: derive a stable key from initialData to reset form state
  const formKey = initialData?.id ?? "__create__";
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [prevKey, setPrevKey] = useState(formKey);

  // Sync form state when switching between templates (derived state pattern)
  if (prevKey !== formKey) {
    setPrevKey(formKey);
    setName(initialData?.name || "");
    setType(initialData?.type || "");
    setDescription(initialData?.description || "");
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description?: string }) => {
      if (isEdit && initialData) {
        return await apiRequest('PUT', `/api/templates/${initialData.id}`, data);
      }
      return await apiRequest('POST', '/api/templates', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEdit ? "Template updated successfully" : "Template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: isEdit ? "Failed to update template" : "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (!type) {
      toast({
        title: "Validation Error",
        description: "Template type is required",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
    });
  };

  const handleClose = () => {
    setName(initialData?.name || "");
    setType(initialData?.type || "");
    setDescription(initialData?.description || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {isEdit 
                ? "Update the template details below." 
                : "Enter the details for your new template."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Template name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-wp-blue hover:bg-wp-blue-dark text-white"
            >
              {mutation.isPending 
                ? (isEdit ? "Saving..." : "Creating...") 
                : (isEdit ? "Save Changes" : "Create Template")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
