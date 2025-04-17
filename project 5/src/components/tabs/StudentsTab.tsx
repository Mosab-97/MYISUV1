import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const StudentsTab = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .ilike('full_name', `%${searchTerm}%`) // Searching by name
        .or(`email.ilike.%${searchTerm}%`) // OR search by email
        .eq('role', 'student');

      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data);
      }
      setLoading(false);
    };

    fetchStudents();
  }, [searchTerm]); // Re-fetch data whenever search term changes

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Search Students</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name or email"
        className="p-2 border border-gray-300 rounded-md w-full"
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.id} className="p-4 bg-gray-100 rounded-md">
              <p><strong>Name:</strong> {student.full_name}</p>
              <p><strong>Email:</strong> {student.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentsTab;

