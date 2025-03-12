"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plus, Minus} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicGraphProps {
  clustersData: { clusters: string[] } | null;
  selectedNode: string;
}

export default function DynamicGraph({ clustersData, selectedNode }: DynamicGraphProps) {
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
          body: JSON.stringify({ node: selectedNode, allowedNodes }),
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{
        cursor: scale > 1 ? (isDraggingRef.current ? "grabbing" : "grab") : "default",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
          backgroundColor: "#2f2f2f",
          backgroundImage: "radial-gradient(circle, #fff 1.25px, transparent 0)",
          backgroundSize: "25px 25px",
          position: "relative",
        }}
      >
        {clustersData ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button className="border-2 border-black text-sm px-2 py-1">
              {selectedNode}
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center text-white">No graph data available.</div>
        )}
      </div>
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
