// app/reports/page.tsx - SHOULD BE VISUALLY FINE

'use client';

import Header from '../../components/Header';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

// (NOTE: The data in this file seems to be placeholder/demo data, not dynamic from Supabase)
const performanceData = [
  { time: '00:00', cpu: 45, memory: 62, network: 23 },
  { time: '04:00', cpu: 52, memory: 58, network: 31 },
  { time: '08:00', cpu: 78, memory: 71, network: 45 },
  { time: '12:00', cpu: 85, memory: 79, network: 52 },
  { time: '16:00', cpu: 72, memory: 68, network: 38 },
  { time: '20:00', cpu: 61, memory: 64, network: 29 },
  { time: '24:00', cpu: 48, memory: 59, network: 25 },
];

const userEngagementData = [
  { month: 'Jan', sessions: 4200, bounceRate: 0.32, avgDuration: 185 },
  { month: 'Feb', sessions: 3800, bounceRate: 0.28, avgDuration: 195 },
  { month: 'Mar', sessions: 5100, bounceRate: 0.25, avgDuration: 205 },
  { month: 'Apr', sessions: 4600, bounceRate: 0.30, avgDuration: 178 },
  { month: 'May', sessions: 5400, bounceRate: 0.22, avgDuration: 215 },
  { month: 'Jun', sessions: 6200, bounceRate: 0.19, avgDuration: 225 },
];

export default function Analytics() { // Note: This component is named Analytics but located in reports/page.tsx
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reports = [
    {
      title: 'Revenue Analysis Report',
      description: 'Comprehensive breakdown of revenue streams and growth patterns',
      date: '2024-01-15',
      status: 'completed',
      size: '2.4 MB',
      format: 'PDF',
      downloadUrl: '#'
    },
    {
      title: 'User Behavior Analytics',
      description: 'Deep dive into user engagement and conversion funnels',
      date: '2024-01-12',
      status: 'completed',
      size: '1.8 MB',
      format: 'Excel',
      downloadUrl: '#'
    },
    {
      title: 'Performance Metrics Dashboard',
      description: 'System performance and uptime analysis',
      date: '2024-01-10',
      status: 'processing',
      size: '3.1 MB',
      format: 'PDF',
      downloadUrl: '#'
    },
    {
      title: 'Marketing Campaign ROI',
      description: 'Return on investment analysis for marketing initiatives',
      date: '2024-01-08',
      status: 'completed',
      size: '1.2 MB',
      format: 'PDF',
      downloadUrl: '#'
    },
    {
      title: 'Data Quality Assessment',
      description: 'Comprehensive data integrity and quality metrics',
      date: '2024-01-05',
      status: 'completed',
      size: '945 KB',
      format: 'Excel',
      downloadUrl: '#'
    },
    {
      title: 'Customer Segmentation Study',
      description: 'Detailed analysis of customer demographics and behavior patterns',
      date: '2024-01-03',
      status: 'scheduled',
      size: 'TBD',
      format: 'PDF',
      downloadUrl: '#'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-400/20 text-green-400';
      case 'processing': return 'bg-yellow-400/20 text-yellow-400';
      case 'scheduled': return 'bg-blue-400/20 text-blue-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'ri-check-line';
      case 'processing': return 'ri-loader-line animate-spin';
      case 'scheduled': return 'ri-time-line';
      default: return 'ri-question-line';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Downloads</h1>
            <p className="text-gray-400">Generate and access your data reports</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-green-600/20 rounded-lg mb-4">
                <i className="ri-file-check-line text-2xl text-green-400"></i>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Completed Reports</h3>
              <p className="text-2xl font-bold text-white">24</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-yellow-600/20 rounded-lg mb-4">
                <i className="ri-file-settings-line text-2xl text-yellow-400"></i>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Processing</h3>
              <p className="text-2xl font-bold text-white">3</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-600/20 rounded-lg mb-4">
                <i className="ri-calendar-schedule-line text-2xl text-blue-400"></i>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Scheduled</h3>
              <p className="text-2xl font-bold text-white">7</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-purple-600/20 rounded-lg mb-4">
                <i className="ri-download-cloud-line text-2xl text-purple-400"></i>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Total Downloads</h3>
              <p className="text-2xl font-bold text-white">1.2K</p>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 md:mb-0 flex items-center">
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  <i className="ri-file-list-line text-blue-400"></i>
                </div>
                Generate New Report
              </h3>
              <div className="flex space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm pr-8"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm pr-8"
                >
                  <option value="all">All Categories</option>
                  <option value="revenue">Revenue</option>
                  <option value="users">Users</option>
                  <option value="performance">Performance</option>
                  <option value="marketing">Marketing</option>
                </select>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <div className="w-6 h-6 flex items-center justify-center mr-2">
                <i className="ri-folder-line text-blue-400"></i>
              </div>
              Recent Reports
            </h3>

            <div className="space-y-4">
              {reports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-600/50 rounded-lg">
                      <i className={`ri-file-${report.format.toLowerCase()}-line text-xl text-blue-400`}></i>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{report.title}</h4>
                      <p className="text-gray-400 text-sm mb-1">{report.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{report.date}</span>
                        <span>{report.size}</span>
                        <span>{report.format}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)} flex items-center`}>
                      <i className={`${getStatusIcon(report.status)} mr-1`}></i>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>

                    {report.status === 'completed' && (
                      <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className="ri-download-line"></i>
                        </div>
                      </button>
                    )}

                    <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer">
                        <i className="ri-more-2-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button className="px-6 py-2 text-blue-400 hover:text-blue-300 font-medium transition-colors whitespace-nowrap cursor-pointer">
                Load More Reports
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}