// app/home/page.tsx
"use client";

import { useTheme } from "next-themes";
import Navbar from '@/components/navbar';

export default function Home() {
  const { theme } = useTheme();

  return (
    <div>
      <Navbar />
      <div className="flex font-bold dark:text-white sm:text-3xl justify-center items-center h-screen">
        Put Tool here
      </div>
    </div>
  );
}