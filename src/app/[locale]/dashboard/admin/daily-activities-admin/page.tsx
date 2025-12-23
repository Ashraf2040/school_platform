'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
// ← or import from 'next-i18next'
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
import { downloadCsv, toCsv } from '@/utils';
import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
  const  t  = useTranslations('AdminDashboard');

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
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f1fbf9] to-[#eaf7f5] p-6">
      <div className="mx-auto mb-6 h-1 w-full max-w-7xl rounded-full bg-[#006d77]" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#064e4f]">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Action Bar */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setShowTeacherForm((v) => !v)}
            className="btn-primary"
          >
            {showTeacherForm ? t('buttons.hideCreateTeacher') : t('buttons.createTeacher')}
          </button>

          <button
            onClick={() => {
              const header = [
                t('table.username'),
                t('table.name'),
                t('table.classes'),
                t('table.subjects'),
              ];
              const rows = teachers.map((t) => [
                t.username ?? '',
                t.name ?? '',
                (t.classes ?? []).map((c: any) => c.name ?? '').join(' | '),
                (t.subjects ?? []).map((s: any) => s.name ?? '').join(' | '),
              ]);
              downloadCsv(
                `teachers_${new Date().toISOString().slice(0, 10)}.csv`,
                toCsv([header, ...rows])
              );
            }}
            className="btn-warning"
          >
            {t('buttons.exportTeachersCsv')}
          </button>

          <button
            onClick={() => setShowTeacherDetails((v) => !v)}
            className="btn-secondary"
          >
            {showTeacherDetails
              ? t('buttons.hideTeacherDetails')
              : t('buttons.showTeacherDetails')}
          </button>

          <button
            onClick={() => router.push('/dashboard/admin/teacherData')}
            className="btn-warning"
          >
            {t('buttons.teachersCards')}
          </button>

          <button
            onClick={() => setShowClassForm((v) => !v)}
            className="btn-tertiary"
          >
            {showClassForm ? t('buttons.hideCreateClass') : t('buttons.createClass')}
          </button>

          <button
            onClick={() => setShowSubjectForm((v) => !v)}
            className="btn-primary"
          >
            {showSubjectForm
              ? t('buttons.hideCreateSubject')
              : t('buttons.createSubject')}
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary"
          >
            {t('buttons.manageSchedules')}
          </button>
        </div>

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

        {/* Filter & Tables */}
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

        <EditSchedule
          show={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          classes={classes}
          subjects={subjects}
          user={{ id: '123' }}
        />

        <button
          onClick={handleSaveAllGrades}
          disabled={allGradesLoading}
          className="btn-success mt-6"
        >
          {allGradesLoading
            ? t('buttons.savingAllGrades')
            : t('buttons.saveAllGrades')}
        </button>

        {/* Global Loader */}
        {pending > 0 && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg ring-1 ring-gray-200">
              <span className="h-3 w-3 animate-ping rounded-full bg-[#006d77]" />
              <span className="text-sm text-gray-700">{t('loading.working')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}