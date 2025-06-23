import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Search, TrendingUp, DollarSign, BarChart3, PieChart, LineChart, Newspaper, Download, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line
} from 'recharts';
import { FinancialDigest } from './types/financial';
import { MetricCard } from './components/MetricCard';
import { ChartCard } from './components/ChartCard';
import { formatCurrency, formatPercentage } from './utils/formatters';
import Home from './components/Home';
import Insights from './components/Insights';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

function App() {
  const [companyName, setCompanyName] = useState('');
  const [digest, setDigest] = useState<FinancialDigest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!companyName.trim()) return;
    
    setError('');
    setDigest(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setDigest(data);
      }
    } catch (err) {
      setError('Backend not reachable. Is Flask running?');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header with navigation */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Financial Digest AI
                </h1>
                <p className="text-gray-600 mt-1">Comprehensive financial analysis powered by AI</p>
              </div>
            </div>
            <nav className="flex space-x-6">
              <Link to="/" className="text-blue-700 font-semibold hover:underline">Home</Link>
              <Link to="/insights" className="text-blue-700 font-semibold hover:underline">Insights</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Section stays on all pages */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Enter Company Name (e.g. Apple, Microsoft, Tesla)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <button 
                onClick={handleSubmit}
                disabled={loading || !companyName.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-5 w-5" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center space-x-2">
              <div className="text-red-500">❌</div>
              <div>{error}</div>
            </div>
          )}
          {digest && (
            <Routes>
              <Route path="/" element={<Home digest={digest} />} />
              <Route path="/insights" element={<Insights digest={digest} />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;