import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { getCourse } from '@api/courses';
import CourseSidebar from './components/CourseSidebar';
import CurriculumHeader from './components/CurriculumHeader';
import SectionList from './components/SectionList';

const Editor = () => {
  const { id } = useParams({ strict: false });

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(id),
  });

  return (
    <div className="flex min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 -my-10">
      <CourseSidebar />
      <div className="flex flex-1 flex-col">
        <CurriculumHeader title={course?.name} />
        <main className="flex-1 p-8">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <SectionList />
          )}
        </main>
      </div>
    </div>
  );
};

export default Editor;
