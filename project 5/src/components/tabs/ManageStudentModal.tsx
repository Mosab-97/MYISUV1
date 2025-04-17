// src/components/tabs/ManageStudentModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CSVLink } from 'react-csv';

const ManageStudentModal = ({ student, onClose }: any) => {
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [newGrade, setNewGrade] = useState('');
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch Attendance History for this student
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', student.id);
        
        if (attendanceError) throw attendanceError;
        setAttendanceHistory(attendanceData || []);

        // Fetch Grades for this student
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select('*')
          .eq('student_id', student.id);
        
        if (gradesError) throw gradesError;
        setGrades(gradesData || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, [student.id]);

  const handleMarkAttendance = async () => {
    const { error } = await supabase.from('attendance').insert([
      {
        user_id: student.id,
        course_id: student.course_id,
        status: attendanceStatus,
        date: new Date().toISOString().split('T')[0],
        clock_in_time: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert('Error marking attendance');
    } else {
      alert('Attendance marked');
      onClose();
    }
  };

  const handleGradeChange = async () => {
    const { error } = await supabase.from('grades').upsert([
      {
        student_id: student.id,
        course_id: student.course_id,
        grade: newGrade,
      },
    ]);

    if (error) {
      alert('Error updating grade');
    } else {
      alert('Grade updated');
      onClose();
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setFile(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const handleCSVUpload = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result?.toString();
      if (!csvData) return;

      const rows = csvData.split('\n').map((row) => row.split(','));

      for (let row of rows) {
        const [studentEmail, grade] = row;

        // Find student ID by email and update grade
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('id')
          .eq('email', studentEmail)
          .single();

        if (studentError) continue; // Skip if student is not found

        await supabase.from('grades').upsert([
          {
            student_id: studentData.id,
            course_id: student.course_id,
            grade: grade,
          },
        ]);
      }

      alert('CSV upload complete');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Manage Student</h2>
        <p><strong>Name:</strong> {student.full_name}</p>
        <p><strong>Email:</strong> {student.email}</p>

        <div className="mt-4">
          <label>Status:</label>
          <select
            className="block mt-1 border rounded p-2 w-full"
            value={attendanceStatus}
            onChange={(e) => setAttendanceStatus(e.target.value)}
          >
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <div className="mt-4 flex justify-between">
          <button onClick={handleMarkAttendance} className="px-4 py-2 bg-blue-600 text-white rounded">
            Mark Attendance
          </button>

          <div>
            <h3 className="font-semibold mt-4">Enter Grade</h3>
            <input
              type="number"
              placeholder="Enter Grade"
              className="mt-1 border rounded p-2"
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
            />
            <button onClick={handleGradeChange} className="px-4 py-2 bg-green-600 text-white rounded mt-2">
              Update Grade
            </button>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Attendance History</h3>
          <table className="w-full mt-2 table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2">{entry.date}</td>
                  <td className="border px-4 py-2">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Grades</h3>
          <table className="w-full mt-2 table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Course</th>
                <th className="px-4 py-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td className="border px-4 py-2">{grade.course_name}</td>
                  <td className="border px-4 py-2">{grade.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Upload Grades via CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mt-1 p-2 border rounded"
          />
          <button
            onClick={handleCSVUpload}
            className="px-4 py-2 bg-orange-600 text-white rounded mt-2"
          >
            Upload CSV
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ManageStudentModal;

