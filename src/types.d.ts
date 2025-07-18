interface RawFileItem {
  fileName: string;
  fileSize: number;
  filePath: string;
}

interface FileItem extends RawFileItem {
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  parsed?: any;
  pageUrl?: string;
  error?: string;
}

interface UploadResult {
  fileName: string;
  success: boolean;
  pageUrl?: string;
  message?: string;
  error?: string;
}

interface Message {
  type: "success" | "error" | "warning";
  text: string;
  html?: boolean;
}

interface WikiCredentials {
  username: string;
  password: string;
}
