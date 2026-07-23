"use client";

import { useState, useRef, useCallback, useEffect, type FC } from "react";
import { X, ImageIcon, RefreshCw, Check, CameraOff } from "lucide-react";

export interface CameraOverlayProps {
  isOpen: boolean;
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

type CameraState = "live" | "preview" | "no-camera";

const CameraOverlay: FC<CameraOverlayProps> = ({ isOpen, onCapture, onClose }) => {
  const [cameraState, setCameraState] = useState<CameraState>("live");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ── Start camera ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("live");
    } catch {
      setCameraState("no-camera");
    }
  }, []);

  // ── Stop camera ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Lifecycle ──
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCameraState("live");
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  // ── Focus trap ──
  useEffect(() => {
    if (isOpen && cameraState === "live") {
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, cameraState]);

  // ── Capture photo ──
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
    setCameraState("preview");
  }, [stopCamera]);

  // ── Confirm photo ──
  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // ── Retake ──
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // ── Resize image to fit screen ──
  // Prevents the preview from overflowing when a large gallery image is picked.
  const resizePreview = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280; // longest edge in px
        let { width, height } = img;
        if (width <= MAX_DIM && height <= MAX_DIM) {
          resolve(dataUrl);
          return;
        }
        if (width > height) {
          height = Math.round((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    });
  }, []);

  // ── Gallery pick ──
  const handleGalleryClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar. Maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const resized = await resizePreview(dataUrl);
      setCapturedImage(resized);
      stopCamera();
      setCameraState("preview");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [stopCamera, resizePreview]);

  // ── Close ──
  const handleClose = useCallback(() => {
    stopCamera();
    setCameraState("live");
    setCapturedImage(null);
    onClose();
  }, [stopCamera, onClose]);

  // ── Escape key ──
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col bg-black"
        role="dialog"
        aria-modal="true"
        aria-label="Kamera"
      >
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        aria-hidden="true"
      />

      {/* ── State: No Camera ── */}
      {cameraState === "no-camera" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <CameraOff className="w-16 h-16 text-text-muted" />
          <p className="text-text-secondary text-center text-sm">
            Kamera tidak tersedia. Kamu bisa pilih gambar dari galeri.
          </p>
          <button
            onClick={handleGalleryClick}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ImageIcon className="w-4 h-4" />
            Pilih dari Galeri
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-xl border border-border text-text-secondary text-sm hover:bg-surface-alt transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ── State: Live Camera ── */}
      {cameraState === "live" && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Viewfinder frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[80%] h-[55%] rounded-2xl border-2 border-white/40" />
          </div>

          {/* Top close button */}
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="absolute top-12 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white"
            aria-label="Tutup kamera"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Bottom bar — floating so it stays visible on desktop too */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center px-6 py-8 bg-gradient-to-t from-black/70 to-transparent">
            {/* Gallery button — bottom-left */}
            <button
              onClick={handleGalleryClick}
              className="absolute left-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white"
              aria-label="Pilih dari galeri"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Capture button — center */}
            <button
              onClick={handleCapture}
              className="w-[72px] h-[72px] rounded-full border-4 border-white bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Ambil foto"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-white" />
            </button>
          </div>
        </>
      )}

      {/* ── State: Photo Preview ── */}
      {cameraState === "preview" && capturedImage && (
        <>
          <img
            src={capturedImage}
            alt="Hasil jepretan"
            className="flex-1 w-full h-full object-contain bg-black"
          />

          {/* Top close button */}
          <button
            onClick={handleClose}
            className="absolute top-12 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Bottom bar — floating so it stays visible on any image size */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-4 px-6 py-8 bg-gradient-to-t from-black/70 to-transparent">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Ulangi
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Check className="w-5 h-5" />
              Gunakan
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraOverlay;
