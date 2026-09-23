import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConsequenceHeader from './ConsequenceHeader';
import Timer from './Timer';
import ProgressStrip from './ProgressStrip';
import ResultSummary from './ResultSummary';
import ChoiceQuestion from '@pages/Assessment/ChoiceQuestion';

describe('ConsequenceHeader', () => {
  it('renders the consequence label first, as text (course assessment)', () => {
    render(
      <ConsequenceHeader variant="course-assessment" title="JS Foundations" />,
    );
    expect(screen.getByText('Course assessment')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'JS Foundations' }),
    ).toBeInTheDocument();
  });

  it('labels a final-qualification attempt correctly (from server-derived variant)', () => {
    render(<ConsequenceHeader variant="final-qualification" title="FMS" />);
    expect(screen.getByText('Final Qualification')).toBeInTheDocument();
  });
});

describe('Timer', () => {
  it('shows the remaining time and announces at a milestone, not every second', () => {
    render(<Timer secondsRemaining={600} expired={false} />);
    expect(screen.getByText('10:00 left')).toBeInTheDocument();
    // Milestone announcement in a polite region (not the ticking display).
    expect(screen.getByText('10 minutes remaining')).toBeInTheDocument();
  });

  it('shows an Expired state when the server considers the attempt over', () => {
    render(<Timer secondsRemaining={0} expired />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});

describe('ProgressStrip', () => {
  it('shows an answered count and keeps accessible per-question names', async () => {
    const onSelect = vi.fn();
    render(
      <ProgressStrip
        count={3}
        answeredFlags={[true, false, false]}
        current={1}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText('1 of 3 answered')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Question 1, answered' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Question 3' }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});

describe('ResultSummary', () => {
  it('leads with the verdict and renders per-area labels in server order', () => {
    render(
      <ResultSummary
        passed
        title="JS Foundations"
        levelLabel="Mid / Senior"
        overallScore={82}
        dimensions={[
          { key: 'a', label: 'Runtime & values', score: 88 },
          { key: 'b', label: 'Scope', score: 71 },
        ]}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Passed' }),
    ).toBeInTheDocument();
    const labels = screen
      .getAllByText(/Runtime & values|Scope/)
      .map((n) => n.textContent);
    expect(labels).toEqual(['Runtime & values', 'Scope']);
  });

  it('renders a not-passed verdict without inventing correctness', () => {
    render(
      <ResultSummary
        passed={false}
        title="JS"
        overallScore={40}
        dimensions={[]}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Not passed' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/correct/i)).not.toBeInTheDocument();
  });
});

describe('ChoiceQuestion — learner-safe', () => {
  it('renders only options and never surfaces an injected grading secret', () => {
    const item = {
      id: 'i1',
      item_type: 'single_choice',
      public_payload: {
        options: [
          { id: 'o1', label: 'Alpha' },
          { id: 'o2', label: 'Beta' },
        ],
      },
      // Defensive: even if a secret rode along, the component must ignore it.
      answer_key: ['o2'],
      scoring_config: { weight: 3 },
    };
    render(
      <ChoiceQuestion
        item={item}
        value={[]}
        locked={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeInTheDocument();
    expect(
      screen.queryByText(/answer_key|scoring|weight|correct/i),
    ).not.toBeInTheDocument();
  });
});
