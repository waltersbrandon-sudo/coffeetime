export type ExportFormat = "json" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  includeRawData?: boolean;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

export interface DriveUploadResult {
  file: DriveFile;
  shareableLink: string;
}
