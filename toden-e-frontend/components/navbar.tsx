"use client";

import Link from 'next/link';
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator"

const Navbar = () => {
  const { theme } = useTheme();

  const [currentRoute, setCurrentRoute] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentRoute(window.location.pathname);
    }
  }, []);

  return (
    <div className="sticky top-0 z-50 !bg-background shadow-md dark:outline dark:outline-1 dark:outline-offset-0 dark:outline-border">
      <div className="flex w-full h-14 items-center px-4">
        <div className="flex items-center justify-start flex-grow">
          <Link href="/home" passHref>
            <div className="flex items-center">
              <Image
                src={'globe.svg'}
                width={50}
                height={50}
                className="mr-3"
                alt="Logo"
                priority
              />
              <span className="text-md whitespace-nowrap font-semibold dark:text-white sm:text-2xl">
                Toden-E
              </span>
            </div>
          </Link>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-12">
          <Link href="/home" passHref>
            <Button 
              variant="ghost" 
              size="default" 
              disabled={currentRoute === "/home"} 
              className={`${currentRoute === "/home" ? "underline" : ""}`}
            >
              Home
            </Button>
          </Link>
          <Link href="/about" passHref>
            <Button 
              variant="ghost" 
              size="default" 
              disabled={currentRoute === "/about"} 
              className={`${currentRoute === "/about" ? "underline" : ""}`}
            >
              About
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-end space-x-3 flex-grow">
          <ThemeToggle />
          <Link href="https://github.com/qilimk/Toden-E-WEB" passHref>
            <Button variant="ghost" size="icon">
              <GitHubLogoIcon />
            </Button>
          </Link>
        </div>
      </div>
      <Separator />
    </div>
  );
};

const ThemeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Navbar;
