// Renders a free_text (interview) item: a labelled textarea with a character
// count. value is the candidate's text; onChange(nextText) fires on input.
// Client max-length is a UX affordance only — the server is authoritative.
export default function FreeTextQuestion({ item, value, locked, onChange }) {
  const maxLength = item.public_payload?.max_length ?? null;
  const count = value.length;
  const over = maxLength != null && count > maxLength;
  const fieldId = `free-text-${item.id}`;

  return (
    <div className="mt-4">
      <label htmlFor={fieldId} className="sr-only">
        Your answer
      </label>
      <textarea
        id={fieldId}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder="Type your answer…"
        aria-describedby={`${fieldId}-count`}
        className={[
          'block w-full rounded-lg border p-3 text-sm text-gray-900 shadow-sm',
          'focus:border-indigo-500 focus:ring-indigo-500',
          over ? 'border-red-400' : 'border-gray-300',
          locked ? 'cursor-not-allowed bg-gray-50 opacity-70' : '',
        ].join(' ')}
      />
      <div
        id={`${fieldId}-count`}
        className={[
          'mt-1 text-right text-xs',
          over ? 'text-red-600' : 'text-gray-400',
        ].join(' ')}
      >
        {maxLength != null ? `${count} / ${maxLength}` : `${count} characters`}
      </div>
    </div>
  );
}
