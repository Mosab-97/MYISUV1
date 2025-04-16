/*
  # Initial Schema Setup for MYISU University Portal

  1. Tables
    - users (handled by Supabase Auth)
    - courses (course information)
    - student_courses (enrollment)
    - attendance (student attendance records)
    - grades (student grades)
    - contact_messages (user messages)

  2. Security
    - RLS policies for each table
    - Faculty access to their courses and related data
    - Student access to their own data only
*/

-- Enable RLS and create policies for existing auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON auth.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  faculty_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_code)
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can manage their courses"
ON courses FOR ALL
TO authenticated
USING (faculty_id = auth.uid());

CREATE POLICY "Students can view all courses"
ON courses FOR SELECT
TO authenticated
USING (true);

-- Student Courses (Enrollment)
CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their enrollments"
ON student_courses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Faculty can view their course enrollments"
ON student_courses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = student_courses.course_id
    AND courses.faculty_id = auth.uid()
  )
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view and create their attendance"
ON attendance FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Faculty can view and manage attendance for their courses"
ON attendance FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = attendance.course_id
    AND courses.faculty_id = auth.uid()
  )
);

-- Grades Table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  final_grade NUMERIC(5,2) CHECK (final_grade >= 0 AND final_grade <= 100),
  posted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their grades"
ON grades FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Faculty can manage grades for their courses"
ON grades FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = grades.course_id
    AND courses.faculty_id = auth.uid()
  )
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create messages"
ON contact_messages FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Faculty can view all messages"
ON contact_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'faculty'
  )
);

CREATE POLICY "Users can view their own messages"
ON contact_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid());