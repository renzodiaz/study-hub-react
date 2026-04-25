import { useParams } from '@tanstack/react-router';

const Editor = () => {
  const { id } = useParams({ strict: false });

  return (
    <div>
      <h1>Course Editor — {id}</h1>
    </div>
  );
};

export default Editor;
