import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Once logged in, retrieve the user role from metadata
      const userRole = data?.user?.user_metadata?.role; // Check user metadata for role

      if (userRole === 'student') {
        // Navigate to student dashboard if role is 'student'
        navigate('/student-dashboard');
      } else if (userRole === 'faculty') {
        // Navigate to faculty dashboard if role is 'faculty'
        navigate('/faculty-dashboard');
      } else {
        // Handle the case where no role is assigned or an invalid role
        setError(t('auth.invalidRole'));
        navigate('/login');  // Optional: redirect to login or an error page
      }
    } catch (err: any) {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="h-12 w-12 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6">
          {t('auth.loginTitle')}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? t('common.loading') : t('common.login')}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          {t('common.register')}{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            {t('common.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

