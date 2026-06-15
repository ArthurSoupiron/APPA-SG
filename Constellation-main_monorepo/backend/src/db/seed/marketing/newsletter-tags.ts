import { eq } from "drizzle-orm";

import { db } from "../../index";
import { newsletterTag } from "../../schema";

const DEFAULT_TAGS = [
  { slug: "client", label: "Client", legalBasis: "contract" as const },
  { slug: "b2b", label: "Intérêt B2B", legalBasis: "consent" as const },
  { slug: "alumni", label: "Alumni", legalBasis: "legitimate_interest" as const },
  { slug: "prospect", label: "Prospect consentant", legalBasis: "consent" as const },
];

export async function seedNewsletterTags() {
  for (const tag of DEFAULT_TAGS) {
    const [existing] = await db
      .select()
      .from(newsletterTag)
      .where(eq(newsletterTag.slug, tag.slug))
      .limit(1);
    if (existing) continue;
    await db.insert(newsletterTag).values({
      id: Bun.randomUUIDv7(),
      ...tag,
    });
  }
}
