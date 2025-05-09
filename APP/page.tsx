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
    