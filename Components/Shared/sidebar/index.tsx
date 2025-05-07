'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import 'tailwindcss/tailwind.css';
import {
  ChevronLeft,
  Heart,
  LineChart,
  Brain,
  FileText,
  Mail,
  Settings,
  X,
  MessageCircle,
  LogOut,
  UserPlus,
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: JSX.Element;
  link: string;
  group: string;
}

const menuItems: MenuItem[] = [
  {
    title: 'Mood Tracker',
    icon: <LineChart className="w-5 h-5" />,
    link: '/mood-tracking',
    group: 'main',
  },
  {
    title: 'AI Predictor',
    icon: <Brain className="w-5 h-5" />,
    link: '/',
    group: 'main',
  },
  {
    title: 'Meditative Chatbot',
    icon: <MessageCircle className="w-5 h-5" />,
    link: '/meditative-chatbot',
    group: 'main',
  },
  {
    title: 'Talk to Doctor',
    icon: <UserPlus className="w-5 h-5" />,
    link: '/doctor-chat',
    group: 'main',
  },
  {
    title: 'Report',
    icon: <FileText className="w-5 h-5" />,
    link: '/report',
    group: 'secondary',
  },
  {
    title: 'Contact us',
    icon: <Mail className="w-5 h-5" />,
    link: '/contact-us',
    group: 'secondary',
  },
  {
    title: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    link: '/settings',
    group: 'secondary',
  },
];

interface SideBarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  darkMode?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({
  isOpen,
  onToggle,
  isMobile = false,
  darkMode = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const bgClasses = darkMode ? 'bg-gray-900' : 'bg-white';
  const textPrimary = darkMode ? 'text-white font-bold' : 'text-gray-800 font-bold';
  const textActive = darkMode ? 'text-white font-bold' : 'text-blue-600 font-bold';

  const containerClasses = isMobile
    ? `fixed inset-y-0 left-0 ${bgClasses} transition-transform duration-300 ease-in-out z-50 w-64 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `h-full ${bgClasses} transition-all duration-300 ease-in-out flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`;

  const handleLogout = () => {
    // Remove cookies by setting an expired date.
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user-settings=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/SignInPage');
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${containerClasses} ${
          darkMode ? 'border border-gray-700' : 'border border-gray-200'
        }`}
      >
        <button
          className={`absolute top-4 right-4 bg-transparent rounded-full p-1.5 transition-all duration-300 ease-in-out z-50 ${
            isMobile ? '' : 'hidden'
          }`}
          onClick={onToggle}
          aria-label={isMobile ? 'Close sidebar' : 'Toggle sidebar'}
        >
          {isMobile ? (
            <X className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-600'}`} />
          ) : (
            <ChevronLeft
              className={`w-4 h-4 ${!isOpen ? 'rotate-180' : ''} ${
                darkMode ? 'text-white' : 'text-gray-600'
              }`}
            />
          )}
        </button>

        <div className="flex items-center gap-3 p-6">
          <div className="min-w-[32px] h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1
            className={`font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${
              !isOpen ? 'w-0 opacity-0' : darkMode ? 'text-white' : 'text-gray-800'
            }`}
          >
            Mental Health
          </h1>
        </div>

        <div className="px-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {menuItems
              .filter((item) => item.group === 'main')
              .map((item, index) => (
                <Link href={item.link} key={index}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 group relative ${
                      pathname === item.link
                        ? darkMode
                          ? 'bg-gray-700/50'
                          : 'bg-gray-200'
                        : darkMode
                        ? 'hover:bg-gray-700/30'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`min-w-[20px] ${
                        pathname === item.link ? textActive : textPrimary
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
                        !isOpen && 'w-0 opacity-0'
                      } ${darkMode ? 'text-white font-bold' : 'text-gray-800 font-bold'}`}
                    >
                      {item.title}
                    </span>
                    {!isOpen && (
                      <div
                        className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0"
                        role="tooltip"
                      >
                        {item.title}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
          </div>

          <div className="my-8 h-px bg-gray-300 dark:bg-gray-600" />

          <div className="space-y-2">
            {menuItems
              .filter((item) => item.group === 'secondary')
              .map((item, index) => (
                <Link href={item.link} key={index}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 group relative ${
                      pathname === item.link
                        ? darkMode
                          ? 'bg-gray-700/50'
                          : 'bg-gray-200'
                        : darkMode
                        ? 'hover:bg-gray-700/30'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`min-w-[20px] ${
                        pathname === item.link ? textActive : textPrimary
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
                        !isOpen && 'w-0 opacity-0'
                      } ${darkMode ? 'text-white font-bold' : 'text-gray-800 font-bold'}`}
                    >
                      {item.title}
                    </span>
                    {!isOpen && (
                      <div
                        className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0"
                        role="tooltip"
                      >
                        {item.title}
                      </div>
                    )}
                  </div>
                </Link>
              ))}

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => setShowLogoutPopup(true)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 group relative w-full text-left ${
                darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'
              }`}
            >
              <div className={`min-w-[20px] ${darkMode ? 'text-white font-bold' : 'text-gray-800 font-bold'}`}>
                <LogOut className="w-5 h-5" />
              </div>
              <span
                className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  !isOpen && 'w-0 opacity-0'
                } ${darkMode ? 'text-white font-bold' : 'text-gray-800 font-bold'}`}
              >
                Logout
              </span>
              {!isOpen && (
                <div
                  className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0"
                  role="tooltip"
                >
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`p-6 rounded-lg shadow-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <h2
              className={`text-lg font-bold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}
            >
              Logout
            </h2>
            <p className={`mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded ${
                  darkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutPopup(false)}
                className={`px-4 py-2 rounded ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideBar;