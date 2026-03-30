import { drive_v3 } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  createdTime: string;
  webViewLink?: string;
}

export class DriveUtils {
  constructor(private drive: drive_v3.Drive) {}

  // Get folder contents
  async getFolderContents(folderId: string): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents)',
      orderBy: 'name'
    });

    return response.data.files?.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size || undefined,
      createdTime: file.createdTime!,
      modifiedTime: file.modifiedTime!,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      parents: file.parents || undefined
    })) || [];
  }

  // Filter video files
  getVideoFiles(files: DriveFile[]): DriveFile[] {
    const videoMimeTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/mkv',
      'video/webm', 'video/wmv', 'video/flv', 'video/quicktime'
    ];

    return files.filter(file =>
      videoMimeTypes.some(type => file.mimeType.includes(type)) ||
      this.isVideoByExtension(file.name)
    );
  }

  private isVideoByExtension(filename: string): boolean {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.flv'];
    const ext = filename.toLowerCase();
    return videoExtensions.some(extension => ext.endsWith(extension));
  }

  extractLessonNumber(filename: string): number {
    const patterns = [
      /^(\d+)[\s-.]/,           // "01 - title"
      /lesson[\s-]*(\d+)/i,      // "lesson 05"
      /^(\d+)/,                   // Just number at start
      /chapter[\s-]*(\d+)/i,     // "chapter 3"
      /part[\s-]*(\d+)/i,        // "part 7"
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return 0;
  }
}
