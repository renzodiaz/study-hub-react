import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const base = (lessonId) =>
  `${API_BASE}/api/v1/admin/lessons/${lessonId}/quiz_questions`;

export const getQuizQuestions = async (lessonId) => {
  const res = await fetch(base(lessonId), { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to fetch quiz questions');
  }
  return normalize(await res.json());
};

export const createQuizQuestion = async (lessonId, data) => {
  const res = await fetch(base(lessonId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quiz_question: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to create question');
  }
  return normalize(await res.json());
};

export const updateQuizQuestion = async (lessonId, id, data) => {
  const res = await fetch(`${base(lessonId)}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quiz_question: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to update question');
  }
  return normalize(await res.json());
};

export const deleteQuizQuestion = async (lessonId, id) => {
  const res = await fetch(`${base(lessonId)}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to delete question');
  }
};
