"use client";

import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

// --- Types ---
type TeacherAttendance = {
  id: string;
  name: string;
  email: string;
  isPresent: boolean;
  checkIn?: string;
  checkOut?: string | null;
};

type LeaveRequest = {
  id: string;
  teacher: { name: string; email: string };
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
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractTime = (dateString: string | undefined) => {
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

    // AUTO-REFRESH: Fetch data every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle Escape key
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
      } else {
        // Don't show toast on auto-refresh errors, only manual
        // toast.error("فشل تحميل البيانات");
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
        toast.success(status === "APPROVED" ? "تم قبول الطلب" : "تم رفض الطلب");
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
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Calculations for Stats
  const totalTeachers = teachers.length;
  const presentTeachers = teachers.filter(t => t.isPresent).length;
  const absentTeachers = totalTeachers - presentTeachers;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* --- Header --- */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">لوحة الإدارة</h1>
            <p className="text-slate-500 text-sm">إدارة الحضور والاستئذانات</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
            تحديث البيانات
          </button>
        </div>
      </header>

      <main className="w-full mx-auto p-6 space-y-8">
        
        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1">إجمالي المعلمين</div>
            <div className="text-3xl font-bold text-slate-800">{totalTeachers}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm font-medium mb-1">حضور اليوم</div>
              <div className="text-3xl font-bold text-slate-800">{presentTeachers}</div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-red-600 text-sm font-medium mb-1">غياب اليوم</div>
              <div className="text-3xl font-bold text-slate-800">{absentTeachers}</div>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- Main Content (Left) --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Teachers Table */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">حضور المعلمين اليوم</h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{new Date().toLocaleDateString("ar-EG")}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                      <th className="px-6 py-4">المعلم</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4">وقت الحضور</th>
                      <th className="px-6 py-4">وقت الانصراف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.length > 0 ? teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500">{t.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          {t.isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              حاضر
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              غائب
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{formatDate(t.checkIn)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{formatDate(t.checkOut)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                          لا توجد بيانات للعرض
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Work Shift Settings */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">إعدادات دوام اليوم</h2>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">بداية الدوام</label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">نهاية الدوام</label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <button
                  onClick={saveWorkShift}
                  disabled={shiftLoading}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 shadow-sm"
                >
                  {shiftLoading ? "حفظ..." : "حفظ"}
                </button>
              </div>
              {workShift && (
                <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  آخر تحديث: {new Date(workShift.date).toLocaleDateString("ar-EG")}
                </p>
              )}
            </section>
          </div>

          {/* --- Sidebar (Right) --- */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
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
                      className="group relative p-4 rounded-lg border border-amber-100 bg-amber-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer border-l-4 border-l-amber-400"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 text-sm">{req.teacher.name}</h3>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">معلق</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {new Date(req.leaveDate).toLocaleDateString("ar-EG")}</p>
                        <p className="flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {req.leaveTime}</p>
                        <p className="text-slate-800 line-clamp-1">"{req.reason}"</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/90 transition backdrop-blur-sm rounded-lg">
                        <span className="text-blue-600 font-bold text-sm">مراجعة الطلب</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  لا توجد طلبات معلقة
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 outline-none transition text-sm"
                  rows={3}
                  placeholder="اكتب ملاحظاتك هنا..."
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={closeModal}
                disabled={decisionLoading}
                className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDecision("REJECTED")}
                disabled={decisionLoading}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition text-sm shadow-sm"
              >
                رفض
              </button>
              <button
                onClick={() => handleDecision("APPROVED")}
                disabled={decisionLoading}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition text-sm shadow-sm"
              >
                موافقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
