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
import SummaryDrawer from "@/components/SummaryDrawer";

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
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

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
        {view === "tabs" ? (
          <div className="flex flex-row h-full w-full relative">
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
          </div>
        ) : view == "graph" ? (
          <div className="flex flex-1 flex-row overflow-hidden">
            {sidebarOpen && 
                <AppSidebar 
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
                  hoveredEdge={hoveredEdge}
                  setHoveredEdge={setHoveredEdge}
                />
            }
            <div className="flex flex-1 flex-col">
              <DynamicGraph 
                clustersData={clustersData} 
                selectedNode={selectedNode} 
                selectedFile={selectedFile} 
                setSidebarOpen={setSidebarOpen}
                setView={setView}
                selectedFunction={selectedFunction}
                setSelectedNode={setSelectedNode}
                setSelectedEdge={setSelectedEdge}
                selectedEdge={selectedEdge}
                hoveredEdge={hoveredEdge}
                setHoveredEdge={setHoveredEdge}
                setDrawerOpen={setDrawerOpen}
                drawerOpen={drawerOpen}
              />
              { drawerOpen &&
                <SummaryDrawer 
                  setDrawerOpen={setDrawerOpen}
                  selectedFunction={selectedFunction} 
                />
              }
            </div>  
          </div>
        ) : view === "matrix" ? (
          <div className="flex flex-row h-full">
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
                              hoveredEdge={hoveredEdge}
                              setHoveredEdge={setHoveredEdge}
                            />
            }
            <MatrixVisualization 
              setSidebarOpen={setSidebarOpen}
              setView={setView}
            />
          </div>
        ) : (null)}
    </div>
  );
}
