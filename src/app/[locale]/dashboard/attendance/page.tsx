"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

// --- Types ---
type AttendanceRecord = {
  id: string;
  checkIn: string;
  checkOut?: string | null;
};

type WorkShift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
};

type LeaveRequest = {
  id: string;
  leaveDate: string;
  leaveTime: string;
  reason: string;
  status: string;
  adminNote?: string;
};

export default function AttendancePage() {
  const { data: session } = useSession();
  const [processing, setProcessing] = useState(false); // Stronger lock: prevents ANY action
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [workShift, setWorkShift] = useState<WorkShift | null>(null);
  
  // Leave Request States
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Timer states
  const [timerDisplay, setTimerDisplay] = useState<string>("00:00:00");
  const [timerLabel, setTimerLabel] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session) return;

    async function fetchAttendance() {
      try {
        // Now this GET endpoint exists and returns today's status
        const res = await fetch("/api/attendance");
        if (res.ok) {
          const data = await res.json();
          setAttendance(data.attendance);
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function fetchWorkShift() {
      try {
        const res = await fetch("/api/admin/work-shift"); 
        if (res.ok) {
          const data = await res.json();
          setWorkShift(data.workShift);
        }
      } catch (error) {
        console.error("Failed to fetch work shift", error);
      }
    }

    async function fetchLeaveRequests() {
      try {
        const res = await fetch("/api/leave-request");
        if (res.ok) {
          const data = await res.json();
          setLeaveRequests(data.requests);
        }
      } catch (error) {
        console.error(error);
      }
    }

    fetchAttendance();
    fetchWorkShift();
    fetchLeaveRequests();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  // Re-run timer when attendance or workShift changes
  useEffect(() => {
    if (attendance?.checkIn) {
      startTimer(attendance.checkIn, attendance.checkOut, workShift);
    }
  }, [attendance, workShift]);

  const getTimeFromDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return { hours: d.getHours(), minutes: d.getMinutes() };
  };

  const startTimer = (checkIn: string, checkOut?: string | null, shift?: WorkShift | null) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    function update() {
      const now = new Date();
      const checkInTime = new Date(checkIn);
      
      let shiftStartObj = new Date(now);
      let shiftEndObj = new Date(now);

      if (shift && shift.startTime) {
        const startT = getTimeFromDate(shift.startTime);
        const endT = shift.endTime ? getTimeFromDate(shift.endTime) : null;
        
        shiftStartObj.setHours(startT.hours, startT.minutes, 0, 0);
        
        if (endT) {
          shiftEndObj.setHours(endT.hours, endT.minutes, 0, 0);
        }
      } else {
        shiftStartObj = checkInTime;
        shiftEndObj = new Date(checkInTime.getTime() + 8 * 60 * 60 * 1000); 
      }

      let displayTime = "";
      let label = "";
      let percent = 0;

      if (checkOut) {
        const totalDuration = shiftEndObj.getTime() - shiftStartObj.getTime();
        const workedDuration = new Date(checkOut).getTime() - shiftStartObj.getTime();
        percent = (workedDuration / totalDuration) * 100;
        displayTime = formatDuration(Math.abs(workedDuration));
        label = "مدة الدوام (تم الإنتهاء)";
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        const totalDuration = shiftEndObj.getTime() - shiftStartObj.getTime();
        const elapsed = now.getTime() - shiftStartObj.getTime();
        const remaining = shiftEndObj.getTime() - now.getTime();

        if (remaining > 0) {
          displayTime = formatDuration(remaining);
          label = "الوقت المتبقي (العد التنازلي)";
          percent = (elapsed / totalDuration) * 100;
        } else {
          displayTime = "00:00:00";
          label = "انتهى الدوام (الرجاء تسجيل الخروج)";
          percent = 100;
        }
      }

      setTimerDisplay(displayTime);
      setTimerLabel(label);
      setProgress(Math.min(Math.max(percent, 0), 100)); 
    }

    update();
    if (!checkOut) {
      intervalRef.current = setInterval(update, 1000);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleAttendance = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!session) {
      toast.error("يجب تسجيل الدخول لتسجيل الحضور");
      return;
    }

    // STRICT LOCK: If already processing, ignore click completely
    if (processing) return;

    setProcessing(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendAttendance(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation failed", err);
          sendAttendance(null, null);
        }
      );
    } else {
      sendAttendance(null, null);
    }
  };

  const sendAttendance = async (latitude: number | null, longitude: number | null) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setAttendance(data.attendance);
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch {
      toast.error("فشل الاتصال بالخادم");
    } finally {
      // Release lock after a short delay to prevent accidental double clicks
      setTimeout(() => {
        setProcessing(false);
      }, 1500); 
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveDate || !leaveTime || !leaveReason) {
      toast.error("من فضلك املأ جميع الحقول");
      return;
    }

    try {
      const res = await fetch("/api/leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveDate, leaveTime, reason: leaveReason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("تم إرسال طلب الاستئذان");
        setLeaveDate("");
        setLeaveTime("");
        setLeaveReason("");
        setShowLeaveForm(false);
        setLeaveRequests((prev) => [data.leaveRequest, ...prev]);
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch {
      toast.error("فشل الاتصال بالخادم");
    }
  };

  const isCheckedIn = attendance && !attendance.checkOut;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "معلقة";
      case "APPROVED": return "موافقة";
      case "REJECTED": return "مرفوضة";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
          <div className="relative inline-block">
            <img
              src={"/default-avatar.png"}
              alt={session?.user?.name || "User"}
              className="w-28 h-28 rounded-full border-4 border-white/30 shadow-lg object-cover"
            />
            <span className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 border-4 border-white rounded-full"></span>
          </div>
          <h1 className="text-2xl font-bold mt-4">{session?.user?.name}</h1>
          <p className="text-blue-100 text-sm mt-1">{session?.user?.email}</p>
        </div>

        {/* Main Action Area */}
        <div className="p-6 space-y-6">
          
          {/* Status Card */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">الحالة الحالية</p>
              <h3 className="text-xl font-bold text-gray-800 mt-1">
                {isCheckedIn ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    متواجد حالياً
                  </span>
                ) : attendance ? (
                  <span className="text-gray-600">منتهي الدوام</span>
                ) : (
                  <span className="text-gray-400">لم يسجل دخول</span>
                )}
              </h3>
            </div>
            <div className="text-left">
              {attendance && (
                <div className="text-sm text-gray-600">
                  <p className="flex items-center gap-1">
                    🟢 <span>دخول: {new Date(attendance.checkIn).toLocaleTimeString("ar-EG", { hour: '2-digit', minute:'2-digit' })}</span>
                  </p>
                  {attendance.checkOut && (
                    <p className="flex items-center gap-1 mt-1">
                      🔴 <span>خروج: {new Date(attendance.checkOut).toLocaleTimeString("ar-EG", { hour: '2-digit', minute:'2-digit' })}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timer & Progress Section */}
          {attendance && attendance.checkIn && (
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 text-center">
              <p className="text-indigo-800 text-sm font-bold mb-2">{timerLabel}</p>
              <div className="text-4xl font-mono font-bold text-indigo-900 mb-4 tracking-wider">
                {timerDisplay}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-indigo-200 rounded-full h-2.5 dark:bg-indigo-200 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              {workShift && isCheckedIn && (
                <p className="text-xs text-indigo-600 mt-2">
                  نهاية الدوام: {workShift.endTime ? new Date(workShift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}
                </p>
              )}
            </div>
          )}

          {/* Big Action Button */}
          <button
            onClick={handleAttendance}
            disabled={processing || !session}
            className={`
              w-full py-5 rounded-xl text-xl font-bold text-white shadow-lg transform transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3
              ${isCheckedIn 
                ? "bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-red-500/30" 
                : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-green-500/30"
              }
            `}
          >
            {processing ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري المعالجة...
              </>
            ) : isCheckedIn ? (
              <>
                <span>🛑</span> تسجيل انصراف
              </>
            ) : (
              <>
                <span>✅</span> تسجيل حضور
              </>
            )}
          </button>

          {/* Leave Request Section */}
          <div className="border-t border-gray-100 pt-6">
            <button
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-medium"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg>
                طلب استئذان
              </span>
              <span>{showLeaveForm ? "▲" : "▼"}</span>
            </button>

            {showLeaveForm && (
              <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستئذان</label>
                  <input
                    type="date"
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وقت الانصراف</label>
                  <input
                    type="time"
                    value={leaveTime}
                    onChange={(e) => setLeaveTime(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={submitLeaveRequest}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-500/20"
                  >
                    إرسال الطلب
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Requests History */}
          {leaveRequests.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                طلبات الاستئذان السابقة
              </h2>
              <div className="space-y-3">
                {leaveRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600">
                        <p>📅 {new Date(req.leaveDate).toLocaleDateString("ar-EG")}</p>
                        <p>⏰ {req.leaveTime}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                        {getStatusText(req.status)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm bg-gray-50 p-2 rounded">{req.reason}</p>
                    {req.adminNote && (
                      <p className="mt-2 text-sm text-red-600 border-t pt-2">
                        <strong>ملاحظة الإدارة:</strong> {req.adminNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}