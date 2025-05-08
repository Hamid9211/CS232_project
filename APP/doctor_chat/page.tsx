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

  const fetchAppointments = async () => {
    if (!userEmail) return;
    setLoadingAppointments(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments?patientId=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments);
        setAppointmentPopupOpen(true);
      } else {
        setError(data.error || 'Failed to fetch appointments.');
      }
    } catch (err) {
      setError('An error occurred while fetching appointments.');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const closeAppointmentPopup = () => {
    setAppointmentPopupOpen(false);
  };

  const filteredDoctors = doctorProfiles.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatAppointmentDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'confirmed':
        return darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800';
      case 'cancelled':
        return darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800';
      case 'pending':
        return darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      default:
        return darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <header className={`sticky top-0 z-10 w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Mental Health Consultations</h1>
          {userEmail && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome, {userEmail}
              </span>
              <button
                onClick={fetchAppointments}
                className={`py-2 px-4 rounded-full font-medium transition-colors flex items-center ${
                  loadingAppointments 
                    ? `${darkMode ? 'bg-gray-700' : 'bg-gray-300'} cursor-not-allowed` 
                    : `${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`
                }`}
                disabled={loadingAppointments}
              >
                {loadingAppointments ? 'Loading...' : 'My Appointments'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {userEmail ? (
          <>
            <div className={`p-6 rounded-lg shadow-md mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p className="mb-4 text-lg">
                Connect with our expert mental health professionals for personalized care and support.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  className={`w-full p-3 pl-10 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  } focus:outline-none focus:ring-2 ${
                    darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-400'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg 
                  className={`absolute left-3 top-3.5 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <div 
                  key={doctor.id}
                  className={`rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl transform ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                  }`}
                >
                  <div className="relative h-56 w-full bg-gradient-to-r from-blue-400 to-indigo-500">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src={`https://ui-avatars.com/api/?name=${doctor.name.replace(' ', '+')}&background=random&size=256`}
                        alt={doctor.name}
                        width={160}
                        height={160}
                        className="rounded-full border-4 border-white h-40 w-40 object-cover"
                        onError={imageOnError}
                      />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold">{doctor.name}</h3>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {doctor.ratings} ★
                      </div>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-md text-sm font-medium mb-3 ${
                      darkMode ? 'bg-indigo-800 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {doctor.specialty}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                      <span className="font-medium">Experience:</span> {doctor.experience}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-4`}>
                      {doctor.bio}
                    </p>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                      <span className="font-medium">Available:</span> {doctor.availability}
                    </div>
                    <button
                      onClick={() => handleSelectDoctor(doctor.id)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        darkMode 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
                      }`}
                    >
                      Start Consultation
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div className={`p-8 rounded-lg shadow-md text-center mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <p className="text-lg">No doctors match your search criteria.</p>
              </div>
            )}
          </>
        ) : (
          <div className={`p-8 rounded-lg shadow-md text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-semibold mb-4">Please log in to chat with doctors</h2>
            <p className="mb-6">You need to be logged in to access the doctor chat feature.</p>
            <button
              onClick={() => router.push('/SignInPage')}
              className={`py-3 px-8 rounded-lg font-medium text-lg ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
              } text-white`}
            >
              Log In
            </button>
          </div>
        )}
      </div>

      {appointmentPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-3xl rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 max-h-[90vh] overflow-y-auto custom-scrollbar`}>
            <button 
              onClick={closeAppointmentPopup}
              className={`absolute top-4 right-4 p-2 rounded-full ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6">My Appointments</h2>

            {error && (
              <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
                {error}
              </div>
            )}

            {appointments.length > 0 ? (
              <div className="space-y-6">
                {appointments.map((appt) => (
                  <div 
                    key={appt._id} 
                    className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                      <h3 className="text-xl font-semibold">Appointment with {appt.doctorName}</h3>
                      <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium mt-2 md:mt-0 ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Date:</p>
                        <p className="font-medium">{formatAppointmentDate(appt.date)}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Time:</p>
                        <p className="font-medium">{appt.startTime} - {appt.endTime}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Reason for visit:</p>
                      <p className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>{appt.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-lg">You have no scheduled appointments.</p>
                <button
                  onClick={closeAppointmentPopup}
                  className={`mt-4 py-2 px-6 rounded-lg font-medium transition-colors ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorChatPage;
