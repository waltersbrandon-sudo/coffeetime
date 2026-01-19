"use client";

import { useState, useCallback, useRef } from "react";

interface UseCameraResult {
  isSupported: boolean;
  isCapturing: boolean;
  error: string | null;
  captureImage: () => Promise<string | null>;
  selectImage: () => Promise<string | null>;
}

export function useCamera(): UseCameraResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check for camera support (mediaDevices API)
  const isSupported =
    typeof window !== "undefined" &&
    "mediaDevices" in navigator &&
    "getUserMedia" in navigator.mediaDevices;

  const captureImage = useCallback(async (): Promise<string | null> => {
    setError(null);
    setIsCapturing(true);

    try {
      // Use native file input with capture for mobile
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment"; // Use back camera

        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            setIsCapturing(false);
            resolve(null);
            return;
          }

          try {
            const base64 = await fileToBase64(file);
            setIsCapturing(false);
            resolve(base64);
          } catch (err) {
            setError("Failed to process image");
            setIsCapturing(false);
            resolve(null);
          }
        };

        input.oncancel = () => {
          setIsCapturing(false);
          resolve(null);
        };

        input.click();
      });
    } catch (err) {
      setError("Failed to access camera");
      setIsCapturing(false);
      return null;
    }
  }, []);

  const selectImage = useCallback(async (): Promise<string | null> => {
    setError(null);
    setIsCapturing(true);

    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          setIsCapturing(false);
          resolve(null);
          return;
        }

        try {
          const base64 = await fileToBase64(file);
          setIsCapturing(false);
          resolve(base64);
        } catch (err) {
          setError("Failed to process image");
          setIsCapturing(false);
          resolve(null);
        }
      };

      input.oncancel = () => {
        setIsCapturing(false);
        resolve(null);
      };

      input.click();
    });
  }, []);

  return {
    isSupported,
    isCapturing,
    error,
    captureImage,
    selectImage,
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 string
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
