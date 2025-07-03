export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  url: string;
  thumbnail_url?: string;
  user_id: string;
  channel_id: string;
  message_id?: string;
  created_at: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number; // for videos/audio
  pages?: number; // for PDFs
  encoding?: string;
  [key: string]: any;
}

export interface FileUploadProgress {
  id: string;
  filename: string;
  size: number;
  uploaded: number;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadResponse {
  file: FileUpload;
  message?: any; // Message object if attached to message
}

export type FileType = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'archive' 
  | 'other';

export interface FileTypeConfig {
  extensions: string[];
  maxSize: number; // in bytes
  previewSupported: boolean;
  thumbnailSupported: boolean;
} 