import React, { useState } from 'react';
import { FinancialDigest } from '../types/financial';
import { ChartCard } from './ChartCard';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InsightsProps {
  digest: FinancialDigest;
}

const Insights: React.FC<InsightsProps> = ({ digest }) => {
  const [activeTab, setActiveTab] = useState<'market' | 'metrics' | 'industry' | 'cashflow'>('market');

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('insights-report');
    if (reportElement) {
      const canvas = await html2canvas(reportElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      // @ts-ignore: getImageProperties is a static function on jsPDF
      const imgProps = (jsPDF as any).getImageProperties
        ? (jsPDF as any).getImageProperties(imgData)
        : { width: canvas.width, height: canvas.height };
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('financial-report.pdf');
    }
  };

  const handleSaveReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(digest, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "financial-report.json");
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-8" id="insights-report">
      {/* Sticky header removed for full scroll-away effect */}
      <div className="flex space-x-4 mb-6">
        <button onClick={() => setActiveTab('market')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'market' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>Market Insights</button>
        <button onClick={() => setActiveTab('metrics')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'metrics' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>Key Metrics</button>
        <button onClick={() => setActiveTab('industry')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'industry' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>Industry & Share</button>
        <button onClick={() => setActiveTab('cashflow')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'cashflow' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700'}`}>Cash Flow</button>
      </div>
      {activeTab === 'market' && (
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-l-8 border-blue-500 rounded-xl p-6 shadow">
          <h2 className="text-xl font-bold mb-2 text-blue-800">💡 Market Insights</h2>
          <ul className="text-gray-800 list-disc pl-6 space-y-3">
            {digest.marketInsights && digest.marketInsights
              .replace(/\*\*/g, '')
              .split(/\n|\r|\*/)
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .map((line, idx) => (
                <li key={idx} className="leading-relaxed text-base">
                  {line}
                </li>
              ))}
          </ul>
        </div>
      )}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-2 text-green-700 text-lg">Key Metrics</h3>
            <ul className="text-gray-700 space-y-3 text-base">
              <li className="mb-2">
                <span className="font-semibold">Gross Margin:</span> {typeof digest.grossMargins === 'number' ? (digest.grossMargins * 100).toFixed(2) + '%' : (digest.grossMargins || 'No data')}
                {digest.comments?.grossMargins && (
                  <div className="text-sm text-gray-600 mt-1 ml-4">{digest.comments.grossMargins}</div>
                )}
              </li>
              <li className="mb-2">
                <span className="font-semibold">Net Margin:</span> {typeof digest.netMargin === 'number' ? (digest.netMargin * 100).toFixed(2) + '%' : (digest.netMargin || 'No data')}
                {digest.comments?.profitMargins && (
                  <div className="text-sm text-gray-600 mt-1 ml-4">{digest.comments.profitMargins}</div>
                )}
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-2 text-green-700">Qualitative Factors</h3>
            <div className="text-gray-700">{digest.qualitativeFactors}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-2 text-green-700">Company Segregation</h3>
            <div className="text-gray-700">{digest.companySegregation}</div>
          </div>
          {/* Investments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-2 text-green-700">Investments</h3>
            <div className="text-gray-700">Current: {digest.currentInvestments}</div>
            <div className="text-gray-700">Future: {digest.futureInvestments}</div>
          </div>
          {/* Financial Health */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-2 text-green-700">Financial Health</h3>
            <div className="text-gray-700">{digest.financialHealth}</div>
          </div>
        </div>
      )}
      {activeTab === 'industry' && digest.industryInsights && (
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 border-l-8 border-purple-500 rounded-xl p-6 shadow">
          <h2 className="text-xl font-bold mb-2 text-purple-800">🏢 Industry Insights & Market Share</h2>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Revenue ($B)</th>
                  <th className="px-4 py-2">Net Income ($B)</th>
                  <th className="px-4 py-2">Gross Margin (%)</th>
                  <th className="px-4 py-2">Profit Margin (%)</th>
                  <th className="px-4 py-2">Market Cap ($B)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-purple-50 font-bold">
                  <td className="px-4 py-2">{digest.company}</td>
                  <td className="px-4 py-2">{(digest.revenue / 1e9).toFixed(2)}</td>
                  <td className="px-4 py-2">{(digest.netIncome / 1e9).toFixed(2)}</td>
                  <td className="px-4 py-2">{(digest.grossMargins * 100).toFixed(2)}</td>
                  <td className="px-4 py-2">{(digest.profitMargins * 100).toFixed(2)}</td>
                  <td className="px-4 py-2">{(digest.marketCap / 1e9).toFixed(2)}</td>
                </tr>
                {digest.industryInsights.competitors.map((c) => (
                  <tr key={c.symbol} className="hover:bg-purple-50">
                    <td className="px-4 py-2">{c.company}</td>
                    <td className="px-4 py-2">{(c.revenue / 1e9).toFixed(2)}</td>
                    <td className="px-4 py-2">{(c.netIncome / 1e9).toFixed(2)}</td>
                    <td className="px-4 py-2">{(c.grossMargins * 100).toFixed(2)}</td>
                    <td className="px-4 py-2">{(c.profitMargins * 100).toFixed(2)}</td>
                    <td className="px-4 py-2">{(c.marketCap / 1e9).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {digest.marketShare && (
            <ChartCard title="🚗 Market Share (Top 5 by Revenue)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: digest.company, value: digest.marketShare.company },
                  ...(digest.industryInsights?.competitors.map((c, i) => ({ name: c.company, value: digest.marketShare!.competitors[i] })) || [])
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
      {activeTab === 'cashflow' && digest.cashFlow && digest.cashFlow.years.length > 0 && (
        <ChartCard title="💵 Cash Flow Trends (5 Years)">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={digest.cashFlow.years.map((year, i) => ({
              year,
              operating: digest.cashFlow!.operating[i] / 1e9,
              investing: digest.cashFlow!.investing[i] / 1e9,
              financing: digest.cashFlow!.financing[i] / 1e9
            }))}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="operating" stroke="#facc15" name="Operating ($B)" />
              <Line type="monotone" dataKey="investing" stroke="#10b981" name="Investing ($B)" />
              <Line type="monotone" dataKey="financing" stroke="#6366f1" name="Financing ($B)" />
            </RechartsLineChart>
          </ResponsiveContainer>
          {digest.comments?.cashFlow && (
            <div className="mt-4 text-gray-700 text-base bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded">
              <strong>Inference:</strong> {digest.comments.cashFlow}
            </div>
          )}
        </ChartCard>
      )}
      <div className="flex space-x-4 mt-8">
        <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm" onClick={handleDownloadPDF}>
          Download as PDF
        </button>
        <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-sm" onClick={handleSaveReport}>
          Save Report
        </button>
      </div>
    </div>
  );
};

export default Insights;
