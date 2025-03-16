"use client";

import React, { useMemo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Minus, TableOfContents, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import SummaryDrawer from "@/components/SummaryDrawer";

interface DynamicGraphProps {
  clustersData: { clusters: string[] } | null;
  selectedNode: string;
  selectedFile: string | null;
  setSidebarOpen: (open: boolean) => void;
  setView: (view: string) => void;
  selectedFunction: string;
}

export default function DynamicGraph({ clustersData, selectedNode, selectedFile, setSidebarOpen, setView, selectedFunction }: DynamicGraphProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [similarityData, setSimilarityData] = useState<any>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [selectedEdge, setSelectedEdge] = useState<{
    from: string;
    to: string;
    similarity: string;
    x: number;
    y: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Measure container dimensions once the component mounts.
  useLayoutEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedNode) return;
    const fetchVisualization = async () => {
      try {
        const allowedNodes = clustersData
          ? clustersData.clusters
              .flatMap(cluster => cluster.split(",").map(n => n.trim()))
              .filter(n => n !== "")
          : [];
          
        const response = await fetch("/api/get-coco-visualization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node: selectedNode, allowedNodes, fileName: selectedFile }),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error("Error response:", text);
          throw new Error("Error fetching visualization data");
        }
        const data = await response.json();
        console.log("Visualization data:", data.results);
        setSimilarityData(data.results);
      } catch (error) {
        console.error("Error fetching visualization data:", error);
      }
    };
    fetchVisualization();
  }, [selectedNode, clustersData, selectedFile]);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    let newOffset = { x: offset.x + dx, y: offset.y + dy };
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * scale;
      const minY = ch - ch * scale;
      newOffset.x = clamp(newOffset.x, minX, 0);
      newOffset.y = clamp(newOffset.y, minY, 0);
    }
    setOffset(newOffset);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY;
    let newScale = delta > 0 ? scale * 1.1 : scale * 0.9;
    newScale = Math.min(Math.max(newScale, 1), 5.0);
    const factor = newScale / scale - 1;
    let newOffsetX = offset.x - factor * mx;
    let newOffsetY = offset.y - factor * my;
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * newScale;
      const minY = ch - ch * newScale;
      newOffsetX = clamp(newOffsetX, minX, 0);
      newOffsetY = clamp(newOffsetY, minY, 0);
    }
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleZoomIn = () => {
    let newScale = scale * 1.1;
    newScale = Math.min(newScale, 5.0);
    setScale(newScale);
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * newScale;
      const minY = ch - ch * newScale;
      setOffset((prev) => ({
        x: clamp(prev.x, minX, 0),
        y: clamp(prev.y, minY, 0),
      }));
    }
  };

  const handleZoomOut = () => {
    let newScale = scale * 0.9;
    newScale = Math.max(newScale, 1);
    setScale(newScale);
    if (newScale === 1) {
      setOffset({ x: 0, y: 0 });
    } else if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * newScale;
      const minY = ch - ch * newScale;
      setOffset((prev) => ({
        x: clamp(prev.x, minX, 0),
        y: clamp(prev.y, minY, 0),
      }));
    }
  };

  const overlayWidth = dimensions ? dimensions.width : (containerRef.current ? containerRef.current.clientWidth : 1000);
  const overlayHeight = dimensions ? dimensions.height : (containerRef.current ? containerRef.current.clientHeight : 800);
  const centerX = dimensions ? dimensions.width / 2 : overlayWidth / 2;
  const centerY = dimensions ? dimensions.height / 2 : overlayHeight / 2;

  const surroundingNodes = useMemo(() => {
    if (!similarityData || similarityData.length === 0) return [];
    let minSim = Infinity;
    let maxSim = -Infinity;
    similarityData.forEach((item: any) => {
      const sim = parseFloat(item.SIMILARITY);
      if (sim < minSim) minSim = sim;
      if (sim > maxSim) maxSim = sim;
    });
    const minRadius = 100; // closest distance (for high similarity)
    const maxRadius = 425; // furthest distance (for low similarity)
    return similarityData.map((item: any, index: number) => {
      const sim = parseFloat(item.SIMILARITY);
      const normSim = maxSim !== minSim ? (sim - minSim) / (maxSim - minSim) : 1;
      const radius = maxRadius - normSim * (maxRadius - minRadius);
      const angle = (2 * Math.PI * index) / similarityData.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...item, x, y, normSim };
    });
  }, [similarityData, centerX, centerY]);

  const getColorForSimilarity = (norm: number) => {
    const hue = norm * 120; // 0 = red, 120 = green.
    return `hsl(${hue}, 100%, 50%)`;
  };

  // Don't render overlay until dimensions have been measured
  if (!dimensions) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
        <div className="text-white text-lg font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{ cursor: scale > 1 ? (isDraggingRef.current ? "grabbing" : "grab") : "default" }}
    >
      {!clustersData && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-bold z-10">
          No graph data available
        </div>
      )}
      <div className="flex absolute top-4 left-4 z-10 items-center">
        <Button
          // @ts-ignore
            onClick={() => setSidebarOpen((prev: boolean) => !prev)}
            variant="outline"
          >
          <TableOfContents/>
        </Button>
        <Button
            onClick={() => setView("tabs")}
            variant="outline"
          >
          Select Functionality
        </Button>
      </div>
      <Button
          onClick={() => setDrawerOpen(prev => !prev)}
          className="absolute bottom-4 right-4 z-10"
          variant="outline"
        >
        {drawerOpen ? <ChevronDown /> : <ChevronUp />}
      </Button>
      {/* Transformed Container: Background and Graph Content Scale Together */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#2f2f2f",
            backgroundImage: "radial-gradient(circle, #fff 1.25px, transparent 0)",
            backgroundSize: "25px 25px",
          }}
        />
        {/* Overlay: Central and Surrounding Nodes */}
        {clustersData && (
          selectedFunction === "CoCo" ? (
            <>
              {/* SVG for edges from the central node to each surrounding node */}
              <svg className="absolute inset-0" width={overlayWidth} height={overlayHeight}>
                {surroundingNodes.map((node: any, idx: number) => (
                  <line
                    key={idx}
                    x1={centerX}
                    y1={centerY}
                    x2={node.x}
                    y2={node.y}
                    stroke="black"
                    strokeWidth="2"
                    style={{ pointerEvents: 'visibleStroke', cursor: 'pointer' }}
                    onClick={() =>
                      console.log(`Edge from ${selectedNode} to ${node.GS_B_ID} clicked`)
                    }
                    onMouseEnter={(e) => (e.currentTarget.style.stroke = "blue")}
                    onMouseLeave={(e) => (e.currentTarget.style.stroke = "black")}
                  />
                ))}
              </svg>
              {/* Fixed Central Node */}
              <div className="absolute" style={{ left: centerX - 40, top: centerY - 20 }}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="border-2 border-black text-sm px-2 py-1 pointer-events-auto">
                        {selectedNode}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {selectedNode}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/* Surrounding Nodes as Buttons */}
              {surroundingNodes.map((node: any, idx: number) => (
                <div
                  key={idx}
                  className="absolute pointer-events-auto"
                  style={{ left: node.x - 30, top: node.y - 15 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="border-2 border-black text-xs px-2 py-1"
                          style={{ backgroundColor: getColorForSimilarity(node.normSim) }}
                        >
                          {node.GS_B_ID}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {node.GS_B_ID}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </>
          ) : selectedFunction === "toden-e" ? (
            <>
              {/* Render alternative layout for toden-e clustering */}
              <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
                Toden-e clustering functionality coming soon.
              </div>
            </>
          ) : null
        )}
      </div>

      {/* Zoom Controls (outside the transformed container) */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button onClick={handleZoomIn} variant="outline" disabled={scale >= 5.0} className="p-2 rounded-full">
          <Plus />
        </Button>
        <Button onClick={handleZoomOut} variant="outline" disabled={scale <= 1} className="p-2 rounded-full">
          <Minus />
        </Button>
      </div>
    </div>
  );
}
