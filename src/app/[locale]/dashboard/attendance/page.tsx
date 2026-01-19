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
// Face Verification Modal - IMPROVED
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<
    "init" | "loading_models" | "camera_ready" | "scanning" | "match_found" | "success" | "error"
  >("init");
  const [matchScore, setMatchScore] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);
  const referenceDescriptorRef = useRef<Float32Array | null>(null);

  // Load models from CDN (once)
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
        setStatus("camera_ready");
      } catch (err) {
        console.error("[FaceAPI] Failed to load models:", err);
        setErrorMessage("فشل تحميل نماذج التعرف على الوجه");
        setStatus("error");
      }
    };

    void loadModels();
  }, [modelsLoaded]);

  // Load reference face descriptor once
  useEffect(() => {
    if (!userImage || !modelsLoaded) return;

    const loadReferenceFace = async () => {
      try {
        const referenceImage = await faceapi.fetchImage(userImage);
        const refResult = await faceapi
          .detectSingleFace(referenceImage)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (refResult) {
          referenceDescriptorRef.current = refResult.descriptor;
        }
      } catch (err) {
        console.error("Failed to load reference face:", err);
      }
    };

    void loadReferenceFace();
  }, [userImage, modelsLoaded]);

  // Camera setup
  useEffect(() => {
    if (!isOpen || status !== "camera_ready") return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus("scanning");
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setErrorMessage("تعذر الوصول إلى الكاميرا");
        setStatus("error");
      }
    };

    void startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, status]);

  // Continuous face scanning
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (status === "scanning" && videoRef.current && referenceDescriptorRef.current) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || !referenceDescriptorRef.current) return;

        const detection = await faceapi
          .detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection && referenceDescriptorRef.current) {
          const distance = faceapi.euclideanDistance(
            referenceDescriptorRef.current,
            detection.descriptor
          );
          
          setMatchScore(distance);
          
          // Good match threshold
          if (distance < 0.6) {
            setCanConfirm(true);
          } else {
            setCanConfirm(false);
          }
        } else {
          setCanConfirm(false);
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  const handleConfirm = () => {
    if (canConfirm && matchScore < 0.6) {
      setStatus("success");
      setTimeout(() => {
        onVerified();
        onClose();
      }, 800);
    }
  };

  const handleClose = () => {
    setStatus("init");
    setCanConfirm(false);
    setErrorMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl border border-white/20 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            التحقق من الهوية
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-200/50 hover:bg-gray-300/50 transition-all w-12 h-12 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Camera View - Full width and responsive */}
        <div className="relative mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black aspect-video max-w-[400px] w-full shadow-2xl border-4 border-gray-200/30">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Face match indicator */}
          {status === "scanning" && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-green-500/20 border-4 border-green-400 rounded-full mx-auto mb-3 animate-pulse flex items-center justify-center">
                  <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center font-bold text-lg">
                    {matchScore < 0.6 ? "✓" : "?"}
                  </div>
                </div>
                <p className="text-lg font-bold">
                  مطابقة: {(1 - matchScore).toFixed(1)}
                </p>
                <p className="text-sm opacity-75">حرك الوجه للحصول على مطابقة أفضل</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="space-y-3 mb-6 text-center">
          {status === "loading_models" && (
            <div className="flex items-center justify-center gap-3 text-blue-600">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span>جاري تحميل نماذج الذكاء...</span>
            </div>
          )}

          {status === "camera_ready" && (
            <p className="text-blue-600 font-bold text-lg">اضغط ابدأ للتحقق</p>
          )}

          {status === "scanning" && (
            <p className={`text-lg font-bold flex items-center justify-center gap-2 ${
              canConfirm ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {canConfirm ? '✓ جاهز للتأكيد' : '🔄 جاري البحث عن الوجه...'}
            </p>
          )}

          {(status === "error" || errorMessage) && (
            <p className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              {errorMessage}
            </p>
          )}

          {status === "success" && (
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-2xl">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-green-800 font-bold text-lg">تم التحقق بنجاح!</p>
            </div>
          )}
        </div>

        {/* Action Buttons - Prominent Confirm button */}
        <div className="flex flex-col gap-3 pt-2">
          {status === "camera_ready" || status === "scanning" ? (
            <>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm || status !== "scanning"}
                className={`py-4 px-8 rounded-2xl font-bold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center gap-3 ${
                  canConfirm && status === "scanning"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-500/40 hover:from-emerald-600 hover:to-green-700 active:scale-95"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span className="text-2xl">✅</span>
                تأكيد الهوية
              </button>
              <button
                onClick={handleClose}
                className="py-4 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium transition-all duration-200"
              >
                إلغاء
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all duration-200"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Main Attendance Page - Mobile Responsive
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

  // ... rest of your existing functions remain the same ...
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-4 px-4 sm:px-6 font-arabic">
      <div className="max-w-sm mx-auto w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="relative inline-block">
            <img
              src={session?.user?.image || "/default-avatar.png"}
              alt={session?.user?.name || "User"}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-2xl object-cover"
            />
            <span className="absolute bottom-0 right-0 w-7 h-7 bg-green-400 border-4 border-white rounded-full shadow-lg"></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-3 sm:mt-4 leading-tight">
            {session?.user?.name}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm opacity-90">
            {session?.user?.email}
          </p>
        </div>

        {/* Main content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Current status */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/50 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-gray-600 text-sm font-semibold mb-1 sm:mb-0">الحالة الحالية</p>
              <h3 className="text-xl font-bold text-gray-800 leading-tight">
                {isCheckedIn ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></span>
                    متواجد حالياً
                  </span>
                ) : attendance ? (
                  <span className="text-gray-600">منتهي الدوام</span>
                ) : (
                  <span className="text-gray-500">لم يسجل دخول</span>
                )}
              </h3>
            </div>

            {attendance && (
              <div className="text-right text-sm text-gray-600 space-y-1">
                <p className="flex items-center justify-end gap-1">
                  🟢 دخول: {new Date(attendance.checkIn).toLocaleTimeString(
                    "ar-EG",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </p>
                {attendance.checkOut && (
                  <p className="flex items-center justify-end gap-1">
                    🔴 خروج: {new Date(attendance.checkOut).toLocaleTimeString(
                      "ar-EG",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timer */}
          {attendance && attendance.checkIn && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-lg text-center">
              <p className="text-indigo-800 text-sm font-bold mb-3 bg-indigo-100 px-3 py-1 rounded-full inline-block">
                {timerLabel}
              </p>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-indigo-900 mb-4 tracking-wider">
                {timerDisplay}
              </div>

              <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full shadow-lg transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {workShift && isCheckedIn && (
                <p className="text-xs text-indigo-600 mt-3 font-medium">
                  نهاية الدوام: {workShift.endTime
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
            className={`w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold text-white shadow-2xl transform transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 px-4 ${
              isCheckedIn
                ? "bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-red-500/40"
                : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-green-500/40"
            }`}
          >
            {processing ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري المعالجة...
              </>
            ) : isCheckedIn ? (
              <>
                <span className="text-2xl">🛑</span> تسجيل انصراف
              </>
            ) : (
              <>
                <span className="text-2xl">✅</span> تسجيل حضور
              </>
            )}
          </button>

          {/* Face registration link */}
          <div className="text-center py-2">
            <Link href="/dashboard/teacher/register" className="text-blue-500 hover:text-blue-600 underline text-sm font-medium transition-colors">
              تسجيل وجهك (Face ID)
            </Link>
          </div>
        </div>

        {/* Leave Request Section */}
        <div className="border-t border-gray-100/50 bg-white/50">
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="w-full flex items-center justify-between p-4 sm:p-5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 rounded-b-none rounded-t-xl transition-all font-semibold border-b border-blue-100"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              طلب استئذان
            </span>
            <span className={`transform transition-transform ${showLeaveForm ? 'rotate-180' : ''}`}>{showLeaveForm ? "▲" : "▼"}</span>
          </button>

          {showLeaveForm && (
            <div className="p-5 sm:p-6 bg-white border border-gray-200 rounded-b-2xl shadow-lg space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  تاريخ الاستئذان
                </label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  وقت الانصراف
                </label>
                <input
                  type="time"
                  value={leaveTime}
                  onChange={(e) => setLeaveTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  السبب
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm transition-all resize-vertical"
                  rows={3}
                  placeholder="اكتب سبب طلب الاستئذان..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold shadow-md transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitLeaveRequest}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all"
                >
                  إرسال الطلب
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Previous leave requests */}
        {leaveRequests.length > 0 && (
          <div className="border-t border-gray-100/50 p-4 sm:p-6 pb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              طلبات الاستئذان السابقة
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto -mx-2 sm:-mx-4 px-2 sm:px-4 pb-2">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {new Date(req.leaveDate).toLocaleDateString("ar-EG")}</p>
                      <p>⏰ {req.leaveTime}</p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border self-start sm:self-auto ${getStatusColor(
                        req.status
                      )}`}
                    >
                      {getStatusText(req.status)}
                    </span>
                  </div>

                  <p className="text-gray-800 text-sm bg-gray-50/50 p-3 rounded-xl leading-relaxed">
                    {req.reason}
                  </p>

                  {req.adminNote && (
                    <p className="mt-3 text-sm text-red-600 border-t border-red-100 pt-2 pt-3">
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
