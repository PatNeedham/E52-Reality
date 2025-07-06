import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import api, { Course } from '../services/api';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorText = styled.p`
  text-align: center;
  color: #dc3545;
  font-size: 1.1rem;
`;

const CreateButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 2rem;
  transition: all 0.2s ease;

  &:hover {
    background: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
  }
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const CourseCard = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const CourseTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.25rem;
`;

const CourseDescription = styled.p`
  color: #666;
  line-height: 1.5;
  margin: 0;
`;

const MyLibrary: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getUserCourses()
      .then(response => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch(_err => {
        setError('Failed to fetch courses.');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingText>Loading...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <Container>
      <Title>{t('my_library')}</Title>
      <CreateButton onClick={() => navigate('/create-course')}>Create New Course</CreateButton>
      {courses.length === 0 ? (
        <LoadingText>You haven't created any courses yet.</LoadingText>
      ) : (
        <CourseGrid>
          {courses.map(course => (
            <CourseCard key={course.id} onClick={() => navigate(`/course/${course.id}/history`)}>
              <CourseTitle>{course.name}</CourseTitle>
              <CourseDescription>{course.description}</CourseDescription>
            </CourseCard>
          ))}
        </CourseGrid>
      )}
    </Container>
  );
};

export default MyLibrary;
