'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SensorChartProps {
  data: {
    Stress: number;
    Energy: number;
    Happiness: number;
    Focus: number;
    Calmness: number;
  };
  darkMode?: boolean;
}

const SensorChart: React.FC<SensorChartProps> = ({ data, darkMode = false }) => {
  const formattedData = [
    { name: 'Stress', value: data.Stress },
    { name: 'Energy', value: data.Energy },
    { name: 'Happiness', value: data.Happiness },
    { name: 'Focus', value: data.Focus },
    { name: 'Calmness', value: data.Calmness },
  ];

  const darkLineColor = '#82ca9d';
  const axisStroke = darkMode ? '#ffffff' : '#333333';
  const gridStroke = darkMode ? '#555' : '#e0e0e0';
  const tooltipContentStyle = darkMode
    ? { backgroundColor: '#333', border: 'none', color: '#fff' }
    : { backgroundColor: '#fff', border: '1px solid #ccc', color: '#333' };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {!darkMode && (
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#007AFF" />
              <stop offset="100%" stopColor="#66B2FF" />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="name" stroke={axisStroke} />
        <YAxis stroke={axisStroke} />
        <Tooltip contentStyle={tooltipContentStyle} />
        <Legend wrapperStyle={{ color: darkMode ? '#fff' : '#333' }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={darkMode ? darkLineColor : 'url(#lineGradient)'}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SensorChart;
