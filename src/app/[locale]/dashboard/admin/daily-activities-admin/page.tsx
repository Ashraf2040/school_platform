


'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
// state
const [lessonsLoading, setLessonsLoading] = useState(false);
const [fixedScheduleMap, setFixedScheduleMap] = useState<Record<string, Record<string, string[]>> | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [filter, setFilter] = useState({ classId: '', date: '' });
const [editingTeacher, setEditingTeacher] = useState<any | null>(null); // the teacher object being edited [web:6]
const [showEditModal, setShowEditModal] = useState(false); // modal toggle [web:2]

  const [newTeacher, setNewTeacher] = useState({
    username: '',
    name: '',
    password: '',
    classIds: [] as string[],
    subjectIds: [] as string[],
  });
  const [newClass, setNewClass] = useState({ name: '' });
  const [newSubject, setNewSubject] = useState({ name: '' });

  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);

  // toggles and data for lessons and assigned teachers
  const [showLessons, setShowLessons] = useState(false);
  const [showAssigned, setShowAssigned] = useState(false);
  const [assignedTeachersStatus, setAssignedTeachersStatus] = useState<
    { id: string; username: string; name: string; submitted: boolean; submittedAt?: string | null }[]
  >([]);

  // GLOBAL LOADING OVERLAY STATE
  const [pendingCount, setPendingCount] = useState(0);

  // track(): increments pending before a promise and always decrements in finally
  const track = <T,>(p: Promise<T>) => {
    setPendingCount((c) => c + 1);
    return p.finally(() => setPendingCount((c) => Math.max(0, c - 1)));
  };

  // fetchJson(): throw error for non-OK responses so toast.promise can show the message
  const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, init);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse failure for no-body responses
    }
    if (!res.ok) {
      const message = data?.error || res.statusText || 'Request failed';
      throw new Error(message);
    }
    return data;
  };

  // One-time bootstrap guard: avoid refocus-triggered reloads
  const loadedOnce = useRef(false);

  // Format a timestamp as HH:MM (local)
  const formatTime = (ts?: string | Date | null) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    if (loadedOnce.current) return; // do not refetch on tab focus or session refetch
    loadedOnce.current = true;

    const load = async () => {
      await toast.promise(
        track(
          Promise.all([
            fetchJson('/api/admin/teachers'),
            fetchJson('/api/classes'),
            fetchJson('/api/subjects'),
          ]).then(([t, c, s]) => {
            setTeachers(t);
            setClasses(c);
            setSubjects(s);
          })
        ),
        {
          loading: 'Loading admin data…',
          success: 'Admin data loaded',
          error: (e) => `Failed to load: ${String((e as any)?.message || e)}`,
        }
      );
    };

    load();
  }, [session, status, router]);
  console.log(assignedTeachersStatus)

 const handleFilter = async () => {
  if (!filter.classId || !filter.date) {
    toast.error('Choose class and date first');
    return;
  }
  try {
    setLessonsLoading(true);
    const data = await fetch(`/api/lessons?classId=${filter.classId}&date=${filter.date}`).then(r => r.json());
    setLessons(data ?? []);
    setShowLessons(true);
    setShowAssigned(false);
  } catch (e) {
    toast.error('Failed to load lessons');
  } finally {
    setLessonsLoading(false);
  }
};


  // compute assigned teachers + submitted flag + first submit time
 const handleShowAssignedTeachers = () => {
  if (!filter.classId || !filter.date) {
    toast.error('Choose class and date first');
    return;
  }

  // Build earliest submission time for each teacher from current lessons list
  const firstSubmitByTeacher = new Map<string, string | null>();
  const sorted = [...(lessons ?? [])].sort((a: any, b: any) => {
    const ta = new Date(a.createdAt ?? a.date).getTime();
    const tb = new Date(b.createdAt ?? b.date).getTime();
    return ta - tb;
  });
  for (const l of sorted) {
    if (!firstSubmitByTeacher.has(l.teacherId)) {
      firstSubmitByTeacher.set(l.teacherId, (l.createdAt ?? l.date) as string | null);
    }
  }

  // Which teachers are assigned to the class (same as before)
  const assigned = teachers.filter((t: any) =>
    (t.classes ?? []).some((c: any) => c.id === filter.classId)
  );

  // Build set of subjects that actually have been submitted for this class/date
  // Note: lessons shown are expected to be already filtered by classId & date when you call handleFilter
  const submittedSubjectsSet = new Set(
    (lessons ?? []).map((l: any) => normalizeSubj(l.subject?.name ?? l.subjectName ?? ''))
  );

  // Get class name to lookup CSV schedule
  const selectedClass = classes.find((cls: any) => cls.id === filter.classId);
  const className = selectedClass?.name ?? '';
  const weekdayName = weekdayNameFromDate(filter.date);

  // get required subjects from CSV schedule if available
  const requiredSubjects: string[] =
    (fixedScheduleMap?.[className]?.[weekdayName] ?? []).map((s) => s.trim()).filter(Boolean) ?? [];

  // If CSV not loaded or no entry, fallback: mark a teacher missing only if they had any lesson in lessons for that date missing? 
  // But better: if we have no schedule info, fallback to your original logic (mark missing if no submission).
  const fallbackMode = requiredSubjects.length === 0;

  // Now determine which teachers are responsible for any missing scheduled subject
  // missingSubjects = requiredSubjects - submittedSubjects
  const missingSubjects = requiredSubjects
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeSubj)
    .filter(s => !submittedSubjectsSet.has(s));

  // map missingSubject -> responsible teacher ids
  const missingSubjectToTeacherIds = new Map<string, string[]>();
  for (const ms of missingSubjects) {
    const responsible = teachers.filter((t: any) => {
      const teachesSubject = (t.subjects ?? []).some((sub: any) => normalizeSubj(sub.name) === ms);
      const teachesClass = (t.classes ?? []).some((c: any) => c.id === filter.classId);
      return teachesSubject && teachesClass;
    }).map(t => t.id);

    // If no teacher found by teacher.subjects relation, we can optionally try to match by schedule items
    // (You could load schedule items from API to get exact teacher assignment.)
    missingSubjectToTeacherIds.set(ms, responsible);
  }

  // Build rows: if fallbackMode we use original submitted check per teacher
  const rows = assigned.map((t: any) => {
    if (fallbackMode) {
      // fallback: same as before — if any lesson by teacher exists mark submitted
      const submitted = (lessons ?? []).some((l: any) => l.teacherId === t.id);
      return {
        id: t.id,
        username: t.username,
        name: t.name,
        submitted,
        submittedAt: firstSubmitByTeacher.get(t.id) ?? null,
      };
    }

    // Non-fallback: mark submitted true if teacher submitted any lesson,
    // otherwise mark missing only if the teacher is responsible for at least one missing subject
    const teacherSubmitted = (lessons ?? []).some((l: any) => l.teacherId === t.id);
    if (teacherSubmitted) {
      return {
        id: t.id,
        username: t.username,
        name: t.name,
        submitted: true,
        submittedAt: firstSubmitByTeacher.get(t.id) ?? null,
      };
    }

    // teacher did not submit: check if they are responsible for any missing subjects
    let responsibleForMissing = false;
    for (const [ms, teacherIds] of missingSubjectToTeacherIds.entries()) {
      if (teacherIds.includes(t.id)) {
        responsibleForMissing = true;
        break;
      }
    }

    return {
      id: t.id,
      username: t.username,
      name: t.name,
      submitted: !responsibleForMissing, // if responsible for missing => mark not submitted (missing)
      submittedAt: firstSubmitByTeacher.get(t.id) ?? null,
    };
  });

  setAssignedTeachersStatus(rows);
  setShowAssigned(true);
};


  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await toast.promise(
        track(
          (async () => {
            await fetchJson('/api/admin/teachers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newTeacher, role: 'TEACHER' }),
            });
            const t = await fetchJson('/api/admin/teachers');
            setTeachers(t);
            setNewTeacher({
              username: '',
              name: '',
              password: '',
              classIds: [],
              subjectIds: [],
            });
            setShowTeacherForm(false);
          })()
        ),
        {
          loading: 'Creating teacher…',
          success: 'Teacher created',
          error: (e) => `Failed to create teacher: ${String((e as any)?.message || e)}`,
        }
      );
    } catch {
      // toast already shown
    }
  };
