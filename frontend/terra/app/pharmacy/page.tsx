"use client"
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Settings } from 'lucide-react';

const HealthcareCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  type Appointment = {
    id: string;
    type: string;
    title: string;
    date: string;
    time: string;
    description: string;
    recurring: boolean;
  };
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dailyCheckInTime, setDailyCheckInTime] = useState('10:00');
  const [lastAppointmentDate, setLastAppointmentDate] = useState('');
  const [askedForLastAppointment, setAskedForLastAppointment] = useState(false);

  // Initialize with some sample data and daily AI check-ins
  useEffect(() => {
    generateAppointments();
  }, [dailyCheckInTime]);

  const generateAppointments = () => {
    const newAppointments = [];
    const today = new Date();
    
    // Generate AI Recovery Check-ins for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      newAppointments.push({
        id: `ai-checkin-${i}`,
        type: 'ai-checkin',
        title: 'AI Recovery Check-in',
        date: date.toISOString().split('T')[0],
        time: dailyCheckInTime,
        description: 'Daily AI assistant check-in for post-hospitalization recovery support',
        recurring: true
      });
    }

    // Only add sample doctor appointments if user hasn't entered their last appointment
    if (askedForLastAppointment) {
      for (let i = 1; i <= 4; i++) {
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + (i * 14)); // Every 2 weeks
        
        newAppointments.push({
          id: `doctor-${i}`,
          type: 'doctor',
          title: 'Follow-up Appointment',
          date: appointmentDate.toISOString().split('T')[0],
          time: '14:00',
          description: 'Regular follow-up appointment with Dr. Smith',
          recurring: false
        });
      }
    }

    setAppointments(newAppointments);
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateString);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'ai-checkin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'doctor': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'ai-checkin': return <span className="text-lg">🤖</span>;
      case 'doctor': return <span className="text-lg">🩺</span>;
      default: return <span className="text-lg">📅</span>;
    }
  };

  // Helper function to format time to 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Function to handle last appointment submission
  const handleLastAppointmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lastAppointmentDate) return;
    
    // Add a doctor appointment 2 weeks after the entered date
    const lastDate = new Date(lastAppointmentDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 14);
    
    const newAppointmentFromLast = {
      id: `doctor-auto-${Date.now()}`,
      type: 'doctor',
      title: 'Follow-up Appointment',
      date: nextDate.toISOString().split('T')[0],
      time: '14:00',
      description: 'Auto-scheduled follow-up appointment (2 weeks after your last)',
      recurring: false,
    };
    
    setAppointments([...appointments, newAppointmentFromLast]);
    setAskedForLastAppointment(true);
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthcare Calendar</h1>
        <p className="text-gray-600">Manage your doctor appointments and daily AI recovery check-ins</p>
      </div>

      {/* Last Appointment Prompt - Show this FIRST if not asked yet */}
      {!askedForLastAppointment && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Welcome! Let's set up your follow-up appointments</h2>
          <form onSubmit={handleLastAppointmentSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-lg font-medium text-blue-900 mb-2">
                When was your last doctor appointment?
              </label>
              <p className="text-sm text-blue-700 mb-3">
                We'll automatically schedule your next follow-up appointment 2 weeks from this date.
              </p>
              <input
                type="date"
                value={lastAppointmentDate}
                onChange={e => setLastAppointmentDate(e.target.value)}
                className="px-4 py-2 border border-blue-300 rounded-md text-lg"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Schedule Follow-up Appointment
              </button>
              <button
                type="button"
                onClick={() => setAskedForLastAppointment(true)}
                className="px-6 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Daily AI Check-in Time:</label>
            <input
              type="time"
              value={dailyCheckInTime}
              onChange={(e) => setDailyCheckInTime(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-sm text-gray-600">({formatTime(dailyCheckInTime)})</span>
          </div>
          {askedForLastAppointment && (
            <button
              onClick={() => {
                setAskedForLastAppointment(false);
                setLastAppointmentDate('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Update Last Appointment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                →
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2 h-20"></div>;
                }

                const dayAppointments = getAppointmentsForDate(day);
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-1 h-20 border border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-blue-200' : ''
                    } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className={`text-xs px-1 py-0.5 rounded border ${getAppointmentTypeColor(apt.type)}`}
                        >
                          {apt.type === 'ai-checkin' ? 'AI Check' : apt.title}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayAppointments.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">{formatDate(selectedDate)}</h3>
            
            {selectedDateAppointments.length === 0 ? (
              <p className="text-gray-500 text-sm">No appointments scheduled</p>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className={`p-3 rounded-lg border ${getAppointmentTypeColor(apt.type)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getAppointmentIcon(apt.type)}
                      <span className="font-medium">{apt.title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm mb-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(apt.time)}</span>
                    </div>
                    <p className="text-sm">{apt.description}</p>
                    {apt.recurring && (
                      <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-2">
                        Daily
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">Appointment Types</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>AI Recovery Check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🩺</span>
                <span>Doctor Appointment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareCalendar;