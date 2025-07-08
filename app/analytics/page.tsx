'use client';

import Header from '../../components/Header';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

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

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
            <p className="text-gray-400">Deep insights and performance metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-purple-600/20 rounded-lg">
                  <i className="ri-cpu-line text-2xl text-purple-400"></i>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">72%</p>
                  <p className="text-purple-400 text-sm">+5% from last hour</p>
                </div>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">CPU Usage</h3>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-cyan-600/20 rounded-lg">
                  <i className="ri-hard-drive-line text-2xl text-cyan-400"></i>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">8.2GB</p>
                  <p className="text-cyan-400 text-sm">68% utilized</p>
                </div>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Memory Usage</h3>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-emerald-600/20 rounded-lg">
                  <i className="ri-wifi-line text-2xl text-emerald-400"></i>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">38MB/s</p>
                  <p className="text-emerald-400 text-sm">Network I/O</p>
                </div>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Network Activity</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  <i className="ri-speed-line text-blue-400"></i>
                </div>
                System Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Line type="monotone" dataKey="cpu" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="memory" stroke="#06B6D4" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="network" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-300">CPU</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm text-gray-300">Memory</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-gray-300">Network</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  <i className="ri-user-heart-line text-blue-400"></i>
                </div>
                User Engagement
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userEngagementData}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorSessions)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Page Views', value: '147K', icon: 'ri-eye-line', color: 'blue' },
              { title: 'Unique Visitors', value: '32.5K', icon: 'ri-user-line', color: 'green' },
              { title: 'Bounce Rate', value: '22.4%', icon: 'ri-arrow-go-back-line', color: 'yellow' },
              { title: 'Avg. Session', value: '3m 42s', icon: 'ri-time-line', color: 'purple' },
            ].map((metric, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 flex items-center justify-center bg-${metric.color}-600/20 rounded-lg`}>
                    <i className={`${metric.icon} text-2xl text-${metric.color}-400`}></i>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-2">{metric.title}</h3>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-6 h-6 flex items-center justify-center mr-2">
                <i className="ri-earth-line text-blue-400"></i>
              </div>
              Geographic Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { country: 'United States', users: '12,847', percentage: 45 },
                { country: 'United Kingdom', users: '8,234', percentage: 29 },
                { country: 'Germany', users: '4,521', percentage: 16 },
                { country: 'France', users: '2,156', percentage: 8 },
                { country: 'Canada', users: '1,892', percentage: 7 },
                { country: 'Others', users: '3,245', percentage: 11 },
              ].map((location, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{location.country}</p>
                    <p className="text-gray-400 text-sm">{location.users} users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-bold">{location.percentage}%</p>
                    <div className="w-16 h-2 bg-slate-600 rounded-full mt-1">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}