'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Doctor } from '../types/chat';
import { getCookie } from 'cookies-next';
import { X } from 'lucide-react';

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

interface Appointment {
  _id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
}

const DoctorChatPage = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentPopupOpen, setAppointmentPopupOpen] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const email = getCookie('userEmail');
    if (email) {
      setUserEmail(email.toString());
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

    const style = document.createElement('style');
    style.textContent = `
      /* Global Scrollbar Styling */
      ::-webkit-scrollbar {
        width: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${darkMode ? '#1f2937' : '#f1f5f9'};
        border-radius: 8px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${darkMode ? '#4b5563' : '#cbd5e1'};
        border-radius: 8px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${darkMode ? '#6b7280' : '#94a3b8'};
      }
      
      /* Custom Scrollbar Styling for specific elements */
      .custom-scrollbar::-webkit-scrollbar {
        width: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: ${darkMode ? '#1f2937' : '#f1f5f9'};
        border-radius: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${darkMode ? '#4b5563' : '#cbd5e1'};
        border-radius: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${darkMode ? '#6b7280' : '#94a3b8'};
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [router, darkMode]);

  const handleSelectDoctor = (doctorId: string) => {
    router.push(`/doctor-chat/${doctorId}`);
  };

  const imageOnError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${e.currentTarget.alt.replace(' ', '+')}&background=random`;
  };
