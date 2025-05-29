// app/home/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

import FunctionTabs from "@/components/FunctionTabs";
import Navbar from '@/components/Navbar';
import DynamicGraph from "@/components/DynamicGraph";
import AppSidebar from "@/components/AppSidebar";
import MatrixVisualization from "@/components/MatrixVisualization";

import { Edge } from "@/types/edge";
import SummaryDrawer from "@/components/SummaryDrawer";

export default function HomePage() {
  // Reconfiguration Notes:
  // Navbar is good.
  // About page is good.

  // Whole tool:
  // Enable custom file upload. (Need session ID and temp backend file creation (will need to store temp info in AWS probably))

  // AppSidebar:
  // Bug when choosing new node and edges not updating when changing to coco (need shared edges state).
  // Toden-E clustering card reconfig.

  // Shared between all components:
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Shared between Sidebar and Graph:
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [selectedFunction, setSelectedFunction] = useState<string>("toden-e");
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [todenEClusters, setTodenEClusters] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string[] | null>(null);
  const [view, setView] = useState<string>("graph");

  // Shared between Sidebar and Matrix:
  const [selectedMatrix, setSelectedMatrix] = useState<string>("adj");
  const [matrixDims, setMatrixDims] = useState<number[] | null>(null);
  const [matrix, setMatrix] = useState<string[][]>([]);

  // Only on Home Page:
  const [prevView, setPrevView] = useState<string>("graph");

  // Only on Graph:
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // States I might remove after reconfiguration:
  const [clustersData, setClustersData] = useState<{ clusters: string[] } | null>(null);

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

  function handleGoToTabs() {
    setPrevView(view);
    setView("tabs");
  }

  function handleSubmitComplete() {
    setView(prevView);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
        {view === "tabs" ? (
          <div className="flex flex-row h-full w-full relative">
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              onClick={() => setView(prevView)}
            >
              <X />
            </Button>
            <FunctionTabs
              setClustersData={setClustersData}
              setSelectedNode={setSelectedNode}
              setSelectedFile={setSelectedFile}
              setView={setView}
              onSubmitComplete={handleSubmitComplete}
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
                  setHoveredNode={setHoveredNode}
                  selectedMatrix={selectedMatrix}
                  setSelectedMatrix={setSelectedMatrix}
                  todenEClusters={todenEClusters}
                  matrixDims={matrixDims}
                  setHoveredCluster={setHoveredCluster}
                  matrix={matrix}
                />
            }
            <div className="flex flex-1 flex-col">
              <DynamicGraph 
                clustersData={clustersData} 
                selectedNode={selectedNode} 
                selectedFile={selectedFile} 
                setSidebarOpen={setSidebarOpen}
                view={view}
                setView={setView}
                selectedFunction={selectedFunction}
                setSelectedNode={setSelectedNode}
                setSelectedEdge={setSelectedEdge}
                selectedEdge={selectedEdge}
                hoveredEdge={hoveredEdge}
                setHoveredEdge={setHoveredEdge}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                setDrawerOpen={setDrawerOpen}
                drawerOpen={drawerOpen}
                onFunctionalitySelect={handleGoToTabs}
                setTodenEClusters={setTodenEClusters}
                todenEClusters={todenEClusters}
                hoveredCluster={hoveredCluster}
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
          <div className="flex flex-row h-full overflow-hidden">
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
                              setHoveredNode={setHoveredNode}
                              selectedMatrix={selectedMatrix}
                              setSelectedMatrix={setSelectedMatrix}
                              todenEClusters={todenEClusters}
                              matrixDims={matrixDims}
                              setHoveredCluster={setHoveredCluster}
                              matrix={matrix}
                            />
            }
            <MatrixVisualization 
              setSidebarOpen={setSidebarOpen}
              selectedFile={selectedFile}
              view={view}
              selectedMatrix={selectedMatrix}
              onFunctionalitySelect={handleGoToTabs}
              setMatrixDims={setMatrixDims}
              matrix={matrix}
              setMatrix={setMatrix}
            />
          </div>
        ) : (null)}
    </div>
  );
}
