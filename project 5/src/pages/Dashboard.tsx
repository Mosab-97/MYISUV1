import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import StudentDashboard from '../components/StudentDashboard';
import FacultyDashboard from '../components/FacultyDashboard';
import type { User } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Check for the current authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          // If no user is authenticated, navigate to login
          navigate('/login');
          return;
        }

        // Fetch additional user data from the 'users' table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          setUser(userData as User); // Set the user state if data exists
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      } finally {
        setLoading(false); // Stop loading state once done
      }
    };

    getUser();
  }, [navigate]); // Run only once when the component is mounted

  if (loading) {
    // Show loading screen while fetching user data
    return <div>Loading...</div>;
  }

  if (!user) {
    // If user is not found or there's an error, navigate to login page
    navigate('/login');
    return null; // Prevent rendering if no user data
  }

  // Based on user role, render the appropriate dashboard
  return user.role === 'student' ? <StudentDashboard /> : <FacultyDashboard />;
};

export default Dashboard;

