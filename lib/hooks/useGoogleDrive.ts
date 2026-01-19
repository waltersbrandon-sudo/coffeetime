"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { uploadToDrive, checkDriveAccess } from "@/lib/services/driveService";
import { ExportResult, DriveUploadResult } from "@/lib/types/export";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

interface UseGoogleDriveResult {
  hasDriveAccess: boolean | null;
  isAuthorizing: boolean;
  isUploading: boolean;
  error: Error | null;
  requestDriveAccess: () => Promise<string | null>;
  uploadFile: (result: ExportResult) => Promise<DriveUploadResult | null>;
}

export function useGoogleDrive(): UseGoogleDriveResult {
  const { user } = useAuth();
  const [hasDriveAccess, setHasDriveAccess] = useState<boolean | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Request Drive access with additional scope
  const requestDriveAccess = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setError(new Error("Not authenticated"));
      return null;
    }

    setIsAuthorizing(true);
    setError(null);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // Add Drive file scope
      provider.addScope(DRIVE_SCOPE);

      // Force account selection
      provider.setCustomParameters({
        prompt: "consent",
        ...(user.email && { login_hint: user.email }),
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error("Failed to get access token");
      }

      // Verify Drive access
      const hasAccess = await checkDriveAccess(credential.accessToken);

      if (!hasAccess) {
        throw new Error("Drive access was not granted");
      }

      setAccessToken(credential.accessToken);
      setHasDriveAccess(true);

      return credential.accessToken;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to authorize Drive");
      setError(error);
      setHasDriveAccess(false);
      return null;
    } finally {
      setIsAuthorizing(false);
    }
  }, [user]);

  // Upload file to Drive
  const uploadFile = useCallback(
    async (result: ExportResult): Promise<DriveUploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        // Get access token if we don't have one
        let token = accessToken;

        if (!token) {
          token = await requestDriveAccess();

          if (!token) {
            throw new Error("Failed to get Drive access");
          }
        }

        const driveResult = await uploadToDrive(token, result);
        return driveResult;
      } catch (err) {
        // If auth error, try to re-auth
        if (
          err instanceof Error &&
          (err.message.includes("401") || err.message.includes("403"))
        ) {
          setAccessToken(null);
          setHasDriveAccess(null);
        }

        const error = err instanceof Error ? err : new Error("Failed to upload to Drive");
        setError(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [accessToken, requestDriveAccess]
  );

  return {
    hasDriveAccess,
    isAuthorizing,
    isUploading,
    error,
    requestDriveAccess,
    uploadFile,
  };
}
