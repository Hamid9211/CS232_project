'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

const parseAIMessage = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    if (!line.trim()) {
      return <br key={`br-${lineIndex}`} />;
    }

    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const parsedLine = parts.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`bold-${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parsedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface BackendMessage {
  _id: string;
  conversationId: string;
  userEmail: string;
  userMessage: string;
  aiMessage: string;
  createdAt: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Welcome to MentalHealthBot, a safe and supportive space where you can share your thoughts and feelings without fear of judgement. How can I help you today?',
      sender: 'bot',
      timestamp: 'Just now',
    },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const formatTimestamp = (date: string | number): string => {
    const messageDate = new Date(date);
    const now = new Date();
    
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return messageDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const fetchUserMessages = async (): Promise<void> => {
    const userEmail = Cookies.get('userEmail');
    if (!userEmail) {
      console.error('User email not found in cookies.');
      return;
    }

    try {
      const response = await fetch(`/api/conversation/${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch messages');

      if (!Array.isArray(data.messages)) {
        throw new Error('Invalid data format: messages is not an array');
      }

      const formattedMessages: Message[] = data.messages.flatMap((msg: BackendMessage) => {
        const timestamp = formatTimestamp(msg.createdAt);
        return [
          {
            id: `${msg._id}-user`,
            text: msg.userMessage,
            sender: 'user',
            timestamp: timestamp
          },
          {
            id: `${msg._id}-bot`,
            text: msg.aiMessage,
            sender: 'bot',
            timestamp: timestamp
          }
        ];
      });

      setMessages(prevMessages => [
        prevMessages[0],
        ...formattedMessages
      ]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = (): void => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchUserMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || loading) return;

    const userEmail = Cookies.get('userEmail');
    if (!userEmail) {
      console.error('User email not found in cookies.');
      return;
    }

    const timestamp = formatTimestamp(Date.now());
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: newMessage,
      sender: 'user',
      timestamp: timestamp,
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: newMessage,
          userEmail: userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch response');

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: data.response,
        sender: 'bot',
        timestamp: timestamp,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'I apologize, but I seem to be having trouble connecting. Could you please try again?',
        sender: 'bot',
        timestamp: timestamp,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md px-6 py-4`}>
        <div className="flex items-center max-w-7xl mx-auto">
          <div className={`${darkMode ? 'bg-blue-600' : 'bg-blue-500'} p-2 rounded-full`}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h1 className={`text-xl font-semibold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mental Health Support</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 py-6 max-w-7xl mx-auto w-full">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg h-full flex flex-col`}>
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-6 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-blue-400 to-blue-600'} flex items-center justify-center text-white font-semibold mr-3`}>
                    AI
                  </div>
                )}
                <div
                  className={`relative max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.sender === 'user' 
                      ? darkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-500 text-white'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-100' 
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm md:text-base leading-relaxed">
                    {message.sender === 'bot' ? parseAIMessage(message.text) : message.text}
                  </div>
                  <span
                    className={`absolute bottom-2 right-3 text-xs ${
                      message.sender === 'user' 
                        ? darkMode 
                          ? 'text-blue-200' 
                          : 'text-blue-100'
                        : darkMode 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </span>
                </div>
                {message.sender === 'user' && (
                  <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center ml-3`}>
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold`}>You</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
            <div className="flex items-center max-w-4xl mx-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className={`flex-1 p-4 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'} border rounded-l-xl w-[90%] focus:outline-none focus:border-blue-500 transition-colors`}
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 w-[10%] pt-4 sm:pb-4 py-5 rounded-r-xl transition-colors flex items-center justify-center min-w-[100px]`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
