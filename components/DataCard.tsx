// components/DataCard.tsx - Corrected and Simplified

'use client';

import React from 'react';

interface DataCardProps {
  title: string;
  value: string | number;
  icon: string;
  className?: string; // Prop for the main wrapper div
  iconBgClass?: string; // Prop specifically for the icon background
  iconClass?: string; // Prop specifically for the icon itself
}

export default function DataCard({
  title,
  value,
  icon,
  className = "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50",
  iconBgClass = "bg-orange-600/20",
  iconClass = "text-orange-400"
}: DataCardProps) {

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${iconBgClass}`}>
          <i className={`${icon} text-2xl ${iconClass}`}></i>
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}