'use client';

interface DataCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function DataCard({ title, value, change, icon, trend = 'neutral' }: DataCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'ri-arrow-up-line';
      case 'down': return 'ri-arrow-down-line';
      default: return 'ri-subtract-line';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 flex items-center justify-center bg-blue-600/20 rounded-lg">
          <i className={`${icon} text-2xl text-blue-400`}></i>
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            <i className={`${getTrendIcon()} text-sm`}></i>
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}