import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface BookAppointmentProps {
  doctorId: string;
  doctorName: string;
  patientId: string; // This is now the user email
  onClose: () => void;
  onSuccess: (appointmentId: string) => void;
  darkMode: boolean;
}

interface ScheduleSlot {
  startTime: string;
  endTime: string;
}

interface ScheduleItem {
  day: string;
  slots: ScheduleSlot[];
  _id: string;
}

interface DoctorScheduleType {
  _id: string;
  doctorId: string;
  schedule: ScheduleItem[];
  unavailableDates: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DoctorScheduleResponse {
  schedule: DoctorScheduleType;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

const getDayName = (date: Date): string =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

const BookAppointment: React.FC<BookAppointmentProps> = ({
  doctorId,
  doctorName,
  patientId,
  onClose,
  onSuccess,
  darkMode
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [doctorSchedule, setDoctorSchedule] = useState<DoctorScheduleType | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [patientName, setPatientName] = useState('');
  const [fetchingPatient, setFetchingPatient] = useState(true);

  useEffect(() => {
    // Add scrollbar styles to the document
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: ${darkMode ? '#2d3748' : '#f1f1f1'};
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${darkMode ? '#4a5568' : '#c1c1c1'};
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${darkMode ? '#718096' : '#a1a1a1'};
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [darkMode]);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setFetchingPatient(true);
        const response = await fetch(`/api/auth/user/getByEmail?email=${encodeURIComponent(patientId)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient details');
        }
        
        const userData = await response.json();
        if (userData.displayName) {
          setPatientName(userData.displayName);
        } else {
          throw new Error('Patient information not found');
        }
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch patient details');
      } finally {
        setFetchingPatient(false);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  useEffect(() => {
    const fetchScheduleAndAppointments = async () => {
      try {
        setLoading(true);

        // Fetch doctor schedule
        const scheduleRes = await fetch(`/api/doctor-schedule?doctorId=${doctorId}`);
        if (!scheduleRes.ok) throw new Error('Failed to fetch doctor schedule');
        const scheduleData: DoctorScheduleResponse = await scheduleRes.json();
        // Set the doctorSchedule to the inner schedule object from the response
        setDoctorSchedule(scheduleData.schedule);

        // Fetch appointments
        const appointmentsRes = await fetch(`/api/appointments?doctorId=${doctorId}`);
        if (!appointmentsRes.ok) throw new Error('Failed to fetch appointments');
        const appointmentsData = await appointmentsRes.json();

        const booked: { [key: string]: string[] } = {};
        appointmentsData.appointments.forEach((apt: any) => {
          const dateStr = format(new Date(apt.date), 'yyyy-MM-dd');
          if (!booked[dateStr]) booked[dateStr] = [];
          booked[dateStr].push(apt.startTime);
        });
        setBookedSlots(booked);

        if (scheduleData.schedule) {
          const today = new Date();
          // Access the nested schedule array correctly with explicit type annotation
          const availableDays = scheduleData.schedule.schedule.map((s: ScheduleItem) => s.day);
          const unavailableDatesSet = new Set(scheduleData.schedule.unavailableDates);

          const dates: Date[] = [];
          for (let i = 0; i < 30; i++) {
            const date = addDays(today, i);
            const dayName = getDayName(date);
            const dateStr = format(date, 'yyyy-MM-dd');

            if (availableDays.includes(dayName) && !unavailableDatesSet.has(dateStr)) {
              dates.push(date);
            }
          }
          setAvailableDates(dates);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Failed to load doctor's availability. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleAndAppointments();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctorSchedule) {
      const dayName = getDayName(selectedDate);
      // Access the nested schedule array with explicit type annotation
      const daySchedule = doctorSchedule.schedule.find((s: ScheduleItem) => s.day === dayName);

      if (daySchedule) {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const bookedTimesForDate = bookedSlots[dateString] || [];

        const availableTimes = TIME_SLOTS.filter(time => {
          const isWithinDoctorHours = daySchedule.slots.some(
            slot => slot.startTime <= time && slot.endTime >= time
          );
          const isNotBooked = !bookedTimesForDate.includes(time);
          return isWithinDoctorHours && isNotBooked;
        });

        setAvailableTimeSlots(availableTimes);
      } else {
        setAvailableTimeSlots([]);
      }
    } else {
      setAvailableTimeSlots([]);
    }

    setSelectedTime(null);
    setEndTime(null);
  }, [selectedDate, doctorSchedule, bookedSlots]);

  useEffect(() => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      let endHours = hours;
      let endMinutes = minutes + 30;
      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }
      setEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
    } else {
      setEndTime(null);
    }
  }, [selectedTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !endTime || !reason.trim() || !patientName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          doctorName,
          patientId,
          patientName,
          date: selectedDate.toISOString(),
          startTime: selectedTime,
          endTime: endTime,
          reason: reason.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }
      onSuccess(data.appointment._id);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || fetchingPatient;
  const hasError = error && ((!selectedDate && availableDates.length === 0) || !patientName);

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-500 bg-opacity-50'}`}>
      <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto custom-scrollbar ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 text-lg font-bold ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Book Appointment with {doctorName}
        </h2>

        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-blue-500' : 'border-blue-600'}`}></div>
          </div>
        ) : hasError ? (
          <div className={`p-4 mb-4 rounded ${darkMode ? 'bg-red-900' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {patientName && (
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Booking appointment for: <span className="font-medium">{patientName}</span>
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Select Date</label>
              <div className={`grid grid-cols-4 gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {availableDates.slice(0, 8).map(date => (
                  <button
                    key={date.toString()}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 text-center rounded text-sm transition-colors ${
                      selectedDate && date.toDateString() === selectedDate.toDateString()
                        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium">{format(date, 'EEE')}</div>
                    <div>{format(date, 'MMM d')}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Time</label>
                {availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimeSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-center rounded flex flex-col items-center justify-center transition-colors ${
                          selectedTime === time
                            ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                            : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Clock className="w-4 h-4 mb-1" />
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No available time slots for this date.
                  </p>
                )}
              </div>
            )}

            {selectedTime && (
              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-1">
                  Reason for Appointment
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className={`w-full p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border border-gray-300'
                  }`}
                  placeholder="Briefly describe the reason for your appointment..."
                  required
                />
              </div>
            )}

            {selectedDate && selectedTime && endTime && patientName && (
              <div className={`p-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-medium mb-2">Appointment Summary</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{selectedTime} - {endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doctor:</span>
                    <span className="font-medium">{doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span className="font-medium">{patientName}</span>
                  </div>
                </div>
              </div>
            )}

            {error && !hasError && (
              <div className={`p-3 rounded text-sm ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedDate || !selectedTime || !endTime || !reason.trim() || !patientName || submitting}
                className={`px-4 py-2 rounded ${
                  !selectedDate || !selectedTime || !endTime || !reason.trim() || !patientName || submitting
                    ? darkMode ? 'bg-blue-800 text-gray-400 cursor-not-allowed' : 'bg-blue-300 text-white cursor-not-allowed'
                    : darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
