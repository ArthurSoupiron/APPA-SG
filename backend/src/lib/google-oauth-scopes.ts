export const GOOGLE_DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
export const GOOGLE_SPREADSHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
export const GOOGLE_CALENDAR_EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export const GOOGLE_GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export function scopeIncludesCalendar(scope: string | null | undefined): boolean {
  return (
    scopeIncludes(scope, GOOGLE_CALENDAR_SCOPE) ||
    scopeIncludes(scope, GOOGLE_CALENDAR_EVENTS_SCOPE)
  );
}

export function scopeIncludesGmailSend(scope: string | null | undefined): boolean {
  return scopeIncludes(scope, GOOGLE_GMAIL_SEND_SCOPE);
}

export function scopeIncludes(scope: string | null | undefined, required: string): boolean {
  if (!scope?.trim()) return false;
  return scope.includes(required);
}

export function scopeIncludesDriveRead(scope: string | null | undefined): boolean {
  return (
    scopeIncludes(scope, GOOGLE_DRIVE_READONLY_SCOPE) || scopeIncludes(scope, GOOGLE_DRIVE_SCOPE)
  );
}

export function scopeIncludesDriveWrite(scope: string | null | undefined): boolean {
  return scopeIncludes(scope, GOOGLE_DRIVE_SCOPE);
}

export function scopeIncludesSpreadsheets(scope: string | null | undefined): boolean {
  return scopeIncludes(scope, GOOGLE_SPREADSHEETS_SCOPE);
}

export type GoogleIntegrationNeeds = {
  driveRead: boolean;
  driveWrite: boolean;
  spreadsheets: boolean;
};

export function googleIntegrationGaps(
  scope: string | null | undefined,
  needs: GoogleIntegrationNeeds,
): string[] {
  const gaps: string[] = [];
  if (needs.driveRead && !scopeIncludesDriveRead(scope)) {
    gaps.push("drive_read");
  }
  if (needs.driveWrite && !scopeIncludesDriveWrite(scope)) {
    gaps.push("drive_write");
  }
  if (needs.spreadsheets && !scopeIncludesSpreadsheets(scope)) {
    gaps.push("spreadsheets");
  }
  return gaps;
}
