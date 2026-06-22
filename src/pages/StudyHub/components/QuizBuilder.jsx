import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

import {
  getQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from '@api/quizQuestions';

// ─── Shared inline form ────────────────────────────────────────────────────────

const QuestionForm = ({ initial, onSave, onCancel, isPending }) => {
  const [body, setBody] = useState(initial?.body ?? '');
  const [topic, setTopic] = useState(initial?.topic ?? '');
  const [hint, setHint] = useState(initial?.hint ?? '');

  const handleSave = () => {
    if (!body.trim() || !topic.trim()) return;
    onSave({
      body: body.trim(),
      topic: topic.trim(),
      hint: hint.trim() || null,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Question *
        </label>
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What is the difference between…"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Topic *
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. React Hooks"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Hint (optional)
          </label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Think about…"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-x-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <XMarkIcon className="size-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !body.trim() || !topic.trim()}
          className="inline-flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <CheckIcon className="size-3.5" />
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

// ─── Single question card ──────────────────────────────────────────────────────

const QuestionCard = ({ question, index, lessonId, queryKey }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data) => updateQuizQuestion(lessonId, question.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(false);
    },
  });

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: () => deleteQuizQuestion(lessonId, question.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (editing) {
    return (
      <QuestionForm
        initial={question}
        onSave={save}
        onCancel={() => setEditing(false)}
        isPending={saving}
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-x-2">
            <span className="text-xs font-semibold text-gray-400">
              Q{index + 1}
            </span>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              {question.topic}
            </span>
          </div>
          <p className="text-sm text-gray-900">{question.body}</p>
          {question.hint && (
            <p className="text-xs text-gray-400 italic">
              Hint: {question.hint}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-x-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit question"
            className="text-gray-400 hover:text-indigo-600"
          >
            <PencilSquareIcon className="size-4" />
          </button>

          {confirming ? (
            <div className="flex items-center gap-x-2">
              <span className="text-xs text-gray-500">Delete?</span>
              <button
                type="button"
                onClick={() => remove()}
                disabled={removing}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Delete question"
              className="text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Quiz Builder ──────────────────────────────────────────────────────────────

const QuizBuilder = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const queryKey = ['quiz_questions', lessonId];
  const [showAdd, setShowAdd] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getQuizQuestions(lessonId),
  });

  const { mutate: addQuestion, isPending: adding } = useMutation({
    mutationFn: (data) => createQuizQuestion(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setShowAdd(false);
    },
  });

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Quiz Questions</h4>
        <span className="text-xs text-gray-500">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {questions.length === 0 && !showAdd && (
            <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
              No questions yet. Add your first one below.
            </p>
          )}
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              lessonId={lessonId}
              queryKey={queryKey}
            />
          ))}
        </div>
      )}

      {showAdd ? (
        <QuestionForm
          onSave={(data) =>
            addQuestion({ ...data, position: questions.length })
          }
          onCancel={() => setShowAdd(false)}
          isPending={adding}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          <PlusIcon className="size-4" />
          Add Question
        </button>
      )}
    </div>
  );
};

export default QuizBuilder;
