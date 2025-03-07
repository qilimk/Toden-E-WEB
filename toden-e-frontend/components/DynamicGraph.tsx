"use client";

import React, { useEffect, useRef, useState } from "react";
import * as dagre from "dagre"; // for layout
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Graph Data Interfaces
export interface GraphNode {
  id: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ClustersData {
  algorithm: string;
  clusters: string[];
  header: string[];
}

/**
 * Build a simple graph from clusters:
 * - Each GO term becomes a node.
 * - For each cluster, connect nodes sequentially.
 */
function buildGraphFromClusters(clustersData: ClustersData): Graph {
  const nodeMap: { [key: string]: GraphNode } = {};
  const edges: GraphEdge[] = [];
  
  clustersData.clusters.forEach((clusterStr) => {
    // Split the cluster string into node IDs.
    const nodes = clusterStr.split(",").map((s) => s.trim()).filter(Boolean);
    
    // Create node objects if they don't already exist.
    nodes.forEach((n) => {
      if (!nodeMap[n]) {
        nodeMap[n] = { id: n };
      }
    });
    
    // Connect consecutive nodes with an edge.
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ source: nodes[i], target: nodes[i + 1] });
    }
  });
  
  return { nodes: Object.values(nodeMap), edges };
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

interface AlternativeDynamicGraphProps {
  clustersData: ClustersData | null;
}

export default function AlternativeDynamicGraph({ clustersData }: AlternativeDynamicGraphProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [graph, setGraph] = useState<Graph | null>(null);

  // Build the graph and compute layout when clustersData changes.
  useEffect(() => {
    if (clustersData) {
      // Build graph directly from clustersData.
      const builtGraph = buildGraphFromClusters(clustersData);
      
      // Create a dagre graph and add nodes and edges.
      const g = new dagre.graphlib.Graph();
      g.setGraph({});
      g.setDefaultEdgeLabel(() => ({}));
      
      // Add nodes with fixed width/height.
      builtGraph.nodes.forEach((n) => {
        g.setNode(n.id, { label: n.id, width: 50, height: 50 });
      });
      builtGraph.edges.forEach((e) => {
        g.setEdge(e.source, e.target);
      });
      
      // Compute layout.
      dagre.layout(g);
      
      // Update node positions.
      const positionedNodes = builtGraph.nodes.map((n) => {
        const pos = g.node(n.id);
        return { ...n, x: pos.x, y: pos.y };
      });
      
      setGraph({ nodes: positionedNodes, edges: builtGraph.edges });
    }
  }, [clustersData]);

  // Pan/zoom event handlers.
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
        {/* Optionally, render the algorithm name */}
        {clustersData && (
          <div style={{ position: "absolute", top: 10, left: 10, color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>
            Algorithm: {clustersData.algorithm}
          </div>
        )}
        {graph ? (
          <svg width="1000" height="800">
            {/* Render edges */}
            {graph.edges.map((edge, index) => {
              const source = graph.nodes.find((n) => n.id === edge.source);
              const target = graph.nodes.find((n) => n.id === edge.target);
              if (!source || !target) return null;
              return (
                <line
                  key={index}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#000"
                  markerEnd="url(#arrow)"
                />
              );
            })}
            <defs>
              <marker
                id="arrow"
                markerWidth="10"
                markerHeight="10"
                refX="10"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#000" />
              </marker>
            </defs>
            {/* Render nodes */}
            {graph.nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle r={20} fill="#fff" stroke="#000" strokeWidth={2} />
                <text x={0} y={5} textAnchor="middle" fontSize="10" fill="#000" transform="rotate(30)">
                  {node.id}
                </text>
              </g>
            ))}
          </svg>
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
