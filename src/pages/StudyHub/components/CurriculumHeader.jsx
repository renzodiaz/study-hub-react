const CurriculumHeader = ({ title }) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <button className="rounded-md border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
        Bulk Uploader
      </button>
    </div>
  );
};

export default CurriculumHeader;
