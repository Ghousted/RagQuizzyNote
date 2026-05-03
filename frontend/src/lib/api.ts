const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function upload<T>(path: string, form: FormData): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) { localStorage.removeItem("access_token"); window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) { const err = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(err.detail ?? "Upload failed"); }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type NoteSummary = {
  id: string;
  title: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
};
export type NoteDetail = NoteSummary & { content: string; chunk_count: number };
export type NoteResponse = { id: string; title: string; chunk_count: number; icon: string | null };
export type Flashcard = { id: string; question: string; answer: string; due_at: string };
export type AnswerResult = { score: number; reasoning: string; missed_concepts: string[]; new_interval_days: number };
export type QuizQuestion = { id: string; question: string; options: string[]; correct_index: number; explanation: string };
export type Quiz = { id: string; note_id: string; question_count: number; questions: QuizQuestion[] };
export type QuizAnswerResult = { correct: boolean; score: number; correct_index: number; explanation: string };
export type ExplainResult = { explanation: string; key_points: string[]; analogy: string | null };
export type DashboardStats = { notes: number; flashcards: number; reviews: number; due_cards: number; overall_accuracy: number | null };
export type WeakTopic = { topic_id: string; name: string; accuracy: number; attempts: number };

// ── API ───────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ access_token: string }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
    login: (email: string, password: string) =>
      request<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  },
  notes: {
    list: () => request<NoteSummary[]>("/notes"),
    get: (id: string) => request<NoteDetail>(`/notes/${id}`),
    create: (title: string, content: string, icon?: string | null) =>
      request<NoteResponse>("/notes", { method: "POST", body: JSON.stringify({ title, content, icon: icon ?? null }) }),
    update: (id: string, title: string, content: string, icon?: string | null) =>
      request<NoteDetail>(`/notes/${id}`, { method: "PUT", body: JSON.stringify({ title, content, icon: icon ?? null }) }),
    delete: (id: string) => request<void>(`/notes/${id}`, { method: "DELETE" }),
    uploadPdf: (file: File, title?: string) => {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      return upload<NoteResponse>("/notes/upload-pdf", form);
    },
  },
  ai: {
    getFlashcards: (noteId: string) => request<Flashcard[]>(`/notes/${noteId}/flashcards`),
    generateFlashcards: (noteId: string) =>
      request<Flashcard[]>(`/notes/${noteId}/flashcards`, { method: "POST" }),
    answerFlashcard: (id: string, answer: string) =>
      request<AnswerResult>(`/flashcards/${id}/answer`, { method: "POST", body: JSON.stringify({ answer }) }),
    getDueFlashcards: () => request<Flashcard[]>("/flashcards/due"),
    getQuiz: (noteId: string) => request<Quiz | null>(`/notes/${noteId}/quiz`),
    generateQuiz: (noteId: string) =>
      request<Quiz>(`/notes/${noteId}/quiz`, { method: "POST" }),
    answerQuiz: (quizId: string, questionId: string, selectedIndex: number) =>
      request<QuizAnswerResult>(`/quizzes/${quizId}/answer`, {
        method: "POST", body: JSON.stringify({ question_id: questionId, selected_index: selectedIndex }),
      }),
    explain: (concept: string, noteId?: string) =>
      request<ExplainResult>("/explain", { method: "POST", body: JSON.stringify({ concept, note_id: noteId }) }),
  },
  dashboard: {
    stats: () => request<DashboardStats>("/dashboard"),
    weakTopics: () => request<WeakTopic[]>("/dashboard/weak-topics"),
    dueCards: () => request<Flashcard[]>("/dashboard/due-cards"),
  },
};
