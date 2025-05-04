'use client';

import React, { useState, useEffect } from 'react';
import { Send, User, Mail, MessageSquare, Type } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Cookies from 'js-cookie';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [focused, setFocused] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);

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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Message sent successfully!');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error('Error sending message');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error sending message');
    }
  };

  const handleFocus = (field: string) => {
    setFocused(field);
  };

  const handleBlur = () => {
    setFocused('');
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <header className={`h-16 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-between px-6`}>
          <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Contact Support</h1>
        </header>
               <main className="flex-1 overflow-auto p-6">
          <Toaster 
            position="top-center" 
            richColors 
            expand={true}
            closeButton={true}
          />
          
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Send us a Message</h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>We'll get back to you as soon as possible.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 
                    ${focused === 'name' || formData.name ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus('name')}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-700'} rounded-lg border transition-all duration-200
                      focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                      ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                    ${focused === 'email' || formData.email ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-700'} rounded-lg border transition-all duration-200
                      focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                      ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    placeholder="Your Email"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                  ${focused === 'subject' || formData.subject ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  <Type size={18} />
                </div>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => handleFocus('subject')}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-700'} rounded-lg border transition-all duration-200
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  placeholder="Subject"
                  required
                />
              </div>

              <div className="relative">
                <div className={`absolute left-3 top-4 transition-colors duration-200
                  ${focused === 'message' || formData.message ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  <MessageSquare size={18} />
                </div>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => handleFocus('message')}
                  onBlur={handleBlur}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-700'} rounded-lg border transition-all duration-200
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    ${darkMode ? 'border-gray-600' : 'border-gray-200'} resize-none`}
                  placeholder="Your Message"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg
                    transition-all duration-200 transform 
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                    flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Send Message
                </button>
              </div>
            </form>

            <div className={`flex items-center justify-center gap-2 mt-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
              <MessageSquare size={16} />
              <span>Average response time: 24-48 hours</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContactUs;

