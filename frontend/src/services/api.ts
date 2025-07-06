// src/services/api.ts
import axios, { AxiosResponse } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interfaces for API data
export interface Course {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  current_version_id?: string;
  is_public: boolean;
  price: string;
  created_at: string;
  updated_at: string;
  course_data?: any;
}

export interface CourseVersion {
  id: string;
  commit_message: string;
  created_at: string;
}

export default {
  // Course methods
  createCourse(data: { name: string; description: string }): Promise<AxiosResponse<Course>> {
    return apiClient.post('/api/courses', data);
  },
  getUserCourses(): Promise<AxiosResponse<Course[]>> {
    return apiClient.get('/api/courses/my-library');
  },
  getCourseById(courseId: string): Promise<AxiosResponse<Course>> {
    return apiClient.get(`/api/courses/${courseId}`);
  },

  // Versioning methods
  saveVersion(
    courseId: string,
    data: { commit_message: string; course_data: any }
  ): Promise<AxiosResponse<{ versionId: string }>> {
    return apiClient.post(`/api/courses/${courseId}/versions`, data);
  },
  getCourseHistory(courseId: string): Promise<AxiosResponse<CourseVersion[]>> {
    return apiClient.get(`/api/courses/${courseId}/history`);
  },
  getVersionData(versionId: string): Promise<AxiosResponse<any>> {
    return apiClient.get(`/api/courses/versions/${versionId}/data`);
  },

  // Marketplace methods
  publishCourse(
    courseId: string,
    data: { is_public: boolean; price: number }
  ): Promise<AxiosResponse<Course>> {
    return apiClient.patch(`/api/courses/${courseId}/publish`, data);
  },
  getPublicCourses(): Promise<AxiosResponse<Course[]>> {
    return apiClient.get('/api/courses/discover');
  },
};
