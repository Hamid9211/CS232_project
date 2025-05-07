// app/doctor-login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';

interface Doctor {
  id: string;
  name: string;
  email: string;
  password: string;
  specialty: string;
  experience: string;
  avatar: string;
  bio: string;
  availability: string;
  ratings: number;
}

const doctorProfiles: Doctor[] = [
    {
      id: 'dr-sarah-johnson',
      name: 'Dr. Sarah Johnson',
      email: 'sarah@example.com',
      password: 'password123',
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
      email: 'michael@example.com',
      password: 'password123',
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
      email: 'amelia@example.com',
      password: 'password123',
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
      email: 'james@example.com',
      password: 'password123',
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
      email: 'elena@example.com',
      password: 'password123',
      specialty: 'Trauma Specialist',
      experience: '14 years',
      avatar: '/doctors/elena-rodriguez.jpg',
      bio: 'Dr. Rodriguez specializes in trauma recovery, PTSD treatment, and resilience building for individuals who have experienced adverse life events.',
      availability: 'Tuesday, Thursday, Saturday, 10 AM - 7 PM',
      ratings: 4.9,
    }
  ];
  
  const DoctorLoginPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
  
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const doctor = doctorProfiles.find(
        (doc) => doc.email === email && doc.password === password
      );
      if (doctor) {
        setCookie('doctorId', doctor.id);
        setCookie('doctorName', doctor.name);
        router.push('/doctor-dashboard');
      } else {
        setErrorMsg('Invalid email or password.');
      }
    };
  
    return (
      <div className="min-h-screen text-black flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Doctor Login</h2>
          {errorMsg && <p className="text-red-500 mb-4 text-center">{errorMsg}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 font-semibold">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 font-semibold">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  };
  
  export default DoctorLoginPage;