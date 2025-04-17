import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import CoursesSection from './CoursesSection';
import UpcomingAssignments from './UpcomingAssignments';
import CalendarView from './CalendarView';
import AttendanceCalendar from './AttendanceCalendar';
import Notifications from './Notifications';
import type { Course, Attendance, Grade } from '../types';

const StudentDashboard = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [studentRole, setStudentRole] = useState('');
  const [clockInError, setClockInError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('User ID:', user.id); // Debugging statement

        // Fetch name + role from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profileData?.full_name) {
          setStudentName(profileData.full_name);
        }
        if (profileData?.role) {
          setStudentRole(profileData.role);
        }

        // Fetch enrolled courses
        const { data: enrolledCourses } = await supabase
          .from('student_courses')
          .select(`
            course_id,
            courses (*)
          `)
          .eq('user_id', user.id);

        if (enrolledCourses) {
          setCourses(enrolledCourses.map((ec: any) => ec.courses));
        }

        // Fetch attendance data
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (attendanceData) {
          setAttendance(attendanceData);
        }

        // Fetch grades data
        const { data: gradesData } = await supabase
          .from('grades')
          .select('*')
          .eq('user_id', user.id);

        if (gradesData) {
          setGrades(gradesData);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleClockIn = async () => {
    try {
      setClockInError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      const isMorningWindow = (currentHour === 8 && currentMinutes >= 45) ||
                              (currentHour === 9 && currentMinutes <= 15);

      const isAfternoonWindow = (currentHour === 13 && currentMinutes >= 45) ||
                                (currentHour === 14 && currentMinutes <= 15);

      if (!isMorningWindow && !isAfternoonWindow) {
        setClockInError(t('dashboard.student.outsideWindow'));
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existingAttendance) {
        setClockInError(t('dashboard.student.alreadyClockedIn'));
        return;
      }

      const isLate = (currentHour === 9 && currentMinutes > 0) ||
                     (currentHour === 14 && currentMinutes > 0);
      const status = isLate ? 'late' : 'present';

      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: user.id,
            clock_in_time: now.toISOString(),
            date: today,
            status,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setAttendance([data[0], ...attendance]);
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      setClockInError(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {studentName ? `${studentName}'s Dashboard` : t('dashboard.student.title')}
        </h1>

        {studentName && studentRole && (
          <p className="text-gray-600 text-lg">
            Welcome back, <span className="font-semibold">{studentName}</span>! You are logged in as a <span className="italic">{studentRole}</span>.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CoursesSection courses={courses} />
          <UpcomingAssignments assignments={[]} />
          <CalendarView />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <AttendanceCalendar attendance={attendance} />
          <Notifications />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

