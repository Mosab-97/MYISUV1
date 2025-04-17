// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">MYISU</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">
              {t('nav.dashboard')}
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-blue-600">
              {t('nav.contact')}
            </Link>
            
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {t('nav.language')}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

