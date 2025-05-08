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

  const groupMessagesByDate = () => {
    const groups: { [key: string]: ChatMessage[] } = {};

    messages.forEach(message => {
      const date = formatMessageDate(message.timestamp);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(message);
    });

    return groups;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header with Book Appointment button always visible */}
      <header className={`px-4 py-3 shadow-md flex justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center">
          <button
            onClick={() => router.push('/doctor-chat')}
            className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {doctor && (
            <div className="flex items-center">
              <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                <Image
                  src={`https://ui-avatars.com/api/?name=${doctor.name.replace(' ', '+')}&background=random&size=100`}
                  alt={doctor.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <h3 className="font-semibold">{doctor.name}</h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{doctor.specialty}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Book Appointment
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <MessageIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Your Consultation</h3>
            <p className={`max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Send a message to begin your private conversation with {doctor?.name}.
              All communications are confidential.
            </p>
            {/* Optional: You may remove this duplicate button if you prefer the header-only approach */}
            <button
              onClick={() => setShowBookingModal(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div>
            {Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center my-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                    {date}
                  </span>
                </div>

                {dateMessages.map((msg) => {
                  const isUserMessage = msg.senderId === userEmail;

                  return (
                    <div key={msg.id} className={`mb-4 flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                      {!isUserMessage && doctor && (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0 self-end">
                          <Image
                            src={`https://ui-avatars.com/api/?name=${doctor.name.replace(' ', '+')}&background=random&size=64`}
                            alt={doctor.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      <div className={`max-w-[75%] ${isUserMessage ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`px-4 py-3 rounded-lg ${
                            isUserMessage
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white'
                              : darkMode
                                ? 'bg-gray-800 text-white'
                                : 'bg-white text-gray-800'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${isUserMessage ? 'text-right' : 'text-left'}`}>
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className={`flex-1 resize-none p-3 rounded-lg max-h-32 ${
              darkMode
                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                : 'bg-gray-100 text-gray-800 placeholder-gray-500 border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`ml-2 p-3 rounded-full ${
              message.trim()
                ? darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showBookingModal && doctor && userEmail && (
        <BookAppointment
          doctorId={doctor.id}
          doctorName={doctor.name}
          patientId={userEmail}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(appointmentId) => {
            console.log('Appointment booked successfully:', appointmentId);
            setShowBookingModal(false);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

const MessageIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

export default DoctorChatRoom;
