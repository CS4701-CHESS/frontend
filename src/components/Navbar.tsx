"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation links configuration for better maintainability
const NAV_LINKS = [
  { href: "/", label: "Chessboard" },
  { href: "/elo", label: "ELO Leaderboard" },
];

// Constants
const NAVBAR_HEIGHT = "h-16"; // Using Tailwind's standard height class

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <nav className={`top-0 left-0 right-0 bg-gray-900 ${NAVBAR_HEIGHT} z-50`}>
      <div className="max-w-7xl mx-auto h-full px-4">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`
                  relative text-gray-100 px-3 py-2 
                  rounded-md text-lg font-medium
                  transition-colors duration-200
                  hover:bg-gray-700
                  ${isActive(href) ? "bg-gray-700" : ""}
                  ${
                    isActive(href)
                      ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500"
                      : ""
                  }
                `}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
