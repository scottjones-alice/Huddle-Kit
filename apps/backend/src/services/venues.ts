import { addresses, venues } from "@alice/database";
import type { Database } from "@alice/database";
import { and, asc, eq } from "drizzle-orm";

import { notFound } from "@/lib/app-error";

export interface AddressInput {
  city: string;
  countryCode: string;
  line1: string;
  line2?: string | null;
  postalCode?: string | null;
  region?: string | null;
}

const addressValues = (address: AddressInput) => ({
  city: address.city,
  countryCode: address.countryCode,
  line1: address.line1,
  line2: address.line2 ?? null,
  postalCode: address.postalCode ?? null,
  region: address.region ?? null,
});

/** A venue with its address, for lists and the venue screen. */
const venueWithAddress = async (
  db: Database,
  organizationId: string,
  id: string
) => {
  const [row] = await db
    .select({ address: addresses, venue: venues })
    .from(venues)
    .innerJoin(addresses, eq(addresses.id, venues.addressId))
    .where(and(eq(venues.organizationId, organizationId), eq(venues.id, id)));
  if (row === undefined) {
    throw notFound("Venue");
  }
  return { ...row.venue, address: row.address };
};

export const listVenues = async (
  db: Database,
  organizationId: string,
  includeArchived: boolean
) => {
  const rows = await db
    .select({ address: addresses, venue: venues })
    .from(venues)
    .innerJoin(addresses, eq(addresses.id, venues.addressId))
    .where(
      and(
        eq(venues.organizationId, organizationId),
        includeArchived ? undefined : eq(venues.isActive, true)
      )
    )
    .orderBy(asc(venues.name));
  return rows.map((row) => ({ ...row.venue, address: row.address }));
};

export const getVenue = venueWithAddress;

export interface VenueInput {
  address: AddressInput;
  directions?: string | null;
  kinds: ("training_ground" | "classroom" | "clubhouse" | "match_venue")[];
  name: string;
  what3words?: string | null;
}

export const createVenue = async (
  db: Database,
  organizationId: string,
  input: VenueInput
) => {
  const id = await db.transaction(async (tx) => {
    const [address] = await tx
      .insert(addresses)
      .values({ ...addressValues(input.address), organizationId })
      .returning({ id: addresses.id });
    if (address === undefined) {
      throw new Error("Address insert returned no row");
    }
    const [venue] = await tx
      .insert(venues)
      .values({
        addressId: address.id,
        directions: input.directions ?? null,
        kinds: input.kinds,
        name: input.name,
        organizationId,
        what3words: input.what3words ?? null,
      })
      .returning({ id: venues.id });
    if (venue === undefined) {
      throw new Error("Venue insert returned no row");
    }
    return venue.id;
  });
  return await venueWithAddress(db, organizationId, id);
};

export type VenueChanges = Partial<Omit<VenueInput, "address">> & {
  address?: AddressInput;
  /** Archive (false) or restore (true). Venues are never deleted. */
  isActive?: boolean;
};

export const updateVenue = async (
  db: Database,
  organizationId: string,
  id: string,
  changes: VenueChanges
) => {
  const current = await venueWithAddress(db, organizationId, id);
  await db.transaction(async (tx) => {
    if (changes.address !== undefined) {
      await tx
        .update(addresses)
        .set(addressValues(changes.address))
        .where(
          and(
            eq(addresses.organizationId, organizationId),
            eq(addresses.id, current.addressId)
          )
        );
    }
    const { address: _address, ...rest } = changes;
    if (Object.keys(rest).length > 0) {
      await tx
        .update(venues)
        .set(rest)
        .where(
          and(eq(venues.organizationId, organizationId), eq(venues.id, id))
        );
    }
  });
  return await venueWithAddress(db, organizationId, id);
};

/** Pitches at a venue, in the club. Used to check a venue belongs to the caller's club. */
export const assertVenueInClub = async (
  db: Database,
  organizationId: string,
  venueId: string
): Promise<void> => {
  const [row] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(
      and(eq(venues.organizationId, organizationId), eq(venues.id, venueId))
    );
  if (row === undefined) {
    throw notFound("Venue");
  }
};
