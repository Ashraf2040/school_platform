// app/teacher/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

type Lesson = {
  id: string;
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  unit: string;
  lesson: string;
  objective: string;
  homework?: string | null;
  pages: string;
  comments?: string | null;
  class?: { id: string; name: string };
  subject?: { id: string; name: string };
};

const getTodayStr = () => new Date().toISOString().slice(0, 10);

export default function TeacherDashboard() {
  const t = useTranslations('TeacherDashboard');

  const { data: session, status } = useSession();
  const router = useRouter();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);

  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    date: getTodayStr(),
    unit: '',
    lesson: '',
    objective: '',
    homework: '',
    pages: '',
    comments: '',
  });

  // Global pending counter
  const [pendingCount, setPendingCount] = useState(0);
  const track = <T,>(p: Promise<T>) => {
    setPendingCount((c) => c + 1);
    return p.finally(() => setPendingCount((c) => Math.max(0, c - 1)));
  };

  // JSON fetch helper
  const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, init);
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      const message = data?.error || res.statusText || 'Request failed';
      throw new Error(message);
    }
    return data;
  };

  const teacherId = session?.user?.id as string | undefined;
  const today = useMemo(getTodayStr, []);

  // Initial load
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !session.user) {
      router.push('/login');
      return;
    }
    const load = async () => {
      await toast.promise(
        track(
          Promise.all([
            fetchJson(`/api/users/${session.user.id}/classes`),
            fetchJson(`/api/users/${session.user.id}/subjects`),
            fetchJson(`/api/lessons?teacherId=${session.user.id}&date=${today}`),
          ]).then(([c, s, l]) => {
            setClasses(c);
            setSubjects(s);
            setTodayLessons(l);
          })
        ),
        {
          loading: t('toast.loadingDashboard'),
          success: t('toast.dashboardReady'),
          error: (e) => `${t('toast.loadFailed')}: ${String((e as any)?.message || e)}`,
        }
      );
    };
    load();
  }, [session, status, router, today, t]);

  const refreshTodayLessons = async () => {
    if (!teacherId) return;
    await toast.promise(
      track(fetchJson(`/api/lessons?teacherId=${teacherId}&date=${today}`)),
      {
        loading: t('toast.refreshingLessons'),
        success: t('toast.lessonsUpdated'),
        error: (e) => `${t('toast.refreshFailed')}: ${String((e as any)?.message || e)}`,
      }
    ).then((data) => setTodayLessons(data as Lesson[]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    const payload = { ...formData, teacherId };
    try {
      await toast.promise(
        track(
          (async () => {
            await fetchJson('/api/lessons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            await refreshTodayLessons();
          })()
        ),
        {
          loading: t('toast.submittingLesson'),
          success: t('toast.lessonSubmitted'),
          error: (e) => `${t('toast.submitFailed')}: ${String((e as any)?.message || e)}`,
        }
      );
    } catch {}
  };

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Lesson>>({});

  const startEdit = (row: Lesson) => {
    setEditingId(row.id);
    setEditData({
      unit: row.unit,
      lesson: row.lesson,
      objective: row.objective,
      homework: row.homework ?? '',
      pages: row.pages,
      comments: row.comments ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await toast.promise(
        track(
          (async () => {
            await fetchJson(`/api/lessons/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(editData),
            });
            await refreshTodayLessons();
            cancelEdit();
          })()
        ),
        {
          loading: t('toast.savingChanges'),
          success: t('toast.lessonUpdated'),
          error: (e) => `${t('toast.updateFailed')}: ${String((e as any)?.message || e)}`,
        }
      );
    } catch {}
  };

  const todaysTeacherLessons = todayLessons.filter((l: any) => l.teacherId === teacherId);

  if (status === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-white via-[#f1fbf9] to-[#eaf7f5]">
        <div className="inline-flex items-center gap-3 text-[#006d77]">
          <span className="h-3 w-3 animate-ping rounded-full bg-[#006d77]" />
          <span className="text-lg font-medium">{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f1fbf9] to-[#eaf7f5] p-6">
      {/* Top accent */}
      <div className="mx-auto mb-6 h-1 w-full max-w-5xl rounded-full bg-[#006d77]" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#064e4f]">
            {t('title')}
          </h1>
          {session?.user && (
            <p className="mt-1 text-sm text-gray-600">
              {t('welcome', { name: session.user.name, role: session.user.role })}
            </p>
          )}
        </div>

        {/* Lesson form */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.class')}
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              >
                <option value="">{t('form.selectClass')}</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.subject')}
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              >
                <option value="">{t('form.selectSubject')}</option>
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.unit')}
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.lesson')}
              </label>
              <input
                type="text"
                value={formData.lesson}
                onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.objective')}
              </label>
              <input
                type="text"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.pages')}
              </label>
              <input
                type="text"
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                required
                disabled={pendingCount > 0}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.homework')}
              </label>
              <input
                type="text"
                value={formData.homework}
                onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                disabled={pendingCount > 0}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('form.labels.comments')}
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="mt-1 block min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                disabled={pendingCount > 0}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  classId: '',
                  subjectId: '',
                  date: formData.date,
                  unit: '',
                  lesson: '',
                  objective: '',
                  homework: '',
                  pages: '',
                  comments: '',
                })
              }
              disabled={pendingCount > 0}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2 disabled:opacity-60"
            >
              {t('buttons.reset')}
            </button>
            <button
              type="submit"
              disabled={pendingCount > 0}
              className="inline-flex items-center justify-center rounded-lg bg-[#006d77] px-5 py-2.5 font-medium text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2 disabled:opacity-60"
            >
              {pendingCount > 0 ? t('buttons.working') : t('buttons.submitLesson')}
            </button>
          </div>
        </form>

        {/* Today’s lessons */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#064e4f]">
              {t('lessons.title')}
            </h2>
            <button
              onClick={refreshTodayLessons}
              disabled={pendingCount > 0}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2 disabled:opacity-60"
            >
              {pendingCount > 0 ? t('buttons.refreshing') : t('buttons.refresh')}
            </button>
          </div>

          {todaysTeacherLessons?.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('lessons.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 shadow-sm">
              <table className="w-full table-auto text-sm">
                <thead className="bg-[#006d77] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.class')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.subject')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.unit')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.lesson')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.objective')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.pages')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.homework')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.comments')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t('lessons.headers.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todaysTeacherLessons?.map((row, idx) => {
                    const isEditing = editingId === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={
                          idx % 2 === 0
                            ? 'bg-white hover:bg-[#83c5be]/10 transition-colors'
                            : 'bg-gray-50 hover:bg-[#83c5be]/10 transition-colors'
                        }
                      >
                        <td className="px-4 py-3">{row.class?.name || ''}</td>
                        <td className="px-4 py-3">{row.subject?.name || ''}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editData.unit ?? '')}
                              onChange={(e) => setEditData((d) => ({ ...d, unit: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              disabled={pendingCount > 0}
                            />
                          ) : (
                            row.unit
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editData.lesson ?? '')}
                              onChange={(e) => setEditData((d) => ({ ...d, lesson: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              disabled={pendingCount > 0}
                            />
                          ) : (
                            row.lesson
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editData.objective ?? '')}
                              onChange={(e) => setEditData((d) => ({ ...d, objective: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              disabled={pendingCount > 0}
                            />
                          ) : (
                            row.objective
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editData.pages ?? '')}
                              onChange={(e) => setEditData((d) => ({ ...d, pages: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              disabled={pendingCount > 0}
                            />
                          ) : (
                            row.pages
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editData.homework ?? '')}
                              onChange={(e) => setEditData((d) => ({ ...d, homework: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              disabled={pendingCount > 0}
                            />
                          ) : (
                            row.homework || t('lessons.noData')
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editData.comments ?? '')}
                              onChange={(e) => setEditData((d) => ({ ...d, comments: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              disabled={pendingCount > 0}
                            />
                          ) : (
                            row.comments || t('lessons.noData')
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                disabled={pendingCount > 0}
                                className="rounded-md bg-[#006d77] px-3 py-1.5 text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 disabled:opacity-60"
                              >
                                {t('buttons.save')}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={pendingCount > 0}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                              >
                                {t('buttons.cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(row)}
                              disabled={pendingCount > 0}
                              className="rounded-md bg-[#83c5be] px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-[#83c5be]/40 transition hover:bg-[#83c5be]/90 disabled:opacity-60"
                            >
                              {t('buttons.edit')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Global loading overlay */}
      {pendingCount > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg ring-1 ring-gray-200">
            <span className="h-3 w-3 animate-ping rounded-full bg-[#006d77]" />
            <span className="text-sm text-gray-700">....loading</span>
          </div>
        </div>
      )}
    </div>
  );
}