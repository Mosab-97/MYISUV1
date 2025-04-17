// AttendanceCalendar.tsx
import React from 'react';
import Calendar from 'react-calendar'; // You can use different libraries for color coding

const AttendanceCalendar = ({ attendance }: { attendance: any[] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Attendance</h2>
      <Calendar />
    </div>
  );
};

export default AttendanceCalendar;

