import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import api, { CourseVersion } from '../services/api';

const CourseHistory: FC = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const [history, setHistory] = useState<CourseVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      api
        .getCourseHistory(courseId)
        .then(response => {
          setHistory(response.data);
          setLoading(false);
        })
        .catch(_err => {
          setError('Failed to fetch course history.');
          setLoading(false);
        });
    }
  }, [courseId]);

  const handleRevert = (versionId: string) => {
    if (courseId) {
      api.getVersionData(versionId).then(response => {
        const oldData = response.data;
        const commitMessage = `Reverted to version ${versionId.substring(0, 8)}`;
        api
          .saveVersion(courseId, { course_data: oldData, commit_message: commitMessage })
          .then(() => {
            alert('Successfully reverted!');
            api.getCourseHistory(courseId).then(res => setHistory(res.data));
          });
      });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{t('course_history')}</h2>
      <ul>
        {history.map(version => (
          <li key={version.id}>
            <p>
              <strong>{t('commit_message')}:</strong> {version.commit_message || 'No message'}
            </p>
            <p>
              <strong>Date:</strong> {new Date(version.created_at).toLocaleString()}
            </p>
            <button>{t('preview')}</button>
            <button onClick={() => handleRevert(version.id)}>{t('revert_to_version')}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseHistory;
