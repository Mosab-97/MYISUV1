import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Grade, Course } from "../../types";

const GradesTab = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoursesAndGrades = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .eq("faculty_id", user.id);

        if (coursesError) throw coursesError;
        if (coursesData) setCourses(coursesData);

        const { data: gradesData, error: gradesError } = await supabase
          .from("grades")
          .select("*")
          .in("course_id", coursesData.map((c) => c.id));

        if (gradesError) throw gradesError;
        if (gradesData) setGrades(gradesData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndGrades();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading grades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Grades</h2>
      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        courses.map((course) => (
          <div key={course.id} className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-bold mb-2">{course.course_name}</h3>
            <div className="space-y-2">
              {grades
                .filter((grade) => grade.course_id === course.id)
                .map((grade) => (
                  <div
                    key={grade.id}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    <span>{grade.student_name || grade.student_id}</span>
                    <span className="font-medium">{grade.grade}%</span>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GradesTab;

