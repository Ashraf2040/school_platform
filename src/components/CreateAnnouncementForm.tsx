// src/components/CreateAnnouncementForm.tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { createAnnouncement } from "@/app/actions/createAnnouncement";
import { toast } from "react-hot-toast";

type Props = {
  type: "general" | "targeted";
  teachers: { id: string; name: string }[];
  subjects: {
    id: string;
    name: string;
    teachers: { teacher: { id: string } }[];
  }[];
};

type AnnouncementFormState = {
  message: string;
  success: boolean;
};

const initialState: AnnouncementFormState = { message: "", success: false };

export default function CreateAnnouncementForm({ type, teachers, subjects }: Props) {
  const [state, formAction] = useActionState<AnnouncementFormState, FormData>(
    createAnnouncement,
    initialState
  );
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  useEffect(() => {
    if (state?.success) {
      toast.success("Announcement published successfully");
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state]);
console.log(type)
  return (
    <form
      action={formAction}
      className="space-y-6 bg-white p-8 rounded-2xl shadow-lg"
      encType="multipart/form-data"
    >
      {/* Pass type to the server action */}
      <input type="hidden" name="type" value={type} />

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Title
        </label>
        <input
          name="title"
          required
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-teal-500"
          placeholder="Enter announcement title"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Body
        </label>
        <textarea
          name="body"
          required
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-teal-500"
          placeholder="Write the announcement content..."
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Date
        </label>
        <input
          name="date"
          type="date"
          required
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500"
        />
      </div>

      {/* Attachment */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Attachment (optional)
        </label>
        <input
          name="attachment"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.png"
          className="w-full"
        />
      </div>

      {/* Targeted recipients */}
      {type === "targeted" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Recipients (by teacher or subject)
          </label>
          <div className="space-y-4 max-h-96 overflow-y-auto p-4 border rounded-lg">
            {/* by subject (all teachers of a subject) */}
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={subject.id}
                  onChange={(e) => {
                    const ids = subject.teachers.map((t) => t.teacher.id);
                    if (e.target.checked) {
                      setSelectedTeacherIds((prev) => [
                        ...prev,
                        ...ids.filter((id) => !prev.includes(id)),
                      ]);
                    } else {
                      setSelectedTeacherIds((prev) =>
                        prev.filter((id) => !ids.includes(id))
                      );
                    }
                  }}
                />
                <label htmlFor={subject.id} className="text-sm">
                  All teachers of <strong>{subject.name}</strong>
                </label>
              </div>
            ))}

            {/* Individual teachers */}
            <div className="border-t pt-4 mt-4">
              <p className="font-medium mb-2">Or select individual teachers:</p>
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="teacherIds"
                    value={teacher.id}
                    checked={selectedTeacherIds.includes(teacher.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeacherIds((prev) => [...prev, teacher.id]);
                      } else {
                        setSelectedTeacherIds((prev) =>
                          prev.filter((id) => id !== teacher.id)
                        );
                      }
                    }}
                  />
                  <label>{teacher.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition"
      >
        Publish Announcement
      </button>
    </form>
  );
}
