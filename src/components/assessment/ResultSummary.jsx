import { CheckCircleIcon, MinusCircleIcon } from '@heroicons/react/20/solid';

import Card from '@components/ui/Card';
import { classNames as cn } from '@utils/helpers';

// ResultSummary (§6.4, §33–35): verdict FIRST, then the server-supplied score,
// then per-area (dimension) outcomes. Every value shown is the server's — pass
// is never recomputed from raw scores/thresholds, and the per-area taxonomy
// (labels + order) is whatever the backend returns. Status is icon + word, not
// colour alone. No answer keys or correctness are shown.
const formatScore = (value) => Number(value ?? 0).toFixed(2);

const ResultSummary = ({
  passed,
  title,
  levelLabel,
  overallScore,
  dimensions,
}) => (
  <>
    <Card
      variant="accented"
      accent={passed ? 'primary' : undefined}
      className={cn('flex items-center gap-3 p-5', passed && 'bg-success-tint')}
    >
      {passed ? (
        <CheckCircleIcon
          aria-hidden="true"
          className="size-10 shrink-0 text-success"
        />
      ) : (
        <MinusCircleIcon
          aria-hidden="true"
          className="size-10 shrink-0 text-ink-muted"
        />
      )}
      <div className="min-w-0">
        <h1 className="text-title-app font-semibold text-ink">
          {passed ? 'Passed' : 'Not passed'}
        </h1>
        <p className="text-body-sm text-ink-muted">
          {title}
          {levelLabel ? ` · ${levelLabel}` : ''}
        </p>
      </div>
      {overallScore != null ? (
        <div className="ml-auto text-right">
          <div className="text-title font-semibold text-ink">
            {formatScore(overallScore)}
          </div>
          <div className="text-caption text-ink-muted">overall score</div>
        </div>
      ) : null}
    </Card>

    {Array.isArray(dimensions) && dimensions.length > 0 ? (
      <section className="mt-8">
        <h2 className="text-panel font-semibold text-ink">By area</h2>
        <ul className="mt-3 space-y-3">
          {dimensions.map((d) => (
            <li key={d.key}>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-ink-secondary">{d.label}</span>
                <span className="font-medium text-ink">
                  {formatScore(d.score)}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-pill bg-surface-sunken">
                <div
                  className={cn(
                    'h-full rounded-pill',
                    passed ? 'bg-success' : 'bg-primary',
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, d.score))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : null}
  </>
);

export default ResultSummary;
