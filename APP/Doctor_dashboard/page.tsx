'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';
import { format } from 'date-fns';
import {
  Send,
  Sun,
  Moon,
  LogOut,
  User,
  MessageSquare,
  Clock,
  Calendar
} from 'lucide-react';
import BookAppointment from '../../components/ui/BookAppointment';

import { ref, push, onValue, set, update } from 'firebase/database';
import { database } from '../firebase';

type ChatSession = {
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  userName?: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
  senderName: string;
};

type PatientProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type ScheduleSlot = {
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  day: string;
  slots: ScheduleSlot[];
};

type DoctorSchedule = {
  doctorId: string;
  schedule: DaySchedule[];
  unavailableDates?: string[];
};

type Appointment = {
  _id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const DoctorDashboard = () => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('General Medicine');
  const [chatSessions, setChatSessions] = useState<{ [key: string]: ChatSession }>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [patientProfiles, setPatientProfiles] = useState<{ [key: string]: PatientProfile }>({});
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDay, setScheduleDay] = useState('Monday');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [doctorSchedule, setDoctorSchedule] = useState<DoctorSchedule | null>(null);

  const [showAppointments, setShowAppointments] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const docId = getCookie('doctorId');
    const docName = getCookie('doctorName');
    const docSpecialty = getCookie('doctorSpecialty') || 'General Medicine';

    if (!docId || !docName) {
      router.push('/doctor-login');
      return;
    }

    setDoctorId(docId.toString());
    setDoctorName(docName.toString());
    setDoctorSpecialty(docSpecialty.toString());

    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    fetch('/api/patients')
      .then(response => response.json())
      .then(data => {
        setPatientProfiles(data);
      })
      .catch(error => console.error("Error fetching patient profiles:", error));

    fetchDoctorSchedule(docId.toString());

    if (showAppointments) {
      fetchAppointments(docId.toString());
    }
  }, [router, showAppointments]);

  const fetchDoctorSchedule = async (doctorId: string) => {
    try {
      const response = await fetch(`/api/doctor-schedule?doctorId=${doctorId}`);
      const data = await response.json();
      if (data.schedule) {
        setDoctorSchedule(data.schedule);
      } else {
        setDoctorSchedule({ doctorId, schedule: [], unavailableDates: [] });
      }
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
    }
  };

  const fetchAppointments = async (doctorId: string) => {
    try {
      const response = await fetch(`/api/appointments?doctorId=${doctorId}`);
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    deleteCookie('doctorId');
    deleteCookie('doctorName');
    deleteCookie('doctorSpecialty');
    router.push('/doctor-login');
  };

  const getPatientName = (patientId: string): string => {
    if (patientProfiles[patientId]) {
      return patientProfiles[patientId].name;
    }
    const session = Object.values(chatSessions).find(s => s.participants.includes(patientId));
    if (session?.userName) {
      return session.userName;
    }
    return `Patient ${patientId}`;
  };

  useEffect(() => {
    if (!doctorId) return;
    const sessionsRef = ref(database, 'chatSessions');
    onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      const sessions: { [key: string]: ChatSession } = {};
      if (data) {
        Object.keys(data).forEach((sessionId) => {
          const session = data[sessionId];
          if (session.participants && session.participants.includes(doctorId)) {
            sessions[sessionId] = session;
          }
        });
      }
      setChatSessions(sessions);
    });
  }, [doctorId]);

  useEffect(() => {
    if (!selectedChatId) return;
    const messagesRef = ref(database, `chats/${selectedChatId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const msgs: ChatMessage[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          msgs.push({ id: key, ...data[key] });
        });
        msgs.sort((a, b) => a.timestamp - b.timestamp);
      }
      setMessages(msgs);

      if (doctorId) {
        msgs.forEach((msg) => {
          if (msg.senderId !== doctorId && !msg.read) {
            const msgRef = ref(database, `chats/${selectedChatId}/messages/${msg.id}`);
            update(msgRef, { read: true });
          }
        });
        const sessionRef = ref(database, `chatSessions/${selectedChatId}`);
        update(sessionRef, { unreadCount: 0 });
      }
    });
  }, [selectedChatId, doctorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !doctorId || !selectedChatId) return;
    const session = chatSessions[selectedChatId];
    const receiverId = session.participants.find(p => p !== doctorId) || '';
    const messageObj: Omit<ChatMessage, 'id'> = {
      senderId: doctorId,
      receiverId,
      content: newMessage.trim(),
      timestamp: Date.now(),
      read: false,
      senderName: doctorName || 'Doctor',
    };

    const messagesRef = ref(database, `chats/${selectedChatId}/messages`);
    const newMessageRef = push(messagesRef);
    set(newMessageRef, messageObj)
      .then(() => {
        const sessionRef = ref(database, `chatSessions/${selectedChatId}`);
        update(sessionRef, {
          lastMessage: newMessage.trim(),
          lastMessageTimestamp: Date.now(),
        });
        setNewMessage('');
      })
      .catch(err => console.error('Error sending message:', err));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const openScheduleModal = (day: string = 'Monday') => {
    setScheduleDay(day);
    setScheduleError('');
    if (doctorSchedule) {
      const daySchedule = doctorSchedule.schedule.find(s => s.day === day);
      if (daySchedule && daySchedule.slots.length > 0) {
        setScheduleStartTime(daySchedule.slots[0].startTime);
        setScheduleEndTime(daySchedule.slots[0].endTime);
      } else {
        setScheduleStartTime('');
        setScheduleEndTime('');
      }
    }
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleStartTime('');
    setScheduleEndTime('');
    setScheduleDay('Monday');
    setScheduleError('');
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    if (!scheduleStartTime || !scheduleEndTime) {
      setScheduleError('Please provide both start and end times.');
      return;
    }
    if (!doctorSchedule) return;
    const updatedSchedule = doctorSchedule.schedule.filter(s => s.day !== scheduleDay);
    updatedSchedule.push({
      day: scheduleDay,
      slots: [{ startTime: scheduleStartTime, endTime: scheduleEndTime }]
    });
    const scheduleData: DoctorSchedule = { ...doctorSchedule, schedule: updatedSchedule };
    try {
      const response = await fetch('/api/doctor-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      if (response.ok) {
        const data = await response.json();
        setDoctorSchedule(data.schedule);
        closeScheduleModal();
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setScheduleError('Failed to update schedule');
    }
  };

  const handleDeleteScheduleDay = async (day: string) => {
    if (!doctorId || !doctorSchedule) return;
    const updatedSchedule = doctorSchedule.schedule.filter(s => s.day !== day);
    const scheduleData: DoctorSchedule = { ...doctorSchedule, schedule: updatedSchedule };
    try {
      const response = await fetch('/api/doctor-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      if (response.ok) {
        const data = await response.json();
        setDoctorSchedule(data.schedule);
      } else {
        throw new Error('Failed to delete schedule day');
      }
    } catch (error) {
      console.error('Error deleting schedule day:', error);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      <header className={`py-4 px-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex justify-between items-center`}>
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center mr-4`}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{doctorName || 'Doctor'}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-black'}`}>
              {doctorSpecialty} • ID: {doctorId?.substring(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              setShowAppointments(true);
              if (doctorId) fetchAppointments(doctorId);
            }}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            View Appointments
          </button>
          <button
            onClick={() => {
              setShowAppointments(false);
              setSelectedChatId(null);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Chats
          </button>
          <button
            onClick={() => openScheduleModal()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Manage Schedule
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center px-4 py-2 rounded ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!showAppointments && (
          <aside className={`w-80 border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} overflow-y-auto`}>
            <div className="p-4 border-b mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Patient Chats
              </h2>
              <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                {Object.keys(chatSessions).length}
              </span>
            </div>
            {Object.keys(chatSessions).length === 0 ? (
              <div className="p-4 text-center">
                <p className={`${darkMode ? 'text-gray-400' : 'text-black'}`}>No chat sessions available.</p>
              </div>
            ) : (
              <ul className="px-2">
                {Object.entries(chatSessions)
                  .sort((a, b) => b[1].lastMessageTimestamp - a[1].lastMessageTimestamp)
                  .map(([chatId, session]) => {
                    const patientId = session.participants.find(p => p !== doctorId) || '';
                    const patientName = getPatientName(patientId);
                    const hasUnread = session.unreadCount > 0;
                    return (
                      <li
                        key={chatId}
                        className={`p-3 my-1 rounded-lg cursor-pointer transition-all duration-200
                          ${selectedChatId === chatId ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                          ${hasUnread ? (darkMode ? 'border-l-4 border-blue-500' : 'border-l-4 border-blue-500') : ''}`}
                        onClick={() => handleSelectChat(chatId)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{patientName}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-black'}`}>
                            {format(new Date(session.lastMessageTimestamp), 'MMM d, h:mm a')}
                          </div>
                        </div>
                        <div className="flex items-center mt-1">
                          <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-black'}`}>
                            {session.lastMessage}
                          </p>
                          {hasUnread && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {session.unreadCount}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </aside>
        )}

        <main className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {showAppointments ? (
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2" /> Your Appointments
              </h2>
              {appointments.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-400' : 'text-black'}`}>No appointments scheduled.</p>
              ) : (
                <ul className="space-y-4">
                  {appointments.map((appt) => (
                    <li key={appt._id} className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold">{appt.patientName}</h3>
                        <span className="text-sm text-black">{format(new Date(appt.date), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="mt-1 text-sm">{appt.startTime} - {appt.endTime}</p>
                      <p className="mt-1 text-sm">Status: <strong>{appt.status}</strong></p>
                      <p className="mt-1 text-sm">Reason: {appt.reason}</p>
                      {appt.notes && <p className="mt-1 text-sm">Notes: {appt.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : selectedChatId ? (
            <>
              <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mr-3`}>
                    <User className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    {selectedChatId && (
                      <>
                        <h3 className="font-semibold">
                          {getPatientName(chatSessions[selectedChatId]?.participants.find(p => p !== doctorId) || '')}
                        </h3>
                        <div className="flex items-center text-xs">
                          <Clock className={`w-3 h-3 mr-1 ${darkMode ? 'text-gray-400' : 'text-black'}`} />
                          <span className={`${darkMode ? 'text-gray-400' : 'text-black'}`}>
                            Last activity: {format(new Date(chatSessions[selectedChatId]?.lastMessageTimestamp || Date.now()), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-black'} bg-opacity-80 p-4 rounded-lg`}>
                      No messages in this conversation yet.<br />Send a message to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isDoctor = msg.senderId === doctorId;
                      return (
                        <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                          <div className="flex flex-col max-w-[75%]">
                            <div className={`px-4 py-3 rounded-lg shadow-sm ${isDoctor ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (darkMode ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200')}`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <div className={`text-xs mt-1 flex items-center ${isDoctor ? 'self-end' : 'self-start'} ${darkMode ? 'text-gray-400' : 'text-black'}`}>
                              {format(new Date(msg.timestamp), 'h:mm a')}
                              {isDoctor && (
                                <span className="ml-2">{msg.read ? '✓✓' : '✓'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className={`flex-1 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' : 'bg-gray-100 text-black border-gray-200'}`}
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`ml-3 p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs mt-2 text-center text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-black'} max-w-md p-6`}>
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">Welcome, Dr. {doctorName}</h3>
                <p>
                  {showAppointments
                    ? "Here are your appointments."
                    : "Select a patient conversation from the sidebar to view and respond to messages."}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {showBookingModal && doctorId && (
        <BookAppointment
          doctorId={doctorId}
          doctorName={doctorName || 'Doctor'}
          patientId="patient-id"
          onClose={() => setShowBookingModal(false)}
          onSuccess={(appointmentId) => {
            console.log('Appointment booked successfully:', appointmentId);
            setShowBookingModal(false);
          }}
          darkMode={darkMode}
        />
      )}

      {showScheduleModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-500 bg-opacity-50'}`}>
          <div className={`relative w-full max-w-lg p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <button
              onClick={closeScheduleModal}
              className={`absolute top-4 right-4 text-lg font-bold ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Manage Schedule</h2>
            {doctorSchedule && doctorSchedule.schedule.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Current Schedule</h3>
                <div className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <tr>
                        <th className="px-4 py-2 text-left">Day</th>
                        <th className="px-4 py-2 text-left">Hours</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorSchedule.schedule.map((daySchedule) => (
                        <tr key={daySchedule.day} className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                          <td className="px-4 py-3">{daySchedule.day}</td>
                          <td className="px-4 py-3">
                            {daySchedule.slots.map((slot, index) => (
                              <div key={index}>
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => openScheduleModal(daySchedule.day)}
                                className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteScheduleDay(daySchedule.day)}
                                className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <h3 className="text-lg font-medium">
                {doctorSchedule?.schedule.some(s => s.day === scheduleDay)
                  ? `Edit ${scheduleDay} Schedule`
                  : `Add ${scheduleDay} Schedule`}
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">Day of Week</label>
                <select
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'text-black'}`}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                  className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'text-black'}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={scheduleEndTime}
                  onChange={(e) => setScheduleEndTime(e.target.value)}
                  className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'text-black'}`}
                  required
                />
              </div>
              {scheduleError && <div className="text-red-500 text-sm">{scheduleError}</div>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'}`}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white">
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
