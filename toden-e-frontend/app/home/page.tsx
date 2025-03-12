// app/home/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Home from "@/components/tabscontent";
import Navbar from '@/components/navbar';
import DynamicGraph from "@/components/DynamicGraph";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeCombobox } from "@/components/NodeCombobox";

export default function HomePage() {
  const [clustersData, setClustersData] = useState<{ clusters: string[] } | null>(null);
  const [view, setView] = useState("tabs");
  const [selectedNode, setSelectedNode] = useState<string>("");

  const nodesArray = useMemo(() => {
    if (!clustersData) return [];
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
              - Change graph visualization to visualize CoCo graph
            </p>
            <p>
              - Hookup summarize functionality
            </p>
            <p>
              - Return a downloadable csv file with predict for download
            </p>
          </div>  
          <div className="flex flex-row h-full w-full items-center">
            <div className="flex-1">
              <Home clustersData={clustersData} setClustersData={setClustersData} setView={setView} />
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
            <DynamicGraph clustersData={clustersData} selectedNode={selectedNode} />
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
