// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Teacher = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string | null;
  jobTitle?: string | null;
  specialty?: string | null;
  schoolName?: string | null;
  classesTaught?: { class: { id: string; name: string } }[];
  subjectsTaught?: { subject: { id: string; name: string } }[];
};

type Class = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
};

export default function AdminTeachersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

        const teachersData: Teacher[] = await teachersRes.json();
        const classesData: Class[] = await classesRes.json();
        const subjectsData: Subject[] = await subjectsRes.json();

        setTeachers(teachersData);
        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, status, router]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.password) {
      toast.error("Password is required");
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
        throw new Error(data.error || "Failed to create teacher");
      }

      toast.success("Teacher created successfully");
      const updated = await fetch("/api/admin/teachers").then((r) => r.json());
      setTeachers(updated);
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
      toast.error(err.message || "Failed to create teacher");
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;

    try {
      const body: any = {
        username: editingTeacher.username,
        name: editingTeacher.name,
        email: editingTeacher.email,
        classIds: (editingTeacher.classesTaught || []).map((c) => c.class.id),
        subjectIds: (editingTeacher.subjectsTaught || []).map((s) => s.subject.id),
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
        throw new Error(data.error || "Failed to update teacher");
      }

      toast.success("Teacher updated successfully");
      const updated = await fetch("/api/admin/teachers").then((r) => r.json());
      setTeachers(updated);
      setShowEditModal(false);
      setEditingTeacher(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update teacher");
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete teacher");

      toast.success("Teacher deleted");
      const updated = await fetch("/api/admin/teachers").then((r) => r.json());
      setTeachers(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete teacher");
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Subject name already exists");
      }

      toast.success("Subject created");
      const updated = await fetch("/api/subjects").then((r) => r.json());
      setSubjects(updated);
      setNewSubject({ name: "" });
      setShowCreateSubject(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create subject");
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Class name already exists");
      }

      toast.success("Class created successfully");
      const updated = await fetch("/api/classes").then((r) => r.json());
      setClasses(updated);
      setNewClass({ name: "" });
      setShowCreateClass(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create class");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 px-6 text-center">
        <p className="text-base font-medium text-slate-700">
          Loading teachers and data...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Manage Teachers</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create, edit, and assign teachers to classes and subjects.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setShowCreateTeacher(true)}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 transition"
        >
          Add New Teacher
        </button>
        <button
          onClick={() => setShowCreateClass(true)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
        >
          Add New Class
        </button>
        <button
          onClick={() => setShowCreateSubject(true)}
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-amber-700 transition"
        >
          Add New Subject
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-teal-600 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">
            All Teachers ({teachers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-slate-700">Username</th>
                <th className="px-5 py-3 text-left font-medium text-slate-700">Name</th>
                <th className="px-5 py-3 text-left font-medium text-slate-700">Email</th>
                <th className="px-5 py-3 text-left font-medium text-slate-700">Classes</th>
                <th className="px-5 py-3 text-left font-medium text-slate-700">Subjects</th>
                <th className="px-5 py-3 text-left font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="text-4xl mb-3 opacity-20">👩‍🏫</div>
                    <p className="text-slate-600 text-sm">No teachers found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click "Add New Teacher" to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-teal-50/40 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">{teacher.username}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{teacher.name}</td>
                    <td className="px-5 py-3 text-slate-700">
                      {teacher.email || <span className="text-slate-400 italic">No email</span>}
                    </td>
                    <td className="px-5 py-3">
                      {(teacher.classesTaught ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.classesTaught!.map((c) => (
                            <span
                              key={c.class.id}
                              className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium"
                            >
                              {c.class.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {(teacher.subjectsTaught ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjectsTaught!.map((s) => (
                            <span
                              key={s.subject.id}
                              className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-medium"
                            >
                              {s.subject.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTeacher({
                              ...teacher,
                              password: "",
                            });
                            setShowEditModal(true);
                          }}
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition"
                        >
                          Delete
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
          <div className="w-full max-w-4xl rounded-2xl bg-white p-7 shadow-xl">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Create New Teacher</h2>
            <form onSubmit={handleCreateTeacher} className="space-y-5 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Username"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Assign Classes</label>
                  <select
                    multiple
                    size={7}
                    value={newTeacher.classIds}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        classIds: Array.from(e.target.selectedOptions, (o) => o.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Assign Subjects</label>
                  <select
                    multiple
                    size={7}
                    value={newTeacher.subjectIds}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        subjectIds: Array.from(e.target.selectedOptions, (o) => o.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacher(false)}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-7 py-2 text-xs font-medium text-white shadow hover:bg-teal-700 transition"
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
          <div className="w-full max-w-4xl rounded-2xl bg-white p-7 shadow-xl my-8">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Edit Teacher: {editingTeacher.name}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTeacher();
              }}
              className="space-y-5 text-sm"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Username"
                  value={editingTeacher.username}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={editingTeacher.email || ""}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value || null })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
                <input
                  type="password"
                  placeholder="New Password (leave blank to keep current)"
                  value={editingTeacher.password || ""}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Classes</label>
                  <select
                    multiple
                    size={7}
                    value={(editingTeacher.classesTaught || []).map((c) => c.class.id)}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, (o) => o.value);
                      const newClasses = classes
                        .filter((c) => selectedIds.includes(c.id))
                        .map((c) => ({ class: { id: c.id, name: c.name } }));
                      setEditingTeacher({
                        ...editingTeacher,
                        classesTaught: newClasses,
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Subjects</label>
                  <select
                    multiple
                    size={7}
                    value={(editingTeacher.subjectsTaught || []).map((s) => s.subject.id)}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, (o) => o.value);
                      const newSubjects = subjects
                        .filter((s) => selectedIds.includes(s.id))
                        .map((s) => ({ subject: { id: s.id, name: s.name } }));
                      setEditingTeacher({
                        ...editingTeacher,
                        subjectsTaught: newSubjects,
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
                  }}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-7 py-2 text-xs font-medium text-white shadow hover:bg-teal-700 transition"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Create New Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-4 text-sm">
              <input
                type="text"
                placeholder="Class name"
                value={newClass.name}
                onChange={(e) => setNewClass({ name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                required
              />
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow hover:bg-indigo-700 transition"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Create New Subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-4 text-sm">
              <input
                type="text"
                placeholder="Subject name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                required
              />
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateSubject(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-medium text-white shadow hover:bg-amber-700 transition"
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