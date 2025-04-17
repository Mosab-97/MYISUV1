import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Course, CourseMaterial } from '../../types';

const CoursesTab = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoursesAndMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch courses assigned to faculty
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('faculty_id', user.id);
      if (courseError) {
        console.error('Error fetching courses:', courseError);
      }
      setCourses(courseData || []);

      // Fetch course materials associated with faculty
      const { data: materialsData, error: materialsError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('faculty_id', user.id);
      if (materialsError) {
        console.error('Error fetching course materials:', materialsError);
      }
      setCourseMaterials(materialsData || []);

      setLoading(false);
    };

    fetchCoursesAndMaterials();
  }, []);

  const handleUploadMaterial = async (courseId: string, file: File, type: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload file to Supabase Storage
    const filePath = `${user.id}/courses/${courseId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }

    // Insert file info into the course materials table
    const { data, error } = await supabase
      .from('course_materials')
      .insert([
        {
          faculty_id: user.id,
          course_id: courseId,
          file_url: filePath,
          file_type: type,
          due_date: null, // Set a due date if necessary
        },
      ]);
    if (error) {
      console.error('Error inserting course material:', error);
    } else {
      setCourseMaterials((prev) => [data![0], ...prev]);
    }
  };

  const handleDueDate = async (materialId: string, dueDate: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('course_materials')
      .update({ due_date: dueDate })
      .eq('id', materialId);

    if (error) {
      console.error('Error updating due date:', error);
    } else {
      setCourseMaterials((prev) => 
        prev.map((material) => (material.id === materialId ? { ...material, due_date: dueDate } : material))
      );
    }
  };

  const handleAccessControl = async (materialId: string, restrictAccess: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('course_materials')
      .update({ restricted_access: restrictAccess })
      .eq('id', materialId);

    if (error) {
      console.error('Error updating access control:', error);
    } else {
      setCourseMaterials((prev) => 
        prev.map((material) => (material.id === materialId ? { ...material, restricted_access: restrictAccess } : material))
      );
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">Course Materials</h2>

      {courses.map((course) => (
        <div key={course.id} className="border rounded-md p-6 bg-gray-50 shadow-md">
          <h3 className="text-2xl font-semibold">{course.course_name}</h3>
          <p className="text-gray-600">{course.course_code}</p>

          <div className="mt-4">
            <h4 className="font-medium">Upload Materials</h4>
            <input
              type="file"
              accept=".pdf, .mp4, .jpg, .png"
              onChange={(e) => {
                if (e.target.files) {
                  const file = e.target.files[0];
                  handleUploadMaterial(course.id, file, file.type);
                }
              }}
              className="mt-2 p-2 border rounded"
            />
          </div>

          <div className="mt-4">
            <h4 className="font-medium">Course Materials</h4>
            <ul>
              {courseMaterials
                .filter((material) => material.course_id === course.id)
                .map((material) => (
                  <li key={material.id} className="border p-4 rounded-md my-2 bg-white shadow">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {material.file_type === 'application/pdf' ? '📄' : '📽️'}{' '}
                          {material.file_url.split('/').pop()}
                        </p>
                        {material.due_date && (
                          <p className="text-sm text-gray-500">Due Date: {material.due_date}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleAccessControl(material.id, !material.restricted_access)}
                          className={`${
                            material.restricted_access ? 'bg-red-500' : 'bg-green-500'
                          } text-white p-2 rounded`}
                        >
                          {material.restricted_access ? 'Restrict Access' : 'Grant Access'}
                        </button>
                        <button
                          onClick={() => handleDueDate(material.id, prompt('Enter due date (YYYY-MM-DD):')!)}
                          className="bg-blue-600 text-white p-2 rounded"
                        >
                          Set Due Date
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoursesTab;

