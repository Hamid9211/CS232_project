'use client'
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Moon, Mail, MapPin, Lock, LucideIcon, ToggleLeft, ToggleRight, Sun } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import Cookies from 'js-cookie';

interface SettingsState {
  notifications: boolean;
  darkMode: boolean;
  emailUpdates: boolean;
  locationAccess: boolean;
  accountPrivacy: boolean;
}

interface SettingConfig {
  name: keyof SettingsState;
  label: string;
  description: string;
  icon: LucideIcon;
}

const COOKIE_NAME = 'user-settings';
const COOKIE_EXPIRY = 365; 

const Settings: React.FC = () => {
  const [savedSettings, setSavedSettings] = useState<SettingsState>(() => {
    const savedSettings = Cookies.get(COOKIE_NAME);
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing settings from cookie:', e);
      }
    }
    return {
      notifications: true,
      darkMode: false,
      emailUpdates: false,
      locationAccess: false,
      accountPrivacy: false
    };
  });

  const [unsavedSettings, setUnsavedSettings] = useState<SettingsState>(savedSettings);

  useEffect(() => {
    if (savedSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [savedSettings.darkMode]);

  useEffect(() => {
    setUnsavedSettings(savedSettings);
  }, [savedSettings]);

  const settingsConfig: SettingConfig[] = [
    {
      name: 'notifications',
      label: 'Enable Notifications',
      description: 'Receive important updates and reminders',
      icon: Bell
    },
    {
      name: 'darkMode',
      label: 'Dark Mode',
      description: 'Switch between light and dark theme',
      icon: unsavedSettings.darkMode ? Moon : Sun
    },
    {
      name: 'emailUpdates',
      label: 'Email Updates',
      description: 'Get updates delivered to your inbox',
      icon: Mail
    },
    {
      name: 'locationAccess',
      label: 'Location Access',
      description: 'Allow access to your location data',
      icon: MapPin
    },
    {
      name: 'accountPrivacy',
      label: 'Account Privacy',
      description: 'Manage your privacy preferences',
      icon: Lock
    }
  ];

  const handleChange = (name: keyof SettingsState): void => {
    setUnsavedSettings(prevSettings => ({
      ...prevSettings,
      [name]: !prevSettings[name]
    }));
  };

  const handleSave = (): void => {
    try {
      Cookies.set(COOKIE_NAME, JSON.stringify(unsavedSettings), {
        expires: COOKIE_EXPIRY,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });

      setSavedSettings(unsavedSettings);

      toast.success('Settings saved successfully', {
        description: 'Your preferences have been updated and saved.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', {
        description: 'There was an error saving your preferences. Please try again.',
      });
    }
  };

  return (
    <div className={`min-h-screen ${savedSettings.darkMode ? 'bg-gray-900' : 'bg-[#f9fafb]'} pt-4 p-2 overflow-hidden transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto px-6">
        <Toaster position="top-center" theme={savedSettings.darkMode ? 'dark' : 'light'} />
        
        <div className="mb-10">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${savedSettings.darkMode ? 'text-white' : 'text-gray-900'} tracking-tight font-inter`}>Settings</h1>
              <p className={`${savedSettings.darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 text-lg`}>Manage your preferences</p>
            </div>
          </div>
        </div>
       
        <Card className={`${savedSettings.darkMode ? 'bg-[#1e2538] border-white' : 'bg-white border-gray-200'} shadow-xl transition-colors duration-300`}>
          <CardHeader className={`border-b ${savedSettings.darkMode ? 'border-[#2a3146]' : 'border-gray-200'}`}>
            <CardTitle className={`text-xl font-semibold ${savedSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {settingsConfig.map(({ name, label, description, icon: Icon }) => (
              <div
                key={name}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  savedSettings.darkMode ? 'bg-[#252b3b] hover:bg-[#2a3146]' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors duration-300`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Icon className={`w-5 h-5 ${savedSettings.darkMode ? 'text-blue-500' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${savedSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
                    <p className={`text-sm ${savedSettings.darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleChange(name)}
                  className="focus:outline-none"
                >
                  {unsavedSettings[name] ? (
                    <ToggleRight className={`w-6 h-6 ${savedSettings.darkMode ? 'text-blue-500' : 'text-blue-600'} transition-colors`} />
                  ) : (
                    <ToggleLeft className={`w-6 h-6 ${savedSettings.darkMode ? 'text-slate-400' : 'text-gray-400'} transition-colors`} />
                  )}
                </button>
              </div>
            ))}
            
            <Button
              onClick={handleSave}
              className={`w-full ${
                savedSettings.darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors mt-6 font-medium`}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
