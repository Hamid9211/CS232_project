'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import SensorChart from '@/components/shared/Sensors/SensorChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MoodLog {
  _id: string;
  stress: number;
  happiness: number;
  energy: number;
  focus: number;
  calmness: number;
  description: string;
  date: string;
  prediction: string;
  createdAt: Date;
}

interface MoodData {
  id: string;
  Stress: number;
  Energy: number;
  Happiness: number;
  Focus: number;
  Calmness: number;
}

interface AggregatedData {
  date: string;
  Stress: number;
  Energy: number;
  Happiness: number;
  Focus: number;
  Calmness: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<MoodData>({
    id: '',
    Stress: 0,
    Energy: 0,
    Happiness: 0,
    Focus: 0,
    Calmness: 0,
  });

  const [weeklyData, setWeeklyData] = useState<AggregatedData[]>([]);
  const [monthlyData, setMonthlyData] = useState<AggregatedData[]>([]);
  const [allLogs, setAllLogs] = useState<MoodLog[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const savedSettings = Cookies.get('user-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode);
      } catch (error) {
        console.error('Error parsing settings from cookie:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/moodlogs')
      .then((res) => res.json())
      .then((response) => {
        if (response.success && response.data.length > 0) {
          const logs = response.data;
          setAllLogs(logs);
          
          const latest = logs[0];
          setData({
            id: latest._id,
            Stress: latest.stress,
            Energy: latest.energy,
            Happiness: latest.happiness,
            Focus: latest.focus,
            Calmness: latest.calmness,
          });
          
          const weeklyLogs = processWeeklyData(logs);
          setWeeklyData(weeklyLogs);
          
          const monthlyLogs = processMonthlyData(logs);
          setMonthlyData(monthlyLogs);
        }
      })
      .catch((error) => console.error('Error fetching mood logs:', error));
  }, []);
  
  const processWeeklyData = (logs: MoodLog[]): AggregatedData[] => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); 
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); 
    sevenDaysAgo.setHours(0, 0, 0, 0); 
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const lastWeekLogs = sortedLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= sevenDaysAgo && logDate <= today;
    });
    
    const groupedByDate: { [key: string]: MoodLog[] } = {};
    lastWeekLogs.forEach(log => {
      const date = log.date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(log);
    });
    
    const weeklyData: AggregatedData[] = Object.keys(groupedByDate).map(date => {
      const logs = groupedByDate[date];
      const avgStress = logs.reduce((sum, log) => sum + log.stress, 0) / logs.length;
      const avgEnergy = logs.reduce((sum, log) => sum + log.energy, 0) / logs.length;
      const avgHappiness = logs.reduce((sum, log) => sum + log.happiness, 0) / logs.length;
      const avgFocus = logs.reduce((sum, log) => sum + log.focus, 0) / logs.length;
      const avgCalmness = logs.reduce((sum, log) => sum + log.calmness, 0) / logs.length;
      
      return {
        date,
        Stress: avgStress,
        Energy: avgEnergy,
        Happiness: avgHappiness,
        Focus: avgFocus,
        Calmness: avgCalmness
      };
    });
    
    return weeklyData;
  };
  
  const processMonthlyData = (logs: MoodLog[]): AggregatedData[] => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); 
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29); 
    thirtyDaysAgo.setHours(0, 0, 0, 0); 
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const lastMonthLogs = sortedLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= thirtyDaysAgo && logDate <= today;
    });
    
    const groupedByWeek: { [key: string]: MoodLog[] } = {};
    lastMonthLogs.forEach(log => {
      const logDate = new Date(log.date);
      const weekStart = new Date(logDate);
      weekStart.setDate(logDate.getDate() - logDate.getDay()); 
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = [];
      }
      groupedByWeek[weekKey].push(log);
    });
    
    const monthlyData: AggregatedData[] = Object.keys(groupedByWeek).map(weekKey => {
      const logs = groupedByWeek[weekKey];
      const avgStress = logs.reduce((sum, log) => sum + log.stress, 0) / logs.length;
      const avgEnergy = logs.reduce((sum, log) => sum + log.energy, 0) / logs.length;
      const avgHappiness = logs.reduce((sum, log) => sum + log.happiness, 0) / logs.length;
      const avgFocus = logs.reduce((sum, log) => sum + log.focus, 0) / logs.length;
      const avgCalmness = logs.reduce((sum, log) => sum + log.calmness, 0) / logs.length;
      
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekKey);
      weekEnd.setDate(weekStart.getDate() + 6);
      const dateLabel = `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`;
      
      return {
        date: dateLabel,
        Stress: avgStress,
        Energy: avgEnergy,
        Happiness: avgHappiness,
        Focus: avgFocus,
        Calmness: avgCalmness
      };
    });
   return monthlyData;
  };

  return (
    <div
      className={`p-5 min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
      }`}
    >
      <h1
        className={`text-xl font-bold mb-5 text-center transition-colors duration-300 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}
      >
        Hello, This is your Mental Health Support Dashboard Overview
      </h1>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div
            className={`w-full md:w-1/2 h-80 shadow-xl rounded-lg p-4 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white'
                : 'bg-gradient-to-r from-blue-200 to-blue-100 text-gray-800'
            }`}
          >
            <h2 className="text-xl font-bold mb-2">Weekly Overview</h2>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart
                  data={weeklyData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ccc'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={darkMode ? '#fff' : '#333'} 
                    tick={{ fill: darkMode ? '#fff' : '#333' }} 
                  />
                  <YAxis stroke={darkMode ? '#fff' : '#333'} tick={{ fill: darkMode ? '#fff' : '#333' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#fff' : '#333',
                      border: `1px solid ${darkMode ? '#555' : '#ddd'}`
                    }} 
                  />
                  <Legend wrapperStyle={{ color: darkMode ? '#fff' : '#333' }} />
                  <Line type="monotone" dataKey="Happiness" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Energy" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Stress" stroke="#ff7300" />
                  <Line type="monotone" dataKey="Focus" stroke="#0088fe" />
                  <Line type="monotone" dataKey="Calmness" stroke="#00C49F" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p>No weekly data available</p>
              </div>
            )}
          </div>
          <div
            className={`w-full md:w-1/2 h-80 shadow-xl rounded-lg p-4 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-r from-green-900 to-green-800 text-white'
                : 'bg-gradient-to-r from-green-200 to-green-100 text-gray-800'
            }`}
          >
            <h2 className="text-xl font-bold mb-2">Monthly Overview</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ccc'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={darkMode ? '#fff' : '#333'} 
                    tick={{ fill: darkMode ? '#fff' : '#333' }} 
                  />
                  <YAxis stroke={darkMode ? '#fff' : '#333'} tick={{ fill: darkMode ? '#fff' : '#333' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#fff' : '#333',
                      border: `1px solid ${darkMode ? '#555' : '#ddd'}`
                    }} 
                  />
                  <Legend wrapperStyle={{ color: darkMode ? '#fff' : '#333' }} />
                  <Line type="monotone" dataKey="Happiness" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Energy" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Stress" stroke="#ff7300" />
                  <Line type="monotone" dataKey="Focus" stroke="#0088fe" />
                  <Line type="monotone" dataKey="Calmness" stroke="#00C49F" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p>No monthly data available</p>
              </div>
            )}
          </div>
        </div>
        <div
          className={`w-full shadow-xl rounded-lg p-8 transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-r from-purple-900 to-purple-800 text-white'
              : 'bg-gradient-to-r from-purple-200 to-purple-100 text-gray-800'
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Progress Tracking</h2>
          <SensorChart data={data} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;