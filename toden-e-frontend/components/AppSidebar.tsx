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
import { EdgeCombobox } from "@/components/EdgeCombobox";

interface Edge {
  from: string;
  to: string;
  similarity: string;
  x: number;
  y: number;
}

interface AppSidebarProps {
  nodes: { value: string; label: string }[];
  setSelectedNode: (node: string) => void;
  selectedFunction: string;
  setSelectedFunction: (fn: string) => void;
  setSelectedFile: (file: string) => void;
  selectedFile: string;
  onFileSelect: (file: string) => void;
  selectedNode: string;
  // selectedEdge: Edge | null;
  // setSelectedEdge: (edge: Edge) => void;
  // edgesForSelectedNode: Edge[];
}

export default function AppSidebar({ 
    nodes, 
    setSelectedNode, 
    selectedFunction, 
    setSelectedFunction, 
    setSelectedFile, 
    selectedFile, 
    onFileSelect,
    selectedNode,
    // selectedEdge,
    // setSelectedEdge,
    // edgesForSelectedNode
  }: AppSidebarProps) {

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
                <div className="grid grid-cols-3 gap-2">
                    <Label className="col-span-1">Choose Function</Label>
                    <div className="col-span-2">
                      <Select onValueChange={setSelectedFunction} value={selectedFunction}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup >
                            <SelectLabel>Functions</SelectLabel>
                            <SelectItem value="toden-e">Toden-E</SelectItem>
                            <SelectItem value="CoCo">CoCo</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  <Label className="col-span-1">Choose File</Label>
                    <div className="col-span-2">
                      <Select onValueChange={(value) => {
                              setSelectedFile(value);
                              onFileSelect(value);
                              }}
                              value={selectedFile}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a file..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Files</SelectLabel>
                            <SelectItem value="Leukemia">Leukemia Dataset</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
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
            ) : selectedFunction === "CoCo" ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>CoCo Clustering</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <Label className="col-span-1">Choose Node</Label>
                      <div className="col-span-2">
                        <NodeCombobox 
                          nodes={nodes} 
                          onSelect={setSelectedNode} 
                          selectedNode={selectedNode}
                        />
                      </div>
                      <Label className="col-span-1">Choose Edge</Label>
                      <div className="col-span-2">
                      {/* <EdgeCombobox
                        edges={edgesForSelectedNode}
                        onSelect={setSelectedEdge}
                        selectedEdge={selectedEdge}
                      /> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Selected Node Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedNode}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Selected Edge Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* <div className="grid grid-cols-3 gap-2">
                      <p className="col-span-1">
                        From:
                      </p>  
                      <div className="col-span-2">
                        {selectedNode}
                      </div>
                      <p className="col-span-1">
                        To:
                      </p>
                      <div className="col-span-2">
                        {selectedEdge.to}
                      </div>
                      <p className="col-span-1">
                        Similarity:
                      </p>
                      <div className="col-span-2">
                        {parseFloat(selectedEdge.similarity).toFixed(4)}
                      </div>
                    </div> */}
                  </CardContent>
                </Card>
              </>
            ) : (
              null
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Separator orientation="vertical" />
    </div>
  );
}
