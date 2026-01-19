"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as faceapi from "face-api.js";
import Link from "next/link";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// Office Location Config
// ────────────────────────────────────────────────
const OFFICE_LOCATION = {
  lat: 21.434300867,
  lng: 39.798508625,
  radiusInMeters: 500,
};

// Haversine distance calculator
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// ────────────────────────────────────────────────
// Face Verification Modal
// ────────────────────────────────────────────────
type FaceVerificationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  userImage: string | null | undefined;
};

const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  userImage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<
    "init" | "loading_models" | "ready" | "detecting" | "success" | "error"
  >("init");
  const [errorMessage, setErrorMessage] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load models from CDN (once - when component first mounts)
  useEffect(() => {
    if (modelsLoaded) return;

    const loadModels = async () => {
      if (typeof window === "undefined") return;

      setStatus("loading_models");

      try {
        const MODEL_URL =
          "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("[FaceAPI] Models loaded successfully from CDN");
        setModelsLoaded(true);
        setStatus("ready");
      } catch (err) {
        console.error("[FaceAPI] Failed to load models:", err);
        setErrorMessage("فشل تحميل نماذج التعرف على الوجه");
        setStatus("error");
      }
    };

    void loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← important: empty dependency → run once

  // Camera & face matching logic
  useEffect(() => {
    if (!isOpen || !modelsLoaded || status !== "ready") return;

    let stream: MediaStream | null = null;
    let intervalId: number | null = null;

    const startDetection = async () => {
      if (!videoRef.current || !userImage) return;

      setStatus("detecting");

      try {
        const referenceImage = await faceapi.fetchImage(userImage);
        const refResult = await faceapi
          .detectSingleFace(referenceImage)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!refResult) {
          setErrorMessage("لم نستطع استخراج ملامح الوجه من صورتك الشخصية");
          setStatus("error");
          return;
        }

        const refDescriptor = refResult.descriptor;

        intervalId = window.setInterval(async () => {
          if (!videoRef.current) return;

          const detection = await faceapi
            .detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            const distance = faceapi.euclideanDistance(
              refDescriptor,
              detection.descriptor
            );

            if (distance < 0.6) {
              if (intervalId) clearInterval(intervalId);
              setStatus("success");
              setTimeout(() => {
                onVerified();
                onClose();
              }, 1200);
            } else {
              setErrorMessage(`المطابقة ضعيفة (${distance.toFixed(2)})`);
            }
          } else {
            setErrorMessage("يرجى إظهار الوجه بوضوح أمام الكاميرا");
          }
        }, 1200);
      } catch (err) {
        setErrorMessage("حدث خطأ أثناء معالجة الصورة");
        setStatus("error");
      }
    };

    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          void startDetection();
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setErrorMessage("تعذر الوصول إلى الكاميرا");
        setStatus("error");
      }
    };

    void startVideo();

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen, modelsLoaded, status, userImage, onVerified, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-5 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">التحقق من الهوية</h2>

        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/5] mx-auto max-w-[280px]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {status === "loading_models" && (
          <p className="text-gray-600">جاري تحميل نماذج الذكاء...</p>
        )}

        {status === "ready" && (
          <p className="text-blue-600 font-medium">جاهز للمطابقة</p>
        )}

        {status === "detecting" && (
          <p className="text-blue-600 font-medium animate-pulse">
            جاري التحقق من الوجه...
          </p>
        )}

        {(status === "error" || errorMessage) && (
          <p className="text-red-600 text-sm px-2">{errorMessage}</p>
        )}

        {status === "success" && (
          <p className="text-green-600 font-bold">تم التحقق بنجاح ✓</p>
        )}

        <button
          onClick={onClose}
          className="mt-2 px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition font-medium"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Main Attendance Page
