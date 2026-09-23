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
          'block w-full rounded-control border bg-surface p-3 text-body text-ink',
          over ? 'border-danger' : 'border-line',
          locked ? 'cursor-not-allowed bg-surface-sunken opacity-70' : '',
        ].join(' ')}
      />
      <div
        id={`${fieldId}-count`}
        className={[
          'mt-1 text-right text-caption',
          over ? 'text-danger' : 'text-ink-muted',
        ].join(' ')}
      >
        {maxLength != null ? `${count} / ${maxLength}` : `${count} characters`}
      </div>
    </div>
  );
}
