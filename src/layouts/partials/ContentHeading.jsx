const ContentHeading = ({ title, children }) => {
  return (
    <div className="mt-2 mb-4 md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h2>
      </div>
      <div className="my-4 flex shrink-0 md:mt-0 md:ml-4">{children}</div>
    </div>
  );
};

export default ContentHeading;
