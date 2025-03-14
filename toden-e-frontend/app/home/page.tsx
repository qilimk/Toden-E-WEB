// app/home/page.tsx
"use client";

// Import statements
import { useMemo, useState, useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom Components
import FunctionTabs from "@/components/FunctionTabs";
import Navbar from '@/components/Navbar';
import DynamicGraph from "@/components/DynamicGraph";
import { NodeCombobox } from "@/components/NodeCombobox";

// Function for Home Page.
// 3 Main Components: Dynamic Graph, Function Tabs, Node Combobox

export default function HomePage() {
  const [clustersData, setClustersData] = useState<{ clusters: string[] } | null>(null);
  const [view, setView] = useState("tabs");
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");

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
          <>
          <div className="flex-col text-center">
            <p>
              - Create siderbar on visualization
            </p>
            <p>
              - Create clustering visualization
            </p>
            <p> - Summarization with clustering graph results</p>
            <p>
              - Allow Hierarchical/Tree graph loading?
            </p>
            
            <p>
              - Hookup summarize functionality
            </p>
            <p>
              - Return a downloadable csv file with predict for download
            </p>
            <p>
              - Integrate Summarize and Visualize with prediction
            </p>
          </div>  
          <div className="flex flex-row h-full w-full items-center">
            <div className="flex-1">
              <FunctionTabs setClustersData={setClustersData} setView={setView} setSelectedNode={setSelectedNode} setSelectedFile={setSelectedFile} />
            </div>
              <Button 
                variant="ghost"
                onClick={() => setView("graph")}
                className="rounded-full"
              >
                <ArrowRight />
              </Button>
          </div>
          </>
        ) : (
          <div className="flex flex-row h-full w-full items-center space-x-2">
            <Button 
              variant="ghost"
              onClick={() => setView("tabs")}
              className="rounded-full"
            >
              <ArrowLeft />
            </Button>
            <DynamicGraph clustersData={clustersData} selectedNode={selectedNode} selectedFile={selectedFile} />
            {clustersData && (
              <div className="absolute top-20 left-20 z-20">
                <NodeCombobox nodes={nodesArray} onSelect={setSelectedNode} />
              </div>
            )}
          </div>
        )}
    </div>
  );
}
