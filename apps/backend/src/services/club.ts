import {
  clubFeeSettings,
  clubProfiles,
  clubSettings,
  clubSocialLinks,
  clubTrainingSlots,
  organizations,
} from "@alice/database";
import type { Database } from "@alice/database";
import { asc, eq } from "drizzle-orm";

import { notFound } from "@/lib/app-error";

/** Everything the club wizard collected, in one read, for the club settings screens. */
export const getClubOverview = async (db: Database, organizationId: string) => {
  const [organization] = await db
    .select({
      id: organizations.id,
      logo: organizations.logo,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId));
  if (organization === undefined) {
    throw notFound("Club");
  }
  const [settings, profile, fees, socialLinks, trainingSlots] =
    await Promise.all([
      db
        .select()
        .from(clubSettings)
        .where(eq(clubSettings.organizationId, organizationId)),
      db
        .select()
        .from(clubProfiles)
        .where(eq(clubProfiles.organizationId, organizationId)),
      db
        .select()
        .from(clubFeeSettings)
        .where(eq(clubFeeSettings.organizationId, organizationId)),
      db
        .select()
        .from(clubSocialLinks)
        .where(eq(clubSocialLinks.organizationId, organizationId))
        .orderBy(asc(clubSocialLinks.platform)),
      db
        .select()
        .from(clubTrainingSlots)
        .where(eq(clubTrainingSlots.organizationId, organizationId))
        .orderBy(
          asc(clubTrainingSlots.dayOfWeek),
          asc(clubTrainingSlots.startsAt)
        ),
    ]);
  return {
    fees: fees[0] ?? null,
    organization,
    profile: profile[0] ?? null,
    settings: settings[0] ?? null,
    socialLinks,
    trainingSlots,
  };
};
