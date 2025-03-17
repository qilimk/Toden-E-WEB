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

interface Edge {
  from: string;
  to: string;
  similarity: string;
  x: number;
  y: number;
}

interface EdgeComboboxProps {
  edges: Edge[];
  onSelect?: (edge: Edge) => void;
  selectedEdge: Edge | null;
}

export const EdgeCombobox: React.FC<EdgeComboboxProps> = ({ edges, onSelect, selectedEdge }) => {
  const [open, setOpen] = React.useState(false);

  // Called when a user selects an edge from the combobox
  const handleSelect = (selectedEdgeValue: string) => {
    // Look up the edge by a unique property – here we use the "to" field (assuming it’s unique)
    const edge = edges.find((edge) => edge.to === selectedEdgeValue);
    setOpen(false);
    if (edge && onSelect) {
      onSelect(edge);
    }
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
        <Button variant="outline" role="combobox" aria-expanded={open}>
          {selectedEdge
            ? `${selectedEdge.to} ${parseFloat(selectedEdge.similarity).toFixed(3)}`
            : "Select edge..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <CommandAny>
          <CommandInputAny className="h-9" placeholder="Search edges..." />
          <CommandListAny>
            <CommandEmptyAny>No edge found.</CommandEmptyAny>
            <CommandGroupAny>
              {edges.map((edge) => (
                <CommandItemAny
                  key={edge.to} // assume "to" is unique per edge
                  value={edge.to}
                  onSelect={handleSelect}
                >
                  {`To: ${edge.to} (Sim: ${edge.similarity})`}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedEdge?.to === edge.to ? "opacity-100" : "opacity-0"
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
