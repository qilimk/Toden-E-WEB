"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { Plus, Minus} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DynamicGraphProps {
  clustersData: { clusters: string[] } | null;
  selectedNode: string;
  selectedFile: string | null;
}

export default function DynamicGraph({ clustersData, selectedNode, selectedFile }: DynamicGraphProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [similarityData, setSimilarityData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!selectedNode) return;
    const fetchVisualization = async () => {
      try {
        const allowedNodes = clustersData
          ? clustersData.clusters
              .flatMap(cluster => cluster.split(",").map(n => n.trim()))
              .filter(n => n !== "")
          : [];
          
        const response = await fetch("/api/get-visualization", {
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
  }, [selectedNode, clustersData]);

  const clamp = (val: number, min: number, max: number) => {
    return Math.min(Math.max(val, min), max);
  };

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
    const delta = -e.deltaY;
    let newScale = scale;
    newScale = delta > 0 ? scale * 1.1 : scale * 0.9;
    newScale = Math.min(Math.max(newScale, 1), 5.0);
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

  const overlayWidth = containerRef.current ? containerRef.current.clientWidth : 1000;
  const overlayHeight = containerRef.current ? containerRef.current.clientHeight : 800;
  const centerX = overlayWidth / 2;
  const centerY = overlayHeight / 2;

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
      // Invert the normalized value: higher similarity → smaller radius.
      const radius = maxRadius - normSim * (maxRadius - minRadius);
      const angle = (2 * Math.PI * index) / similarityData.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...item, x, y, normSim };
    });
  }, [similarityData, centerX, centerY]);

  // Map normalized similarity (0 to 1) to a color from red (weak) to green (strong).
  const getColorForSimilarity = (norm: number) => {
    const hue = norm * 120; // 0 = red, 120 = green.
    return `hsl(${hue}, 100%, 50%)`;
  };

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
      {/* Transformed Container: background and graph content scale together */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        {/* Background */}
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
        <div className="absolute inset-0">
          {/* Fixed Central Node */}
          <div className="absolute" style={{ left: centerX - 40, top: centerY - 20 }}>
          <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="border-2 border-black text-sm px-2 py-1">
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
          {surroundingNodes.map((node, idx) => (
            <div
              key={idx}
              className="absolute"
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
        </div>
      </div>

      {/* Zoom Controls (outside the transformed container) */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button onClick={handleZoomIn} disabled={scale >= 5.0} className="p-2 bg-white rounded-full shadow">
          <Plus size={24} />
        </Button>
        <Button onClick={handleZoomOut} disabled={scale <= 1} className="p-2 bg-white rounded-full shadow">
          <Minus />
        </Button>
      </div>
    </div>
  );
}
