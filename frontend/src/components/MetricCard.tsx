import React from 'react';
import { MetricCardProps } from '../types/financial';

export function MetricCard({ title, value, comment, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      {comment && (
        <div className="text-xs text-gray-500 leading-relaxed">{comment}</div>
      )}
    </div>
  );
}