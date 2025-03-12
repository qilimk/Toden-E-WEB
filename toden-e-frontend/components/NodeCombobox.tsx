"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Node {
  value: string;
  label: string;
}

interface NodeComboboxProps {
  nodes: Node[];
  onSelect?: (value: string) => void;
}

export const NodeCombobox: React.FC<NodeComboboxProps> = ({ nodes, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(() => (nodes.length > 0 ? nodes[0].value : ""));

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue;
    setValue(newValue);
    setOpen(false);
    if (onSelect) onSelect(newValue);
  };

  // Workaround: cast command components to any so that they accept children
  const CommandAny = Command as any;
  const CommandInputAny = CommandInput as any;
  const CommandListAny = CommandList as any;
  const CommandEmptyAny = CommandEmpty as any;
  const CommandGroupAny = CommandGroup as any;
  const CommandItemAny = CommandItem as any;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? nodes.find((node) => node.value === value)?.label : "Select node..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <CommandAny>
          <CommandInputAny placeholder="Search node..." className="h-9" />
          <CommandListAny>
            <CommandEmptyAny>No node found.</CommandEmptyAny>
            <CommandGroupAny>
              {nodes.map((node) => (
                <CommandItemAny
                  key={node.value}
                  value={node.value}
                  onSelect={handleSelect}
                >
                  {node.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === node.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItemAny>
              ))}
            </CommandGroupAny>
          </CommandListAny>
        </CommandAny>
      </PopoverContent>
    </Popover>
  );
};
