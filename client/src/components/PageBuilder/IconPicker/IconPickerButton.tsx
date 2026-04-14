import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { IconReference } from '@/lib/icon-indexes';
import { IconPickerDialog } from './IconPickerDialog';

interface IconPickerButtonProps {
  currentIcon?: IconReference;
  onSelect: (icon: IconReference) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function IconPickerButton({
  currentIcon,
  onSelect,
  variant = 'outline',
  size = 'sm',
}: IconPickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="gap-1"
      >
        <Pencil className="w-3 h-3" />
        Change
      </Button>
      <IconPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={onSelect}
        currentIcon={currentIcon}
      />
    </>
  );
}
