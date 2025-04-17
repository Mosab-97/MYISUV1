// Sidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // Assuming you're using react-router for routing

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4">
      <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
      <ul className="space-y-4">
        <li><Link to="/courses" className="hover:text-blue-400">Courses</Link></li>
        <li><Link to="/assignments" className="hover:text-blue-400">Assignments</Link></li>
        <li><Link to="/grades" className="hover:text-blue-400">Grades</Link></li>
        <li><Link to="/attendance" className="hover:text-blue-400">Attendance</Link></li>
        <li><Link to="/notifications" className="hover:text-blue-400">Notifications</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;

