import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Course, Attendance, Grade } from '../types';

const StudentDashboard = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockInError, setClockInError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRole, setStudentRole] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('User ID:', user.id);

        // Fetch name + role from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        console.log('Profile data:', profileData);
        console.log('Profile error:', profileError);

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

        // Fetch attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (attendanceData) {
          setAttendance(attendanceData);
        }

        // Fetch grades
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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">
        {studentName ? `${studentName}'s Dashboard` : t('dashboard.student.title')}
      </h1>

      {studentName && studentRole && (
        <p className="text-gray-600 text-lg">
          Welcome back, <span className="font-semibold">{studentName}</span>! You are logged in as a <span className="italic">{studentRole}</span>.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Courses Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.student.myCourses')}</h2>
          </div>
          <div className="space-y-2">
            {courses.length === 0 ? (
              <p className="text-gray-500">{t('dashboard.student.noCourses')}</p>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="p-3 bg-gray-50 rounded-md"
                >
                  <p className="font-medium">{course.course_name}</p>
                  <p className="text-sm text-gray-600">{course.course_code}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.student.attendance')}</h2>
          </div>
          <div className="mb-4">
            <button
              onClick={handleClockIn}
              className="btn btn-primary w-full mb-2"
            >
              {t('dashboard.student.clockIn')}
            </button>
            {clockInError && (
              <p className="text-red-600 text-sm">{clockInError}</p>
            )}
          </div>
          <div className="space-y-2">
            {attendance.length === 0 ? (
              <p className="text-gray-500">{t('dashboard.student.noAttendance')}</p>
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
                    {t(`dashboard.student.status.${record.status}`)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.clock_in_time).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grades Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.student.grades')}</h2>
          </div>
          <div className="space-y-2">
            {grades.length === 0 ? (
              <p className="text-gray-500">{t('dashboard.student.noGrades')}</p>
            ) : (
              grades.map((grade) => (
                <div
                  key={grade.id}
                  className={`p-3 rounded-md ${
                    grade.final_grade >= 90
                      ? 'bg-green-50'
                      : grade.final_grade >= 70
                      ? 'bg-yellow-50'
                      : 'bg-red-50'
                  }`}
                >
                  <p className="font-medium">
                    Grade: {grade.final_grade}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Posted: {new Date(grade.posted_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

