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
            
