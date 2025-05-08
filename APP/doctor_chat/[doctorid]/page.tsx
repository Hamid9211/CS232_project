'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ref, push, onValue, set, update } from 'firebase/database';
import { database } from '../../firebase';
import { Doctor, ChatMessage } from '../../types/chat';
import { getCookie } from 'cookies-next';
import { format } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import BookAppointment from '../../../components/ui/BookAppointment';

const doctorProfiles: Doctor[] = [
  {
    id: 'dr-sarah-johnson',
    name: 'Dr. Sarah Johnson',
    specialty: 'Clinical Psychologist',
    experience: '12 years',
    avatar: '/doctors/sarah-johnson.jpg',
    bio: 'Dr. Johnson specializes in cognitive behavioral therapy and treats anxiety, depression, and stress-related disorders.',
    availability: 'Monday-Thursday, 9 AM - 5 PM',
    ratings: 4.8,
  },
  {
    id: 'dr-michael-chen',
    name: 'Dr. Michael Chen',
    specialty: 'Psychiatrist',
    experience: '15 years',
    avatar: '/doctors/michael-chen.jpg',
    bio: 'Dr. Chen is a board-certified psychiatrist experienced in medication management for mood disorders and psychosis.',
    availability: 'Tuesday-Friday, 10 AM - 6 PM',
    ratings: 4.7,
  },
  {
    id: 'dr-amelia-patel',
    name: 'Dr. Amelia Patel',
    specialty: 'Neuropsychologist',
    experience: '10 years',
    avatar: '/doctors/amelia-patel.jpg',
    bio: 'Dr. Patel specializes in the assessment and treatment of cognitive and behavioral problems related to brain disorders.',
    availability: 'Monday, Wednesday, Friday, 9 AM - 4 PM',
    ratings: 4.9,
  },
  {
    id: 'dr-james-wilson',
    name: 'Dr. James Wilson',
    specialty: 'Mental Health Counselor',
    experience: '8 years',
    avatar: '/doctors/james-wilson.jpg',
    bio: 'Dr. Wilson offers supportive counseling for relationship issues, life transitions, and personal development.',
    availability: 'Monday-Friday, 12 PM - 8 PM',
    ratings: 4.6,
  },
  {
    id: 'dr-elena-rodriguez',
    name: 'Dr. Elena Rodriguez',
    specialty: 'Trauma Specialist',
    experience: '14 years',
    avatar: '/doctors/elena-rodriguez.jpg',
    bio: 'Dr. Rodriguez specializes in trauma recovery, PTSD treatment, and resilience building for individuals who have experienced adverse life events.',
    availability: 'Tuesday, Thursday, Saturday, 10 AM - 7 PM',
    ratings: 4.9,
  }
];

const sanitizeKey = (key: string) => {
  return key.replace(/[.#$[\]]/g, '_');
};

const getChatId = (userId1: string, userId2: string) => {
  const sanitizedIds = [sanitizeKey(userId1), sanitizeKey(userId2)].sort();
  return `${sanitizedIds[0]}_${sanitizedIds[1]}`;
};

const DoctorChatRoom = () => {
  const router = useRouter();
  const params = useParams();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const doctorId = params.doctorId;

  useEffect(() => {
    const email = getCookie('userEmail');
    if (email) {
      setUserEmail(email.toString());
    } else {
      router.push('/SignInPage');
      return;
    }

    const userSettings = getCookie('user-settings');
    if (userSettings) {
      try {
        const settings = JSON.parse(userSettings.toString());
        setDarkMode(settings.darkMode === true);
      } catch (e) {
        console.error('Error parsing user settings:', e);
      }
    }

    const foundDoctor = doctorProfiles.find(d => d.id === doctorId);
    if (foundDoctor) {
      setDoctor(foundDoctor);
    } else {
      router.push('/doctor-chat');
      return;
    }

    if (userEmail && doctorId) {
      const chatId = getChatId(userEmail.toString(), doctorId.toString());
      const messagesRef = ref(database, `chats/${chatId}/messages`);

      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const messagesList: ChatMessage[] = [];

        if (data) {
          Object.keys(data).forEach((key) => {
            messagesList.push({
              id: key,
              ...data[key]
            });
          });

          messagesList.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(messagesList);
        }

        setLoading(false);
      });
    }
  }, [router, doctorId, userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (userEmail && doctorId && messages.length > 0) {
      const chatId = getChatId(userEmail.toString(), doctorId.toString());

      messages.forEach(msg => {
        if (!msg.read && msg.senderId === doctorId) {
          const messageRef = ref(database, `chats/${chatId}/messages/${msg.id}`);
          update(messageRef, { read: true });
        }
      });
    }
  }, [messages, userEmail, doctorId]);

  const handleSendMessage = () => {
    if (!message.trim() || !userEmail || !doctor) return;

    const chatId = getChatId(userEmail.toString(), doctor.id);
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);

    const newMessage: Omit<ChatMessage, 'id'> = {
      senderId: userEmail,
      receiverId: doctor.id,
      content: message.trim(),
      timestamp: Date.now(),
      read: false,
      senderName: 'You'
    };

    set(newMessageRef, newMessage)
      .then(() => {
        const chatSessionRef = ref(database, `chatSessions/${chatId}`);
        set(chatSessionRef, {
          participants: [userEmail, doctor.id],
          lastMessage: message.trim(),
          lastMessageTimestamp: Date.now(),
          unreadCount: 0
        });
        setMessage('');
      })
      .catch((error) => {
        console.error("Error sending message: ", error);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const formatMessageDate = (timestamp: number) => {
    const today = new Date();
    const messageDate = new Date(timestamp);

    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }

    return format(messageDate, 'MMMM d, yyyy');
  };