const handleUpdateTeacher = async (payload: {
  id: string;
  username: string;
  name: string;
  password?: string;
  classIds: string[];
  subjectIds: string[];
}) => {
  const body: any = {
    username: payload.username,
    name: payload.name,
    classIds: payload.classIds,
    subjectIds: payload.subjectIds,
  };
  if (payload.password && payload.password.trim().length > 0) {
    body.password = payload.password;
  }

  try {
    await toast.promise(
      track(
        (async () => {
          await fetchJson(`/api/admin/teachers/${payload.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const t = await fetchJson('/api/admin/teachers');
          setTeachers(t);
          setShowEditModal(false);
          setEditingTeacher(null);
        })()
      ),
      {
        loading: 'Saving changes…',
        success: 'Teacher updated',
        error: (e) => `Failed to update teacher: ${String((e as any)?.message || e)}`,
      }
    );
  } catch {
    // toast already shown
  }
};

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await toast.promise(
        track(
          (async () => {
            await fetchJson(`/api/admin/teachers/${id}`, { method: 'DELETE' });
            const t = await fetchJson('/api/admin/teachers');
            setTeachers(t);
          })()
        ),
        {
          loading: 'Deleting teacher…',
          success: 'Teacher deleted',
          error: (e) => `Failed to delete teacher: ${String((e as any)?.message || e)}`,
        }
      );
    } catch {
      // toast already shown
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await toast.promise(
        track(
          (async () => {
            await fetchJson('/api/classes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newClass),
            });
            const c = await fetchJson('/api/classes');
            setClasses(c);
            setNewClass({ name: '' });
            setShowClassForm(false);
          })()
        ),
        {
          loading: 'Creating class…',
          success: 'Class created',
          error: (e) => `Failed to create class: ${String((e as any)?.message || e)}`,
        }
      );
    } catch {
      // toast already shown
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await toast.promise(
        track(
          (async () => {
            await fetchJson('/api/subjects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSubject),
            });
            const s = await fetchJson('/api/subjects');
            setSubjects(s);
            setNewSubject({ name: '' });
            setShowSubjectForm(false);
          })()
        ),
        {
          loading: 'Creating subject…',
          success: 'Subject created',
          error: (e) => `Failed to create subject: ${String((e as any)?.message || e)}`,
        }
      );
    } catch {
      // toast already shown
    }
  };
const subjectOrder = [
  'English',
  'Math',
  'Science',
  'Social Studies',
  'Life Skills',
  "ICT",
   'French',
  'Computer',
  'Arabic',
  'S.S in Arabic',
  'Islamic Studies',
  
 
  
];

// Helper to get the subject's order index (default to large number for unknown subjects)
function subjectSortIndex(subjectName: string) {
  const idx = subjectOrder.findIndex(
    key => subjectName.trim().toLowerCase().startsWith(key.trim().toLowerCase())
  );
  return idx === -1 ? 999 : idx;
}

// Sort the lessons array
const sortedLessons = [...lessons].sort((a, b) =>
  subjectSortIndex(a.subject.name) - subjectSortIndex(b.subject.name)
);
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const selectedClass = classes.find((cls: any) => cls.id === filter.classId);
    const className = selectedClass ? selectedClass.name : 'All Classes';
    const tableContent = document.getElementById('lessons-table')?.outerHTML;
    printWindow?.document.write(`
      <html>
        <head>
          <title>${className} - ${dateStr}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #006d77; color: white; }
            tr:nth-child(odd) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Daily Academic Plan for Grade ${className} - ${dateStr}</h1>
          ${tableContent}
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };
const toCsv = (rows: string[][]) => {
  const esc = (v: string) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\n');
};
const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
const normalizeSubj = (s?: string) => (s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

// Get weekday string that matches CSV: Sunday, Monday, ... (adjust locale if needed)
const weekdayNameFromDate = (dateStr: string) => {
  const d = new Date(dateStr);
  // Use en-US weekdays to match your CSV which uses Sunday..Thursday
  return d.toLocaleDateString('en-US', { weekday: 'long' }); // "Sunday"
};

// parse CSV text into the map { className: { weekday: [subjects...] } }
const parseFixedScheduleCsv = (csvText: string) => {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const map: Record<string, Record<string, string[]>> = {};
  for (const row of result.data as any[]) {
    const className = (row.class ?? row.Class ?? '').toString().trim();
    const weekday = (row.weekday ?? row.Weekday ?? '').toString().trim();
    let subjectsRaw = row.subjects ?? row.Subjects ?? '';
    // subjects might be quoted "A, B, C" — split on commas
    const subjects = subjectsRaw
      .toString()
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((s: string) => s); // keep original casing but trim
    if (!className || !weekday) continue;
    if (!map[className]) map[className] = {};
    map[className][weekday] = subjects;
  }
  return map;
};

// load CSV once on mount (client-side)
useEffect(() => {
  (async () => {
    try {
      // adjust path if you host the csv somewhere else
      const res = await fetch('/fixed-schedule.csv'); 
      if (!res.ok) return; // graceful
      const text = await res.text();
      const map = parseFixedScheduleCsv(text);
      setFixedScheduleMap(map);
      console.log(fixedScheduleMap)
    } catch (err) {
      console.warn('Failed to load fixed schedule csv', err);
    }
  })();
}, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f1fbf9] to-[#eaf7f5] p-6">
      {/* Top accent bar */}
      <div className="mx-auto mb-6 h-1 w-full max-w-7xl rounded-full bg-[#006d77]" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#064e4f]">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">
            Manage teachers, classes, subjects, and view lessons with filters and export-friendly tables.
          </p>
        </div>

        {/* Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setShowTeacherForm(!showTeacherForm)}
            className="inline-flex items-center justify-center rounded-lg bg-[#006d77] px-4 py-2.5 text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2"
            disabled={pendingCount > 0}
          >
            {showTeacherForm ? 'Hide Create Teacher' : 'Create Teacher'}
          </button>
<button
  type="button"
  onClick={() => {
    const header = ['Username', 'Name', 'Classes', 'Subjects'];
    const rows = teachers.map((t: any) => [
      t?.username ?? '',
      t?.name ?? '',
      (t?.classes ?? []).map((c: any) => c?.name ?? '').join(' | '),
      (t?.subjects ?? []).map((s: any) => s?.name ?? '').join(' | '),
    ]);
    const csv = toCsv([header, ...rows]);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`teachers_${date}.csv`, csv);
  }}
  className="inline-flex items-center rounded-lg bg-[#e29578] px-4 py-2.5 text-white"
>
  Export Teacher CSV
</button>

          <button
            onClick={() => setShowTeacherDetails(!showTeacherDetails)}
            className="inline-flex items-center justify-center rounded-lg bg-[#83c5be] px-4 py-2.5 text-slate-900 shadow-sm ring-1 ring-[#83c5be]/40 transition hover:bg-[#83c5be]/90 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2"
            disabled={pendingCount > 0}
          >
            {showTeacherDetails ? 'Hide Teacher Details' : 'Show Teacher Details'}
          </button>
<button
  onClick={() => router.push('/teacherData')}
  className="inline-flex items-center justify-center rounded-lg bg-[#e29578] px-4 py-2.5 text-white shadow-sm ring-1 ring-sky-200 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
  disabled={pendingCount > 0}
  title="Export teacher details"
>
  Teachers Cards
</button>
          <button
            onClick={() => setShowClassForm(!showClassForm)}
            className="inline-flex items-center justify-center rounded-lg border border-[#006d77]/30 bg-[#83c5be] px-4 py-2.5  text-white shadow-sm transition hover:bg-[#006d77]/5 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2"
            disabled={pendingCount > 0}
          >
            {showClassForm ? 'Hide Create Class' : 'Create Class'}
          </button>

          <button
            onClick={() => setShowSubjectForm(!showSubjectForm)}
            className="inline-flex items-center justify-center rounded-lg bg-[#006d77] px-4 py-2.5 text-white shadow-sm ring-1 ring-[#e29578]/20 transition hover:bg-[#e29578]/90 focus:outline-none focus:ring-2 focus:ring-[#e29578] focus:ring-offset-2"
            disabled={pendingCount > 0}
          >
            {showSubjectForm ? 'Hide Create Subject' : 'Create Subject'}
          </button>
          <button
  onClick={() => router.push("/schedule")}
  className="inline-flex items-center justify-center rounded-lg bg-[#006d77] px-4 py-2.5 text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2"
>
  Generate Schedule
</button>
        </div>

        {/* Create Teacher Form */}
        {showTeacherForm && (
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
            <h2 className="mb-4 text-xl font-semibold text-[#064e4f]">Create Teacher</h2>
            <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Assign Classes</label>
                <select
                  multiple
                  value={newTeacher.classIds}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      classIds: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                >
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Assign Subjects</label>
                <select
                  multiple
                  value={newTeacher.subjectIds}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      subjectIds: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                >
                  {subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={pendingCount > 0}
                  className="mt-2 w-full rounded-lg bg-[#006d77] px-4 py-2.5 font-medium text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2 disabled:opacity-60"
                >
                  {pendingCount > 0 ? 'Working…' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Class Form */}
        {showClassForm && (
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
            <h2 className="mb-4 text-xl font-semibold text-[#064e4f]">Create Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={pendingCount > 0}
                className="w-full rounded-lg bg-[#83c5be] px-4 py-2.5 font-medium text-slate-900 shadow-sm ring-1 ring-[#83c5be]/40 transition hover:bg-[#83c5be]/90 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2 disabled:opacity-60"
              >
                {pendingCount > 0 ? 'Working…' : 'Create Class'}
              </button>
            </form>
          </div>
        )}

        {/* Create Subject Form */}
        {showSubjectForm && (
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
            <h2 className="mb-4 text-xl font-semibold text-[#064e4f]">Create Subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={pendingCount > 0}
                className="w-full rounded-lg bg-[#e29578] px-4 py-2.5 font-medium text-white shadow-sm ring-1 ring-[#e29578]/20 transition hover:bg-[#e29578]/90 focus:outline-none focus:ring-2 focus:ring-[#e29578] focus:ring-offset-2 disabled:opacity-60"
              >
                {pendingCount > 0 ? 'Working…' : 'Create Subject'}
              </button>
            </form>
          </div>
        )}

        {/* Teacher List */}
        {showTeacherDetails && (
          <div className="mx-auto mb-8 max-w-7xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
            <h2 className="mb-4 text-xl font-semibold text-[#064e4f]">Teachers</h2>
            <div className="overflow-scroll rounded-xl ring-1 ring-gray-200 shadow-sm">
              <table className="w-full table-auto text-sm">
                <thead className="bg-[#006d77] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Username</th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Password</th>
                    <th className="px-4 py-3 text-left font-semibold">Classes</th>
                    <th className="px-4 py-3 text-left font-semibold">Subjects</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((teacher: any, idx: number) => (
                    <tr
                      key={teacher.id}
                      className={
                        idx % 2 === 0
                          ? 'bg-white hover:bg-[#83c5be]/10 transition-colors'
                          : 'bg-gray-50 hover:bg-[#83c5be]/10 transition-colors'
                      }
                    >
                      <td className="px-4 py-3">{teacher.username}</td>
                      <td className="px-4 py-3">{teacher.name}</td>
                      <td className="px-4 py-3">{teacher.password ?? '-'}</td>
                      <td className="px-4 py-3">{teacher.classes.map((c: any) => c.name).join(', ')}</td>
                      <td className="px-4 py-3">{teacher.subjects.map((s: any) => s.name).join(', ')}</td>
                      <td className="px-4 py-3 flex ">
                        <button
      onClick={() => {
        setEditingTeacher({
          id: teacher.id,
          username: teacher.username,
          name: teacher.name,
          // do not prefill password to avoid showing hashes or leaking; leave empty to mean unchanged
          password: '',
          classIds: (teacher.classes ?? []).map((c:any)=>c.id),
          subjectIds: (teacher.subjects ?? []).map((s:any)=>s.id),
        });
        setShowEditModal(true);
      }}
      disabled={pendingCount > 0}
      className="rounded-md bg-[#0ea5e9] px-3 py-1.5 text-white shadow-sm ring-1 ring-sky-200 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 disabled:opacity-60"
    >
      Edit
    </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          disabled={pendingCount > 0}
                          className="rounded-md bg-[#e29578] px-3 py-1.5 ml-4 text-white shadow-sm ring-1 ring-[#e29578]/20 transition hover:bg-[#e29578]/90 focus:outline-none focus:ring-2 focus:ring-[#e29578] focus:ring-offset-2 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
{showEditModal && editingTeacher && (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#064e4f]">Edit Teacher</h3>
        <button
          onClick={() => setShowEditModal(false)}
          className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!editingTeacher) return;
          void handleUpdateTeacher(editingTeacher);
        }}
        className="grid grid-cols-1 gap-6"
      >
        {/* Basic info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={editingTeacher.username}
              onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editingTeacher.name}
              onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password <span className="text-gray-400">(leave blank to keep)</span>
            </label>
            <input
              type="password"
              value={editingTeacher.password}
              onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
              placeholder="Leave empty to keep current password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
            />
          </div>
        </div>

        {/* Dual-list: Classes */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-[#064e4f]">Classes</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Available */}
            <div className="rounded-lg border border-gray-200">
              <div className="px-3 py-2 text-sm font-medium text-gray-600">Available</div>
              <div className="max-h-44 overflow-auto">
                {classes
                  .filter((c:any) => !(editingTeacher.classIds ?? []).includes(c.id))
                  .map((c:any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setEditingTeacher({
                          ...editingTeacher,
                          classIds: [...(editingTeacher.classIds ?? []), c.id],
                        })
                      }
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {c.name}
                    </button>
                  ))}
                {classes.filter((c:any) => !(editingTeacher.classIds ?? []).includes(c.id)).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No more classes</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid place-items-center">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const remaining = classes
                      .filter((c:any) => !(editingTeacher.classIds ?? []).includes(c.id))
                      .map((c:any) => c.id);
                    setEditingTeacher({
                      ...editingTeacher,
                      classIds: [...(editingTeacher.classIds ?? []), ...remaining],
                    });
                  }}
                  className="rounded-md bg-[#83c5be] px-3 py-1.5 text-sm text-slate-900 ring-1 ring-[#83c5be]/40"
                >
                  Add all →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher({ ...editingTeacher, classIds: [] });
                  }}
                  className="rounded-md bg-[#e29578] px-3 py-1.5 text-sm text-white ring-1 ring-[#e29578]/20"
                >
                  ← Remove all
                </button>
              </div>
            </div>

            {/* Assigned */}
            <div className="rounded-lg border border-gray-200">
              <div className="px-3 py-2 text-sm font-medium text-gray-600">Assigned</div>
              <div className="max-h-44 overflow-auto">
                {classes
                  .filter((c:any) => (editingTeacher.classIds ?? []).includes(c.id))
                  .map((c:any) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{c.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTeacher({
                            ...editingTeacher,
                            classIds: (editingTeacher.classIds ?? []).filter((id:string) => id !== c.id),
                          })
                        }
                        className="rounded-md px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                {(editingTeacher.classIds ?? []).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No classes assigned</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dual-list: Subjects */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-[#064e4f]">Subjects</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Available */}
            <div className="rounded-lg border border-gray-200">
              <div className="px-3 py-2 text-sm font-medium text-gray-600">Available</div>
              <div className="max-h-44 overflow-auto">
                {subjects
                  .filter((s:any) => !(editingTeacher.subjectIds ?? []).includes(s.id))
                  .map((s:any) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setEditingTeacher({
                          ...editingTeacher,
                          subjectIds: [...(editingTeacher.subjectIds ?? []), s.id],
                        })
                      }
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {s.name}
                    </button>
                  ))}
                {subjects.filter((s:any) => !(editingTeacher.subjectIds ?? []).includes(s.id)).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No more subjects</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid place-items-center">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const remaining = subjects
                      .filter((s:any) => !(editingTeacher.subjectIds ?? []).includes(s.id))
                      .map((s:any) => s.id);
                    setEditingTeacher({
                      ...editingTeacher,
                      subjectIds: [...(editingTeacher.subjectIds ?? []), ...remaining],
                    });
                  }}
                  className="rounded-md bg-[#83c5be] px-3 py-1.5 text-sm text-slate-900 ring-1 ring-[#83c5be]/40"
                >
                  Add all →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher({ ...editingTeacher, subjectIds: [] });
                  }}
                  className="rounded-md bg-[#e29578] px-3 py-1.5 text-sm text-white ring-1 ring-[#e29578]/20"
                >
                  ← Remove all
                </button>
              </div>
            </div>

            {/* Assigned */}
            <div className="rounded-lg border border-gray-200">
              <div className="px-3 py-2 text-sm font-medium text-gray-600">Assigned</div>
              <div className="max-h-44 overflow-auto">
                {subjects
                  .filter((s:any) => (editingTeacher.subjectIds ?? []).includes(s.id))
                  .map((s:any) => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{s.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTeacher({
                            ...editingTeacher,
                            subjectIds: (editingTeacher.subjectIds ?? []).filter((id:string) => id !== s.id),
                          })
                        }
                        className="rounded-md px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                {(editingTeacher.subjectIds ?? []).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No subjects assigned</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pendingCount > 0}
            className="rounded-lg bg-[#006d77] px-4 py-2.5 font-medium text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2 disabled:opacity-60"
          >
            {pendingCount > 0 ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


        {/* Filter */}
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
          <h2 className="mb-4 text-xl font-semibold text-[#064e4f]">View Lessons</h2>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
              <select
                value={filter.classId}
                onChange={(e) => setFilter({ ...filter, classId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
              >
                <option value="">Select Class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-[#83c5be] focus:ring-2 focus:ring-[#83c5be]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                disabled={pendingCount > 0}
                className="w-full rounded-lg bg-[#006d77] px-4 py-2.5 font-medium text-white shadow-sm ring-1 ring-[#006d77]/20 transition hover:bg-[#006d77]/90 focus:outline-none focus:ring-2 focus:ring-[#006d77] focus:ring-offset-2 disabled:opacity-60"
              >
                {pendingCount > 0 ? 'Loading…' : 'Show'}
              </button>
            </div>
            <div className="flex items-end gap-3">
              {showLessons && lessons.length > 0 && (
                <button
                  onClick={() => setShowLessons(false)}
                  disabled={pendingCount > 0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2 disabled:opacity-60"
                >
                  Hide
                </button>
              )}
              <button
                onClick={() => (showAssigned ? setShowAssigned(false) : handleShowAssignedTeachers())}
                className="w-full rounded-lg bg-[#83c5be] px-4 py-2.5 font-medium text-slate-900 shadow-sm ring-1 ring-[#83c5be]/40 transition hover:bg-[#83c5be]/90 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2"
                disabled={!filter.classId || !filter.date || pendingCount > 0}
                title={!filter.classId || !filter.date ? 'Choose class and date first' : 'Show assigned teachers'}
              >
                {showAssigned ? 'Hide' : 'Teachers'}
              </button>
            </div>
          </div>

          {/* Lessons table (toggle) */}
          {/* Loading skeleton while fetching lessons */}
{showLessons && lessonsLoading && (
  <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="mb-3 h-6 w-40 animate-pulse rounded bg-gray-200" />
    <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
    <div className="mt-2 h-8 w-full animate-pulse rounded bg-gray-200" />
    <div className="mt-2 h-8 w-full animate-pulse rounded bg-gray-200" />
  </div>
)}

{/* Empty state when no lessons for the selected day */}
{showLessons && !lessonsLoading && lessons.length === 0 && (
  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
    No lessons submitted for today.
  </div>
)}

{/* The original table rendered only when data exists and not loading */}
{showLessons && !lessonsLoading && lessons.length > 0 && (
  <div>
    <div className="overflow-scroll rounded-xl ring-1 ring-gray-200 shadow-sm">
      <table id="lessons-table" className="w-full table-auto text-sm">
        <thead className="bg-[#006d77] text-white">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Subject</th>
            <th className="px-4 py-3 text-left font-semibold">Unit</th>
            <th className="px-4 py-3 text-left font-semibold">Lesson</th>
            <th className="px-4 py-3 text-left font-semibold">Objective</th>
            <th className="px-4 py-3 text-left font-semibold">Pages</th>
            <th className="px-4 py-3 text-left font-semibold">Homework</th>
            <th className="px-4 py-3 text-left font-semibold">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedLessons.map((lesson: any, idx: number) => (
            <tr
              key={lesson.id}
              className={
                idx % 2 === 0
                  ? 'bg-white hover:bg-[#83c5be]/10 transition-colors'
                  : 'bg-gray-50 hover:bg-[#83c5be]/10 transition-colors'
              }
            >
              <td className="px-4 py-3">{lesson.subject.name}</td>
              <td className="px-4 py-3">{lesson.unit}</td>
              <td className="px-4 py-3">{lesson.lesson}</td>
              <td className="px-4 py-3">{lesson.objective}</td>
              <td className="px-4 py-3">{lesson.pages}</td>
              <td className="px-4 py-3">{lesson.homework || '-'}</td>
              <td
                className="px-4 py-3"
                dir={`${lesson.subject.name === 'Islamic' || lesson.subject.name === 'Arabic' ? 'rtl' : 'ltr'}`}
              >
                {lesson.comments || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <button
      onClick={handlePrint}
      className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#83c5be] focus:ring-offset-2"
    >
      Print Table
    </button>
  </div>
)}


          {/* Assigned teachers table (toggle) */}
          {showAssigned && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-[#064e4f]">Assigned Teachers for Selected Class</h3>
              <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 shadow-sm">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-[#006d77] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Username</th>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Submitted at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assignedTeachersStatus.map((t, idx) => (
                      <tr
                        key={t.id}
                        className={
                          idx % 2 === 0
                            ? 'bg-white hover:bg-[#83c5be]/10 transition-colors'
                            : 'bg-gray-50 hover:bg-[#83c5be]/10 transition-colors'
                        }
                      >
                        <td className="px-4 py-3">{t.username}</td>
                        <td className="px-4 py-3">{t.name}</td>
                        <td className="px-4 py-3">
                          {t.submitted ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {t.submitted ? formatTime(t.submittedAt ?? null) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global loading overlay */}
      {pendingCount > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg ring-1 ring-gray-200">
            <span className="h-3 w-3 animate-ping rounded-full bg-[#006d77]" />
            <span className="text-sm text-gray-700">Working...</span>
          </div>
        </div>
      )}
    </div>
  );
}












// this code should be replace the current code next year, but for now we keep it here for reference and to avoid merge conflicts with the ongoing work on the new dashboard design and features. 
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
// import toast from 'react-hot-toast';
// import { useTranslations } from 'next-intl';

// // Imports kept intact
// import { useAssignedTeachers } from '@/app/hooks/useAssignedTeachers';
// import LessonsFilter from '@/components/LessonsFilter';
// import LessonsTable from '@/components/LessonsTable';
// import { useAdminData } from '@/app/hooks/useAdminData';
// import CreateTeacherForm from '@/components/CreateTeacherForm';
// import CreateClassForm from '@/components/CreateClassForm';
// import CreateSubjectForm from '@/components/CreateSubjectForm';
// import TeacherList from '@/components/TeacherList';
// import EditTeacherModal from '@/components/EditTeacherModal';
// import AllGradesLessonsTable from '@/components/AllGradesLessonsTable';
// import AssignedTeachersTable from '@/components/AssignedTeachersTable';
// import EditSchedule from '@/components/EditSchedule';
// import MissingSubmissionsTable from '@/components/MissingSubmissionsTable';

// export default function AdminDashboard() {
//   const t = useTranslations('AdminDashboard');
//   const { data: session } = useSession(); // Use useSession to get the real user object
//   const router = useRouter();

//   // ——— Admin Data (teachers, classes, subjects) ———
//   const {
//     teachers,
//     classes,
//     subjects,
//     isLoading: adminLoading,
//     error: adminError,
//     pending,
//     track,
//     fetchJson,
//     refreshTeachers,
//     refreshClasses,
//     refreshSubjects,
//   } = useAdminData();

//   // ——— UI Toggles ———
//   const [showTeacherForm, setShowTeacherForm] = useState(false);
//   const [showClassForm, setShowClassForm] = useState(false);
//   const [showSubjectForm, setShowSubjectForm] = useState(false);
//   const [showTeacherDetails, setShowTeacherDetails] = useState(false);
//   const [showLessons, setShowLessons] = useState(false);
//   const [showAssigned, setShowAssigned] = useState(false);
//   const [assignedData, setAssignedData] = useState<any[]>([]);
//   const [allGradesLessons, setAllGradesLessons] = useState<Record<string, any[]>>({});
//   const [allGradesLoading, setAllGradesLoading] = useState(false);
//   const [showAllGrades, setShowAllGrades] = useState(false);
//   const [showScheduleModal, setShowScheduleModal] = useState(false);

//   // ——— Filter & Lessons ———
//   const [filter, setFilter] = useState({ classId: '', date: '' });
//   const [lessons, setLessons] = useState<any[]>([]);
//   const [lessonsLoading, setLessonsLoading] = useState(false);
//   const [scheduleInfo, setScheduleInfo] = useState({});

//   // ——— Edit Modal ———
//   const [editingTeacher, setEditingTeacher] = useState<any>(null);
//   const [showEditModal, setShowEditModal] = useState(false);

//   // ——— CSV Helpers ———
//   const toCsv = (array: any[][]) => array.map(row => row.map(item => `"${item}"`).join(',')).join('\n');
  
//   const downloadCsv = (filename: string, content: string) => {
//     const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement("a");
//     if (link.download !== undefined) {
//       const url = URL.createObjectURL(blob);
//       link.setAttribute("href", url);
//       link.setAttribute("download", filename);
//       link.style.visibility = 'hidden';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   // ADDED LOGGING FOR DEBUGGING
//   const handleToggleLog = (name: string) => {
//     console.log(`[AdminDashboard] Clicking: ${name}`);
//   };

//   const handleFilter = async () => {
//     if (!filter.classId || !filter.date) {
//       toast.error(t('errors.selectClassAndDate'));
//       return;
//     }
//     try {
//       setLessonsLoading(true);
//       const data = await fetch(`/api/lessons?classId=${filter.classId}&date=${filter.date}`)
//         .then((r) => r.json())
//         .catch(() => []);
//       setLessons(data ?? []);
//       setShowLessons(true);
//     } catch (err) {
//       toast.error(t('errors.loadLessons'));
//       console.error(err);
//     } finally {
//       setLessonsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (filter.classId) {
//       fetch(`/api/schedule?classId=${filter.classId}`)
//         .then((res) => res.json())
//         .then((data) => setScheduleInfo(data.schedule || {}));
//     }
//   }, [filter.classId]);

//   const newAssigned = useAssignedTeachers({
//     lessons,
//     teachers,
//     filter,
//     scheduleInfo,
//     subjects,
//   });

//   useEffect(() => {
//     if (Array.isArray(newAssigned) && newAssigned.length > 0) {
//       setAssignedData(newAssigned);
//     }
//   }, [newAssigned]);

//   const handleShowAssigned = async () => {
//     if (!filter.classId || !filter.date) {
//       toast.error(t('errors.selectClassAndDate'));
//       return;
//     }
//     const res = await fetch(`/api/schedule?classId=${filter.classId}`);
//     const data = await res.json();
//     setScheduleInfo(data.schedule || {});
//     setShowAssigned(true);
//   };

//   const handleSaveAllGrades = async () => {
//     if (!filter.date) {
//       toast.error(t('errors.selectDateFirst'));
//       return;
//     }
//     setAllGradesLoading(true);
//     setShowAllGrades(true);
//     setShowLessons(false);
//     setShowAssigned(false);
//     try {
//       const promises = classes.map((cls) =>
//         fetch(`/api/lessons?classId=${cls.id}&date=${filter.date}`)
//           .then((r) => r.json())
//           .then((data) => ({ classId: cls.id, className: cls.name, lessons: data ?? [] }))
//           .catch(() => ({ classId: cls.id, className: cls.name, lessons: [] }))
//       );

//       const results = await Promise.all(promises);
//       const grouped: Record<string, any[]> = {};
//       results.forEach((r) => {
//         grouped[r.classId] = r.lessons.map((l: any) => ({
//           ...l,
//           __className: r.className,
//         }));
//       });
//       setAllGradesLessons(grouped);
//     } catch (err) {
//       toast.error(t('errors.loadAllGrades'));
//       console.error(err);
//     } finally {
//       setAllGradesLoading(false);
//     }
//   };

//  const handlePrint = () => {
//   const w = window.open('', '_blank');
//   if (!w) return;
//   const date = new Date().toLocaleDateString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });
//   const cls = classes.find((c) => c.id === filter.classId);

//   // Build table rows with conditional dir per row based on subject
//   const tableRows = sortedLessons.map((lesson: any) => {
//     const isRtl = ['Arabic', 'Islamic', 'S.S in Arabic'].some((subj) =>
//       (lesson.subject?.name || '').toLowerCase().includes(subj.toLowerCase())
//     );
//     return `
//       <tr>
//         <td style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}">${lesson.subject?.name ?? ''}</td>
//         <td style="direction: ltr; text-align: left">${lesson.unit ?? ''}</td>
//         <td style="direction: ltr; text-align: left">${lesson.lesson ?? ''}</td>
//         <td style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}">${lesson.objective ?? ''}</td>
//         <td style="direction: ltr; text-align: left">${lesson.pages ?? ''}</td>
//         <td style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}">${lesson.homework || '-'}</td>
//         <td style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}">${lesson.comments || '-'}</td>
//       </tr>
//     `;
//   }).join('');

//   w.document.write(`
// <html>
// <head>
// <title>${cls?.name ?? ''} - ${date}</title>
// <style>
//   body { font-family: Arial, sans-serif; margin: 20px; direction: ltr; }
//   h1 { text-align: center; color: #064e4f; }
//   table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//   th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//   th { background: #006d77; color: white; }
//   tr:nth-child(odd) { background: #f8fafc; }
// </style>
// </head>
// <body>
//   <h1>${t('print.dailyPlan')} – ${cls?.name ?? ''} – ${date}</h1>
//   <table id="lessons-table">
//     <thead>
//       <tr>
//         <th>Subject</th>
//         <th>Unit</th>
//         <th>Lesson</th>
//         <th>Objective</th>
//         <th>Pages</th>
//         <th>Homework</th>
//         <th>Comments</th>
//       </tr>
//     </thead>
//     <tbody>
//       ${tableRows}
//     </tbody>
//   </table>
// </body>
// </html>
// `);
//   w.document.close();
//   w.focus();
//   setTimeout(() => w.print(), 500);
// };

//   return (
//     <div className="min-h-screen w-full text-slate-900 relative overflow-hidden bg-slate-50">

//       {/* ================= BACKGROUND ================= */}
//       <div className="fixed inset-0 -z-10 pointer-events-none">
//         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-100/50 to-transparent opacity-60" />
//         <svg className="absolute inset-0 w-full h-full opacity-[0.3]">
//           <defs>
//             <pattern id="admin-dashboard-grid" width="32" height="32" patternUnits="userSpaceOnUse">
//               <circle cx="1" cy="1" r="1" fill="#0f766e" />
//             </pattern>
//           </defs>
//           <rect width="100%" height="100%" fill="url(#admin-dashboard-grid)" />
//         </svg>
//         <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/90 pointer-events-none" />
//       </div>

//       <div className="mx-auto w-full px-6 lg:px-8 py-8 sm:py-10">

//         {/* ================= HEADER ================= */}
      

//         {/* ================= QUICK ACTIONS GRID ================= */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

//           {/* Create Teacher */}
//           <button
//             onClick={() => {
//               handleToggleLog('Create Teacher Form');
//               setShowTeacherForm((v) => !v);
//             }}
//             className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
//               showTeacherForm
//                 ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
//                 : 'border-white bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1'
//             }`}
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
//               {showTeacherForm ? t('buttons.hideCreateTeacher') : t('buttons.createTeacher')}
//             </span>
//           </button>

//           {/* Export CSV */}
//           <button
//             onClick={() => {
//               const header = [
//                 t('table.username'),
//                 t('table.name'),
//                 t('table.classes'),
//                 t('table.subjects'),
//               ];
//               const rows = teachers.map((teacher: any) => [
//                 teacher.username ?? '',
//                 teacher.name ?? '',
//                 (teacher.classes ?? []).map((c: any) => c.name ?? '').join(' | '),
//                 (teacher.subjects ?? []).map((s: any) => s.name ?? '').join(' | '),
//               ]);
//               downloadCsv(
//                 `teachers_${new Date().toISOString().slice(0, 10)}.csv`,
//                 toCsv([header, ...rows])
//               );
//             }}
//             className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-white bg-white hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
//               {t('buttons.exportTeachersCsv')}
//             </span>
//           </button>

//           {/* Show Teacher Details */}
//           <button
//             onClick={() => {
//               handleToggleLog('Show Teacher Details');
//               setShowTeacherDetails((v) => !v);
//             }}
//             className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
//               showTeacherDetails
//                 ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
//                 : 'border-white bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1'
//             }`}
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0h6m2 2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
//               {showTeacherDetails ? t('buttons.hideTeacherDetails') : t('buttons.showTeacherDetails')}
//             </span>
//           </button>

//           {/* Cards View */}
//           <button
//             onClick={() => router.push('/dashboard/admin/teacherData')}
//             className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-white bg-white hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">
//               {t('buttons.teachersCards')}
//             </span>
//           </button>

//           {/* Create Class */}
//           <button
//             onClick={() => {
//               handleToggleLog('Create Class Form');
//               setShowClassForm((v) => !v);
//             }}
//             className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
//               showClassForm
//                 ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
//                 : 'border-white bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1'
//             }`}
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
//               {showClassForm ? t('buttons.hideCreateClass') : t('buttons.createClass')}
//             </span>
//           </button>

//           {/* Create Subject */}
//           <button
//             onClick={() => {
//               handleToggleLog('Create Subject Form');
//               setShowSubjectForm((v) => !v);
//             }}
//             className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
//               showSubjectForm
//                 ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
//                 : 'border-white bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1'
//             }`}
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
//               {showSubjectForm ? t('buttons.hideCreateSubject') : t('buttons.createSubject')}
//             </span>
//           </button>

//           {/* Manage Schedule */}
//           <button
//             onClick={() => {
//               handleToggleLog('Manage Schedules');
//               setShowScheduleModal(true);
//             }}
//             className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-white bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
//             </div>
//             <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
//               {t('buttons.manageSchedules')}
//             </span>
//           </button>
//         </div>

//         {/* ================= MAIN CONTENT AREA ================= */}
//         <div className="space-y-8">

//           {/* Forms */}
//           <CreateTeacherForm
//             show={showTeacherForm}
//             classes={classes}
//             subjects={subjects}
//             track={track}
//             fetchJson={fetchJson}
//             toast={toast}
//             onSuccess={() => {
//               setShowTeacherForm(false);
//               refreshTeachers();
//             }}
//             pending={pending}
//           />

//           <CreateClassForm
//             show={showClassForm}
//             track={track}
//             fetchJson={fetchJson}
//             toast={toast}
//             onSuccess={() => {
//               setShowClassForm(false);
//               refreshClasses();
//             }}
//             pending={pending}
//           />

//           <CreateSubjectForm
//             show={showSubjectForm}
//             track={track}
//             fetchJson={fetchJson}
//             toast={toast}
//             onSuccess={() => {
//               setShowSubjectForm(false);
//               refreshSubjects();
//             }}
//             pending={pending}
//           />

//           {/* Teacher List */}
//           <TeacherList
//             show={showTeacherDetails}
//             teachers={teachers}
//             onEdit={(teacher) => {
//               setEditingTeacher({
//                 id: teacher.id,
//                 username: teacher.username,
//                 name: teacher.name,
//                 password: '',
//                 classIds: teacher.classes.map((c: any) => c.id),
//                 subjectIds: teacher.subjects.map((s: any) => s.id),
//               });
//               setShowEditModal(true);
//             }}
//             onDelete={async (id) => {
//               if (!confirm(t('confirm.deleteTeacher'))) return;
//               await toast.promise(
//                 track(fetchJson(`/api/admin/teachers/${id}`, { method: 'DELETE' })),
//                 {
//                   loading: t('toast.loading'),
//                   success: t('toast.deleted'),
//                   error: t('toast.failed'),
//                 }
//               );
//               refreshTeachers();
//             }}
//             pending={pending}
//           />

//           {/* Edit Modal */}
//           {showEditModal && editingTeacher && (
//             <EditTeacherModal
//               teacher={editingTeacher}
//               setTeacher={setEditingTeacher}
//               classes={classes}
//               subjects={subjects}
//               onClose={() => {
//                 setShowEditModal(false);
//                 setEditingTeacher(null);
//               }}
//               onSave={async () => {
//                 const body: any = {
//                   username: editingTeacher.username,
//                   name: editingTeacher.name,
//                   classIds: editingTeacher.classIds,
//                   subjectIds: editingTeacher.subjectIds,
//                 };
//                 if (editingTeacher.password) body.password = editingTeacher.password;

//                 await toast.promise(
//                   track(
//                     fetchJson(`/api/admin/teachers/${editingTeacher.id}`, {
//                       method: 'PATCH',
//                       headers: { 'Content-Type': 'application/json' },
//                       body: JSON.stringify(body),
//                     })
//                   ),
//                   {
//                     loading: t('toast.saving'),
//                     success: t('toast.updated'),
//                     error: t('toast.failed'),
//                   }
//                 );
//                 refreshTeachers();
//                 setShowEditModal(false);
//                 setEditingTeacher(null);
//               }}
//               pending={pending}
//             />
//           )}

//           {/* Filter & Tables Container */}
//           <div className="bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl overflow-hidden">

//             <LessonsFilter
//               filter={filter}
//               setFilter={setFilter}
//               classes={classes}
//               onFilter={handleFilter}
//               showLessons={showLessons}
//               setShowLessons={setShowLessons}
//               showAssigned={showAssigned}
//               setShowAssigned={setShowAssigned}
//               pending={lessonsLoading}
//             />

//             {showLessons && (
//               <LessonsTable
//                 show={showLessons}
//                 loading={lessonsLoading}
//                 lessons={lessons}
//                 onPrint={handlePrint}
//               />
//             )}

//             {showAllGrades && (
//               <AllGradesLessonsTable
//                 loading={allGradesLoading}
//                 dataByClass={allGradesLessons}
//                 date={filter.date}
//               />
//             )}

//             {showAssigned && (
//               <AssignedTeachersTable
//                 show={showAssigned}
//                 data={assignedData}
//                 loading={lessonsLoading}
//                 scheduleInfo={scheduleInfo}
//                 filter={filter}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* CRITICAL: EditSchedule Modal - Passed Session */}
//       {showScheduleModal && session?.user && (
//         <EditSchedule
//           show={showScheduleModal}
//           onClose={() => {
//             console.log("Closing Schedule Modal");
//             setShowScheduleModal(false);
//           }}
//           classes={classes}
//           subjects={subjects}
//           user={session.user}
//         />
//       )}
//   {/* <MissingSubmissionsTable
//   data={teachers}
//   scheduleInfo={scheduleInfo}
//   date={filter.date}
// /> */}

//       {/* Bottom Actions */}
//       <div className="flex justify-center pb-8">
//         <button
//           onClick={handleSaveAllGrades}
//           disabled={allGradesLoading}
//           className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-lg shadow-emerald-200/50 hover:from-emerald-600 hover:to-teal-700 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {allGradesLoading ? (
//             <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
//           ) : (
//             <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
//           )}
//           <span>{allGradesLoading ? t('buttons.savingAllGrades') : t('buttons.saveAllGrades')}</span>
//         </button>
//       </div>

//       {/* Global loading overlay */}
//       {pending > 0 && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
//           <div className="relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
//             <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-lg animate-pulse">
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m0 0l-3-3m-3 3l-3-3m3 3V4"></path></svg>
//             </div>
//             <p className="text-lg font-bold text-slate-800">{t('loading.working')}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }