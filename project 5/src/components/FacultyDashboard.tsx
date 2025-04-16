import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, GraduationCap, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Course, Attendance, Grade, ContactMessage, Announcement, Student } from '../types';

const FacultyDashboard = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [facultyName, setFacultyName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('');

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch faculty profile details
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (profileData) {
          setFacultyName(profileData.full_name);
          setRole(profileData.role); // Get faculty role (admin or teacher)
        }

        // Fetch courses for the logged-in faculty
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('faculty_id', user.id);

        if (coursesData) {
          setCourses(coursesData);
        }

        // Fetch students enrolled in courses
        const { data: studentsData } = await supabase
          .from('student_courses')
          .select('user_id, courses(course_name)')
          .eq('faculty_id', user.id);

        if (studentsData) {
          setStudents(studentsData.map((sc: any) => sc.user_id));
        }

        // Fetch attendance for the logged-in faculty (if admin role)
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('faculty_id', user.id);

        if (attendanceData) {
          setAttendance(attendanceData);
        }

        // Fetch grades for the logged-in faculty
        const { data: gradesData } = await supabase
          .from('grades')
          .select('*')
          .eq('faculty_id', user.id);

        if (gradesData) {
          setGrades(gradesData);
        }

        // Fetch messages for the logged-in faculty (if admin role)
        const { data: messagesData } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (messagesData) {
          setMessages(messagesData);
        }

        // Fetch announcements for the logged-in faculty (if admin role)
        const { data: announcementsData } = await supabase
          .from('announcements')
          .select('*')
          .eq('faculty_id', user.id);

        if (announcementsData) {
          setAnnouncements(announcementsData);
        }
      } catch (error) {
        console.error('Error fetching faculty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  const handleAttendanceFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttendanceDate(e.target.value);
  };

  const handleAttendanceStatusFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttendanceStatusFilter(e.target.value);
  };

  const handleMarkAttendance = async (studentId: string, courseId: string, status: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();

      // Check if student is already marked for the day
      const existingAttendance = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('date', now.toISOString().split('T')[0])
        .single();

      if (existingAttendance) {
        alert('Attendance already marked for today!');
        return;
      }

      // Insert attendance record
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            student_id: studentId,
            course_id: courseId,
            status,
            date: now.toISOString().split('T')[0],
            clock_in_time: now.toISOString(),
          },
        ]);

      if (error) {
        console.error('Error marking attendance:', error);
      } else {
        setAttendance([data[0], ...attendance]);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleExportAttendance = () => {
    const dataToExport = attendance.filter((att) => {
      return (
        (!attendanceDate || att.date === attendanceDate) &&
        (!attendanceStatusFilter || att.status === attendanceStatusFilter)
      );
    });
    const csvData = dataToExport.map((att) => {
      return {
        Date: att.date,
        Course: att.course_id,
        Status: att.status,
        'Clock In Time': att.clock_in_time,
        'Clock Out Time': att.clock_out_time,
      };
    });
    const csvContent = `Date, Course, Status, Clock In Time, Clock Out Time\n${csvData
      .map((row) => Object.values(row).join(','))
      .join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendance.csv';
    link.click();
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
      <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.faculty.title')}</h1>
      <p className="text-lg text-gray-600">
        Welcome, <span className="font-semibold">{facultyName}</span>
      </p>

      {/* Attendance Filtering */}
      <div className="flex gap-4">
        <input
          type="date"
          value={attendanceDate}
          onChange={handleAttendanceFilterChange}
          className="p-2 rounded border"
        />
        <select
          value={attendanceStatusFilter}
          onChange={handleAttendanceStatusFilterChange}
          className="p-2 rounded border"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
        <button
          onClick={handleExportAttendance}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Export Attendance
        </button>
      </div>

      {/* Courses List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">{t('dashboard.faculty.courses')}</h2>
        </div>
        <div className="space-y-2">
          {courses.length === 0 ? (
            <p className="text-gray-500">{t('dashboard.faculty.noCourses')}</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{course.course_name}</p>
                <p className="text-sm text-gray-600">{course.course_code}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">{t('dashboard.faculty.attendance')}</h2>
        </div>
        <div className="space-y-2">
          {attendance.length === 0 ? (
            <p className="text-gray-500">{t('dashboard.faculty.noAttendance')}</p>
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
                <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                <p className={`text-sm ${record.status === 'present' ? 'text-green-600' : record.status === 'late' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {t(`dashboard.faculty.status.${record.status}`)}
                </p>
                <p className="text-xs text-gray-500">{new Date(record.clock_in_time).toLocaleTimeString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

