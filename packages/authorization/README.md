# @alice/authorization

Roles, permissions and access checks: **what may this person do?** [`@alice/authentication`](../authentication) says who is calling and in which club; this package decides what they may do there. It is the single place for access rules. Do not add a second policy elsewhere (the database package has none).

## Usage

```ts
import { authorize, assertCan, loadAccessContext } from "@alice/authorization";

// Once per request, after the session says who and which club.
const context = await loadAccessContext(db, { organizationId, userId });

// Before touching a record: say which record, and where it belongs.
assertCan(context, "medical", "read_emergency", {
  organizationId: child.organizationId,
  subjectPersonId: child.id,
  teamIds: childTeamIds,
});
await recordAuditEvent(db, { action: "medical_record.read", ... }); // @alice/database
```

- `src/statements.ts` — the vocabulary: every resource and its actions (`fixtures`, `medical`, `consents`, `credentials`, `finance`, `venues`, `audit`...).
- `src/policy.ts` — what each role may do, as data. Nothing is implied; owners and admins get no safeguarding cases or full medical records.
- `src/authorize.ts` — reach (club-wide, listed teams, a guardian's children, a player's own record), sensitive-record rules and locked records.
- `src/load-access-context.ts` — builds the caller's context from `members`, `role_assignments`, `team_memberships` and `person_relationships`.

Map from database tables to resources: events and series → `fixtures` / `training`; announcements → `communications`; fees, charges and payments → `finance`; registrations → `registrations`; consents and consent documents → `consents`; DBS and other checks, qualifications → `credentials`; concerns and notes → `safeguarding`; venues and pitches → `venues`; `audit_events` → `audit`. Notifications belong to their recipient, so they are filtered by `user_id` rather than by a role.

## Scripts

- `pnpm check-types` — type-check
- `pnpm test` — run tests with Vitest
