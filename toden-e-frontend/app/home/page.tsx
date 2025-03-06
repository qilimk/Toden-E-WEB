"use client";

import { useState } from "react";
import Home from "@/components/tabscontent";
import Navbar from '@/components/navbar';
import DynamicGraph from "@/components/DynamicGraph";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [clustersData, setClustersData] = useState(null);
  const [view, setView] = useState("tabs");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
        {view === "tabs" ? (
          <div className="flex flex-row h-full w-full items-center">
            <div className="flex-1">
              <Home clustersData={clustersData} setClustersData={setClustersData} />
            </div>
              <Button 
                variant="ghost"
                onClick={() => setView("graph")}
                className="rounded-full"
              >
                <ArrowRight />
              </Button>
          </div>
        ) : (
          <div className="flex flex-row h-full w-full items-center space-x-2">
            <Button 
              variant="ghost"
              onClick={() => setView("tabs")}
              className="rounded-full"
            >
              <ArrowLeft />
            </Button>
            <DynamicGraph clustersData={clustersData} />
          </div>
        )}
    </div>
  );
}
