// components/DataCard.tsx - With Centered Content and Syntax Fix

'use client';

import React from 'react';

interface DataCardProps {
  title: string;
  value: string | number;
  icon: string;
  className?: string;
  iconBgClass?: string;
  iconClass?: string;
}

export default function DataCard({
  title,
  value,
  icon,
  className = "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50",
  iconBgClass = "bg-orange-600/20",
  iconClass = "text-orange-400"
// --- THE FIX IS HERE: Corrected the typo from 'Data-card-props' to 'DataCardProps' ---
}: DataCardProps) {

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 flex flex-col items-center ${className}`}>

      <div className={`w-12 h-12 flex items-center justify-center rounded-lg mb-4 ${iconBgClass}`}>
        <i className={`${icon} text-2xl ${iconClass}`}></i>
      </div>

      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>

      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}