// UpcomingAssignments.tsx
import React from 'react';

const UpcomingAssignments = ({ assignments }: { assignments: any[] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upcoming Assignments</h2>
      {assignments.map((assignment, index) => (
        <div key={index} className="mb-3 p-3 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium">{assignment.title}</h3>
          <p className="text-sm text-gray-600">Course: {assignment.course}</p>
          <p className="text-sm text-gray-500">Due Date: {assignment.dueDate}</p>
        </div>
      ))}
    </div>
  );
};

export default UpcomingAssignments;

