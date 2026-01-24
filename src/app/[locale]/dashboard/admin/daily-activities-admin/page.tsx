'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

// Imports kept intact
import { useAssignedTeachers } from '@/app/hooks/useAssignedTeachers';
import LessonsFilter from '@/components/LessonsFilter';
import LessonsTable from '@/components/LessonsTable';
import { useAdminData } from '@/app/hooks/useAdminData';
import CreateTeacherForm from '@/components/CreateTeacherForm';
import CreateClassForm from '@/components/CreateClassForm';
import CreateSubjectForm from '@/components/CreateSubjectForm';
import TeacherList from '@/components/TeacherList';
import EditTeacherModal from '@/components/EditTeacherModal';
import AllGradesLessonsTable from '@/components/AllGradesLessonsTable';
import AssignedTeachersTable from '@/components/AssignedTeachersTable';
import EditSchedule from '@/components/EditSchedule';
import MissingSubmissionsTable from '@/components/MissingSubmissionsTable';

export default function AdminDashboard() {
  const t = useTranslations('AdminDashboard');
  const { data: session } = useSession(); // Use useSession to get the real user object
  const router = useRouter();

  // ——— Admin Data (teachers, classes, subjects) ———
  const {
    teachers,
    classes,
    subjects,
    isLoading: adminLoading,
    error: adminError,
    pending,
    track,
    fetchJson,
    refreshTeachers,
    refreshClasses,
    refreshSubjects,
  } = useAdminData();

  // ——— UI Toggles ———
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [showLessons, setShowLessons] = useState(false);
  const [showAssigned, setShowAssigned] = useState(false);
  const [assignedData, setAssignedData] = useState<any[]>([]);
  const [allGradesLessons, setAllGradesLessons] = useState<Record<string, any[]>>({});
  const [allGradesLoading, setAllGradesLoading] = useState(false);
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // ——— Filter & Lessons ———
  const [filter, setFilter] = useState({ classId: '', date: '' });
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState({});

  // ——— Edit Modal ———
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ——— CSV Helpers ———
  const toCsv = (array: any[][]) => array.map(row => row.map(item => `"${item}"`).join(',')).join('\n');
  
  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ADDED LOGGING FOR DEBUGGING
  const handleToggleLog = (name: string) => {
    console.log(`[AdminDashboard] Clicking: ${name}`);
  };

  const handleFilter = async () => {
    if (!filter.classId || !filter.date) {
      toast.error(t('errors.selectClassAndDate'));
      return;
    }
    try {
      setLessonsLoading(true);
      const data = await fetch(`/api/lessons?classId=${filter.classId}&date=${filter.date}`)
        .then((r) => r.json())
        .catch(() => []);
      setLessons(data ?? []);
      setShowLessons(true);
    } catch (err) {
      toast.error(t('errors.loadLessons'));
      console.error(err);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (filter.classId) {
      fetch(`/api/schedule?classId=${filter.classId}`)
        .then((res) => res.json())
        .then((data) => setScheduleInfo(data.schedule || {}));
    }
  }, [filter.classId]);

  const newAssigned = useAssignedTeachers({
    lessons,
    teachers,
    filter,
    scheduleInfo,
    subjects,
  });

  useEffect(() => {
    if (Array.isArray(newAssigned) && newAssigned.length > 0) {
      setAssignedData(newAssigned);
    }
  }, [newAssigned]);

  const handleShowAssigned = async () => {
    if (!filter.classId || !filter.date) {
      toast.error(t('errors.selectClassAndDate'));
      return;
    }
    const res = await fetch(`/api/schedule?classId=${filter.classId}`);
    const data = await res.json();
    setScheduleInfo(data.schedule || {});
    setShowAssigned(true);
  };

  const handleSaveAllGrades = async () => {
    if (!filter.date) {
      toast.error(t('errors.selectDateFirst'));
      return;
    }
    setAllGradesLoading(true);
    setShowAllGrades(true);
    setShowLessons(false);
    setShowAssigned(false);
    try {
      const promises = classes.map((cls) =>
        fetch(`/api/lessons?classId=${cls.id}&date=${filter.date}`)
          .then((r) => r.json())
          .then((data) => ({ classId: cls.id, className: cls.name, lessons: data ?? [] }))
          .catch(() => ({ classId: cls.id, className: cls.name, lessons: [] }))
      );

      const results = await Promise.all(promises);
      const grouped: Record<string, any[]> = {};
      results.forEach((r) => {
        grouped[r.classId] = r.lessons.map((l: any) => ({
          ...l,
          __className: r.className,
        }));
      });
      setAllGradesLessons(grouped);
    } catch (err) {
      toast.error(t('errors.loadAllGrades'));
      console.error(err);
    } finally {
      setAllGradesLoading(false);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const cls = classes.find((c) => c.id === filter.classId);
    const html = document.getElementById('lessons-table')?.outerHTML ?? '';
    w.document.write(`
<html>
<head>
<title>${cls?.name ?? ''} - ${date}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
  h1 { text-align: center; color: #064e4f; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
  th { background: #006d77; color: white; }
  tr:nth-child(odd) { background: #f8fafc; }
</style>
</head>
<body>
  <h1>${t('print.dailyPlan')} – ${cls?.name ?? ''} – ${date}</h1>
  ${html}
</body>
</html>
`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="min-h-screen w-full text-slate-900 relative overflow-hidden bg-slate-50">

      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-100/50 to-transparent opacity-60" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.3]">
          <defs>
            <pattern id="admin-dashboard-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#0f766e" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-dashboard-grid)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/90 pointer-events-none" />
      </div>

      <div className="mx-auto w-full px-6 lg:px-8 py-8 sm:py-10">

        {/* ================= HEADER ================= */}
      

        {/* ================= QUICK ACTIONS GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

          {/* Create Teacher */}
          <button
            onClick={() => {
              handleToggleLog('Create Teacher Form');
              setShowTeacherForm((v) => !v);
            }}
            className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              showTeacherForm
                ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                : 'border-white bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
              {showTeacherForm ? t('buttons.hideCreateTeacher') : t('buttons.createTeacher')}
            </span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => {
              const header = [
                t('table.username'),
                t('table.name'),
                t('table.classes'),
                t('table.subjects'),
              ];
              const rows = teachers.map((teacher: any) => [
                teacher.username ?? '',
                teacher.name ?? '',
                (teacher.classes ?? []).map((c: any) => c.name ?? '').join(' | '),
                (teacher.subjects ?? []).map((s: any) => s.name ?? '').join(' | '),
              ]);
              downloadCsv(
                `teachers_${new Date().toISOString().slice(0, 10)}.csv`,
                toCsv([header, ...rows])
              );
            }}
            className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-white bg-white hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
              {t('buttons.exportTeachersCsv')}
            </span>
          </button>

          {/* Show Teacher Details */}
          <button
            onClick={() => {
              handleToggleLog('Show Teacher Details');
              setShowTeacherDetails((v) => !v);
            }}
            className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              showTeacherDetails
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                : 'border-white bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0h6m2 2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
              {showTeacherDetails ? t('buttons.hideTeacherDetails') : t('buttons.showTeacherDetails')}
            </span>
          </button>

          {/* Cards View */}
          <button
            onClick={() => router.push('/dashboard/admin/teacherData')}
            className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-white bg-white hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">
              {t('buttons.teachersCards')}
            </span>
          </button>

          {/* Create Class */}
          <button
            onClick={() => {
              handleToggleLog('Create Class Form');
              setShowClassForm((v) => !v);
            }}
            className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              showClassForm
                ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                : 'border-white bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
              {showClassForm ? t('buttons.hideCreateClass') : t('buttons.createClass')}
            </span>
          </button>

          {/* Create Subject */}
          <button
            onClick={() => {
              handleToggleLog('Create Subject Form');
              setShowSubjectForm((v) => !v);
            }}
            className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              showSubjectForm
                ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                : 'border-white bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
              {showSubjectForm ? t('buttons.hideCreateSubject') : t('buttons.createSubject')}
            </span>
          </button>

          {/* Manage Schedule */}
          <button
            onClick={() => {
              handleToggleLog('Manage Schedules');
              setShowScheduleModal(true);
            }}
            className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-white bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
              {t('buttons.manageSchedules')}
            </span>
          </button>
        </div>

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="space-y-8">

          {/* Forms */}
          <CreateTeacherForm
            show={showTeacherForm}
            classes={classes}
            subjects={subjects}
            track={track}
            fetchJson={fetchJson}
            toast={toast}
            onSuccess={() => {
              setShowTeacherForm(false);
              refreshTeachers();
            }}
            pending={pending}
          />

          <CreateClassForm
            show={showClassForm}
            track={track}
            fetchJson={fetchJson}
            toast={toast}
            onSuccess={() => {
              setShowClassForm(false);
              refreshClasses();
            }}
            pending={pending}
          />

          <CreateSubjectForm
            show={showSubjectForm}
            track={track}
            fetchJson={fetchJson}
            toast={toast}
            onSuccess={() => {
              setShowSubjectForm(false);
              refreshSubjects();
            }}
            pending={pending}
          />

          {/* Teacher List */}
          <TeacherList
            show={showTeacherDetails}
            teachers={teachers}
            onEdit={(teacher) => {
              setEditingTeacher({
                id: teacher.id,
                username: teacher.username,
                name: teacher.name,
                password: '',
                classIds: teacher.classes.map((c: any) => c.id),
                subjectIds: teacher.subjects.map((s: any) => s.id),
              });
              setShowEditModal(true);
            }}
            onDelete={async (id) => {
              if (!confirm(t('confirm.deleteTeacher'))) return;
              await toast.promise(
                track(fetchJson(`/api/admin/teachers/${id}`, { method: 'DELETE' })),
                {
                  loading: t('toast.loading'),
                  success: t('toast.deleted'),
                  error: t('toast.failed'),
                }
              );
              refreshTeachers();
            }}
            pending={pending}
          />

          {/* Edit Modal */}
          {showEditModal && editingTeacher && (
            <EditTeacherModal
              teacher={editingTeacher}
              setTeacher={setEditingTeacher}
              classes={classes}
              subjects={subjects}
              onClose={() => {
                setShowEditModal(false);
                setEditingTeacher(null);
              }}
              onSave={async () => {
                const body: any = {
                  username: editingTeacher.username,
                  name: editingTeacher.name,
                  classIds: editingTeacher.classIds,
                  subjectIds: editingTeacher.subjectIds,
                };
                if (editingTeacher.password) body.password = editingTeacher.password;

                await toast.promise(
                  track(
                    fetchJson(`/api/admin/teachers/${editingTeacher.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body),
                    })
                  ),
                  {
                    loading: t('toast.saving'),
                    success: t('toast.updated'),
                    error: t('toast.failed'),
                  }
                );
                refreshTeachers();
                setShowEditModal(false);
                setEditingTeacher(null);
              }}
              pending={pending}
            />
          )}

          {/* Filter & Tables Container */}
          <div className="bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl overflow-hidden">

            <LessonsFilter
              filter={filter}
              setFilter={setFilter}
              classes={classes}
              onFilter={handleFilter}
              showLessons={showLessons}
              setShowLessons={setShowLessons}
              showAssigned={showAssigned}
              setShowAssigned={setShowAssigned}
              pending={lessonsLoading}
            />

            {showLessons && (
              <LessonsTable
                show={showLessons}
                loading={lessonsLoading}
                lessons={lessons}
                onPrint={handlePrint}
              />
            )}

            {showAllGrades && (
              <AllGradesLessonsTable
                loading={allGradesLoading}
                dataByClass={allGradesLessons}
                date={filter.date}
              />
            )}

            {showAssigned && (
              <AssignedTeachersTable
                show={showAssigned}
                data={assignedData}
                loading={lessonsLoading}
                scheduleInfo={scheduleInfo}
                filter={filter}
              />
            )}
          </div>
        </div>
      </div>

      {/* CRITICAL: EditSchedule Modal - Passed Session */}
      {showScheduleModal && session?.user && (
        <EditSchedule
          show={showScheduleModal}
          onClose={() => {
            console.log("Closing Schedule Modal");
            setShowScheduleModal(false);
          }}
          classes={classes}
          subjects={subjects}
          user={session.user}
        />
      )}
  {/* <MissingSubmissionsTable
  data={teachers}
  scheduleInfo={scheduleInfo}
  date={filter.date}
/> */}

      {/* Bottom Actions */}
      <div className="flex justify-center pb-8">
        <button
          onClick={handleSaveAllGrades}
          disabled={allGradesLoading}
          className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-lg shadow-emerald-200/50 hover:from-emerald-600 hover:to-teal-700 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allGradesLoading ? (
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
          )}
          <span>{allGradesLoading ? t('buttons.savingAllGrades') : t('buttons.saveAllGrades')}</span>
        </button>
      </div>

      {/* Global loading overlay */}
      {pending > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-lg animate-pulse">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m0 0l-3-3m-3 3l-3-3m3 3V4"></path></svg>
            </div>
            <p className="text-lg font-bold text-slate-800">{t('loading.working')}</p>
          </div>
        </div>
      )}
    </div>
  );
}