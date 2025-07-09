// app/settings/page.tsx - SHOULD BE VISUALLY FINE

'use client';

import Header from '../../components/Header';
import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    reports: true
  });

  const tabs = [
    { id: 'general', label: 'General', icon: 'ri-settings-line' },
    { id: 'data', label: 'Data Sources', icon: 'ri-database-line' },
    { id: 'notifications', label: 'Notifications', icon: 'ri-notification-line' },
    { id: 'security', label: 'Security', icon: 'ri-shield-line' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your dashboard preferences and configurations</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className={tab.icon}></i>
                    </div>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="lg:col-span-3">
              {activeTab === 'general' && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">General Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dashboard Title
                      </label>
                      <input
                        type="text"
                        defaultValue="DataVault Dashboard"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default View
                      </label>
                      <select className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                        <option value="dashboard">Dashboard</option>
                        <option value="analytics">Analytics</option>
                        <option value="reports">Reports</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Time Zone
                      </label>
                      <select className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">Greenwich Mean Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Dark Mode</p>
                        <p className="text-gray-400 text-sm">Use dark theme across the dashboard</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-8">
                    <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Data Source Management</h3>
                  
                  <div className="space-y-6">
                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-green-600/20 rounded-lg">
                            <i className="ri-file-excel-line text-green-400"></i>
                          </div>
                          <div>
                            <p className="text-white font-medium">Sales Data Sheet</p>
                            <p className="text-gray-400 text-sm">Google Sheets • Last sync: 2 min ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full font-medium">Active</span>
                          <button className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <i className="ri-settings-line"></i>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-600/20 rounded-lg">
                            <i className="ri-cloud-line text-blue-400"></i>
                          </div>
                          <div>
                            <p className="text-white font-medium">Analytics API</p>
                            <p className="text-gray-400 text-sm">REST API • Last sync: 5 min ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full font-medium">Active</span>
                          <button className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <i className="ri-settings-line"></i>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-slate-600 rounded-lg text-gray-400 hover:text-white hover:border-blue-500 transition-colors cursor-pointer">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-add-line"></i>
                      </div>
                      <span>Add New Data Source</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                  
                  <div className="space-y-6">
                    {Object.entries({
                      email: 'Email Notifications',
                      push: 'Push Notifications',
                      sms: 'SMS Alerts',
                      reports: 'Report Generation Alerts'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{label}</p>
                          <p className="text-gray-400 text-sm">
                            Receive {label.toLowerCase()} for important updates
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={notifications[key as keyof typeof notifications]}
                            onChange={(e) => setNotifications(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Security Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-history-line text-blue-400"></i>
                        </div>
                        Recent Activity
                      </h4>
                      <div className="space-y-2">
                        {[
                          { action: 'Login from Chrome on Windows', time: '2 hours ago', location: 'New York, US' },
                          { action: 'Data export downloaded', time: '1 day ago', location: 'New York, US' },
                          { action: 'Settings updated', time: '3 days ago', location: 'New York, US' },
                        ].map((activity, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="text-gray-300">{activity.action}</p>
                              <p className="text-gray-500 text-xs">{activity.location}</p>
                            </div>
                            <span className="text-gray-500 text-xs">{activity.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-8">
                    <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                      Update Security
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}