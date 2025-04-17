// components/Attendance.tsx
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const Attendance = () => {
  const { t } = useTranslation();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [clockInError, setClockInError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileData?.full_name) setStudentName(profileData.full_name);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (attendanceData) setAttendance(attendanceData);
      setLoading(false);
    };

    fetchAttendance();
  }, []);

  const handleClockIn = async () => {
    setClockInError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    const isMorning = (currentHour === 8 && currentMinutes >= 45) || (currentHour === 9 && currentMinutes <= 15);
    const isAfternoon = (currentHour === 13 && currentMinutes >= 45) || (currentHour === 14 && currentMinutes <= 15);

    if (!isMorning && !isAfternoon) {
      setClockInError('You are outside the clock-in window.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existing) {
      setClockInError('You have already clocked in today.');
      return;
    }

    const isLate = (currentHour === 9 && currentMinutes > 0) || (currentHour === 14 && currentMinutes > 0);
    const status = isLate ? 'late' : 'present';

    const { data, error } = await supabase
      .from('attendance')
      .insert([{ user_id: user.id, clock_in_time: now.toISOString(), date: today, status }])
      .select();

    if (error) {
      console.error('Clock-in error:', error);
      setClockInError('An error occurred while clocking in.');
      return;
    }

    if (data) {
      setAttendance([data[0], ...attendance]);
    }
  };

  if (loading) {
    return <p className="text-center">Loading attendance...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Attendance</h2>
      </div>

      {studentName && (
        <p className="text-gray-700 mb-4">Welcome, <strong>{studentName}</strong></p>
      )}

      <button
        onClick={handleClockIn}
        className="btn btn-primary bg-blue-600 text-white px-4 py-2 rounded-md mb-4 hover:bg-blue-700"
      >
        Clock In
      </button>

      {clockInError && (
        <p className="text-red-600 mb-2">{clockInError}</p>
      )}

      <div className="space-y-2">
        {attendance.length === 0 ? (
          <p className="text-gray-500">No attendance records yet.</p>
        ) : (
          attendance.map((record) => (
            <div
              key={record.id}
              className={`p-3 rounded-md ${
                record.status === 'present'
                  ? 'bg-green-50'
                  : record.status === 'late'
                  ? 'bg-yellow-50'
                  : 'bg-red-50'
              }`}
            >
              <p className="font-medium">
                {new Date(record.date).toLocaleDateString()}
              </p>
              <p className={`text-sm ${
                record.status === 'present'
                  ? 'text-green-600'
                  : record.status === 'late'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </p>
              <p className="text-xs text-gray-500">
                {record.clock_in_time && new Date(record.clock_in_time).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Attendance;

