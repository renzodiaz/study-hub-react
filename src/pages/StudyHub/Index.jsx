import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useDrawer } from '@hooks/useDrawer';
import { getCourses } from '@api/courses';
import ContentHeading from '@layouts/partials/ContentHeading';
import PrimaryButton from '@components/PrimaryButton';
import StudyCard from '@components/StudyCard';
import Form from './Form';

const StudyHub = () => {
  const { openDrawer } = useDrawer();

  const { isLoading, data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const handleClick = useCallback(() => {
    openDrawer(
      <Form />,
      'Add Learning',
      'Here you can add what you want to learn and then add your notes and practice.',
      'study-hub-form',
    );
  }, [openDrawer]);

  return (
    <>
      <ContentHeading title="Study Hub">
        <PrimaryButton title="New Learning" onButtonClick={handleClick} />
      </ContentHeading>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-gray-500">
          No courses yet. Add your first one!
        </p>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {courses.map((item) => (
            <StudyCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
};

export default StudyHub;
