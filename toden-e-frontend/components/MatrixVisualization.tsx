"use client";

import { Button } from "@/components/ui/button";
import { TableOfContents } from "lucide-react";

interface MatrixVisualizationProps {
    setSidebarOpen: (open: boolean) => void;
    setView: (view: string) => void;
}

export default function MatrixVisualization({ 
    setSidebarOpen,
    setView 
}: MatrixVisualizationProps) {
    return (
        <div className="flex absolute top-4 left-4 z-10 space-x-1 relative">
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
    );
}