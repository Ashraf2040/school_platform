"use client";

import React, { useEffect, useState } from "react";

interface TeacherData {
  teacherId: string;
  teacherName: string;
  classes: string[];
  subjects: string[];
}

export default function TeachersScheduleTable() {
  const [date, setDate] = useState(() => {
    // افتراضي اليوم الحالي بصيغة yyyy-mm-dd
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teachers-schedule?date=${date}`);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers();
  }, [date]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">جدول المعلمين لجلسات اليوم</h2>

      <label className="block mb-4">
        اختر التاريخ:{" "}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </label>

      {loading && <p>جارٍ تحميل البيانات...</p>}
      {error && <p className="text-red-600">حدث خطأ: {error}</p>}

      {!loading && !error && teachers.length === 0 && (
        <p>لا توجد جلسات معلمين لهذا اليوم.</p>
      )}

      {!loading && !error && teachers.length > 0 && (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-right">اسم المعلم</th>
              <th className="border border-gray-300 px-3 py-2 text-right">الصفوف</th>
              <th className="border border-gray-300 px-3 py-2 text-right">المواد</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.teacherId} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-right">{t.teacherName}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {t.classes.join(", ")}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {t.subjects.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
