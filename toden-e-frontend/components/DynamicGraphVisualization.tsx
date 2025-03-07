import React, { useEffect, useRef, useState } from "react";
import * as dagre from "dagre"; // for layout
import * as d3 from "d3-scale-chromatic"; // for viridis colormap

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Graph Data Interfaces
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
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

// Prediction row interface expected from your backend transformation.
export interface PredictionRow {
  ID: string;
  "0"?: string;  // comma-separated list of node IDs for cluster 0
  "1"?: string;
  "-1"?: string;
}

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Helper Functions
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function shortestPath(graph: Graph, start: string, end: string): string[] | null {
  const queue: string[][] = [[start]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;
    const last = path[path.length - 1];
    if (last === end) return path;

    // Get neighbors (edges where current node is source)
    const neighbors = graph.edges
      .filter(e => e.source === last)
      .map(e => e.target);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

function addIntermediateNodesToKeepConnected(nodesList: string[], fullGraph: Graph): Set<string> {
  const allNodesIncluded = new Set<string>(nodesList);
  for (let i = 0; i < nodesList.length; i++) {
    for (let j = i + 1; j < nodesList.length; j++) {
      const path = shortestPath(fullGraph, nodesList[i], nodesList[j]);
      if (path) {
        path.forEach((n) => allNodesIncluded.add(n));
      }
    }
  }
  return allNodesIncluded;
}

function createSubgraphFromNodes(fullGraph: Graph, nodesSet: Set<string>): Graph {
  const subNodes = fullGraph.nodes.filter((n) => nodesSet.has(n.id));
  const subEdges = fullGraph.edges.filter(
    (e) => nodesSet.has(e.source) && nodesSet.has(e.target)
  );
  return { nodes: subNodes, edges: subEdges };
}

function reverseGraph(graph: Graph): Graph {
  const reversedEdges = graph.edges.map((e) => ({
    source: e.target,
    target: e.source,
  }));
  return { nodes: graph.nodes, edges: reversedEdges };
}

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// DynamicGraphVisualization Component
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

interface DynamicGraphVisualizationProps {
  fullGraph: Graph;         // The complete graph (nodes & edges)
  predictionRow: PredictionRow; // A single row from your prediction/clustering CSV
}

export default function DynamicGraphVisualization({
  fullGraph,
  predictionRow,
}: DynamicGraphVisualizationProps) {
  const [subGraph, setSubGraph] = useState<Graph | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Process prediction data: assume clusters are stored under keys "0", "1", and "-1"
    const labels = ["0", "1", "-1"];
    const predLists: string[][] = [];

    labels.forEach((label) => {
      const value = predictionRow[label];
      if (value) {
        const items = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "");
        if (items.length > 0) {
          predLists.push(items);
        }
      }
    });

    // All predicted nodes
    const allPredNodes = new Set<string>(predLists.flat());

    // Compute intermediate nodes to keep selected nodes connected
    const allConnectedNodes = addIntermediateNodesToKeepConnected(
      Array.from(allPredNodes),
      fullGraph
    );

    // Create subgraph and reverse its edges
    const subG = createSubgraphFromNodes(fullGraph, allConnectedNodes);
    const reversedSubG = reverseGraph(subG);

    // Compute layout with dagre (using a dot-like layout)
    const g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes (using fixed dimensions for layout)
    reversedSubG.nodes.forEach((n) => {
      g.setNode(n.id, { label: n.id, width: 40, height: 40 });
    });

    // Add edges
    reversedSubG.edges.forEach((e) => {
      g.setEdge(e.source, e.target);
    });

    // Compute layout
    dagre.layout(g);

    // Update node positions
    const positionedNodes = reversedSubG.nodes.map((n) => {
      const nodeWithPos = g.node(n.id);
      return { ...n, x: nodeWithPos.x, y: nodeWithPos.y };
    });

    const positionedGraph: Graph = {
      nodes: positionedNodes,
      edges: reversedSubG.edges,
    };

    setSubGraph(positionedGraph);
  }, [fullGraph, predictionRow]);

  // Set colors for nodes based on cluster membership using D3's viridis interpolator
  const clusterColors = [
    d3.interpolateViridis(0.3),
    d3.interpolateViridis(0.6),
    d3.interpolateViridis(0.9),
  ];
  const nodeColorMap: { [key: string]: string } = {};
  const labels = ["0", "1", "-1"];
  labels.forEach((label, i) => {
    const value = predictionRow[label];
    if (value) {
      const items = value.split(",").map((s) => s.trim());
      items.forEach((id) => {
        nodeColorMap[id] = clusterColors[i];
      });
    }
  });

  return (
    <svg
      ref={svgRef}
      width="1000"
      height="800"
      style={{ border: "1px solid #ccc" }}
    >
      {/* Render edges */}
      {subGraph &&
        subGraph.edges.map((edge, index) => {
          const source = subGraph.nodes.find((n) => n.id === edge.source);
          const target = subGraph.nodes.find((n) => n.id === edge.target);
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
      {/* Arrow marker definition */}
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
      {/* Render nodes and labels */}
      {subGraph &&
        subGraph.nodes.map((node) => {
          const fillColor = nodeColorMap[node.id] || "#ffffff";
          const strokeColor = nodeColorMap[node.id] || "#000000";
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle r={20} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
              <text
                x={0}
                y={5}
                textAnchor="middle"
                fontSize="10"
                fill={strokeColor}
                transform="rotate(30)"
              >
                {node.id}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
