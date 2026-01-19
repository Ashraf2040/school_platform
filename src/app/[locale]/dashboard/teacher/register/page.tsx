"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as faceapi from "face-api.js";

export default function TeacherRegistrationPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);

  // Form State
  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState("");

  // Face Recognition State
  const [isScanning, setIsScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [status, setStatus] = useState<
    "init" | "loading_models" | "ready" | "saving"
  >("init");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // 1. Load Face Models
 useEffect(() => {
  const loadModels = async () => {
    setStatus("loading_models");
    
    try {
      // ✅ WORKING CDN PATHS
      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
      
      console.log("[FaceAPI] Models loaded from CDN");
      setModelsLoaded(true);
      setStatus("ready");
      toast.success("تم تحميل نماذج التعرف");
    } catch (error) {
      console.error("[FaceAPI] CDN Error:", error);
    }
  };
  
  loadModels();
}, []);


  // 2. Start Camera & Detect Face on Button Click
  const startCameraAndScan = async () => {
    console.log("[FaceAPI] startCameraAndScan called, modelsLoaded =", modelsLoaded);

    if (!modelsLoaded) {
      toast.error("يرجى انتظار تحميل النماذج...");
      return;
    }

    setIsScanning(true);
    setStatus("ready");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("[FaceAPI] camera stream acquired");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("[FaceAPI] video playback started");
      }

      const detectLoop = window.setInterval(async () => {
        if (!videoRef.current) return;

        const detection = await faceapi
          .detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          if (!faceDetected) {
            console.log("[FaceAPI] face detected in loop");
          }
          setFaceDetected(true);
        } else {
          if (faceDetected) {
            console.log("[FaceAPI] face lost in loop");
          }
          setFaceDetected(false);
        }
      }, 100);

      // Cleanup if component unmounts while scanning
      return () => {
        console.log("[FaceAPI] clearing detectLoop interval");
        window.clearInterval(detectLoop);
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((t) => t.stop());
        }
      };
    } catch (err) {
      console.error("[FaceAPI] camera error:", err);
      toast.error("غير مسموح بالوصول للكاميرا");
      setIsScanning(false);
    }
  };

  // 3. Submit Data
  const handleRegister = async () => {
    console.log("[FaceAPI] handleRegister called, faceDetected =", faceDetected);

    if (!faceDetected) {
      toast.error("لم يتم التعرف على الوجه بوضوح");
      return;
    }

    setStatus("saving");
    setIsScanning(false);

    if (!videoRef.current) {
      console.error("[FaceAPI] videoRef.current is null in handleRegister");
      toast.error("فشل التقاط صورة الوجه");
      setStatus("ready");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.error("[FaceAPI] no detection in handleRegister");
      toast.error("لم يتم التقاط الوجه بشكل صحيح");
      setStatus("ready");
      setIsScanning(true);
      return;
    }

    const descriptorArray = Array.from(detection.descriptor);
    console.log("[FaceAPI] descriptor length =", descriptorArray.length);

    try {
      const res = await fetch("/api/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          faceDescriptor: JSON.stringify(descriptorArray),
        }),
      });

      console.log("[FaceAPI] /api/teacher/register status =", res.status);
      const data = await res.json();
      console.log("[FaceAPI] /api/teacher/register response =", data);

      if (res.ok) {
        toast.success("تم حفظ بياناتك وتسجيل الوجه بنجاح!");

        if (session) {
          void update({ ...session, user: { ...session.user, name } });
        }

        setTimeout(() => {
          router.push("/dashboard/attendance");
        }, 1500);
      } else {
        toast.error(data.error || "حدث خطأ");
        setStatus("ready");
        setIsScanning(true);
      }
    } catch (error) {
      console.error("[FaceAPI] register error:", error);
      toast.error("فشل الاتصال بالخادم");
      setStatus("ready");
      setIsScanning(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              إكمال البيانات الشخصية
            </h1>
            <p className="text-slate-500 mt-2">
              يرجى تعبئة البيانات وتسجيل الوجه للدخول المستقبلي.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ادخل اسمك"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleRegister}
                disabled={status === "saving" || status === "loading_models"}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "saving" ? "جاري الحفظ..." : "حفظ وتسجيل الوجه"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Camera / Scanner */}
        <div className="w-full md:w-1/2 bg-slate-900 p-10 flex flex-col items-center justify-center relative">
          {/* Status Badge */}
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            {status === "loading_models" && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                جاري تحميل النماذج...
              </span>
            )}
            {status === "ready" && modelsLoaded && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                الكاميرا جاهزة
              </span>
            )}
            {status === "saving" && (
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                جاري الحفظ...
              </span>
            )}
          </div>

          <div
            className={`relative rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
              faceDetected
                ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                : "border-slate-600"
            }`}
          >
            {isScanning ? (
              <video
                ref={videoRef}
                className="w-full max-w-[400px] object-cover transform scale-x-[-1]"
                autoPlay
                muted
                onPlay={() => console.log("[FaceAPI] video onPlay")}
              />
            ) : (
              <div className="w-full max-w-[400px] h-[300px] bg-slate-800 flex items-center justify-center text-slate-500">
                <span className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l6 3v6"></path>
                    <line x1="1" y1="13" x2="23" y2="13"></line>
                  </svg>
                  <p className="mt-2">اضغط على زر تشغيل الكاميرا</p>
                </span>
              </div>
            )}

            {faceDetected && (
              <div className="absolute inset-0 border-4 border-green-400 animate-pulse pointer-events-none"></div>
            )}
          </div>

          {!isScanning && (
            <button
              onClick={startCameraAndScan}
              disabled={status === "loading_models"}
              className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-lg transition backdrop-blur-sm disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7-5M5 12h6M12 12l-2 9"></path>
              </svg>
              تشغيل الكاميرا ومسح الوجه
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
