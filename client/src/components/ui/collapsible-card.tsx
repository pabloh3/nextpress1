import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const CollapsibleCard = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  className = ""
}: { 
  title: string; 
  icon?: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={`border-gray-200 rounded-none ${className}`}>
      <CardHeader 
        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-600" />}
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="p-4 space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
};