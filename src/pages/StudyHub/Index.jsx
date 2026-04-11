import { useDrawer } from '@hooks/useDrawer';
import ContentHeading from '@layouts/partials/ContentHeading';

import Form from './Form';
import PrimaryButton from '@components/PrimaryButton';
import StudyCard from '@components/StudyCard';

const studyList = [
  {
    name: 'Javascript Fundamentals',
    description: 'Javascript base knowledge',
    status: 'In-Progress',
    level: 'Beginners',
    percentage: 80,
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'React Fundamentals',
    description: 'ReactJS base knowledge',
    status: 'Not-Started',
    level: 'Beginners',
    percentage: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Ruby Fundamentals',
    description: 'Ruby base knowledge',
    status: 'Not-Started',
    level: 'Beginners',
    percentage: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Ruby Advanced Concepts',
    description: 'Ruby advanced knowledge',
    status: 'Not-Started',
    level: 'Advanced',
    percentage: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Javascript Advanced Concepts',
    description: 'Javascript advanced knowledge',
    status: 'Not-Started',
    level: 'Advanced',
    percentage: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'React Advanced Concepts',
    description: 'ReactJS advanced knowledge',
    status: 'Not-Started',
    level: 'Advanced',
    percentage: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
];

const StudyHub = () => {
  const { openDrawer } = useDrawer();

  const handleClick = () => {
    openDrawer(
      <Form />,
      'Add Learning',
      'Here you can add what you want to learn and then add your notes and practice.',
      'study-hub-form',
    );
  };

  return (
    <>
      <ContentHeading title="Study Hub">
        <PrimaryButton title="New Learning" onButtonClick={handleClick} />
      </ContentHeading>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {studyList.map((item) => (
          <StudyCard key={item.name} item={item} />
        ))}
      </ul>
    </>
  );
};

export default StudyHub;
