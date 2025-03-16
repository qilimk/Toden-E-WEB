"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { NodeCombobox } from "@/components/NodeCombobox";

interface AppSidebarProps {
  nodes: { value: string; label: string }[];
  setSelectedNode: (node: string) => void;
  selectedFunction: string;
  setSelectedFunction: (fn: string) => void;
}

export default function AppSidebar({ nodes, setSelectedNode, selectedFunction, setSelectedFunction }: AppSidebarProps) {
  return (
    <div className="flex flex-row h-full">
      <div className="px-2 py-2">
        <Tabs defaultValue="graphing">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="graphing">Graphing</TabsTrigger>
            <TabsTrigger value="embedding">Matrix</TabsTrigger>
          </TabsList>
          <TabsContent value="graphing" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Clustering</CardTitle>
                <CardDescription>
                  Choose the clustering function.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row items-center space-x-2">
                  <Label>Choose Function</Label>
                  <Select onValueChange={setSelectedFunction} value={selectedFunction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Functions</SelectLabel>
                        <SelectItem value="toden-e">Toden-E</SelectItem>
                        <SelectItem value="CoCo">CoCo</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            {selectedFunction === "toden-e" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Toden-E Clustering</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row">
                    {/* Insert your Toden-E specific clustering content here */}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>CoCo Clustering</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row items-center space-x-2">
                    <Label>Choose Node</Label>
                    <NodeCombobox nodes={nodes} onSelect={setSelectedNode} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Separator orientation="vertical" />
    </div>
  );
}
