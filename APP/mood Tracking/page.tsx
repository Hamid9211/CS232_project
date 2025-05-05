'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { toast, Toaster } from 'sonner';

interface MoodData {
  stress: number;
  happiness: number;
  energy: number;
  focus: number;
  calmness: number;
  description: string;
  date: string;
}

interface AIResponse {
  prediction: string;
}

const MoodTracking = () => {
  const [moodData, setMoodData] = useState<MoodData>({
    stress: 0,
    happiness: 0,
    energy: 0,
    focus: 0,
    calmness: 0,
    description: '',
    date: ''
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupContent, setPopupContent] = useState('');

  useEffect(() => {
    const savedSettings = Cookies.get('user-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode);
      } catch (error) {
        console.error('Error parsing user settings cookie:', error);
      }
    }
  }, []);

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const formatPredictionContent = (content: string) => {
    const sections = content.split('---');
    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      return (
        <div key={index} className="mb-6 last:mb-0">
          {lines.map((line, lineIndex) => {
            if (line.startsWith('####')) {
              return (
                <h4 key={lineIndex} className="text-lg font-semibold mb-3 text-blue-500">
                  {parseBoldText(line.replace('####', '').trim())}
                </h4>
              );
            }
            if (line.startsWith('###')) {
              return (
                <h3 key={lineIndex} className="text-xl font-bold mb-4 text-blue-600">
                  {parseBoldText(line.replace('###', '').trim())}
                </h3>
              );
            }
            if (line.startsWith('##')) {
              return (
                <h2 key={lineIndex} className="text-2xl font-bold mb-4 text-blue-700">
                  {parseBoldText(line.replace('##', '').trim())}
                </h2>
              );
            }
            
            if (line.match(/^\d+\./)) {
              return (
                <div key={lineIndex} className="ml-4 mb-2">
                  {parseBoldText(line)}
                </div>
              );
            }
            if (line.match(/^-\s/)) {
              return (
                <div key={lineIndex} className="ml-6 mb-2">
                  {parseBoldText(line)}
                </div>
              );
            }
            
            if (line.startsWith('>')) {
              return (
                <blockquote key={lineIndex} className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-300">
                  {parseBoldText(line.replace('>', '').trim())}
                </blockquote>
              );
            }
            
            return line.trim() ? (
              <p key={lineIndex} className="mb-2">
                {parseBoldText(line)}
              </p>
            ) : (
              <div key={lineIndex} className="h-2" />
            );
          })}
        </div>
      );
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'range' 
      ? parseInt(e.target.value, 10)
      : e.target.value;
    setMoodData({ ...moodData, [e.target.name]: value });
  };

  const handleLogMood = async () => {
    if (!moodData.description.trim() || !moodData.date.trim()) {
      toast.error('Please fill in all required fields: Description and Date.');
      return;
    }
  
    if (isLoading) return;
    setIsLoading(true);
  
    try {
      const userEmail = Cookies.get('userEmail');
      
      if (!userEmail) {
        toast.error('User not logged in. Please log in to track your mood.');
        setIsLoading(false);
        return;
      }
      
      const userResponse = await fetch(`/api/auth/user/getByEmail?email=${encodeURIComponent(userEmail)}`);
      
      if (!userResponse.ok) {
        throw new Error("Failed to get user information");
      }
      
      const userData = await userResponse.json();
      const userId = userData._id; 
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      const payload = { 
        ...moodData, 
        userId 
      };
  
      const res = await fetch('/api/mood/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) {
        throw new Error("Failed to get prediction");
      }
  
      const data = await res.json();
      setPopupContent(data.prediction);
      setPopupVisible(true);
    } catch (error) {
      console.error("Error getting prediction:", error);
      toast.error("Failed to analyze mood data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sliders = [
    { label: 'Stress', name: 'stress', value: moodData.stress },
    { label: 'Happiness', name: 'happiness', value: moodData.happiness },
    { label: 'Energy', name: 'energy', value: moodData.energy },
    { label: 'Focus', name: 'focus', value: moodData.focus },
    { label: 'Calmness', name: 'calmness', value: moodData.calmness }
  ];

  return (
    <div className="px-4 py-6">
      <Toaster position="top-right" />
      
      <style jsx global>{`
        /* Date picker styles */
        input[type='date']::-webkit-calendar-picker-indicator {
          filter: ${darkMode ? 'invert(1)' : 'none'};
        }
        
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f3f4f6'};
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4b5563' : '#9ca3af'};
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6b7280' : '#6b7280'};
        }
      `}</style>

      <div className={`max-w-4xl w-full mx-auto mt-10 rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
      } p-6 transition-colors duration-300`}>
        <h1 className="text-3xl font-bold mb-4">Mood Logger</h1>
        <p className="mb-6 text-lg">How do you feel today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {sliders.map((item) => (
            <div key={item.name}>
              <label className="block font-medium mb-1">{item.label}</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name={item.name}
                  min="0"
                  max="100"
                  value={item.value}
                  onChange={handleChange}
                  className="w-full accent-blue-600"
                />
                <span className="font-semibold min-w-[3ch] text-right">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-2">Description</label>
          <textarea
            name="description"
            placeholder="How are you feeling today?"
            value={moodData.description}
            onChange={handleChange}
            className={`w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-gray-100 border-gray-300 text-gray-900'
            }`}
            rows={4}
          />
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-2">Date</label>
          <input
            type="date"
            name="date"
            value={moodData.date}
            onChange={handleChange}
            className={`w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-gray-100 border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogMood}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full"
                viewBox="0 0 24 24"
              />
              <span>Analyzing...</span>
            </div>
          ) : (
            'Log Mood'
          )}
        </button>
      </div>

      {popupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
            onClick={() => setPopupVisible(false)}
          />
          <div 
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl transform transition-all ${
              darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className={`px-6 py-4 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className="text-2xl font-bold text-blue-600">AI Prediction</h2>
                <p className={`mt-1 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Analysis based on your mood data for today</p>
              </div>
              
              <div className="p-6 flex-1">
                <div className="overflow-y-auto max-h-[calc(70vh-80px)] pr-4 custom-scrollbar">
                  {formatPredictionContent(popupContent)}
                </div>
                <div className="mt-6 flex justify-end border-t pt-4">
                  <button
                    onClick={() => setPopupVisible(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MoodTracking;
