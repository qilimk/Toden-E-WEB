// app/home/page.tsx
"use client";

// Import statements
import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom Components
import FunctionTabs from "@/components/FunctionTabs";
import Navbar from '@/components/Navbar';
import DynamicGraph from "@/components/DynamicGraph";
import AppSidebar from "@/components/AppSidebar";
import MatrixVisualization from "@/components/MatrixVisualization";

import { Edge } from "@/types/edge";

// Function for Home Page.
// 3 Main Components: Dynamic Graph, Function Tabs, Node Combobox

export default function HomePage() {
  const [clustersData, setClustersData] = useState<{ clusters: string[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedFunction, setSelectedFunction] = useState<string>("toden-e");
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [view, setView] = useState<string>("graph");

  async function handleFileSelect(file: string) {
    const formData = new FormData();
    setSelectedFile(file);

    formData.append('file', file);

    try {
      const response = await fetch('/api/create-m-type-data', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setSelectedNode(result.selectedNode);
      setClustersData({ clusters: result.allowedNodes });
      setView("graph");
    } catch (error) {
      console.error('Error submitting visualize form:', error);
    }
  };

  const nodesArray = useMemo(() => {
    if (!clustersData) return [];
    if (!clustersData?.clusters) return [];
    const nodesSet = new Set<string>();
    clustersData.clusters.forEach((cluster: string) => {
      cluster.split(",").forEach((n) => {
        const trimmed = n.trim();
        if (trimmed) nodesSet.add(trimmed);
      });
    });
    return Array.from(nodesSet).map((node) => ({ value: node, label: node }));
  }, [clustersData]);

  useEffect(() => {
    if (nodesArray.length > 0 && !selectedNode) {
      setSelectedNode(nodesArray[0].value);
    }
  }, [nodesArray, selectedNode]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-row h-full w-full relative">
        {view === "tabs" ? (
          <>
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              onClick={() => setView("graph")}
            >
              <X />
            </Button>
            <FunctionTabs
              setClustersData={setClustersData} 
              setSelectedNode={setSelectedNode}
              setSelectedFile={setSelectedFile}
              setView={setView}
            />
          </>
        ) : view == "graph" ? (
          <>
            {sidebarOpen && <AppSidebar 
                              nodes={nodesArray} 
                              setSelectedNode={setSelectedNode} 
                              selectedFunction={selectedFunction}
                              setSelectedFunction={setSelectedFunction}
                              setSelectedFile={setSelectedFile}
                              selectedFile={selectedFile}
                              onFileSelect={handleFileSelect}
                              selectedNode={selectedNode}
                              setView={setView}
                              view={view}
                              selectedEdge={selectedEdge}
                              setSelectedEdge={setSelectedEdge}
                            />
            }
            <DynamicGraph 
              clustersData={clustersData} 
              selectedNode={selectedNode} 
              selectedFile={selectedFile} 
              setSidebarOpen={setSidebarOpen}
              setView={setView}
              selectedFunction={selectedFunction}
              setSelectedNode={setSelectedNode}
              // setSelectedEdge={setSelectedEdge}
            />
          </>
        ) : view === "matrix" ? (
          <>
            {sidebarOpen && <AppSidebar 
                              nodes={nodesArray} 
                              setSelectedNode={setSelectedNode} 
                              selectedFunction={selectedFunction}
                              setSelectedFunction={setSelectedFunction}
                              setSelectedFile={setSelectedFile}
                              selectedFile={selectedFile}
                              onFileSelect={handleFileSelect}
                              selectedNode={selectedNode}
                              setView={setView}
                              view={view}
                              selectedEdge={selectedEdge}
                              setSelectedEdge={setSelectedEdge}
                            />
            }
            <MatrixVisualization 
              setSidebarOpen={setSidebarOpen}
              setView={setView}
            />
          </>
        ) : (null)}
      </div>
    </div>
  );
}
