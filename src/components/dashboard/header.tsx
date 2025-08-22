// src/components/dashboard/header.tsx
"use client";

interface DashboardHeaderProps {
  heading: string;
  text: string;
}

export function DashboardHeader({ heading, text }: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-700 px-4 py-4 md:px-6 lg:px-8 flex flex-col gap-1 bg-black bg-opacity-40 backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-white">{heading}</h1>
      <p className="text-gray-300">{text}</p>
    </header>
  );
}
