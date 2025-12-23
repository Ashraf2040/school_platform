// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
// ← adjust if you use next-i18next

type RawTeacher = {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string | null;
  classesTaught?: { class: { id: string; name: string } }[];
  subjectsTaught?: { subject: { id: string; name: string } }[];
};

type Teacher = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  password?: string;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
};

type Class = { id: string; name: string };
type Subject = { id: string; name: string };

export default function AdminTeachersPage() {
  const t  = useTranslations("AdminTeachers");

  const { data: session, status } = useSession();
  const router = useRouter();

  const [rawTeachers, setRawTeachers] = useState<RawTeacher[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);

  const [newTeacher, setNewTeacher] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    classIds: [] as string[],
    subjectIds: [] as string[],
  });

  const [newSubject, setNewSubject] = useState({ name: "" });
  const [newClass, setNewClass] = useState({ name: "" });

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Transform raw data → flat classes/subjects arrays
  const transformTeachers = (raw: RawTeacher[]): Teacher[] => {
    return raw.map((t) => ({
      id: t.id,
      username: t.username,
      name: t.name,
      email: t.email,
      classes: t.classesTaught?.map((c) => c.class) || [],
      subjects: t.subjectsTaught?.map((s) => s.subject) || [],
    }));
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [teachersRes, classesRes, subjectsRes] = await Promise.all([
          fetch("/api/admin/teachers"),
          fetch("/api/classes"),
          fetch("/api/subjects"),
        ]);

        if (!teachersRes.ok || !classesRes.ok || !subjectsRes.ok) {
          throw new Error("Failed to load data");
        }

        const rawTeachersData: RawTeacher[] = await teachersRes.json();
        const classesData: Class[] = await classesRes.json();
        const subjectsData: Subject[] = await subjectsRes.json();

        setRawTeachers(rawTeachersData);
        setTeachers(transformTeachers(rawTeachersData));
        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (err) {
        toast.error(t("errors.load"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, status, router, t]);

  const refreshData = async () => {
    try {
      const teachersRes = await fetch("/api/admin/teachers");
      const raw = await teachersRes.json();
      setRawTeachers(raw);
      setTeachers(transformTeachers(raw));
    } catch (err) {
      toast.error(t("errors.refresh"));
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.password) {
      toast.error(t("errors.passwordRequired"));
      return;
    }

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTeacher,
          role: "TEACHER",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.createTeacher"));
      }

      toast.success(t("success.teacherCreated"));
      await refreshData();
      setNewTeacher({
        username: "",
        name: "",
        email: "",
        password: "",
        classIds: [],
        subjectIds: [],
      });
      setShowCreateTeacher(false);
    } catch (err: any) {
      toast.error(err.message || t("errors.createTeacher"));
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;

    try {
      const body: any = {
        username: editingTeacher.username,
        name: editingTeacher.name,
        email: editingTeacher.email,
        classIds: editingTeacher.classes.map((c) => c.id),
        subjectIds: editingTeacher.subjects.map((s) => s.id),
      };

      if (editingTeacher.password && editingTeacher.password.trim()) {
        body.password = editingTeacher.password.trim();
      }

      const res = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.updateTeacher"));
      }

      toast.success(t("success.teacherUpdated"));
      await refreshData();
      setShowEditModal(false);
      setEditingTeacher(null);
    } catch (err: any) {
      toast.error(err.message || t("errors.updateTeacher"));
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("errors.deleteTeacher"));

      toast.success(t("success.teacherDeleted"));
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || t("errors.deleteTeacher"));
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubject),
      });

      if (!res.ok) throw new Error(t("errors.createSubject"));

      toast.success(t("success.subjectCreated"));
      const updated = await fetch("/api/subjects").then((r) => r.json());
      setSubjects(updated);
      setNewSubject({ name: "" });
      setShowCreateSubject(false);
    } catch (err: any) {
      toast.error(err.message || t("errors.createSubject"));
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });

      if (!res.ok) throw new Error(t("errors.createClass"));

      toast.success(t("success.classCreated"));
      const updated = await fetch("/api/classes").then((r) => r.json());
      setClasses(updated);
      setNewClass({ name: "" });
      setShowCreateClass(false);
    } catch (err: any) {
      toast.error(err.message || t("errors.createClass"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 px-6 text-center">
        <p className="text-base font-medium text-slate-700">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-8 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("subtitle")}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setShowCreateTeacher(true)}
          className="rounded-xl bg-teal-600 px-6 py-3 text-white font-medium shadow hover:bg-teal-700 transition"
        >
          {t("actions.addTeacher")}
        </button>
        <button
          onClick={() => setShowCreateClass(true)}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-medium shadow hover:bg-indigo-700 transition"
        >
          {t("actions.addClass")}
        </button>
        <button
          onClick={() => setShowCreateSubject(true)}
          className="rounded-xl bg-amber-600 px-6 py-3 text-white font-medium shadow hover:bg-amber-700 transition"
        >
          {t("actions.addSubject")}
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-teal-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t("table.title", { count: teachers.length })}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-slate-700">
                  {t("table.username")}
                </th>
                <th className="px-6 py-4 text-left font-medium text-slate-700">
                  {t("table.name")}
                </th>
                <th className="px-6 py-4 text-left font-medium text-slate-700">
                  {t("table.email")}
                </th>
                <th className="px-6 py-4 text-left font-medium text-slate-700">
                  {t("table.classes")}
                </th>
                <th className="px-6 py-4 text-left font-medium text-slate-700">
                  {t("table.subjects")}
                </th>
                <th className="px-6 py-4 text-left font-medium text-slate-700">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-5xl mb-4 opacity-20">👩‍🏫</div>
                    <p className="text-slate-600">{t("empty.title")}</p>
                    <p className="text-xs text-slate-500 mt-1">{t("empty.subtitle")}</p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-teal-50/30 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{teacher.username}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{teacher.name}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {teacher.email || <span className="italic text-slate-400">{t("noEmail")}</span>}
                    </td>
                    <td className="px-6 py-4">
                      {teacher.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {teacher.classes.map((c) => (
                            <span
                              key={c.id}
                              className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {teacher.subjects.map((s) => (
                            <span
                              key={s.id}
                              className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-medium"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingTeacher({
                              ...teacher,
                              password: "",
                            });
                            setShowEditModal(true);
                          }}
                          className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
                        >
                          {t("actions.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Teacher Modal */}
      {showCreateTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">{t("actions.addTeacher")}</h2>
            <form onSubmit={handleCreateTeacher} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  placeholder={t("table.username")}
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="text"
                  placeholder={t("table.name")}
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="email"
                  placeholder={t("table.email")}
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Assign Classes</label>
                  <select
                    multiple
                    size={8}
                    value={newTeacher.classIds}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        classIds: Array.from(e.target.selectedOptions, (o) => o.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Assign Subjects</label>
                  <select
                    multiple
                    size={8}
                    value={newTeacher.subjectIds}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        subjectIds: Array.from(e.target.selectedOptions, (o) => o.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacher(false)}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-8 py-3 text-sm font-medium text-white shadow hover:bg-teal-700"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl my-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Edit Teacher: {editingTeacher.name}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTeacher();
              }}
              className="space-y-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  placeholder={t("table.username")}
                  value={editingTeacher.username}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3"
                  required
                />
                <input
                  type="text"
                  placeholder={t("table.name")}
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3"
                  required
                />
                <input
                  type="email"
                  placeholder={t("table.email")}
                  value={editingTeacher.email || ""}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value || null })}
                  className="rounded-lg border border-slate-300 px-4 py-3"
                />
                <input
                  type="password"
                  placeholder="New Password (leave blank to keep current)"
                  value={editingTeacher.password || ""}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Classes</label>
                  <select
                    multiple
                    size={8}
                    value={editingTeacher.classes.map((c) => c.id)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                      const newClasses = classes
                        .filter((c) => selected.includes(c.id))
                        .map((c) => ({ id: c.id, name: c.name }));
                      setEditingTeacher({ ...editingTeacher, classes: newClasses });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Subjects</label>
                  <select
                    multiple
                    size={8}
                    value={editingTeacher.subjects.map((s) => s.id)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                      const newSubjects = subjects
                        .filter((s) => selected.includes(s.id))
                        .map((s) => ({ id: s.id, name: s.name }));
                      setEditingTeacher({ ...editingTeacher, subjects: newSubjects });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
                  }}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-8 py-3 text-sm font-medium text-white shadow hover:bg-teal-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Create New Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-5">
              <input
                type="text"
                placeholder="Class name"
                value={newClass.name}
                onChange={(e) => setNewClass({ name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                required
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm text-white shadow hover:bg-indigo-700"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subject Modal */}
      {showCreateSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Create New Subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-5">
              <input
                type="text"
                placeholder="Subject name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                required
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateSubject(false)}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm text-white shadow hover:bg-amber-700"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}