// ────────────────────────────────────────────────
export default function AttendancePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [workShift, setWorkShift] = useState<WorkShift | null>(null);

  // Leave request states
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Face modal state
  const [showFaceModal, setShowFaceModal] = useState(false);

  // Timer states
  const [timerDisplay, setTimerDisplay] = useState<string>("00:00:00");
  const [timerLabel, setTimerLabel] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error("fetchAttendance error:", error);
    }
  };

  useEffect(() => {
    if (!session) return;

    const fetchWorkShift = async () => {
      try {
        const res = await fetch("/api/admin/work-shift");
        if (res.ok) {
          const data = await res.json();
          setWorkShift(data.workShift);
        }
      } catch (error) {
        console.error("Failed to fetch work shift", error);
      }
    };

    const fetchLeaveRequests = async () => {
      try {
        const res = await fetch("/api/leave-request");
        if (res.ok) {
          const data = await res.json();
          setLeaveRequests(data.requests);
        }
      } catch (error) {
        console.error("fetchLeaveRequests error:", error);
      }
    };

    void fetchAttendance();
    void fetchWorkShift();
    void fetchLeaveRequests();

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [session]);

  useEffect(() => {
    if (attendance?.checkIn) {
      startTimer(attendance.checkIn, attendance.checkOut, workShift);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance, workShift]);

  const getTimeFromDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return { hours: d.getHours(), minutes: d.getMinutes() };
  };

  const startTimer = (
    checkIn: string,
    checkOut?: string | null,
    shift?: WorkShift | null
  ) => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }

    const update = () => {
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
        const workedDuration =
          new Date(checkOut).getTime() - shiftStartObj.getTime();
        percent = (workedDuration / totalDuration) * 100;
        displayTime = formatDuration(Math.abs(workedDuration));
        label = "مدة الدوام (تم الإنتهاء)";
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
        }
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
    };

    update();
    if (!checkOut) {
      intervalRef.current = window.setInterval(update, 1000);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAttendance = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("يجب تسجيل الدخول لتسجيل الحضور");
      return;
    }
    if (processing) return;

    setProcessing(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          const distanceKm = getDistanceFromLatLonInKm(
            userLat,
            userLng,
            OFFICE_LOCATION.lat,
            OFFICE_LOCATION.lng
          );
          const distanceMeters = distanceKm * 1000;

          if (distanceMeters > OFFICE_LOCATION.radiusInMeters) {
            toast.error(
              `أنت بعيد جداً (${Math.floor(
                distanceMeters
              )}م) عن المدرسة. يجب أن تكون داخل نطاق ${
                OFFICE_LOCATION.radiusInMeters
              } متر.`
            );
            setProcessing(false);
            return;
          }

          // // if (!session?.user?.image) {
          // //   toast.error(
          // //     "يرجى تسجيل صورتك الشخصية أولاً لتشغيل ملف التعرف. (اذهب إلى صفحة التسجيل)"
          // //   );
          //   setProcessing(false);
          //   return;
          // }

          setShowFaceModal(true);
        },
        (err) => {
          console.warn("Geolocation failed", err);
          toast.error("يرجى تفعيل تحديد الموقع GPS");
          setProcessing(false);
        }
      );
    } else {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      setProcessing(false);
    }
  };

  const sendAttendance = async (
    latitude: number | null,
    longitude: number | null
  ) => {
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
      setTimeout(() => {
        setProcessing(false);
      }, 1500);
    }
  };

  const onFaceVerified = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void sendAttendance(pos.coords.latitude, pos.coords.longitude);
        void fetchAttendance();
      },
      () => {
        void sendAttendance(null, null);
        void fetchAttendance();
      }
    );
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
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "معلقة";
      case "APPROVED":
        return "موافقة";
      case "REJECTED":
        return "مرفوضة";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
          <div className="relative inline-block">
            <img
              src={session?.user?.image || "/default-avatar.png"}
              alt={session?.user?.name || "User"}
              className="w-28 h-28 rounded-full border-4 border-white/30 shadow-lg object-cover"
            />
            <span className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 border-4 border-white rounded-full"></span>
          </div>
          <h1 className="text-2xl font-bold mt-4">{session?.user?.name}</h1>
          <p className="text-blue-100 text-sm mt-1">{session?.user?.email}</p>
        </div>

        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Current status */}
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
                    🟢{" "}
                    <span>
                      دخول:{" "}
                      {new Date(attendance.checkIn).toLocaleTimeString(
                        "ar-EG",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </p>
                  {attendance.checkOut && (
                    <p className="flex items-center gap-1 mt-1">
                      🔴{" "}
                      <span>
                        خروج:{" "}
                        {new Date(attendance.checkOut).toLocaleTimeString(
                          "ar-EG",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timer */}
          {attendance && attendance.checkIn && (
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 text-center">
              <p className="text-indigo-800 text-sm font-bold mb-2">
                {timerLabel}
              </p>
              <div className="text-4xl font-mono font-bold text-indigo-900 mb-4 tracking-wider">
                {timerDisplay}
              </div>

              <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {workShift && isCheckedIn && (
                <p className="text-xs text-indigo-600 mt-2">
                  نهاية الدوام:{" "}
                  {workShift.endTime
                    ? new Date(workShift.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </p>
              )}
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={handleAttendance}
            disabled={processing || !session}
            className={`w-full py-5 rounded-xl text-xl font-bold text-white shadow-lg transform transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
              isCheckedIn
                ? "bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-red-500/30"
                : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-green-500/30"
            }`}
          >
            {processing ? (
              <>
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0012 20V4a8.001 8.001 0 00-6 13.291z"
                  ></path>
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

          {/* Face registration link */}
          <div className="mt-4 text-center">
            <Link href="/dashboard/teacher/register">
              <span className="text-blue-500 underline cursor-pointer">
                تسجيل وجهك (Face ID)
              </span>
            </Link>
          </div>
        </div>

        {/* Leave Request Section */}
        <div className="border-t border-gray-100 pt-6 px-6 pb-6">
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <span>📝</span>
              طلب استئذان
            </span>
            <span>{showLeaveForm ? "▲" : "▼"}</span>
          </button>

          {showLeaveForm && (
            <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ الاستئذان
                </label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وقت الانصراف
                </label>
                <input
                  type="time"
                  value={leaveTime}
                  onChange={(e) => setLeaveTime(e.target.value)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السبب
                </label>
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

        {/* Previous leave requests */}
        {leaveRequests.length > 0 && (
          <div className="border-t border-gray-100 pt-6 px-6 pb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📚</span>
              طلبات الاستئذان السابقة
            </h2>
            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-600">
                      <p>
                        📅 {new Date(req.leaveDate).toLocaleDateString("ar-EG")}
                      </p>
                      <p>⏰ {req.leaveTime}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                        req.status
                      )}`}
                    >
                      {getStatusText(req.status)}
                    </span>
                  </div>

                  <p className="text-gray-800 text-sm bg-gray-50 p-2 rounded">
                    {req.reason}
                  </p>

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

      {/* Face verification modal */}
      <FaceVerificationModal
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        onVerified={onFaceVerified}
        userImage={session?.user?.image}
      />
    </div>
  );
}