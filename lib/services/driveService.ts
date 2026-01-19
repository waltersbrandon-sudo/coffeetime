import { ExportResult, DriveUploadResult } from "@/lib/types/export";

const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";

// Upload file to Google Drive
export async function uploadToDrive(
  accessToken: string,
  result: ExportResult
): Promise<DriveUploadResult> {
  // Create file metadata
  const metadata = {
    name: result.filename,
    mimeType: result.mimeType,
  };

  // Create multipart request body
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${result.mimeType}\r\n\r\n` +
    result.content +
    closeDelimiter;

  // Upload file
  const uploadResponse = await fetch(
    `${DRIVE_UPLOAD_URL}?uploadType=multipart`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload to Drive: ${error}`);
  }

  const file = await uploadResponse.json();

  // Make file shareable with link
  const shareableLink = await createShareableLink(accessToken, file.id);

  return {
    file: {
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      webContentLink: file.webContentLink || "",
    },
    shareableLink,
  };
}

// Create a shareable link for a Drive file
export async function createShareableLink(
  accessToken: string,
  fileId: string
): Promise<string> {
  // Create permission for anyone with link
  const permissionResponse = await fetch(
    `${DRIVE_API_URL}/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    }
  );

  if (!permissionResponse.ok) {
    console.error("Failed to create shareable permission");
    // Still return view link even if permission fails
  }

  // Get updated file metadata with link
  const fileResponse = await fetch(
    `${DRIVE_API_URL}/${fileId}?fields=webViewLink,webContentLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (fileResponse.ok) {
    const fileData = await fileResponse.json();
    return fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  }

  return `https://drive.google.com/file/d/${fileId}/view`;
}

// Check if we have Drive access
export async function checkDriveAccess(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${DRIVE_API_URL}?pageSize=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
