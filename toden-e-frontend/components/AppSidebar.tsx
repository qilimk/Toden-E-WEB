"use client";

import { useState, useEffect } from "react";
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
  CardFooter
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
import { ScrollArea } from "@/components/ui/scroll-area";

import { Edge } from "@/types/edge";
import { Scroll } from "lucide-react";

interface AppSidebarProps {
  nodes: { value: string; label: string }[];
  setSelectedNode: (node: string) => void;
  selectedFunction: string;
  setSelectedFunction: (fn: string) => void;
  setSelectedFile: (file: string) => void;
  selectedFile: string;
  onFileSelect: (file: string) => void;
  selectedNode: string;
  setView: (view: string) => void;
  view: string;
  selectedEdge: Edge | null;
  setSelectedEdge: (edge: Edge) => void;
  hoveredEdge: string | null;
  setHoveredEdge: (edge: string | null) => void;
  setHoveredNode: (node: string | null) => void;
  selectedMatrix: string;
  setSelectedMatrix: (matrix: string) => void;
  todenEClusters: { clusters: string[][]; sortedNodes: string[] } | null;
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
    setView,
    view,
    selectedEdge,
    setSelectedEdge,
    hoveredEdge,
    setHoveredEdge,
    setHoveredNode,
    selectedMatrix,
    setSelectedMatrix,
    todenEClusters,
  }: AppSidebarProps) {

  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (selectedNode && selectedFile) {
      fetch("/api/get-edge-information", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedNode, selectedFile }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Ensure data.edges is an array; if similarity is not a number already, convert it here.
          const fetchedEdges = data.edges?.map((edge: any) => ({
            ...edge,
            similarity: Number(edge.similarity),
          }));
          setEdges(fetchedEdges || []);
        })
        .catch((err) => {
          console.error("Error fetching edge data: ", err);
          setEdges([]);
        });
    }
  }, [selectedNode, selectedFile]);

  return (
    <div className="flex flex-row">
      <ScrollArea className="px-2 pt-2">
        <Tabs defaultValue={view} onValueChange={setView} className="px-2 py-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="graph">Graphing</TabsTrigger>
            <TabsTrigger value="matrix">Matrix</TabsTrigger>
          </TabsList>
          <TabsContent value="graph" className="space-y-2">
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
                            <SelectItem value="Leukemia_2_0.25">Leukemia (2 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_2_0.5">Leukemia (2 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_3_0.25">Leukemia (3 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_3_0.5">Leukemia (3 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_4_0.25">Leukemia (4 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_4_0.5">Leukemia (4 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_5_0.25">Leukemia (5 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_5_0.5">Leukemia (5 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="text-muted-foreground sm:text-sm">
                *CoCo clustering is same for all files.
              </CardFooter>
            </Card>
            {selectedFunction === "toden-e" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Toden-E Clustering</CardTitle>
                </CardHeader>
                <CardContent>
                {selectedFunction === "toden-e" && todenEClusters && todenEClusters.clusters.length > 0 && (
                  <div className="space-y-4">
                    {todenEClusters.clusters.map((cluster, clusterIndex) => (
                      <Table key={clusterIndex} className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cluster {clusterIndex + 1}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cluster.map((node, nodeIndex) => (
                            <TableRow 
                              key={nodeIndex} 
                              className="cursor-pointer hover:bg-muted" 
                              // onClick={() => setSelectedNode(node)}
                              onMouseEnter={() => setHoveredNode(node)}
                              onMouseLeave={() => setHoveredNode(null)}
                            >
                              <TableCell>{node}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ))}
                  </div>
                )}
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
                      <EdgeCombobox
                        edges={edges}
                        onSelect={setSelectedEdge}
                        selectedEdge={selectedEdge}
                      />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Selected Edge Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  {selectedEdge ? (
                    <div className="grid grid-cols-3 gap-2">
                      <p className="col-span-1">From:</p>  
                      <div className="col-span-2">{selectedNode}</div>
                      <p className="col-span-1">To:</p>
                      <div className="col-span-2">{selectedEdge.to}</div>
                      <p className="col-span-1">Similarity:</p>
                      <div className="col-span-2">{selectedEdge.similarity.toFixed(4)}</div>
                    </div>
                  ) : (
                    <p>No edge selected</p>
                  )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedNode} Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <ScrollArea className="h-64">
                  <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Node</TableHead>
                          <TableHead>Similarity</TableHead>
                        </TableRow>
                      </TableHeader>
                        {edges && edges.length > 0 ? (
                          edges.map((edge, index) => (
                            <TableBody>
                            <TableRow 
                              key={index}
                              onClick={() => setSelectedEdge(edge)}
                              onMouseEnter={() => setHoveredEdge(edge.to)}
                              onMouseLeave={() => setHoveredEdge(null)}
                              className="cursor-pointer hover:bg-muted"
                            >
                              <TableCell>{edge.to}</TableCell>
                              <TableCell>
                                {edge.similarity.toFixed(4)}
                              </TableCell>
                            </TableRow>
                            </TableBody>
                          ))
                        ) : (
                          <TableCaption>No edges found.</TableCaption>
                        )}
                    </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              null
            )}
          </TabsContent>
          <TabsContent value="matrix" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Matrix Selection
                </CardTitle>
                <CardDescription>
                  Choose what matrix you want for your dataset.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
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
                          <SelectItem value="Leukemia_2_0.25">Leukemia (2 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_2_0.5">Leukemia (2 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_3_0.25">Leukemia (3 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_3_0.5">Leukemia (3 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_4_0.25">Leukemia (4 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_4_0.5">Leukemia (4 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_5_0.25">Leukemia (5 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_5_0.5">Leukemia (5 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Label className="col-span-1">Select Matrix</Label>
                  <div className="col-span-2">
                    <Select onValueChange={(value) => {
                            setSelectedMatrix(value);
                            }}
                            value={selectedMatrix}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a matrix..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Matrices</SelectLabel>
                          <SelectItem value="adj">Adj Matrix</SelectItem>
                          <SelectItem value="con">Con Matrix</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Matrix Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="col-span-1">Dimensions</Label>
                  <p className="col-span-2">Put Dimensions here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </ScrollArea>
      <Separator orientation="vertical" />
    </div>
  );
}
