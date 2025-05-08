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
