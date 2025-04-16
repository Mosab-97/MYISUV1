export type UserRole = 'student' | 'faculty';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Course {
  id: string;
  course_name: string;
  course_code: string;
  faculty_id: string;
}

export interface StudentCourse {
  id: string;
  user_id: string;
  course_id: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  course_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  status: 'present' | 'late' | 'absent';
  date: string;
}

export interface Grade {
  id: string;
  user_id: string;
  course_id: string;
  final_grade: number;
  posted_at: string;
}

export interface ContactMessage {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
}