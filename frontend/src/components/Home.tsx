import React from 'react';
import { FinancialDigest } from '../types/financial';
import { ChartCard } from './ChartCard';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface HomeProps {
  digest: FinancialDigest;
}

const Home: React.FC<HomeProps> = ({ digest }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">📊 Company Overview</h2>
      <ChartCard title="Historical Revenue & Net Income (5 Years)">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={digest.historicalTrends?.years.map((year, i) => ({
            year,
            revenue: digest.historicalTrends!.revenue[i] / 1e9,
            netIncome: digest.historicalTrends!.netIncome[i] / 1e9
          }))}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue ($B)" />
            <Line type="monotone" dataKey="netIncome" stroke="#10B981" name="Net Income ($B)" />
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="mt-4 text-gray-700 text-base bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded">
        <strong>Summary:</strong> The chart above shows the company’s real revenue and net income trends over the past five years, helping you quickly spot growth or decline.
      </div>
    </div>
  );
};

export default Home;
