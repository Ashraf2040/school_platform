"use client";

import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

// --- Types ---
type TeacherAttendance = {
  id: string;
  name: string;
  email: string;
  isPresent: boolean; // We will ignore this from DB and calculate dynamically
  checkIn?: string;
  checkOut?: string | null;
};

type LeaveRequest = {
  id: string;
  teacher: { name: string; email: string; phone?: string }; // Added phone for notification logic context
  leaveDate: string;
  leaveTime: string;
  reason: string;
  status: string;
  adminNote?: string;
};

type WorkShift = {
  id: string;
  date: string;
  startTime: string;
  endTime?: string | null;
};

// --- Helpers ---
const getTodayDateString = () => {
  const date = new Date();
  // Returns YYYY-MM-DD in local time for accurate comparison
  return date.toLocaleDateString("en-CA");
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractTime = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    return dateString.slice(11, 16);
  } catch {
    return "";
  }
};

export default function AdminDashboard() {
  // --- States ---
  const [teachers, setTeachers] = useState<TeacherAttendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Work Shift States
  const [workShift, setWorkShift] = useState<WorkShift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    fetchData();
    fetchWorkShift();

    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedRequest(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/attendance");
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
        setLeaveRequests(data.leaveRequests || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkShift = async () => {
    try {
      const res = await fetch("/api/admin/work-shift");
      if (res.ok) {
        const data = await res.json();
        setWorkShift(data.workShift);
        if (data.workShift) {
          setShiftStart(extractTime(data.workShift.startTime));
          setShiftEnd(extractTime(data.workShift.endTime));
        }
      }
    } catch (error) {
      console.error("Failed to fetch work shift:", error);
    }
  };

  // --- Actions ---
  const saveWorkShift = async () => {
    if (!shiftStart) {
      toast.error("الرجاء إدخال وقت بداية الدوام");
      return;
    }
    setShiftLoading(true);
    try {
      const res = await fetch("/api/admin/work-shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: shiftStart, endTime: shiftEnd }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم تحديث وقت الدوام");
        setWorkShift(data.workShift);
      } else {
        toast.error(data.error || "حدث خطأ أثناء حفظ وقت الدوام");
      }
    } catch {
      toast.error("فشل الاتصال بالخادم");
    } finally {
      setShiftLoading(false);
    }
  };

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedRequest) return;
    
    if (status === "REJECTED" && !adminNote.trim()) {
      toast.error("يجب كتابة ملاحظة عند رفض الطلب");
      return;
    }

    setDecisionLoading(true);
    try {
      // This API call triggers the backend to send WhatsApp/Messenger notifications
      const res = await fetch("/api/admin/leave-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          status,
          adminNote: status === "REJECTED" ? adminNote : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(status === "APPROVED" ? "تم قبول الطلب وإرسال الإشعار" : "تم رفض الطلب وإرسال الإشعار");
        closeModal();
        fetchData(); 
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch {
      toast.error("فشل الاتصال بالخادم");
    } finally {
      setDecisionLoading(false);
    }
  };

  // --- Modal Logic ---
  const closeModal = () => {
    setSelectedRequest(null);
    setAdminNote("");
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  // --- Dynamic Filtering ---
  const today = getTodayDateString();
  
  // Logic to fix the glitch: Only mark as present if checkIn date matches TODAY
  const presentTeachers = teachers.filter(t => 
    t.checkIn && t.checkIn.startsWith(today)
  );
  
  const absentTeachers = teachers.filter(t => 
    !(t.checkIn && t.checkIn.startsWith(today))
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-teal-50/40 to-transparent opacity-70" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.25]">
          <defs>
            <pattern id="att-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#0f766e" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#att-grid)" />
        </svg>
      </div>

      <div className="w-full px-6 lg:px-10 py-8 space-y-8">
        
        {/* --- Header --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/50">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              لوحة الإدارة
            </h1>
            <p className="text-slate-500 mt-1">إدارة الحضور اليومي وطلبات الاستئذان</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={fetchData}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition font-medium text-sm shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              تحديث البيانات
            </button>
          </div>
        </header>

        {/* --- Stats Cards (Full Width) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition">
            <div className="text-slate-500 text-sm font-medium mb-1">إجمالي المعلمين</div>
            <div className="text-3xl font-bold text-slate-800">{teachers.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <div className="text-emerald-600 text-sm font-medium mb-1">حضور اليوم</div>
              <div className="text-3xl font-bold text-slate-800">{presentTeachers.length}</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <div className="text-rose-600 text-sm font-medium mb-1">غياب اليوم</div>
              <div className="text-3xl font-bold text-slate-800">{absentTeachers.length}</div>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* --- Left Column (Tables) --- */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* --- Present Teachers Table --- */}
            <section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
                <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  حضور اليوم
                </h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                  {new Date().toLocaleDateString("ar-EG")}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-6 py-4">المعلم</th>
                      <th className="px-6 py-4">وقت الحضور</th>
                      <th className="px-6 py-4">وقت الانصراف</th>
                      <th className="px-6 py-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {presentTeachers.length > 0 ? presentTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-emerald-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-400">{t.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono font-medium">{extractTime(t.checkIn)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{extractTime(t.checkOut)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            حاضر
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm bg-slate-50/50">
                          لا يوجد حضور مسجل لليوم بعد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* --- Absent Teachers Table --- */}
            <section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  غياب اليوم
                </h2>
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-md">
                  {new Date().toLocaleDateString("ar-EG")}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-6 py-4">المعلم</th>
                      <th className="px-6 py-4">آخر حضور</th>
                      <th className="px-6 py-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absentTeachers.length > 0 ? absentTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-rose-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-400">{t.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                          {t.checkIn ? extractTime(t.checkIn) : "سجل جديد"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            غائب
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm bg-slate-50/50">
                          جميع المعلمين حاضرون 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* --- Work Shift Settings --- */}
            <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                إعدادات دوام اليوم
              </h2>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">بداية الدوام</label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white/80"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">نهاية الدوام</label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white/80"
                  />
                </div>
                <button
                  onClick={saveWorkShift}
                  disabled={shiftLoading}
                  className="w-full md:w-auto px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-md shadow-teal-200"
                >
                  {shiftLoading ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
              {workShift && (
                <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  آخر تحديث: {new Date(workShift.date).toLocaleDateString("ar-EG")}
                </p>
              )}
            </section>
          </div>

          {/* --- Sidebar (Requests) --- */}
          <div className="xl:col-span-1">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm border border-white/60 p-6 h-full sticky top-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>طلبات الاستئذان</span>
                {leaveRequests.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{leaveRequests.length}</span>
                )}
              </h2>

              {leaveRequests.length > 0 ? (
                <div className="space-y-4">
                  {leaveRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="group relative p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-white hover:shadow-md hover:border-amber-200 transition-all cursor-pointer border-l-4 border-l-amber-400"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 text-sm">{req.teacher.name}</h3>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">معلق</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {new Date(req.leaveDate).toLocaleDateString("ar-EG")}</p>
                        <p className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {req.leaveTime}</p>
                        <p className="text-slate-800 line-clamp-1">"{req.reason}"</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/95 transition backdrop-blur-sm rounded-xl">
                        <span className="text-teal-600 font-bold text-sm">مراجعة الطلب</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  لا توجد طلبات معلقة
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Modal --- */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={handleBackdropClick}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
          >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">إدارة طلب الاستئذان</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="font-medium text-slate-600">المعلم:</span>
                <span className="font-bold text-slate-900">{selectedRequest.teacher.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100">
                <div>
                  <span className="block text-xs text-slate-500 mb-1">التاريخ</span>
                  <span className="text-sm font-medium">{new Date(selectedRequest.leaveDate).toLocaleDateString("ar-EG")}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-1">الوقت</span>
                  <span className="text-sm font-medium">{selectedRequest.leaveTime}</span>
                </div>
              </div>

              <div className="py-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">السبب</label>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-lg text-sm">{selectedRequest.reason}</p>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ملاحظة الإدارة <span className="text-xs text-slate-400 font-normal">(مطلوب عند الرفض)</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm bg-white"
                  rows={3}
                  placeholder="اكتب ملاحظاتك هنا..."
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={closeModal}
                disabled={decisionLoading}
                className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-xl transition text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDecision("REJECTED")}
                disabled={decisionLoading}
                className="px-4 py-2 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition text-sm shadow-sm"
              >
                رفض
              </button>
              <button
                onClick={() => handleDecision("APPROVED")}
                disabled={decisionLoading}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition text-sm shadow-sm"
              >
                {decisionLoading ? "جاري الإرسال..." : "موافقة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}