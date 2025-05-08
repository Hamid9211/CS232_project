'use client';

import React, { PropsWithChildren, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import 'tailwindcss/tailwind.css';
import SideBar from '@/components/shared/SideBar';
import { Menu } from 'lucide-react';

const RootLayout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const pathname = usePathname();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Routes where authentication UI should be shown without sidebar
  const authRoutes = ['/SignInPage', '/SignUpPage'];
  
  // Doctor-related routes where sidebar should be hidden
  const doctorRoutes = ['/doctor-login', '/doctor-dashboard'];
  
  // Check if current path is a route where sidebar should be hidden
  const shouldHideSidebar = authRoutes.includes(pathname) || doctorRoutes.includes(pathname);

  useEffect(() => {
    const savedSettings = Cookies.get('user-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode);
      } catch (e) {
        console.error('Error parsing settings from cookie:', e);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const savedSettings = Cookies.get('user-settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.darkMode !== darkMode) {
            setDarkMode(settings.darkMode);
          }
        } catch (e) {
          console.error('Error parsing settings from cookie:', e);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [darkMode]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const toggleDesktopSidebar = () => setIsDesktopSidebarOpen((prev) => !prev);

  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <main className="w-full flex h-full">
          {!shouldHideSidebar && (
            <>
              <div className="sm:hidden">
                <SideBar
                  isOpen={isMobileSidebarOpen}
                  onToggle={toggleMobileSidebar}
                  isMobile
                  darkMode={darkMode}
                />
              </div>

              <div className="hidden sm:flex">
                <SideBar
                  isOpen={isDesktopSidebarOpen}
                  onToggle={toggleDesktopSidebar}
                  darkMode={darkMode}
                />
              </div>
            </>
          )}

          <div className="flex flex-col w-full h-full overflow-hidden">
            {!shouldHideSidebar && (
              <header
                className={`sm:hidden flex items-center justify-between p-4 ${
                  darkMode ? 'bg-gray-900' : 'bg-white'
                } shadow`}
              >
                <button
                  onClick={toggleMobileSidebar}
                  className="p-2 rounded-md"
                  aria-label="Open sidebar"
                >
                  <Menu className={`w-6 h-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} />
                </button>
                <h1 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Mental Health App
                </h1>
                <div className="w-6" />
              </header>
            )}

            <div
              className={`flex-1 overflow-y-auto ${!shouldHideSidebar ? 'sm:p-0 p-2' : 'p-0'} ${
                darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
              }`}
            >
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
};

export default RootLayout;
