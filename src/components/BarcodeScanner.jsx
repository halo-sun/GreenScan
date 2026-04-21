import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

/**
 * Barcode scanner using the device camera via @zxing/browser.
 *
 * @param {Object} props
 * @param {function} props.onResult - Called with the decoded barcode string
 */
export default function BarcodeScanner({ onResult }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    setError("");
    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined, // use default camera
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            stopScanning();
            onResult?.(barcode);
          }
          // Ignore NotFoundException — it fires every frame until found
        }
      );

      controlsRef.current = controls;
      setScanning(true);
    } catch (err) {
      console.error("Scanner error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to start scanner. Please try again.");
      }
      setScanning(false);
    }
  }, [onResult, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Video container */}
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan frame overlay */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dimmed edges */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Clear center cutout */}
            <div className="relative w-3/5 aspect-square">
              <div className="absolute inset-0 bg-transparent border-2 border-emerald-400/60 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)]" />
              {/* Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
              {/* Scanning line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse rounded-full top-1/2" />
            </div>
          </div>
        )}

        {/* Idle state */}
        {!scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80">
            <svg
              className="w-16 h-16 text-emerald-500/40 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M8 12h8M12 8v8"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Tap Start to scan a barcode
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
              />
            </svg>
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
