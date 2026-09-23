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
      <legend className="sr-only">
        {isMulti ? 'Select all that apply' : 'Select one answer'}
      </legend>
      {options.map((option) => {
        const checked = value.includes(option.id);
        return (
          <label
            key={option.id}
            className={[
              'flex cursor-pointer items-center gap-3 rounded-control border px-4 py-3 text-body',
              checked
                ? 'border-primary bg-primary-tint'
                : 'border-line hover:bg-primary-wash',
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
              className="size-4 text-primary"
            />
            <span className="text-ink">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
