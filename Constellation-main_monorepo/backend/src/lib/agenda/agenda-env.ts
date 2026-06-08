export function getAgendaEnv() {
  return {
    mandatEmailDomain: (process.env.AGENDA_MANDAT_EMAIL_DOMAIN ?? "jeece.fr").toLowerCase(),
    intervenantsGroupEmail: process.env.AGENDA_INTERVENANTS_GROUP_EMAIL?.trim().toLowerCase() ?? "",
    sheetId: process.env.AGENDA_SHEET_ID?.trim() ?? "",
    googleSyncEnabled:
      process.env.AGENDA_GOOGLE_SYNC_ENABLED === "true" ||
      process.env.AGENDA_GOOGLE_SYNC_ENABLED === "1",
    appBaseUrl: process.env.CORS_ORIGIN?.replace(/\/$/, "") ?? "",
  };
}
