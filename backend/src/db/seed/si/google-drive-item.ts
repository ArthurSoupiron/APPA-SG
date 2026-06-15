import type { InferInsertModel } from "drizzle-orm";

import { googleDriveItem } from "../../schema/si/google-drive-item";
import type { SeedDb } from "../db-type";

export type GoogleDriveItemSeedRow = InferInsertModel<typeof googleDriveItem>;

/** Éléments Drive — `userId` doit exister dans `auth.user`. */
export const GOOGLE_DRIVE_ITEM_SEED_ROWS: GoogleDriveItemSeedRow[] = [
  // {
  //   id: "…",
  //   userId: "…",
  //   driveFileId: "…",
  // },
];

export async function seedSiGoogleDriveItems(db: SeedDb): Promise<void> {
  if (GOOGLE_DRIVE_ITEM_SEED_ROWS.length === 0) return;
  await db
    .insert(googleDriveItem)
    .values(GOOGLE_DRIVE_ITEM_SEED_ROWS)
    .onConflictDoNothing({ target: [googleDriveItem.userId, googleDriveItem.driveFileId] });
}
