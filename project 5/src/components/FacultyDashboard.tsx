import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, GraduationCap, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Course, ContactMessage } from '../types';

const FacultyDashboard = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch faculty courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('faculty_id', user.id);

        if (coursesData) {
          setCourses(coursesData);
        }

        // Fetch contact messages
        const { data: messagesData } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (messagesData) {
          setMessages(messagesData);
        }
      } catch (error) {
        console.error('Error fetching faculty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            course_name: newCourse.name,
            course_code: newCourse.code,
            faculty_id: user.id,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setCourses([...courses, data[0]]);
        setNewCourse({ name: '', code: '' });
      }
    } catch (error) {
      console.error('Error creating course:', error);
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
        {t('dashboard.faculty.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manage Courses Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.faculty.manageCourses')}</h2>
          </div>

          <form onSubmit={handleCreateCourse} className="mb-4 space-y-3">
            <input
              type="text"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              placeholder="Course Name"
              className="input"
              required
            />
            <input
              type="text"
              value={newCourse.code}
              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
              placeholder="Course Code"
              className="input"
              required
            />
            <button type="submit" className="btn btn-primary w-full">
              Create Course
            </button>
          </form>

          <div className="space-y-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{course.course_name}</p>
                  <p className="text-sm text-gray-600">{course.course_code}</p>
                </div>
                <button className="btn btn-secondary">
                  {t('common.edit')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.faculty.messages')}</h2>
          </div>
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="p-4 bg-gray-50 rounded-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{message.full_name}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{message.email}</p>
                <p className="mt-2">{message.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;