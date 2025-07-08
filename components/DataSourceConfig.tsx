'use client';

import { useState } from 'react';

export default function DataSourceConfig() {
  const [activeSource, setActiveSource] = useState('sheets');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState('30');

  const handleConnect = () => {
    if (activeSource === 'sheets' && sheetsUrl) {
      console.log('Connecting to Google Sheets:', sheetsUrl);
    } else if (activeSource === 'api' && apiUrl) {
      console.log('Connecting to API:', apiUrl);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          <i className="ri-database-line text-blue-400"></i>
        </div>
        Data Source Configuration
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex space-x-1 mb-4">
            <button
              onClick={() => setActiveSource('sheets')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeSource === 'sheets'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 bg-slate-700/50 hover:text-white hover:bg-slate-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                <i className="ri-file-excel-line"></i>
              </div>
              Google Sheets
            </button>
            <button
              onClick={() => setActiveSource('api')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeSource === 'api'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 bg-slate-700/50 hover:text-white hover:bg-slate-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                <i className="ri-cloud-line"></i>
              </div>
              API Endpoint
            </button>
          </div>

          {activeSource === 'sheets' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Sheets URL
                </label>
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="text-xs text-gray-400 bg-slate-700/30 p-3 rounded-lg">
                <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                  <i className="ri-information-line text-blue-400"></i>
                </div>
                Make sure your Google Sheet is publicly accessible or properly shared
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Endpoint URL
                </label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="text-xs text-gray-400 bg-slate-700/30 p-3 rounded-lg">
                <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                  <i className="ri-information-line text-blue-400"></i>
                </div>
                API should return JSON data and support CORS for browser requests
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Refresh Interval (seconds)
            </label>
            <select 
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Status: Ready to connect</span>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={(!sheetsUrl && activeSource === 'sheets') || (!apiUrl && activeSource === 'api')}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Connect Data Source
          </button>
        </div>
      </div>
    </div>
  );
}