"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableOfContents } from "lucide-react";
// @ts-ignore
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

interface MatrixVisualizationProps {
  setSidebarOpen: (open: boolean) => void;
  setView: (view: string) => void;
  selectedFile: string;
  view: string;
  selectedMatrix: string;
  onFunctionalitySelect: () => void;
  setMatrixDims: (dimensions: number[] | null) => void;
  matrix: string[][];
  setMatrix: (matrix: string[][]) => void;
}

export default function MatrixVisualization({ 
  setSidebarOpen,
  setView,
  selectedFile,
  view,
  selectedMatrix,
  onFunctionalitySelect,
  setMatrixDims,
  matrix,
  setMatrix
}: MatrixVisualizationProps) {

  useEffect(() => {
    if (view !== "matrix") return;
    if (!selectedFile) return;

    async function fetchMatrix() {
      try {
        const response = await fetch(
          `/api/get-matrix-information?file=${encodeURIComponent(selectedFile)}&type=${encodeURIComponent(selectedMatrix)}`
        );
        if (!response.ok) {
          console.error("Failed to fetch matrix data:", response.status);
          return;
        }
        const data = await response.json();
        console.log("Fetched matrix:", data.matrix);
        setMatrix(data.matrix);
        setMatrixDims(data.dims);
      } catch (error) {
        console.error("Error fetching matrix:", error);
      }
    }
    fetchMatrix();
  }, [selectedFile, view, selectedMatrix]);

  // Define dimensions for individual cells (adjust as needed)
  const rowHeight = 35;
  const columnWidth = 100;
  const rowCount = matrix.length;
  const columnCount = matrix[0]?.length || 0;

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div className="flex absolute top-4 left-4 z-10 space-x-1">
        
        <Button onClick={//@ts-ignore
            () => setSidebarOpen(prev => !prev)} 
            variant="outline"
        >
          <TableOfContents />
        </Button>
        <Button onClick={onFunctionalitySelect} variant="outline">
          Select Functionality
        </Button>
      </div>
      {selectedFile !== "" ? (
        <div className="mt-16 flex-1 p-2">
          <AutoSizer>
            {({ height, width }) => (
              <Grid
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={width}
              >
                {// @ts-ignore
                  ({ columnIndex, rowIndex, style }) => (
                  <div style={style} className="border p-1 whitespace-nowrap">
                    {isNaN(Number(matrix[rowIndex][columnIndex]))
                      ? matrix[rowIndex][columnIndex]
                      : Number(matrix[rowIndex][columnIndex]).toFixed(5)}
                  </div>
                )}
              </Grid>
            )}
          </AutoSizer>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center font-semibold text-xl">
          Choose a file to view matrix.
        </div>
      )}
    </div>
  );
}
