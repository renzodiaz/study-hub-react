// Renders a single_choice / multiple_choice item. Pure presentation: value is
// the selected option-id array; onChange(nextIds) is called with the new array.
// Knowledge-assessment behavior is unchanged from the original AttemptShell.
export default function ChoiceQuestion({ item, value, locked, onChange }) {
  const options = item.public_payload?.options ?? [];
  const isMulti = item.item_type === 'multiple_choice';

  const toggle = (optionId) => {
    if (isMulti) {
      onChange(
        value.includes(optionId)
          ? value.filter((id) => id !== optionId)
          : [...value, optionId],
      );
    } else {
      onChange(value.includes(optionId) ? [] : [optionId]);
    }
  };

  return (
    <fieldset className="mt-4 space-y-2" disabled={locked}>
      <legend className="sr-only">Answer options</legend>
      {options.map((option) => {
        const checked = value.includes(option.id);
        return (
          <label
            key={option.id}
            className={[
              'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm',
              checked ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200',
              locked ? 'cursor-not-allowed opacity-60' : '',
            ].join(' ')}
          >
            <input
              type={isMulti ? 'checkbox' : 'radio'}
              name={`item-${item.id}`}
              value={option.id}
              checked={checked}
              disabled={locked}
              onChange={() => toggle(option.id)}
              className="size-4"
            />
            <span className="text-gray-900">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
