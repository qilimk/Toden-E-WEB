// components/SummaryDrawer.tsx

"use client";

import React, { useState, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";


interface SummaryDrawerProps {
    setDrawerOpen: (open: boolean) => void;
}

export default function SummaryDrawer ({ setDrawerOpen }: SummaryDrawerProps) {
    return (
        <div className="flex flex-col p-2 space-y-2">
            <p>
                Summary Drawer
            </p>
        </div>
    );
}