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

interface Edge {
  from: string;
  to: string;
  similarity: string;
  x: number;
  y: number;
}


interface DynamicGraphProps {
  clustersData: { clusters: string[] } | null;
  selectedNode: string;
  selectedFile: string | null;
  setSidebarOpen: (open: boolean) => void;
  setView: (view: string) => void;
  selectedFunction: string;
  setSelectedNode: (view: string) => void;
  // setSelectedEdge: (edge: Edge) => void;
  // onEdgesUpdate?: (edges: Edge[]) => void;
}

export default function DynamicGraph({ 
    clustersData, 
    selectedNode, 
    selectedFile, 
    setSidebarOpen, 
    setView, 
    selectedFunction,
    setSelectedNode,
    // setSelectedEdge,
    // onEdgesUpdate
  }: DynamicGraphProps) {

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cocoData, setCocoData] = useState<any>(null);
  const [todenEData, setTodenEData] = useState<any>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const overlayWidth = dimensions ? dimensions.width : (containerRef.current ? containerRef.current.clientWidth : 1000);
  const overlayHeight = dimensions ? dimensions.height : (containerRef.current ? containerRef.current.clientHeight : 800);
  const centerX = dimensions ? dimensions.width / 2 : overlayWidth / 2;
  const centerY = dimensions ? dimensions.height / 2 : overlayHeight / 2;

  const surroundingNodes = useMemo(() => {
    if (!cocoData || cocoData.length === 0) return [];
    let minSim = Infinity;
    let maxSim = -Infinity;
    cocoData.forEach((item: any) => {
      const sim = parseFloat(item.SIMILARITY);
      if (sim < minSim) minSim = sim;
      if (sim > maxSim) maxSim = sim;
    });
    const minRadius = 100; // closest distance (for high similarity)
    const maxRadius = 425; // furthest distance (for low similarity)
    return cocoData.map((item: any, index: number) => {
      const sim = parseFloat(item.SIMILARITY);
      const normSim = maxSim !== minSim ? (sim - minSim) / (maxSim - minSim) : 1;
      const radius = maxRadius - normSim * (maxRadius - minRadius);
      const angle = (2 * Math.PI * index) / cocoData.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...item, x, y, normSim };
    });
  }, [cocoData, centerX, centerY]);

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
    if (selectedFunction !== "CoCo") return;
    if (!selectedNode || !selectedFile) return;
    const fetchCoco = async () => {
      try {
        const allowedNodes = clustersData
          ? clustersData.clusters
              .flatMap((cluster) => cluster.split(",").map((n) => n.trim()))
              .filter((n) => n !== "")
          : [];
        const response = await fetch("/api/get-coco-visualization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node: selectedNode, allowedNodes, fileName: selectedFile }),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error("Error response:", text);
          throw new Error("Error fetching CoCo data");
        }
        const data = await response.json();
        console.log("CoCo Data", data.results)
        setCocoData(data.results);
      } catch (error) {
        console.error("Error fetching CoCo visualization data:", error);
      }
    };
    fetchCoco();
  }, [selectedNode, clustersData, selectedFile, selectedFunction]);

  // useEffect(() => {
  //   if (selectedFunction === "CoCo" && surroundingNodes.length > 0) {
  //     const availableEdges = surroundingNodes.map((node: any) => ({
  //       from: selectedNode,
  //       to: node.GS_B_ID,
  //       similarity: node.SIMILARITY,
  //       x: (centerX + node.x) / 2,
  //       y: (centerY + node.y) / 2,
  //     }));
  //     if (onEdgesUpdate) {
  //       onEdgesUpdate(availableEdges);
  //     }
  //   } else if (onEdgesUpdate) {
  //     onEdgesUpdate([]);
  //   }
  // }, [surroundingNodes, selectedNode, centerX, centerY, selectedFunction, onEdgesUpdate]);

  useEffect(() => {
    if (selectedFunction !== "toden-e") return;
    if (!selectedNode || !selectedFile) return;
    const fetchTodenE = async () => {
      try {
        const allowedNodes = clustersData
          ? clustersData.clusters
              .flatMap((cluster) => cluster.split(",").map((n) => n.trim()))
              .filter((n) => n !== "")
          : [];
        const response = await fetch("/api/get-toden-e-visualization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node: selectedNode, allowedNodes, fileName: selectedFile }),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error("Error response:", text);
          throw new Error("Error fetching Toden‑E data");
        }
        const data = await response.json();
        console.log("Toden-E Data", data.results)
        setTodenEData(data.results[0]);
      } catch (error) {
        console.error("Error fetching Toden‑E visualization data:", error);
      }
    };
    fetchTodenE();
  }, [selectedNode, clustersData, selectedFile, selectedFunction]);

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
      <div className="flex absolute top-4 left-4 z-10 items-center space-x-1">
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
      {clustersData && selectedFunction === "toden-e" && (
        <div className="absolute top-4 left-1/2 z-20 transform -translate-x-1/2 text-white text-2xl font-bold">
          <p>Algorithm: {todenEData?.algorithm}</p>
        </div>
      )}
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
                      // setSelectedEdge({
                      //   from: selectedNode,
                      //   to: node.GS_B_ID,
                      //   similarity: node.SIMILARITY, // assuming SIMILARITY is a string
                      //   // Calculate the midpoint of the line as the representative x,y:
                      //   x: (centerX + node.x) / 2,
                      //   y: (centerY + node.y) / 2,
                      // })
                      console.log('clicked edge')
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
                          onClick={() => setSelectedNode(node.GS_B_ID)}
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
              {(() => {
                const clusters = todenEData?.clusters || [];
                const numClusters = clusters.length;
                let clusterCenters: { x: number; y: number }[] = [];
                const offsetVal = 300; // adjust spacing between cluster centers

                // Cluster center calculations from your original code
                if (numClusters === 2) {
                  clusterCenters = [
                    { x: centerX - offsetVal, y: centerY },
                    { x: centerX + offsetVal, y: centerY },
                  ];
                } else if (numClusters === 3) {
                  clusterCenters = [
                    { x: centerX, y: centerY - offsetVal },
                    { x: centerX - offsetVal, y: centerY + offsetVal },
                    { x: centerX + offsetVal, y: centerY + offsetVal },
                  ];
                } else if (numClusters === 4) {
                  clusterCenters = [
                    { x: centerX - offsetVal, y: centerY - offsetVal },
                    { x: centerX + offsetVal, y: centerY - offsetVal },
                    { x: centerX - offsetVal, y: centerY + offsetVal },
                    { x: centerX + offsetVal, y: centerY + offsetVal },
                  ];
                } else if (numClusters === 5) {
                  const radius = offsetVal;
                  clusterCenters = Array.from({ length: 5 }, (_, i) => {
                    const angle = ((-90 + i * 72) * Math.PI) / 180;
                    return {
                      x: centerX + radius * Math.cos(angle),
                      y: centerY + radius * Math.sin(angle),
                    };
                  });
                }

                // Define ring configurations for nodes within each cluster
                const ringConfigs = [
                  { capacity: 2, radius: 0 },
                  { capacity: 10, radius: 50 },
                  { capacity: 20, radius: 100 },
                  { capacity: 35, radius: 150 },
                  { capacity: 45, radius: 200 },
                  { capacity: 55, radius: 250 },
                ];

                for (let i = 1; i < ringConfigs.length; i++) {
                  const adjustment = Math.floor(Math.random() * 4);
                  const sign = Math.random() < 0.5 ? -1 : 1;
                  ringConfigs[i].capacity = Math.max(ringConfigs[i].capacity + sign * adjustment, 0);
                }

                // Define colors for clusters
                const clusterColors = ["red", "green", "blue", "orange", "purple"];

                return clusterCenters.map((clusterCenter, clusterIndex) => {
                  const cluster = clusters[clusterIndex] || [];
                  let nodesPlaced = 0;

                  // Render rings for this cluster
                  return ringConfigs.map((ring, ringIndex) => {
                    const nodesInThisRing = Math.min(
                      ring.capacity,
                      cluster.length - nodesPlaced
                    );

                    if (nodesInThisRing <= 0) return null;

                    const ringNodes = cluster.slice(nodesPlaced, nodesPlaced + nodesInThisRing);
                    nodesPlaced += nodesInThisRing;

                    return (
                      <div
                        key={`${clusterIndex}-${ringIndex}`}
                        className="absolute"
                        style={{ left: clusterCenter.x, top: clusterCenter.y }}
                      >
                        {// @ts-ignore
                        ringNodes.map((node, nodeIndex) => {
                          const angle = (2 * Math.PI * nodeIndex) / nodesInThisRing;
                          const randomOffset = Math.random() * 35;
                          const nodeX = (ring.radius + randomOffset) * Math.cos(angle);
                          const nodeY = (ring.radius + randomOffset) * Math.sin(angle);

                          return (
                            <div
                              key={nodeIndex}
                              className="absolute"
                              style={{ left: nodeX - 15, top: nodeY - 15 }}
                            >
                              <Button
                                variant="outline"
                                className="text-xs rounded-full"
                                style={{ backgroundColor: clusterColors[clusterIndex % clusterColors.length] }}
                              >
                                {/* Add node content here if needed */}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                });
              })()}
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
