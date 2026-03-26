import { google } from 'googleapis';
import { getDecryptedTokens } from './googleAccountQueries';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  downloadUrl?: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
  parentId?: string;
}

/**
 * Create authenticated Google Drive API client
 */
async function createDriveClient(googleAccountId: string, userId: string) {
  const tokens = await getDecryptedTokens(googleAccountId, userId);
  if (!tokens) {
    throw new Error('Google account tokens not found');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * List files in a Google Drive folder
 */
export async function listDriveFiles(
  folderId: string,
  googleAccountId: string,
  userId: string,
  options: {
    mimeType?: string;
    maxResults?: number;
    orderBy?: 'name' | 'createdTime' | 'modifiedTime';
  } = {}
): Promise<DriveFile[]> {
  const drive = await createDriveClient(googleAccountId, userId);

  let query = `'${folderId}' in parents and trashed = false`;
  if (options.mimeType) {
    query += ` and mimeType = '${options.mimeType}'`;
  }

  const response = await drive.files.list({
    q: query,
    pageSize: options.maxResults || 100,
    orderBy: options.orderBy || 'name',
    fields: 'files(id,name,mimeType,size,webViewLink,parents,createdTime,modifiedTime)',
  });

  const files = response.data.files || [];
  return files.map(file => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    size: file.size ? parseInt(file.size) : undefined,
    webViewLink: file.webViewLink!,
    parents: file.parents || undefined,
    createdTime: file.createdTime!,
    modifiedTime: file.modifiedTime!,
  }));
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  name: string,
  parentFolderId: string | null,
  googleAccountId: string,
  userId: string
): Promise<DriveFolder> {
  const drive = await createDriveClient(googleAccountId, userId);

  const fileMetadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id,name,webViewLink,parents',
  });

  const folder = response.data;
  return {
    id: folder.id!,
    name: folder.name!,
    webViewLink: folder.webViewLink!,
    parentId: folder.parents?.[0],
  };
}

/**
 * Get folder information by ID
 */
export async function getDriveFolder(
  folderId: string,
  googleAccountId: string,
  userId: string
): Promise<DriveFolder | null> {
  try {
    const drive = await createDriveClient(googleAccountId, userId);

    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,webViewLink,parents,mimeType',
    });

    const folder = response.data;

    // Verify it's actually a folder
    if (folder.mimeType !== 'application/vnd.google-apps.folder') {
      return null;
    }

    return {
      id: folder.id!,
      name: folder.name!,
      webViewLink: folder.webViewLink!,
      parentId: folder.parents?.[0],
    };
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get file download URL (for downloadable files)
 */
export async function getDriveFileDownloadUrl(
  fileId: string,
  googleAccountId: string,
  userId: string
): Promise<string | null> {
  try {
    const drive = await createDriveClient(googleAccountId, userId);

    // For most files, we can get direct download
    const response = await drive.files.get({
      fileId,
      fields: 'mimeType,webContentLink',
    });

    // Google Workspace files (Docs, Sheets, etc.) need export
    if (response.data.mimeType?.startsWith('application/vnd.google-apps.')) {
      // For video files in Google Drive, we'll use webViewLink
      return null;
    }

    return response.data.webContentLink || null;
  } catch (error: any) {
    console.error('Error getting download URL:', error);
    return null;
  }
}

/**
 * Export Google Workspace file to specific format
 */
export async function exportDriveFile(
  fileId: string,
  mimeType: string,
  googleAccountId: string,
  userId: string
): Promise<Buffer> {
  const drive = await createDriveClient(googleAccountId, userId);

  const response = await drive.files.export({
    fileId,
    mimeType,
  }, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Upload file to Google Drive folder
 */
export async function uploadToDrive(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  parentFolderId: string,
  googleAccountId: string,
  userId: string
): Promise<DriveFile> {
  const drive = await createDriveClient(googleAccountId, userId);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentFolderId],
    },
    media: {
      mimeType,
      body: fileBuffer,
    },
    fields: 'id,name,mimeType,size,webViewLink,parents',
  });

  const file = response.data;
  return {
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    size: file.size ? parseInt(file.size) : undefined,
    webViewLink: file.webViewLink!,
    parents: file.parents || undefined,
  };
}

/**
 * Search for video files in a folder (for course lessons)
 */
export async function searchVideoFiles(
  folderId: string,
  googleAccountId: string,
  userId: string
): Promise<DriveFile[]> {
  const videoMimeTypes = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/mkv',
    'video/wmv',
    'video/flv',
    'video/webm',
  ];

  const files: DriveFile[] = [];

  for (const mimeType of videoMimeTypes) {
    const videoFiles = await listDriveFiles(folderId, googleAccountId, userId, {
      mimeType,
      orderBy: 'name',
    });
    files.push(...videoFiles);
  }

  // Sort by name for consistent ordering
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extract lesson number from filename
 */
export function extractLessonNumber(filename: string): number {
  // Try to extract number from various patterns:
  // "001 - Lesson Title.mp4" -> 1
  // "Lesson 01 - Title.mp4" -> 1
  // "01. Introduction.mp4" -> 1
  // "Chapter 5.mp4" -> 5

  const patterns = [
    /^(\d+)[\s\-\.]+/,           // "001 - " or "01. " at start
    /lesson\s+(\d+)/i,           // "Lesson 01"
    /chapter\s+(\d+)/i,          // "Chapter 5"
    /part\s+(\d+)/i,             // "Part 3"
    /(\d+)/,                     // Any number in filename
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Fallback: return 0 if no number found
  return 0;
}