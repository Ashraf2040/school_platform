// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Removed: import bcrypt from "bcryptjs";

type Teacher = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "TEACHER";
  password?: string; // Added temporarily for edit form
  teacherProfile?: {
    jobTitle?: string;
    specialty?: string;
    schoolName?: string;
  } | null;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
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
    if (!session?.user || session.user.role !== "ADMIN") {
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

        if (!teachersRes.ok || !classesRes.ok || !subjectsRes.ok) throw new Error("Failed to load data");

        const teachersData = await teachersRes.json();
        const classesData = await classesRes.json();
        const subjectsData = await subjectsRes.json();

        setTeachers(teachersData);
        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (err) {
        toast.error("Failed to load data");
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
      // NO HASHING — send password in plain text
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTeacher,
          password: newTeacher.password, // plain text
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
      setNewTeacher({ username: "", name: "", email: "", password: "", classIds: [], subjectIds: [] });
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
        classIds: editingTeacher.classes.map((c) => c.id),
        subjectIds: editingTeacher.subjects.map((s) => s.id),
      };

      // If new password provided → send plain text (optional change)
      if (editingTeacher.password && editingTeacher.password.trim()) {
        body.password = editingTeacher.password.trim(); // plain text
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
      <div className="mx-auto max-w-6xl py-16 px-6 text-center">
        <p className="text-lg font-medium text-slate-700">Loading teachers and data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Manage Teachers</h1>
        <p className="mt-2 text-base text-slate-600">
          Create, edit, and assign teachers to classes and subjects.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setShowCreateTeacher(true)}
          className="rounded-xl bg-teal-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-teal-700 transition"
        >
          Add New Teacher
        </button>
        <button
          onClick={() => setShowCreateClass(true)}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-indigo-700 transition"
        >
          Add New Class
        </button>
        <button
          onClick={() => setShowCreateSubject(true)}
          className="rounded-xl bg-amber-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-amber-700 transition"
        >
          Add New Subject
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-teal-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">All Teachers ({teachers.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Username</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Classes</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Subjects</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-5xl mb-4 opacity-20">👩‍🏫</div>
                    <p className="text-slate-600">No teachers found</p>
                    <p className="text-sm text-slate-500 mt-2">Click "Add New Teacher" to get started.</p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-teal-50/30 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{teacher.username}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{teacher.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{teacher.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {teacher.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.classes.map((c) => (
                            <span key={c.id} className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.subjects.map((s) => (
                            <span key={s.id} className="px-2.5 py-1 bg-sky-100 text-sky-700 rounded text-xs font-medium">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingTeacher({
                              ...teacher,
                              password: "", // clear password field on open
                            });
                            setShowEditModal(true);
                          }}
                          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition"
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

      {/* All Modals remain unchanged below — only password handling was modified above */}
      {/* ... (Create Teacher, Edit Teacher, Create Class, Create Subject modals stay the same) */}
      {/* I'm keeping them here for completeness — no changes needed in UI */}

      {/* Create Teacher Modal */}
      {showCreateTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Create New Teacher</h2>
            <form onSubmit={handleCreateTeacher} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Username"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assign Classes</label>
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assign Subjects</label>
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white"
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
                  className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-8 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 transition"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit, Create Class, Create Subject modals remain exactly as before */}
      {/* ... (no changes needed in UI or logic beyond password handling) */}

      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-xl my-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Edit Teacher: {editingTeacher.name}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTeacher(); }} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Username"
                  value={editingTeacher.username}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="password"
                  placeholder="New Password (leave blank to keep current)"
                  value={editingTeacher.password || ""}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Classes</label>
                  <select
                    multiple
                    size={8}
                    value={editingTeacher.classes.map((c) => c.id)}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        classes: classes.filter((c) => Array.from(e.target.selectedOptions).some((o) => o.value === c.id)),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
                  <select
                    multiple
                    size={8}
                    value={editingTeacher.subjects.map((s) => s.id)}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        subjects: subjects.filter((s) => Array.from(e.target.selectedOptions).some((o) => o.value === s.id)),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm bg-white"
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
                  className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-8 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class & Subject modals unchanged — omitted here for brevity */}
    </div>
  );
}