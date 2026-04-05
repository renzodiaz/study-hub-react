const PrimaryButton = ({ title = 'New Item', onButtonClick, disabled }) => {
  return (
    <button
      type="button"
      className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
      onClick={onButtonClick}
      disabled={disabled}
    >
      {title}
    </button>
  );
};

export default PrimaryButton;
