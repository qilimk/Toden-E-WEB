"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import Navbar from '@/components/navbar';

export default function About() {
  const { theme } = useTheme();

  return (
    <div className="overflow-hidden">
      <Navbar />
    </div>
  );
}