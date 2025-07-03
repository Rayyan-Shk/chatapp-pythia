import { create } from 'zustand';
import { FileUpload, FileUploadProgress, FileType } from '@repo/types';

interface FileState {
  // File uploads
  uploadQueue: FileUploadProgress[];
  recentFiles: FileUpload[];
  
  // UI state
  uploadPanelOpen: boolean;
  
  // Actions
  addToUploadQueue: (file: File, channelId: string) => string;
  updateUploadProgress: (id: string, progress: Partial<FileUploadProgress>) => void;
  removeFromUploadQueue: (id: string) => void;
  clearUploadQueue: () => void;
  
  addRecentFile: (file: FileUpload) => void;
  removeRecentFile: (fileId: string) => void;
  
  setUploadPanelOpen: (open: boolean) => void;
  
  // File upload actions
  uploadFile: (file: File, channelId: string) => Promise<FileUpload>;
  
  // Utility functions
  getFileType: (mimeType: string) => FileType;
  isValidFileType: (file: File) => boolean;
  getMaxFileSize: (fileType: FileType) => number;
  
  reset: () => void;
}

const FILE_TYPE_CONFIG = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    maxSize: 10 * 1024 * 1024, // 10MB
    previewSupported: true,
    thumbnailSupported: true,
  },
  video: {
    extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
    maxSize: 100 * 1024 * 1024, // 100MB
    previewSupported: true,
    thumbnailSupported: true,
  },
  audio: {
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
    maxSize: 50 * 1024 * 1024, // 50MB
    previewSupported: true,
    thumbnailSupported: false,
  },
  document: {
    extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    maxSize: 25 * 1024 * 1024, // 25MB
    previewSupported: false,
    thumbnailSupported: true,
  },
  archive: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    maxSize: 50 * 1024 * 1024, // 50MB
    previewSupported: false,
    thumbnailSupported: false,
  },
  other: {
    extensions: [],
    maxSize: 25 * 1024 * 1024, // 25MB
    previewSupported: false,
    thumbnailSupported: false,
  },
};

export const useFileStore = create<FileState>((set, get) => ({
  // Initial state
  uploadQueue: [],
  recentFiles: [],
  uploadPanelOpen: false,
  
  // Utility functions
  getFileType: (mimeType: string): FileType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    const extension = mimeType.split('/')[1] || '';
    
    if (FILE_TYPE_CONFIG.document.extensions.some(ext => mimeType.includes(ext))) {
      return 'document';
    }
    if (FILE_TYPE_CONFIG.archive.extensions.some(ext => mimeType.includes(ext))) {
      return 'archive';
    }
    
    return 'other';
  },
  
  isValidFileType: (file: File): boolean => {
    const fileType = get().getFileType(file.type);
    const maxSize = get().getMaxFileSize(fileType);
    return file.size <= maxSize;
  },
  
  getMaxFileSize: (fileType: FileType): number => {
    return FILE_TYPE_CONFIG[fileType].maxSize;
  },
  
  // Actions
  addToUploadQueue: (file: File, channelId: string): string => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadProgress: FileUploadProgress = {
      id,
      filename: file.name,
      size: file.size,
      uploaded: 0,
      progress: 0,
      status: 'uploading',
    };
    
    set((state) => ({
      uploadQueue: [...state.uploadQueue, uploadProgress],
    }));
    
    // Start upload
    get().uploadFile(file, channelId).then((uploadedFile) => {
      get().updateUploadProgress(id, { 
        status: 'completed',
        progress: 100 
      });
      get().addRecentFile(uploadedFile);
      
      // Remove from queue after a short delay
      setTimeout(() => {
        get().removeFromUploadQueue(id);
      }, 2000);
    }).catch((error) => {
      console.error('Upload failed:', error);
      get().updateUploadProgress(id, { 
        status: 'error',
        error: error.message || 'Upload failed'
      });
    });
    
    return id;
  },
  
  updateUploadProgress: (id: string, progress: Partial<FileUploadProgress>) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id ? { ...item, ...progress } : item
      ),
    }));
  },
  
  removeFromUploadQueue: (id: string) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
    }));
  },
  
  clearUploadQueue: () => set({ uploadQueue: [] }),
  
  addRecentFile: (file: FileUpload) => {
    set((state) => ({
      recentFiles: [file, ...state.recentFiles].slice(0, 50), // Keep last 50
    }));
  },
  
  removeRecentFile: (fileId: string) => {
    set((state) => ({
      recentFiles: state.recentFiles.filter((file) => file.id !== fileId),
    }));
  },
  
  setUploadPanelOpen: (open: boolean) => set({ uploadPanelOpen: open }),
  
  uploadFile: async (file: File, channelId: string): Promise<FileUpload> => {
    // This will be implemented when we connect to the backend API
    // For now, simulate upload
    const uploadId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          clearInterval(interval);
          
          // Mock successful upload
          const mockFile: FileUpload = {
            id: uploadId,
            filename: `${uploadId}_${file.name}`,
            original_name: file.name,
            size: file.size,
            mime_type: file.type,
            url: URL.createObjectURL(file), // Temporary URL for preview
            user_id: 'current_user', // This would come from auth
            channel_id: channelId,
            created_at: new Date().toISOString(),
            metadata: {
              // Add metadata based on file type
              ...(file.type.startsWith('image/') && {
                width: 800, // Mock dimensions
                height: 600,
              }),
            },
          };
          
          resolve(mockFile);
        } else {
          // Update progress in the queue
          const state = get();
          const queueItem = state.uploadQueue.find(item => 
            item.filename === file.name && item.status === 'uploading'
          );
          if (queueItem) {
            get().updateUploadProgress(queueItem.id, {
              progress: Math.min(progress, 100),
              uploaded: Math.min((progress / 100) * file.size, file.size),
            });
          }
        }
      }, 200);
      
      // Simulate potential failure
      if (Math.random() < 0.05) { // 5% chance of failure
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Upload failed due to network error'));
        }, 1000);
      }
    });
  },
  
  reset: () => set({
    uploadQueue: [],
    recentFiles: [],
    uploadPanelOpen: false,
  }),
})); 