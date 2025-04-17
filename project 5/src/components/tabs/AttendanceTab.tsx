import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Attendance, Course } from '../../types';

const AttendanceTab = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch courses
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('faculty_id', user.id);
      setCourses(courseData || []);

      // Fetch students
      const { data: studentData } = await supabase
        .from('student_courses')
        .select('user_id, course_id, users(full_name, email)')
        .eq('faculty_id', user.id);
      setStudents(studentData || []);

      // Fetch attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('faculty_id', user.id);
      setAttendance(attendanceData || []);
    };

    fetchData();
  }, []);

  const handleMarkAttendance = async (
    studentId: string,
    courseId: string,
    status: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already marked today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      alert('Already marked attendance for today.');
      return;
    }

    // Insert new attendance
    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
          status,
          date: today,
          clock_in_time: now,
        },
      ])
      .select();

    if (error) {
      console.error('Error marking attendance:', error);
    } else {
      setAttendance((prev) => [data![0], ...prev]);
    }
  };

  const filteredAttendance = attendance.filter((att) => {
    return (
      (!dateFilter || att.date === dateFilter) &&
      (!statusFilter || att.status === statusFilter)
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Course ID', 'Student ID', 'Status', 'Clock In', 'Clock Out'];
    const rows = filteredAttendance.map((a) => [
      a.date,
      a.course_id,
      a.student_id,
      a.status,
      a.clock_in_time,
      a.clock_out_time || '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    a.click();
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Attendance Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
        <button
          onClick={exportToCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {students.map((student) => {
          const course = courses.find((c) => c.id === student.course_id);
          return (
            <div
              key={`${student.user_id}-${student.course_id}`}
              className="p-4 border rounded space-y-1"
            >
              <p className="font-medium">{student.users.full_name}</p>
              <p className="text-sm text-gray-500">{student.users.email}</p>
              <p className="text-sm text-gray-400 italic">
                Course: {course?.course_name}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded"
                  onClick={() =>
                    handleMarkAttendance(student.user_id, student.course_id, 'present')
                  }
                >
                  Present
                </button>
                <button
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                  onClick={() =>
                    handleMarkAttendance(student.user_id, student.course_id, 'late')
                  }
                >
                  Late
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() =>
                    handleMarkAttendance(student.user_id, student.course_id, 'absent')
                  }
                >
                  Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance History */}
      <div className="mt-10">
        <h3 className="text-lg font-bold mb-3">Attendance History</h3>
        <div className="space-y-2">
          {filteredAttendance.length === 0 ? (
            <p className="text-gray-500">No records found.</p>
          ) : (
            filteredAttendance.map((record) => (
              <div key={record.id} className="border p-3 rounded">
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(record.date).toLocaleDateString()}
                </p>
                <p>Status: {record.status}</p>
                <p className="text-sm text-gray-400">Student ID: {record.student_id}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTab;

