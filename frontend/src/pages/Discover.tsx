import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const Discover: FC = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicCourses()
      .then(response => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch(_err => {
        setError('Failed to fetch public courses.');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingText>Loading...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <Container>
      <Title>{t('discover')}</Title>
      {courses.length === 0 ? (
        <EmptyState>No public courses available at the moment.</EmptyState>
      ) : (
        <CourseGrid>
          {courses.map(course => (
            <CourseCard key={course.id}>
              <CourseTitle>{course.name}</CourseTitle>
              <CourseDescription>{course.description}</CourseDescription>
              <p>
                <strong>Price:</strong> ${course.price}
              </p>
              <button>Purchase</button>
            </CourseCard>
          ))}
        </CourseGrid>
      )}
    </Container>
  );
};

export default Discover;
