"use client";

import { useState, useRef } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicGraphProps {
  clustersData: {
    algorithm: string;
    clusters: string[];
    header: string[];
  } | null;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export default function DynamicGraph({ clustersData }: DynamicGraphProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

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
    if (delta > 0) {
      newScale = scale * 1.1;
    } else {
      newScale = scale * 0.9;
    }
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
        {/* Optional: Render the algorithm name at the top */}
        {clustersData && (
          <div style={{ position: "absolute", top: 10, left: 10, color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>
            Algorithm: {clustersData.algorithm}
          </div>
        )}

        {/* Render clusters */}
        {clustersData &&
          clustersData.clusters.map((cluster, clusterIndex) => {
            // Split the comma-separated IDs into an array
            const geneIds = cluster.split(",");
            // For demonstration, we position clusters in a simple grid.
            // You can replace this with your own layout logic.
            const xPos = (clusterIndex % 3) * 300; // adjust spacing as needed
            const yPos = Math.floor(clusterIndex / 3) * 200; // adjust spacing as needed

            return (
              <div
                key={clusterIndex}
                style={{
                  position: "absolute",
                  left: xPos,
                  top: yPos,
                  padding: "8px",
                  border: "2px solid #fff",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#fff" }}>
                  Cluster {clusterIndex + 1}
                </div>
                {geneIds.map((id, i) => (
                  <div key={i} style={{ color: "#fff", fontSize: "0.9rem" }}>
                    {id}
                  </div>
                ))}
              </div>
            );
          })}
      </div>

      {/* Vertical Zoom Controls in the top right corner */}
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
