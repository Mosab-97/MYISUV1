import React from 'react';
import { BookOpen } from 'lucide-react';

const CoursesSection = ({ courses }: { courses: any[] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-4">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Your Courses</h2>
      </div>
      <div className="space-y-4">
        {courses.length === 0 ? (
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
        ) : (
          courses.map((course, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-md shadow-sm">
              <h3 className="text-lg font-medium">{course.name}</h3>
              <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
              <p className="text-sm text-gray-500">Next class: {course.nextClassDate}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoursesSection;

