const FOLDER_MIME = "application/vnd.google-apps.folder";

export type DriveChildRow = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  shortcutDetails: { targetId: string | null; targetMimeType: string | null } | null;
};

export function openDriveItemInNewTab(row: DriveChildRow): void {
  if (row.webViewLink) {
    window.open(row.webViewLink, "_blank", "noopener,noreferrer");
    return;
  }
  if (row.mimeType === FOLDER_MIME) {
    window.open(driveFolderBrowseUrl(row.id), "_blank", "noopener,noreferrer");
    return;
  }
  window.open(
    `https://drive.google.com/file/d/${encodeURIComponent(row.id)}/view`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function isDriveFolderMime(mimeType: string): boolean {
  return mimeType === FOLDER_MIME;
}

export function driveFolderBrowseUrl(folderOrDriveId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderOrDriveId)}`;
}
