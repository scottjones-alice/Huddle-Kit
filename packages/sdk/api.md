# Huddlekit TypeScript API

Complete reference of every operation, grouped by resource. See [the README](./README.md) for usage and configuration.

## Contents

- [`Health`](#health)
  - [Health](#health-1)
- [`Club`](#club)
  - [Get the club](#get-the-club)
  - [Change the club](#change-the-club)
- [`Consents`](#consents)
  - [List consent forms](#list-consent-forms)
  - [Publish a consent form](#publish-a-consent-form)
  - [Stop offering a consent form](#stop-offering-a-consent-form)
  - [List a person's consents](#list-a-persons-consents)
  - [Give consent](#give-consent)
  - [Withdraw consent](#withdraw-consent)
- [`Events`](#events)
  - [List events](#list-events)
  - [Add an event](#add-an-event)
  - [Get an event](#get-an-event)
  - [Change, cancel or score an event](#change-cancel-or-score-an-event)
  - [Say if you can make it](#say-if-you-can-make-it)
  - [Who can make it](#who-can-make-it)
  - [Record attendance](#record-attendance)
  - [See attendance](#see-attendance)
  - [Pick the squad](#pick-the-squad)
  - [See the squad](#see-the-squad)
  - [List repeating events](#list-repeating-events)
  - [Add a repeating event](#add-a-repeating-event)
  - [Stop or end a repeating event](#stop-or-end-a-repeating-event)
  - [Make more events](#make-more-events)
- [`Fees`](#fees)
  - [List fees](#list-fees)
  - [Add a fee](#add-a-fee)
  - [Change or archive a fee](#change-or-archive-a-fee)
  - [Charge people for a fee](#charge-people-for-a-fee)
  - [List charges](#list-charges)
  - [List payments on a charge](#list-payments-on-a-charge)
  - [Record a payment](#record-a-payment)
  - [Waive or cancel a charge](#waive-or-cancel-a-charge)
- [`Files`](#files)
  - [Start an upload](#start-an-upload)
  - [List files](#list-files)
  - [Confirm an upload](#confirm-an-upload)
  - [Get a download URL](#get-a-download-url)
  - [List who viewed a file](#list-who-viewed-a-file)
  - [Delete a file](#delete-a-file)
- [`Messaging`](#messaging)
  - [List announcements](#list-announcements)
  - [Post an announcement](#post-an-announcement)
  - [Change, publish or take down an announcement](#change-publish-or-take-down-an-announcement)
  - [List my notifications](#list-my-notifications)
  - [Mark all my notifications as read](#mark-all-my-notifications-as-read)
  - [Mark a notification as read](#mark-a-notification-as-read)
- [`Onboarding`](#onboarding)
  - [`list`](#list)
  - [`saveMemberStep`](#savememberstep)
  - [`saveClubStep`](#saveclubstep)
  - [`retrieveDraft`](#retrievedraft)
  - [`saveDraft`](#savedraft)
  - [`finishDraft`](#finishdraft)
- [`Opponents`](#opponents)
  - [List opponents](#list-opponents)
  - [Add an opponent](#add-an-opponent)
  - [Change or archive an opponent](#change-or-archive-an-opponent)
- [`Payments`](#payments)
  - [Card payment status](#card-payment-status)
  - [Start card payment onboarding](#start-card-payment-onboarding)
  - [Pay a fee charge by card](#pay-a-fee-charge-by-card)
- [`People`](#people)
  - [List people](#list-people)
  - [Add a person](#add-a-person)
  - [Get a person](#get-a-person)
  - [Change or archive a person](#change-or-archive-a-person)
  - [Link a parent or guardian](#link-a-parent-or-guardian)
- [`Registrations`](#registrations)
  - [List registrations](#list-registrations)
  - [Register for a season](#register-for-a-season)
  - [Change or withdraw a registration](#change-or-withdraw-a-registration)
- [`Reports`](#reports)
  - [Club at a glance](#club-at-a-glance)
  - [Money in and owed](#money-in-and-owed)
  - [Team attendance](#team-attendance)
- [`Roles`](#roles)
  - [List club logins](#list-club-logins)
  - [List jobs](#list-jobs)
  - [Give a job](#give-a-job)
  - [End a job](#end-a-job)
- [`Safeguarding`](#safeguarding)
  - [List safeguarding checks](#list-safeguarding-checks)
  - [Record a safeguarding check](#record-a-safeguarding-check)
  - [Decide or correct a check](#decide-or-correct-a-check)
  - [Raise a safeguarding concern](#raise-a-safeguarding-concern)
  - [List concerns](#list-concerns)
  - [Read a concern](#read-a-concern)
  - [Update a concern](#update-a-concern)
  - [Add a note to a concern](#add-a-note-to-a-concern)
- [`Teams`](#teams)
  - [List seasons](#list-seasons)
  - [Add a season](#add-a-season)
  - [Change a season](#change-a-season)
  - [List teams](#list-teams)
  - [Add a team](#add-a-team)
  - [Get a team](#get-a-team)
  - [Change or archive a team](#change-or-archive-a-team)
  - [Get a team's roster](#get-a-teams-roster)
  - [Add a person to a team](#add-a-person-to-a-team)
  - [Take a person off a team](#take-a-person-off-a-team)
- [`Venues`](#venues)
  - [List venues](#list-venues)
  - [Add a venue](#add-a-venue)
  - [Get a venue](#get-a-venue)
  - [Change or archive a venue](#change-or-archive-a-venue)
  - [List pitches](#list-pitches)
  - [Add a pitch](#add-a-pitch)
  - [Change or archive a pitch](#change-or-archive-a-pitch)
- [`Welfare`](#welfare)
  - [Get a person's health information](#get-a-persons-health-information)
  - [Add a medical record](#add-a-medical-record)
  - [Change a medical record](#change-a-medical-record)
  - [Add an allergy](#add-an-allergy)
  - [Change or archive an allergy](#change-or-archive-an-allergy)
  - [List incident reports](#list-incident-reports)
  - [Write an incident report](#write-an-incident-report)
  - [Read an incident report](#read-an-incident-report)
  - [Add to an incident report](#add-to-an-incident-report)
  - [List qualifications](#list-qualifications)
  - [Add a qualification](#add-a-qualification)
  - [Change a qualification](#change-a-qualification)

## Setup

```ts
import HuddlekitAPI from '@alicesystems-co/huddlekit';

const client = new HuddlekitAPI({
  sessionCookie: process.env['SESSION_COOKIE'], // defaults to the SESSION_COOKIE env var
});
```

## `Health`

Whether the API and its dependencies are up.

### Health

Checks every dependency (database, storage, email, worker, novu). Responds 503 when a critical one is down.

| Direction | Type |
| --- | --- |
| Response | [`HealthListAPIRootResponse`](./src/resources/health.ts) |

```ts
const health = await client.health.listAPIRoot();
```

## `Club`

The club's details, legal information and settings.

### Get the club

The club's name and address, legal and safeguarding details, default fees, social links and training times. Any club member can read it.

| Direction | Type |
| --- | --- |
| Response | [`ClubListResponse`](./src/resources/club.ts) |

```ts
const club = await client.club.list();
```

### Change the club

Changes one section of the club: `club` (name, address, type), `location`, `governance` (legal and insurance), `schedule` (training times), `fees` or `social`. Send `{ step, data }`. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`ClubSaveParams`](./src/resources/club.ts) |
| Response | [`ClubSaveResponse`](./src/resources/club.ts) |

```ts
const club = await client.club.save({
  data: {
    affiliationNumber: 'string',
    clubType: 'grassroots',
    contactEmail: 'alex@example.com',
    contactPhone: 'string',
    countyFa: 'string',
    foundedYear: 1850,
    leagues: 'string',
    name: 'string',
    sections: ['mini-soccer'],
    slug: 'string',
    website: 'https://example.com',
  },
  step: 'club',
});
```

## `Consents`

Consent form wording, and what each person or parent has agreed to.

### List consent forms

The wording of each consent form. Everyone in the club can read it.

| Direction | Type |
| --- | --- |
| Request | [`ConsentListFormsParams`](./src/resources/consents.ts) |
| Response | [`ConsentListFormsResponse`](./src/resources/consents.ts) |

```ts
const consent = await client.consents.listForms({
  includeRetired: 'false',
});
```

### Publish a consent form

Publishes new wording as the next version for its type. Old versions are never edited, so every consent shows exactly what was agreed. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`ConsentPublishFormParams`](./src/resources/consents.ts) |
| Response | [`ConsentPublishFormResponse`](./src/resources/consents.ts) |

```ts
const consent = await client.consents.publishForm({ body: 'string', title: 'string', type: 'photo_video' });
```

### Stop offering a consent form

Stops offering a version. Consents already given against it stay valid. Club admins only.

| Direction | Type |
| --- | --- |
| Response | [`ConsentRetireFormResponse`](./src/resources/consents.ts) |

```ts
const consent = await client.consents.retireForm('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### List a person's consents

Everything a person has agreed to, including what was withdrawn. You can see it for anyone you can see.

| Direction | Type |
| --- | --- |
| Response | [`ConsentListResponse`](./src/resources/consents.ts) |

```ts
const consent = await client.consents.list('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Give consent

Records that the person agreed. You can agree for yourself and your children, and a parent is recorded as the one who agreed for a child. Agreeing to the same thing twice is refused; withdraw first.

| Direction | Type |
| --- | --- |
| Request | [`ConsentGrantParams`](./src/resources/consents.ts) |
| Response | [`ConsentGrantResponse`](./src/resources/consents.ts) |

```ts
const consent = await client.consents.grant('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  documentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  expiresAt: '2026-01-15T09:30:00.000Z',
  notes: 'string',
  type: 'photo_video',
});
```

### Withdraw consent

Takes consent back. The record stays, with the date it stopped.

| Direction | Type |
| --- | --- |
| Response | [`ConsentWithdrawResponse`](./src/resources/consents.ts) |

```ts
const consent = await client.consents.withdraw('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

## `Events`

Training, matches and other events, who can make them, who turned up, and match squads.

### List events

Everyone in the club can see the calendar, soonest first.

| Direction | Type |
| --- | --- |
| Request | [`EventListParams`](./src/resources/events.ts) |
| Response | [`EventListResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.list({
  limit: 50,
  offset: 0,
});
```

### Add an event

Adds a training, match or other event. Coaches can add events for their own teams; club admins can add any, including club-wide ones.

| Direction | Type |
| --- | --- |
| Request | [`EventCreateParams`](./src/resources/events.ts) |
| Response | [`EventCreateResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.create({
  description: 'string',
  endsAt: '2026-01-15T09:30:00.000Z',
  kind: 'training',
  match: { competition: 'string', homeAway: 'home', opponentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
  meetAt: '2026-01-15T09:30:00.000Z',
  startsAt: '2026-01-15T09:30:00.000Z',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  title: 'string',
  venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Get an event

| Direction | Type |
| --- | --- |
| Response | [`EventRetrieveResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Change, cancel or score an event

Changes the time or place, cancels or postpones, or records the result. Events are never deleted.

| Direction | Type |
| --- | --- |
| Request | [`EventUpdateParams`](./src/resources/events.ts) |
| Response | [`EventUpdateResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  cancellationReason: 'string',
  description: 'string',
  endsAt: '2026-01-15T09:30:00.000Z',
  match: {
    competition: 'string',
    homeAway: 'home',
    opponentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    goalsAgainst: 1,
    goalsFor: 1,
  },
  meetAt: '2026-01-15T09:30:00.000Z',
  startsAt: '2026-01-15T09:30:00.000Z',
  status: 'scheduled',
  title: 'string',
  venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Say if you can make it

Says whether someone can make it. You can answer for yourself and your children; club admins can answer for anyone. Answering again changes the answer.

| Direction | Type |
| --- | --- |
| Request | [`EventSetAvailabilityParams`](./src/resources/events.ts) |
| Response | [`EventSetAvailabilityResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.setAvailability('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  note: 'string',
  personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  status: 'available',
});
```

### Who can make it

The team's coaches see every answer. Everyone else sees their own and their children's.

| Direction | Type |
| --- | --- |
| Response | [`EventListAvailabilityResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.listAvailability('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Record attendance

Records who turned up. Coaches of the team and club admins only. Saving a person again changes their earlier mark.

| Direction | Type |
| --- | --- |
| Request | [`EventRecordAttendanceParams`](./src/resources/events.ts) |
| Response | [`EventRecordAttendanceResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.recordAttendance('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  records: [{ note: 'string', personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', status: 'present' }],
});
```

### See attendance

Coaches of the team and club admins only.

| Direction | Type |
| --- | --- |
| Response | [`EventListAttendanceResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.listAttendance('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Pick the squad

Picks the match squad. Sending the list again replaces the earlier pick. Coaches of the team and club admins only.

| Direction | Type |
| --- | --- |
| Request | [`EventSetSquadParams`](./src/resources/events.ts) |
| Response | [`EventSetSquadResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.setSquad('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  squad: [
    {
      goals: 1,
      minutesPlayed: 1,
      personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      position: 'string',
      role: 'starter',
      shirtNumber: 1,
    },
  ],
});
```

### See the squad

| Direction | Type |
| --- | --- |
| Response | [`EventListSquadResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.listSquad('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### List repeating events

Repeating sessions, such as training every Tuesday.

| Direction | Type |
| --- | --- |
| Response | [`EventListSeriesResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.listSeries();
```

### Add a repeating event

Creates a repeating weekly event and makes its first events. Coaches for their own teams; club admins for any.

| Direction | Type |
| --- | --- |
| Request | [`EventCreateSeriesParams`](./src/resources/events.ts) |
| Response | [`EventCreateSeriesResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.createSeries({
  description: 'string',
  durationMinutes: 5,
  endsOn: '2026-01-15',
  generateUntil: '2026-01-15',
  intervalWeeks: 1,
  kind: 'training',
  meetMinutesBefore: 1,
  startTime: 'string',
  startsOn: '2026-01-15',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  timeZone: 'string',
  title: 'string',
  venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  weekday: 1,
});
```

### Stop or end a repeating event

Stops a series or sets when it ends. Events already made stay.

| Direction | Type |
| --- | --- |
| Request | [`EventUpdateSeriesParams`](./src/resources/events.ts) |
| Response | [`EventUpdateSeriesResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.updateSeries('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  endsOn: '2026-01-15',
  isActive: true,
});
```

### Make more events

Makes the events for a series up to a date. Safe to repeat: events that exist are skipped.

| Direction | Type |
| --- | --- |
| Request | [`EventExtendSeriesParams`](./src/resources/events.ts) |
| Response | [`EventExtendSeriesResponse`](./src/resources/events.ts) |

```ts
const event = await client.events.extendSeries('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  until: '2026-01-15',
});
```

## `Fees`

Fees, who owes what, and payments received. Money is in pence or cents. Admins and the treasurer manage it; members see their own family's.

### List fees

The club's fee schedule. Everyone in the club can see it.

| Direction | Type |
| --- | --- |
| Request | [`FeeListParams`](./src/resources/fees.ts) |
| Response | [`FeeListResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.list({
  includeArchived: 'false',
});
```

### Add a fee

Adds a fee, such as subs or kit. Club admins and the treasurer only. Nobody owes it until they are charged.

| Direction | Type |
| --- | --- |
| Request | [`FeeCreateParams`](./src/resources/fees.ts) |
| Response | [`FeeCreateResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.create({
  amountMinor: 1,
  currency: 'string',
  description: 'string',
  dueOn: '2026-01-15',
  name: 'string',
  seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Change or archive a fee

Changes or archives a fee. Charges already made keep the amount they were made with.

| Direction | Type |
| --- | --- |
| Request | [`FeeUpdateParams`](./src/resources/fees.ts) |
| Response | [`FeeUpdateResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  amountMinor: 1,
  currency: 'string',
  description: 'string',
  dueOn: '2026-01-15',
  name: 'string',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  isActive: true,
});
```

### Charge people for a fee

Charges people for this fee. Name the people, or leave them out to charge every player on the fee's team. Anyone already charged is skipped.

| Direction | Type |
| --- | --- |
| Request | [`FeeChargePeopleParams`](./src/resources/fees.ts) |
| Response | [`FeeChargePeopleResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.chargePeople('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  personIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
});
```

### List charges

The treasurer and club admins see every charge. Everyone else sees their own and their children's.

| Direction | Type |
| --- | --- |
| Request | [`FeeListChargesParams`](./src/resources/fees.ts) |
| Response | [`FeeListChargesResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.listCharges({
  limit: 50,
  offset: 0,
});
```

### List payments on a charge

| Direction | Type |
| --- | --- |
| Response | [`FeeListChargePaymentsResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.listChargePayments('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Record a payment

Records cash, a bank transfer or a cheque. Card payments are recorded by Stripe, not by hand. A payment that would pay too much is refused, and payments are never edited or deleted.

| Direction | Type |
| --- | --- |
| Request | [`FeeRecordPaymentParams`](./src/resources/fees.ts) |
| Response | [`FeeRecordPaymentResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.recordPayment('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  amountMinor: 1,
  method: 'cash',
  receivedAt: '2026-01-15T09:30:00.000Z',
  reference: 'string',
});
```

### Waive or cancel a charge

Waives a charge for hardship (a reason is required) or cancels one made by mistake. The charge stays on record.

| Direction | Type |
| --- | --- |
| Request | [`FeeCloseChargeParams`](./src/resources/fees.ts) |
| Response | [`FeeCloseChargeResponse`](./src/resources/fees.ts) |

```ts
const fee = await client.fees.closeCharge('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  reason: 'string',
  status: 'waived',
});
```

## `Files`

Uploads, downloads and file views.

### Start an upload

Records a pending file and returns a presigned URL. The client PUTs the bytes there with exactly the returned uploadHeaders, then calls confirm. Sensitive files must declare checksumSha256 (SHA-256 as 64 lower-case hex characters).

| Direction | Type |
| --- | --- |
| Request | [`FileCreateParams`](./src/resources/files.ts) |
| Response | [`FileCreateResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.create({
  checksumSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  contentType: 'string',
  fileName: 'string',
  kind: 'photo',
  sizeBytes: 1,
});
```

### List files

Uploaded files for the active organization, newest first.

| Direction | Type |
| --- | --- |
| Request | [`FileListParams`](./src/resources/files.ts) |
| Response | [`FileListResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.list();
```

### Confirm an upload

Checks the object arrived with the declared size. Safe to call twice.

| Direction | Type |
| --- | --- |
| Response | [`FileConfirmResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.confirm('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Get a download URL

Returns a presigned download URL and records who asked for it and when.

| Direction | Type |
| --- | --- |
| Response | [`FileListDownloadURLResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.listDownloadURL('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### List who viewed a file

Who was given access to a file and when, newest first.

| Direction | Type |
| --- | --- |
| Response | [`FileListViewsResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.listViews('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Delete a file

Deletes the object, then the row.

```ts
await client.files.delete('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

## `Messaging`

Announcements from the club and each person's notification inbox. There is no private messaging between adults and children.

### List announcements

Posts from the club. You see club-wide posts and posts for teams you play for, coach, or have a child in. There is no private messaging: the club speaks to members through posts and notifications, which the club can see.

| Direction | Type |
| --- | --- |
| Request | [`MessagingListAnnouncementsParams`](./src/resources/messaging.ts) |
| Response | [`MessagingListAnnouncementsResponse`](./src/resources/messaging.ts) |

```ts
const messaging = await client.messaging.listAnnouncements({
  limit: 50,
  offset: 0,
  includeDrafts: 'false',
});
```

### Post an announcement

Posts to the whole club (club admins) or to one team (its coaches). Everyone it is for gets a notification, unless it is saved as a draft.

| Direction | Type |
| --- | --- |
| Request | [`MessagingCreateAnnouncementParams`](./src/resources/messaging.ts) |
| Response | [`MessagingCreateAnnouncementResponse`](./src/resources/messaging.ts) |

```ts
const messaging = await client.messaging.createAnnouncement({
  body: 'string',
  expiresAt: '2026-01-15T09:30:00.000Z',
  publish: true,
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  title: 'string',
});
```

### Change, publish or take down an announcement

Edits a post, publishes a draft, or takes a post down by expiring it. Posts are never deleted.

| Direction | Type |
| --- | --- |
| Request | [`MessagingUpdateAnnouncementParams`](./src/resources/messaging.ts) |
| Response | [`MessagingUpdateAnnouncementResponse`](./src/resources/messaging.ts) |

```ts
const messaging = await client.messaging.updateAnnouncement('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  body: 'string',
  expiresAt: '2026-01-15T09:30:00.000Z',
  publish: true,
  title: 'string',
});
```

### List my notifications

The caller's own inbox in this club.

| Direction | Type |
| --- | --- |
| Request | [`MessagingListNotificationsParams`](./src/resources/messaging.ts) |
| Response | [`MessagingListNotificationsResponse`](./src/resources/messaging.ts) |

```ts
const messaging = await client.messaging.listNotifications({
  limit: 50,
  offset: 0,
  unread: 'false',
});
```

### Mark all my notifications as read

| Direction | Type |
| --- | --- |
| Response | [`MessagingMarkAllNotificationsReadResponse`](./src/resources/messaging.ts) |

```ts
const messaging = await client.messaging.markAllNotificationsRead();
```

### Mark a notification as read

| Direction | Type |
| --- | --- |
| Response | [`MessagingMarkNotificationReadResponse`](./src/resources/messaging.ts) |

```ts
const messaging = await client.messaging.markNotificationRead('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

## `Onboarding`

Club and member setup wizards, and saved drafts.

### `list`

Onboarding progress for the signed-in user and active club.

| Direction | Type |
| --- | --- |
| Response | [`OnboardingListResponse`](./src/resources/onboarding.ts) |

```ts
const onboarding = await client.onboarding.list();
```

### `saveMemberStep`

Saves one people-wizard step for the signed-in person and their own children, and marks it done. `you`, `emergency` and `safeguarding` (the club founder's steps) save the same data as `details`, `safety` and `dbs`.

| Direction | Type |
| --- | --- |
| Request | [`OnboardingSaveMemberStepParams`](./src/resources/onboarding.ts) |
| Response | [`OnboardingSaveMemberStepResponse`](./src/resources/onboarding.ts) |

```ts
const onboarding = await client.onboarding.saveMemberStep('role', {});
```

### `saveClubStep`

Saves one club wizard step (club, location, governance, schedule, fees or social) and marks it done. The body is that step's fields. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`OnboardingSaveClubStepParams`](./src/resources/onboarding.ts) |
| Response | [`OnboardingSaveClubStepResponse`](./src/resources/onboarding.ts) |

```ts
const onboarding = await client.onboarding.saveClubStep('club', {});
```

### `retrieveDraft`

The saved draft for a flow, or 404 when there is none.

| Direction | Type |
| --- | --- |
| Response | [`OnboardingRetrieveDraftResponse`](./src/resources/onboarding.ts) |

```ts
const onboarding = await client.onboarding.retrieveDraft('club');
```

### `saveDraft`

Saves the form so far, encrypted. Replaces any earlier draft for the flow.

| Direction | Type |
| --- | --- |
| Request | [`OnboardingSaveDraftParams`](./src/resources/onboarding.ts) |
| Response | [`OnboardingSaveDraftResponse`](./src/resources/onboarding.ts) |

```ts
const onboarding = await client.onboarding.saveDraft('club', { data: { key: {} }, stepId: 'string' });
```

### `finishDraft`

Call when a wizard is finished. Removes the saved draft, which also stops the 'finish your setup' reminder emails. The answers themselves were already saved step by step.

```ts
await client.onboarding.finishDraft('club');
```

## `Opponents`

Clubs the team plays against.

### List opponents

Clubs the team plays against, A to Z.

| Direction | Type |
| --- | --- |
| Request | [`OpponentListParams`](./src/resources/opponents.ts) |
| Response | [`OpponentListResponse`](./src/resources/opponents.ts) |

```ts
const opponent = await client.opponents.list({
  includeArchived: 'false',
});
```

### Add an opponent

Adds an opposition club. Owners, admins and anyone with a coaching job can do this.

| Direction | Type |
| --- | --- |
| Request | [`OpponentCreateParams`](./src/resources/opponents.ts) |
| Response | [`OpponentCreateResponse`](./src/resources/opponents.ts) |

```ts
const opponent = await client.opponents.create({
  contactEmail: 'alex@example.com',
  contactPhone: 'string',
  homeVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'string',
  shortName: 'string',
  website: 'https://example.com',
});
```

### Change or archive an opponent

Changes an opponent, or archives it with `isActive: false`. Past fixtures keep pointing at it.

| Direction | Type |
| --- | --- |
| Request | [`OpponentUpdateParams`](./src/resources/opponents.ts) |
| Response | [`OpponentUpdateResponse`](./src/resources/opponents.ts) |

```ts
const opponent = await client.opponents.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  contactEmail: 'alex@example.com',
  contactPhone: 'string',
  homeVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'string',
  shortName: 'string',
  website: 'https://example.com',
  isActive: true,
});
```

## `Payments`

Stripe Connect payouts and fee checkout.

### Card payment status

Whether the club can take card payments from its members. Reads the live status from Stripe.

| Direction | Type |
| --- | --- |
| Response | [`PaymentListConnectAccountResponse`](./src/resources/payments.ts) |

```ts
const payment = await client.payments.listConnectAccount();
```

### Start card payment onboarding

Creates the club's Stripe account the first time, then returns a single-use Stripe-hosted onboarding link. Call again for a fresh link.

| Direction | Type |
| --- | --- |
| Response | [`PaymentStartConnectOnboardingResponse`](./src/resources/payments.ts) |

```ts
const payment = await client.payments.startConnectOnboarding();
```

### Pay a fee charge by card

Returns a Stripe Checkout page for the amount still owed on a fee charge. The money goes to the club's own Stripe account.

| Direction | Type |
| --- | --- |
| Response | [`PaymentCreateChargeCheckoutResponse`](./src/resources/payments.ts) |

```ts
const payment = await client.payments.createChargeCheckout('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

## `People`

Members, children and guardians. Everyone sees their own family; admins see all.

### List people

Club admins see everyone. A coach sees the people on the teams they coach. Anyone else sees only themselves and their own children.

| Direction | Type |
| --- | --- |
| Request | [`PeopleListParams`](./src/resources/people.ts) |
| Response | [`PeopleListResponse`](./src/resources/people.ts) |

```ts
const people = await client.people.list({
  limit: 50,
  offset: 0,
  includeArchived: 'false',
});
```

### Add a person

Adds a person who does not have a login, such as a child or a coach who has not signed up. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`PeopleCreatePersonParams`](./src/resources/people.ts) |
| Response | [`PeopleCreatePersonResponse`](./src/resources/people.ts) |

```ts
const people = await client.people.createPerson({
  address: {
    city: 'string',
    countryCode: 'string',
    line1: 'string',
    line2: 'string',
    postalCode: 'string',
    region: 'string',
  },
  dateOfBirth: '2026-01-15',
  email: 'alex@example.com',
  firstName: 'string',
  lastName: 'string',
  phone: 'string',
  preferredName: 'string',
});
```

### Get a person

One person with their address, family links, player profile and team history. Medical and safeguarding information is separate.

| Direction | Type |
| --- | --- |
| Response | [`PeopleRetrievePersonResponse`](./src/resources/people.ts) |

```ts
const people = await client.people.retrievePerson('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Change or archive a person

Changes a person's details. You can change your own and your children's; club admins can change anyone's.

| Direction | Type |
| --- | --- |
| Request | [`PeopleUpdatePersonParams`](./src/resources/people.ts) |
| Response | [`PeopleUpdatePersonResponse`](./src/resources/people.ts) |

```ts
const people = await client.people.updatePerson('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  address: {
    city: 'string',
    countryCode: 'string',
    line1: 'string',
    line2: 'string',
    postalCode: 'string',
    region: 'string',
  },
  dateOfBirth: '2026-01-15',
  email: 'alex@example.com',
  firstName: 'string',
  lastName: 'string',
  phone: 'string',
  preferredName: 'string',
  isActive: true,
});
```

### Link a parent or guardian

Records that an adult is a parent, guardian or carer of the person in the path. Saving the same link again updates its permissions. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`PeopleLinkParams`](./src/resources/people.ts) |
| Response | [`PeopleLinkResponse`](./src/resources/people.ts) |

```ts
const people = await client.people.link('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  canCollect: true,
  hasParentalResponsibility: true,
  isEmergencyContact: true,
  relatedPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  relationship: 'parent',
});
```

## `Registrations`

Asking to join for a season, and a club admin accepting or placing them.

### List registrations

Club admins see everyone's registrations. Everyone else sees their own and their children's.

| Direction | Type |
| --- | --- |
| Request | [`RegistrationListParams`](./src/resources/registrations.ts) |
| Response | [`RegistrationListResponse`](./src/resources/registrations.ts) |

```ts
const registration = await client.registrations.list({
  limit: 50,
  offset: 0,
});
```

### Register for a season

Asks to join for a season. It waits as pending for a club admin to accept; if a club admin registers someone it starts active. Each person can register once per season.

| Direction | Type |
| --- | --- |
| Request | [`RegistrationRegisterParams`](./src/resources/registrations.ts) |
| Response | [`RegistrationRegisterResponse`](./src/resources/registrations.ts) |

```ts
const registration = await client.registrations.register({
  notes: 'string',
  personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Change or withdraw a registration

Accepts, rejects, places or withdraws a registration. It is never deleted, so the history stays.

| Direction | Type |
| --- | --- |
| Request | [`RegistrationUpdateParams`](./src/resources/registrations.ts) |
| Response | [`RegistrationUpdateResponse`](./src/resources/registrations.ts) |

```ts
const registration = await client.registrations.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  notes: 'string',
  status: 'active',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

## `Reports`

Summaries for club admins, the treasurer and coaches: club size, money owed, and team attendance.

### Club at a glance

Club admins only. Contains no safeguarding or health information.

| Direction | Type |
| --- | --- |
| Response | [`ReportListClubSummaryResponse`](./src/resources/reports.ts) |

```ts
const report = await client.reports.listClubSummary();
```

### Money in and owed

Per fee: charged, paid, waived and outstanding. Club admins and the treasurer only.

| Direction | Type |
| --- | --- |
| Response | [`ReportListFinanceSummaryResponse`](./src/resources/reports.ts) |

```ts
const report = await client.reports.listFinanceSummary();
```

### Team attendance

How often each person turned up to a team's events. Coaches of the team and club admins only.

| Direction | Type |
| --- | --- |
| Request | [`ReportListAttendanceSummaryParams`](./src/resources/reports.ts) |
| Response | [`ReportListAttendanceSummaryResponse`](./src/resources/reports.ts) |

```ts
const report = await client.reports.listAttendanceSummary({
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

## `Roles`

Who holds which job in the club, and who has a login.

### List club logins

Everyone with a login to the club and their club role. Owners and admins only.

| Direction | Type |
| --- | --- |
| Response | [`RoleListClubMembersResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.listClubMembers();
```

### List jobs

Jobs people hold in the club (coach, welfare officer, treasurer and so on). Ended jobs are kept as history and shown with `includeEnded=true`. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`RoleListAssignmentsParams`](./src/resources/roles.ts) |
| Response | [`RoleListAssignmentsResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.listAssignments({
  includeEnded: 'false',
});
```

### Give a job

Gives a club member a job. Coaching, team and volunteer jobs can be limited to teams; all other jobs apply to the whole club. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`RoleGrantAssignmentParams`](./src/resources/roles.ts) |
| Response | [`RoleGrantAssignmentResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.grantAssignment({
  role: 'admin',
  scope: 'organization',
  teamIds: [],
  userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### End a job

Ends a job from now on. The record stays, so the club can show who held it and when. Owners and admins only.

| Direction | Type |
| --- | --- |
| Response | [`RoleEndAssignmentResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.endAssignment('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

## `Safeguarding`

Checks on adults (DBS, training) and safeguarding concerns. Anyone can raise a concern; only safeguarding staff can read them. Every read and change is audited and nothing is deleted.

### List safeguarding checks

Who has been checked (DBS, safeguarding training, first aid, references) and when it runs out. Club admins and safeguarding staff can read this; only safeguarding staff can change it.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingListChecksParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingListChecksResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.listChecks();
```

### Record a safeguarding check

Records that a check was done. Keep only the certificate number here and the scan in a file. Safeguarding staff only.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingRecordCheckParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingRecordCheckResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.recordCheck({
  dbsLevel: 'basic',
  dbsUpdateService: true,
  expiresOn: '2026-01-15',
  fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  issuedOn: '2026-01-15',
  kind: 'dbs',
  personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  reference: 'string',
});
```

### Decide or correct a check

Marks a check valid, rejected or revoked, or corrects its dates. Checks are never deleted. Safeguarding staff only.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingUpdateCheckParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingUpdateCheckResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.updateCheck('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  expiresOn: '2026-01-15',
  fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  issuedOn: '2026-01-15',
  reference: 'string',
  status: 'pending',
});
```

### Raise a safeguarding concern

Anyone in the club can raise a concern. Only its id comes back: what you wrote and what happens next is seen by safeguarding staff alone.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingRaiseConcernParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingRaiseConcernResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.raiseConcern({
  details: 'string',
  severity: 'low',
  subjectPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  summary: 'string',
});
```

### List concerns

Safeguarding staff only. Shows the short summaries, never the full account. This is recorded in the audit log.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingListConcernsParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingListConcernsResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.listConcerns();
```

### Read a concern

One concern in full with its running log. Safeguarding staff only. Every read is recorded in the audit log.

| Direction | Type |
| --- | --- |
| Response | [`SafeguardingRetrieveConcernResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.retrieveConcern('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Update a concern

Assigns, refers, changes the severity of, closes or reopens a concern. Closing needs a reason. A concern is never deleted.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingUpdateConcernParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingUpdateConcernResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.updateConcern('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  assignedTo: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  closedReason: 'string',
  referredTo: 'string',
  severity: 'low',
  status: 'open',
});
```

### Add a note to a concern

Adds to the concern's running log. Notes cannot be edited or removed; to correct one, add another.

| Direction | Type |
| --- | --- |
| Request | [`SafeguardingCreateConcernNoteParams`](./src/resources/safeguarding.ts) |
| Response | [`SafeguardingCreateConcernNoteResponse`](./src/resources/safeguarding.ts) |

```ts
const safeguarding = await client.safeguarding.createConcernNote('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  body: 'string',
});
```

## `Teams`

Seasons, teams and who plays for them.

### List seasons

The club's seasons, newest first.

| Direction | Type |
| --- | --- |
| Response | [`TeamListSeasonsResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.listSeasons();
```

### Add a season

Starts a season. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`TeamCreateSeasonParams`](./src/resources/teams.ts) |
| Response | [`TeamCreateSeasonResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.createSeason({
  endsOn: '2026-01-15',
  isCurrent: true,
  name: 'string',
  startsOn: '2026-01-15',
});
```

### Change a season

Changes a season, or makes it the current one. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`TeamUpdateSeasonParams`](./src/resources/teams.ts) |
| Response | [`TeamUpdateSeasonResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.updateSeason('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  endsOn: '2026-01-15',
  isCurrent: true,
  name: 'string',
  startsOn: '2026-01-15',
});
```

### List teams

The club's teams, optionally for one season.

| Direction | Type |
| --- | --- |
| Request | [`TeamListParams`](./src/resources/teams.ts) |
| Response | [`TeamListResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.list({
  includeArchived: 'false',
});
```

### Add a team

Adds a team to a season. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`TeamCreateParams`](./src/resources/teams.ts) |
| Response | [`TeamCreateResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.create({
  ageGroup: 4,
  name: 'string',
  seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  trainingVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Get a team

One team. The roster is a separate call.

| Direction | Type |
| --- | --- |
| Response | [`TeamRetrieveResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Change or archive a team

Changes a team, or archives it with `isActive: false`. Club admins only.

| Direction | Type |
| --- | --- |
| Request | [`TeamUpdateParams`](./src/resources/teams.ts) |
| Response | [`TeamUpdateResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  ageGroup: 4,
  name: 'string',
  seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  trainingVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  isActive: true,
});
```

### Get a team's roster

Who is on the team now. Club admins and the team's coaches see everyone. A player, or the parent of a player, on the team sees it too. Anyone else gets a 404.

| Direction | Type |
| --- | --- |
| Response | [`TeamListRosterResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.listRoster('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Add a person to a team

Puts a person on a team as a player, coach, manager or volunteer. Club admins and the team's own coaches can do this.

| Direction | Type |
| --- | --- |
| Request | [`TeamCreateMemberParams`](./src/resources/teams.ts) |
| Response | [`TeamCreateMemberResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.createMember('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  role: 'player',
  shirtNumber: 1,
  startsOn: '2026-01-15',
});
```

### Take a person off a team

Takes someone off a team from today. The record stays as history of who played and when. Club admins and the team's own coaches can do this.

| Direction | Type |
| --- | --- |
| Response | [`TeamEndMembershipResponse`](./src/resources/teams.ts) |

```ts
const team = await client.teams.endMembership('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

## `Venues`

Venues and the pitches at them.

### List venues

The club's venues with their addresses, A to Z.

| Direction | Type |
| --- | --- |
| Request | [`VenueListParams`](./src/resources/venues.ts) |
| Response | [`VenueListResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.list({
  includeArchived: 'false',
});
```

### Add a venue

Adds a venue and its address. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`VenueCreateParams`](./src/resources/venues.ts) |
| Response | [`VenueCreateResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.create({
  address: {
    city: 'string',
    countryCode: 'string',
    line1: 'string',
    line2: 'string',
    postalCode: 'string',
    region: 'string',
  },
  directions: 'string',
  kinds: ['training_ground'],
  name: 'string',
  what3words: 'string',
});
```

### Get a venue

One venue with its address.

| Direction | Type |
| --- | --- |
| Response | [`VenueRetrieveResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Change or archive a venue

Changes a venue or its address. Send `isActive: false` to archive it: venues are never deleted, because old fixtures point at them. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`VenueUpdateParams`](./src/resources/venues.ts) |
| Response | [`VenueUpdateResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  address: {
    city: 'string',
    countryCode: 'string',
    line1: 'string',
    line2: 'string',
    postalCode: 'string',
    region: 'string',
  },
  directions: 'string',
  kinds: ['training_ground'],
  name: 'string',
  what3words: 'string',
  isActive: true,
});
```

### List pitches

Pitches in the club, A to Z, optionally for one venue.

| Direction | Type |
| --- | --- |
| Request | [`VenueListPitchesParams`](./src/resources/venues.ts) |
| Response | [`VenueListPitchesResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.listPitches({
  includeArchived: 'false',
});
```

### Add a pitch

Adds a pitch to a venue. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`VenueCreatePitchParams`](./src/resources/venues.ts) |
| Response | [`VenueCreatePitchResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.createPitch({
  format: '5v5',
  name: 'string',
  surface: 'grass',
  venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Change or archive a pitch

Changes a pitch, or archives it with `isActive: false`. Owners and admins only.

| Direction | Type |
| --- | --- |
| Request | [`VenueUpdatePitchParams`](./src/resources/venues.ts) |
| Response | [`VenueUpdatePitchResponse`](./src/resources/venues.ts) |

```ts
const venue = await client.venues.updatePitch('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  format: '5v5',
  name: 'string',
  surface: 'grass',
  isActive: true,
});
```

## `Welfare`

Medical records, allergies, incident reports and coaching qualifications. Health information is private to the person, their parents, club admins and their coaches, and every read is audited.

### Get a person's health information

A person's medical records and allergies. Seen by the person, their parents, club admins and the coaches of their teams. Every read is recorded in the audit log.

| Direction | Type |
| --- | --- |
| Response | [`WelfareListHealthResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.listHealth('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Add a medical record

Adds a condition, medication or disability. Only the person, their parents or a club admin can.

| Direction | Type |
| --- | --- |
| Request | [`WelfareCreateMedicalRecordParams`](./src/resources/welfare.ts) |
| Response | [`WelfareCreateMedicalRecordResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.createMedicalRecord('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  details: 'string',
  emergencyNotes: 'string',
  endedOn: '2026-01-15',
  isEmergencyRelevant: true,
  kind: 'condition',
  name: 'string',
  startedOn: '2026-01-15',
});
```

### Change a medical record

Changes a record. Set endedOn when it no longer applies rather than removing it.

| Direction | Type |
| --- | --- |
| Request | [`WelfareUpdateMedicalRecordParams`](./src/resources/welfare.ts) |
| Response | [`WelfareUpdateMedicalRecordResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.updateMedicalRecord('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  details: 'string',
  emergencyNotes: 'string',
  endedOn: '2026-01-15',
  isEmergencyRelevant: true,
  kind: 'condition',
  name: 'string',
  startedOn: '2026-01-15',
});
```

### Add an allergy

| Direction | Type |
| --- | --- |
| Request | [`WelfareCreateAllergyParams`](./src/resources/welfare.ts) |
| Response | [`WelfareCreateAllergyResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.createAllergy('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  allergen: 'string',
  reaction: 'string',
  severity: 'mild',
  treatment: 'string',
});
```

### Change or archive an allergy

| Direction | Type |
| --- | --- |
| Request | [`WelfareUpdateAllergyParams`](./src/resources/welfare.ts) |
| Response | [`WelfareUpdateAllergyResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.updateAllergy('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  allergen: 'string',
  reaction: 'string',
  severity: 'mild',
  treatment: 'string',
  archived: true,
});
```

### List incident reports

Incident reports about people you can see: a parent sees their child's, a coach sees those on their teams, a club admin sees all.

| Direction | Type |
| --- | --- |
| Request | [`WelfareListIncidentsParams`](./src/resources/welfare.ts) |
| Response | [`WelfareListIncidentsResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.listIncidents({
  limit: 50,
  offset: 0,
});
```

### Write an incident report

Writes up an accident, injury, illness or welfare incident. Coaches and club admins only. Reports are never deleted.

| Direction | Type |
| --- | --- |
| Request | [`WelfareCreateIncidentParams`](./src/resources/welfare.ts) |
| Response | [`WelfareCreateIncidentResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.createIncident({
  actionTaken: 'string',
  description: 'string',
  firstAiderPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  followUpRequired: true,
  kind: 'injury',
  occurredAt: '2026-01-15T09:30:00.000Z',
  parentsNotifiedAt: '2026-01-15T09:30:00.000Z',
  personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  severity: 'minor',
  teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
});
```

### Read an incident report

| Direction | Type |
| --- | --- |
| Response | [`WelfareRetrieveIncidentResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.retrieveIncident('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Add to an incident report

Adds what was done, marks follow-up, or records when parents were told. Only the person who wrote it, or a club admin.

| Direction | Type |
| --- | --- |
| Request | [`WelfareUpdateIncidentParams`](./src/resources/welfare.ts) |
| Response | [`WelfareUpdateIncidentResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.updateIncident('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  actionTaken: 'string',
  followUpRequired: true,
  parentsNotifiedAt: '2026-01-15T09:30:00.000Z',
});
```

### List qualifications

| Direction | Type |
| --- | --- |
| Response | [`WelfareListQualificationsResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.listQualifications('3fa85f64-5717-4562-b3fc-2c963f66afa6');
```

### Add a qualification

Adds a coaching or refereeing badge. DBS, safeguarding training and first aid are checks, kept under Safeguarding.

| Direction | Type |
| --- | --- |
| Request | [`WelfareCreateQualificationParams`](./src/resources/welfare.ts) |
| Response | [`WelfareCreateQualificationResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.createQualification('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  awardedBy: 'string',
  expiresOn: '2026-01-15',
  fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  issuedOn: '2026-01-15',
  kind: 'coaching',
  reference: 'string',
  title: 'string',
});
```

### Change a qualification

| Direction | Type |
| --- | --- |
| Request | [`WelfareUpdateQualificationParams`](./src/resources/welfare.ts) |
| Response | [`WelfareUpdateQualificationResponse`](./src/resources/welfare.ts) |

```ts
const welfare = await client.welfare.updateQualification('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
  awardedBy: 'string',
  expiresOn: '2026-01-15',
  fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  issuedOn: '2026-01-15',
  kind: 'coaching',
  reference: 'string',
  title: 'string',
});
```
