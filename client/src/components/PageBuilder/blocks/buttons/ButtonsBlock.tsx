import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MousePointer } from "lucide-react";

interface ButtonItem {
  id: string;
  text: string;
  url: string;
  linkTarget?: "_self" | "_blank";
  rel?: string;
  title?: string;
  className?: string;
}

function ButtonsRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const buttons: ButtonItem[] = Array.isArray((block.content as any)?.buttons)
    ? (block.content as any).buttons
    : [];

  const layout = (block.content as any)?.layout || 'flex-start';
  const orientation = (block.content as any)?.orientation || 'horizontal';
  const className = [
    "wp-block-buttons",
    orientation === 'vertical' ? 'is-vertical' : '',
    layout === 'center' ? 'is-content-justification-center' : '',
    layout === 'right' ? 'is-content-justification-right' : '',
    layout === 'space-between' ? 'is-content-justification-space-between' : '',
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={className}
      style={{
        ...block.styles,
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        justifyContent: layout,
        gap: '0.5em',
        alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
        flexWrap: 'wrap',
      }}
    >
      {buttons.map((button, index) => {
        const buttonClassName = [
          "wp-block-button",
          button.className || "",
        ].filter(Boolean).join(" ");

        return (
          <div key={button.id || index} className={buttonClassName}>
            <a
              className="wp-block-button__link"
              href={button.url}
              target={button.linkTarget}
              rel={button.rel}
              title={button.title}
              style={{
                backgroundColor: '#007cba',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {button.text}
            </a>
          </div>
        );
      })}
    </div>
  );
}

function ButtonsSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const buttons: ButtonItem[] = Array.isArray((block.content as any)?.buttons)
    ? (block.content as any).buttons
    : [];

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  const updateButtons = (newButtons: ButtonItem[]) => {
    updateContent({ buttons: newButtons });
  };

  const addButton = () => {
    const newButton: ButtonItem = {
      id: `btn-${Date.now()}`,
      text: 'Button',
      url: '#',
      linkTarget: '_self',
      rel: '',
      title: '',
      className: '',
    };
    updateButtons([...buttons, newButton]);
  };

  const removeButton = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    updateButtons(newButtons);
  };

  const updateButton = (index: number, updates: Partial<ButtonItem>) => {
    const newButtons = buttons.map((btn, i) => i === index ? { ...btn, ...updates } : btn);
    updateButtons(newButtons);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Buttons</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addButton}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Button
        </Button>
      </div>
      
      {buttons.map((button, index) => (
        <div key={button.id || index} className="border rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="font-medium">Button {index + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeButton(index)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div>
            <Label htmlFor={`btn-text-${index}`}>Button Text</Label>
            <Input
              id={`btn-text-${index}`}
              value={button.text}
              onChange={(e) => updateButton(index, { text: e.target.value })}
              placeholder="Button text"
            />
          </div>
          
          <div>
            <Label htmlFor={`btn-url-${index}`}>URL</Label>
            <Input
              id={`btn-url-${index}`}
              value={button.url}
              onChange={(e) => updateButton(index, { url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          
          <div>
            <Label htmlFor={`btn-target-${index}`}>Link Target</Label>
            <Select
              value={button.linkTarget || '_self'}
              onValueChange={(value: "_self" | "_blank") => updateButton(index, { linkTarget: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same Window</SelectItem>
                <SelectItem value="_blank">New Window</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <div>
        <Label htmlFor="buttons-layout">Layout</Label>
        <Select
          value={(block.content as any)?.layout || 'flex-start'}
          onValueChange={(value) => updateContent({ layout: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flex-start">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="flex-end">Right</SelectItem>
            <SelectItem value="space-between">Space Between</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="buttons-orientation">Orientation</Label>
        <Select
          value={(block.content as any)?.orientation || 'horizontal'}
          onValueChange={(value) => updateContent({ orientation: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="buttons-class">Additional CSS Class(es)</Label>
        <Input
          id="buttons-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-style-outline"
        />
      </div>
    </div>
  );
}

const ButtonsBlock: BlockDefinition = {
  id: 'core/buttons',
  name: 'Buttons',
  icon: MousePointer,
  description: 'Prompt visitors to take action with a group of button-style links',
  category: 'basic',
  defaultContent: {
    buttons: [
      {
        id: 'btn-1',
        text: 'Click Me',
        url: '#',
        linkTarget: '_self',
        rel: '',
        title: '',
        className: '',
      }
    ],
    layout: 'flex-start',
    orientation: 'horizontal',
    className: '',
  },
  defaultStyles: {},
  renderer: ButtonsRenderer,
  settings: ButtonsSettings,
};

export default ButtonsBlock;