// CalendarView.tsx
import React from 'react';
import Calendar from 'react-calendar'; // Assuming you're using react-calendar

const CalendarView = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
      <Calendar />
    </div>
  );
};

export default CalendarView;

