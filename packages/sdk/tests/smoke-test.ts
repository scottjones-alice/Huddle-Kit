// File generated from our OpenAPI spec by Scalar. See README.md for details.

// Smoke test: calls every generated operation once to confirm the SDK can reach each endpoint.
// Run it from this repo with `bun tests/smoke-test.ts`. Each case below calls one SDK method
// exactly the way the SDK exposes it (positional params, request body, pagination, streaming).
//
// Two environment variables tune a run:
//   - SCALAR_SMOKE_FILTER: comma-separated needles; only operations whose name or path contains
//     one of them run, so you can smoke-test a subset without editing this file.
//   - SCALAR_SMOKE_REPORT: a file path; when set, the run writes a JSON report there instead of
//     printing a table. The generator uses this to collect per-operation results.
import { writeFileSync } from 'node:fs';

// The package exports the client class. The client reads auth and the base URL from the
// environment, so it needs no constructor options to point at a server.
import HuddlekitAPI from '@alicesystems-co/huddlekit';

// One shared client runs every case.
const client = new HuddlekitAPI({ maxRetries: 2, timeout: 10_000 });

// The result of running one case, collected for the JSON report or the printed table.
type SmokeResult = {
  operation: string;
  method: string;
  path: string;
  label?: string;
  status: 'passed' | 'failed';
  durationMs: number;
  error?: string;
};

// One or two entries per generated operation: the first passes only the arguments the method
// requires, the second also fills every optional parameter and body property. `label` says which
// is which, and is absent when the operation has no optional argument and so has only one case.
// `run` performs the real SDK call; the other fields are metadata used for filtering and
// reporting. This list is generated, so it stays in sync with the SDK surface.
const cases: {
  operation: string;
  method: string;
  path: string;
  label?: string;
  run: () => Promise<unknown>;
}[] = [
  {
    operation: 'listApiRoot',
    method: 'GET',
    path: '/api/v1',
    run: async () => {
      const health = await client.health.listAPIRoot();
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/club',
    run: async () => {
      const club = await client.club.list();
    },
  },

  {
    operation: 'save',
    method: 'PUT',
    path: '/api/v1/club',
    run: async () => {
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
    },
  },

  {
    operation: 'listForms',
    method: 'GET',
    path: '/api/v1/consent-forms',
    run: async () => {
      const consent = await client.consents.listForms({
        includeRetired: 'false',
      });
    },
  },

  {
    operation: 'publishForm',
    method: 'POST',
    path: '/api/v1/consent-forms',
    run: async () => {
      const consent = await client.consents.publishForm({
        body: 'string',
        title: 'string',
        type: 'photo_video',
      });
    },
  },

  {
    operation: 'retireForm',
    method: 'POST',
    path: '/api/v1/consent-forms/{id}/retire',
    run: async () => {
      const consent = await client.consents.retireForm('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/people/{id}/consents',
    run: async () => {
      const consent = await client.consents.list('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'grant',
    method: 'POST',
    path: '/api/v1/people/{id}/consents',
    run: async () => {
      const consent = await client.consents.grant('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        documentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        expiresAt: '2026-01-15T09:30:00.000Z',
        notes: 'string',
        type: 'photo_video',
      });
    },
  },

  {
    operation: 'withdraw',
    method: 'POST',
    path: '/api/v1/consents/{id}/withdraw',
    run: async () => {
      const consent = await client.consents.withdraw('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/events',
    label: 'required params',
    run: async () => {
      const event = await client.events.list({
        limit: 50,
        offset: 0,
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/events',
    label: 'all params',
    run: async () => {
      const event = await client.events.list({
        limit: 50,
        offset: 0,
        from: '2026-01-15T09:30:00.000Z',
        kind: 'training',
        status: 'scheduled',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        to: '2026-01-15T09:30:00.000Z',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/v1/events',
    run: async () => {
      const event = await client.events.create({
        description: 'string',
        endsAt: '2026-01-15T09:30:00.000Z',
        kind: 'training',
        match: {
          competition: 'string',
          homeAway: 'home',
          opponentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        },
        meetAt: '2026-01-15T09:30:00.000Z',
        startsAt: '2026-01-15T09:30:00.000Z',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        title: 'string',
        venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/api/v1/events/{id}',
    run: async () => {
      const event = await client.events.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/v1/events/{id}',
    run: async () => {
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
    },
  },

  {
    operation: 'setAvailability',
    method: 'PUT',
    path: '/api/v1/events/{id}/availability',
    run: async () => {
      const event = await client.events.setAvailability('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        note: 'string',
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'available',
      });
    },
  },

  {
    operation: 'listAvailability',
    method: 'GET',
    path: '/api/v1/events/{id}/availability',
    run: async () => {
      const event = await client.events.listAvailability('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'recordAttendance',
    method: 'PUT',
    path: '/api/v1/events/{id}/attendance',
    run: async () => {
      const event = await client.events.recordAttendance('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        records: [{ note: 'string', personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', status: 'present' }],
      });
    },
  },

  {
    operation: 'listAttendance',
    method: 'GET',
    path: '/api/v1/events/{id}/attendance',
    run: async () => {
      const event = await client.events.listAttendance('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'setSquad',
    method: 'PUT',
    path: '/api/v1/events/{id}/squad',
    run: async () => {
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
    },
  },

  {
    operation: 'listSquad',
    method: 'GET',
    path: '/api/v1/events/{id}/squad',
    run: async () => {
      const event = await client.events.listSquad('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'listSeries',
    method: 'GET',
    path: '/api/v1/event-series',
    run: async () => {
      const event = await client.events.listSeries();
    },
  },

  {
    operation: 'createSeries',
    method: 'POST',
    path: '/api/v1/event-series',
    run: async () => {
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
    },
  },

  {
    operation: 'updateSeries',
    method: 'PATCH',
    path: '/api/v1/event-series/{id}',
    run: async () => {
      const event = await client.events.updateSeries('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        endsOn: '2026-01-15',
        isActive: true,
      });
    },
  },

  {
    operation: 'extendSeries',
    method: 'POST',
    path: '/api/v1/event-series/{id}/generate',
    run: async () => {
      const event = await client.events.extendSeries('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        until: '2026-01-15',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/fees',
    label: 'required params',
    run: async () => {
      const fee = await client.fees.list({
        includeArchived: 'false',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/fees',
    label: 'all params',
    run: async () => {
      const fee = await client.fees.list({
        includeArchived: 'false',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/v1/fees',
    run: async () => {
      const fee = await client.fees.create({
        amountMinor: 1,
        currency: 'string',
        description: 'string',
        dueOn: '2026-01-15',
        name: 'string',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/v1/fees/{id}',
    run: async () => {
      const fee = await client.fees.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        amountMinor: 1,
        currency: 'string',
        description: 'string',
        dueOn: '2026-01-15',
        name: 'string',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        isActive: true,
      });
    },
  },

  {
    operation: 'chargePeople',
    method: 'POST',
    path: '/api/v1/fees/{id}/charges',
    run: async () => {
      const fee = await client.fees.chargePeople('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        personIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
      });
    },
  },

  {
    operation: 'listCharges',
    method: 'GET',
    path: '/api/v1/charges',
    label: 'required params',
    run: async () => {
      const fee = await client.fees.listCharges({
        limit: 50,
        offset: 0,
      });
    },
  },

  {
    operation: 'listCharges',
    method: 'GET',
    path: '/api/v1/charges',
    label: 'all params',
    run: async () => {
      const fee = await client.fees.listCharges({
        limit: 50,
        offset: 0,
        feeId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'due',
      });
    },
  },

  {
    operation: 'listChargePayments',
    method: 'GET',
    path: '/api/v1/charges/{id}/payments',
    run: async () => {
      const fee = await client.fees.listChargePayments('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'recordPayment',
    method: 'POST',
    path: '/api/v1/charges/{id}/payments',
    run: async () => {
      const fee = await client.fees.recordPayment('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        amountMinor: 1,
        method: 'cash',
        receivedAt: '2026-01-15T09:30:00.000Z',
        reference: 'string',
      });
    },
  },

  {
    operation: 'closeCharge',
    method: 'POST',
    path: '/api/v1/charges/{id}/close',
    run: async () => {
      const fee = await client.fees.closeCharge('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        reason: 'string',
        status: 'waived',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/v1/files',
    run: async () => {
      const file = await client.files.create({
        checksumSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        contentType: 'string',
        fileName: 'string',
        kind: 'photo',
        sizeBytes: 1,
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/files',
    label: 'required params',
    run: async () => {
      const file = await client.files.list();
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/files',
    label: 'all params',
    run: async () => {
      const file = await client.files.list({
        kind: 'photo',
      });
    },
  },

  {
    operation: 'confirm',
    method: 'POST',
    path: '/api/v1/files/{id}/confirm',
    run: async () => {
      const file = await client.files.confirm('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'listDownloadUrl',
    method: 'GET',
    path: '/api/v1/files/{id}/url',
    run: async () => {
      const file = await client.files.listDownloadURL('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'listViews',
    method: 'GET',
    path: '/api/v1/files/{id}/views',
    run: async () => {
      const file = await client.files.listViews('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'delete',
    method: 'DELETE',
    path: '/api/v1/files/{id}',
    run: async () => {
      await client.files.delete('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'listAnnouncements',
    method: 'GET',
    path: '/api/v1/announcements',
    run: async () => {
      const messaging = await client.messaging.listAnnouncements({
        limit: 50,
        offset: 0,
        includeDrafts: 'false',
      });
    },
  },

  {
    operation: 'createAnnouncement',
    method: 'POST',
    path: '/api/v1/announcements',
    run: async () => {
      const messaging = await client.messaging.createAnnouncement({
        body: 'string',
        expiresAt: '2026-01-15T09:30:00.000Z',
        publish: true,
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        title: 'string',
      });
    },
  },

  {
    operation: 'updateAnnouncement',
    method: 'PATCH',
    path: '/api/v1/announcements/{id}',
    run: async () => {
      const messaging = await client.messaging.updateAnnouncement('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        body: 'string',
        expiresAt: '2026-01-15T09:30:00.000Z',
        publish: true,
        title: 'string',
      });
    },
  },

  {
    operation: 'listNotifications',
    method: 'GET',
    path: '/api/v1/notifications',
    run: async () => {
      const messaging = await client.messaging.listNotifications({
        limit: 50,
        offset: 0,
        unread: 'false',
      });
    },
  },

  {
    operation: 'markAllNotificationsRead',
    method: 'POST',
    path: '/api/v1/notifications/read',
    run: async () => {
      const messaging = await client.messaging.markAllNotificationsRead();
    },
  },

  {
    operation: 'markNotificationRead',
    method: 'POST',
    path: '/api/v1/notifications/{id}/read',
    run: async () => {
      const messaging = await client.messaging.markNotificationRead('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/onboarding',
    run: async () => {
      const onboarding = await client.onboarding.list();
    },
  },

  {
    operation: 'saveMemberStep',
    method: 'PUT',
    path: '/api/v1/onboarding/member/{step}',
    run: async () => {
      const onboarding = await client.onboarding.saveMemberStep('role', {});
    },
  },

  {
    operation: 'saveClubStep',
    method: 'PUT',
    path: '/api/v1/onboarding/club/{step}',
    run: async () => {
      const onboarding = await client.onboarding.saveClubStep('club', {});
    },
  },

  {
    operation: 'retrieveDraft',
    method: 'GET',
    path: '/api/v1/onboarding/draft/{flow}',
    run: async () => {
      const onboarding = await client.onboarding.retrieveDraft('club');
    },
  },

  {
    operation: 'saveDraft',
    method: 'PUT',
    path: '/api/v1/onboarding/draft/{flow}',
    run: async () => {
      const onboarding = await client.onboarding.saveDraft('club', { data: { key: {} }, stepId: 'string' });
    },
  },

  {
    operation: 'finishDraft',
    method: 'DELETE',
    path: '/api/v1/onboarding/draft/{flow}',
    run: async () => {
      await client.onboarding.finishDraft('club');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/opponents',
    run: async () => {
      const opponent = await client.opponents.list({
        includeArchived: 'false',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/v1/opponents',
    run: async () => {
      const opponent = await client.opponents.create({
        contactEmail: 'alex@example.com',
        contactPhone: 'string',
        homeVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'string',
        shortName: 'string',
        website: 'https://example.com',
      });
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/v1/opponents/{id}',
    run: async () => {
      const opponent = await client.opponents.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        contactEmail: 'alex@example.com',
        contactPhone: 'string',
        homeVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'string',
        shortName: 'string',
        website: 'https://example.com',
        isActive: true,
      });
    },
  },

  {
    operation: 'listConnectAccount',
    method: 'GET',
    path: '/api/v1/payments/connect/account',
    run: async () => {
      const payment = await client.payments.listConnectAccount();
    },
  },

  {
    operation: 'startConnectOnboarding',
    method: 'POST',
    path: '/api/v1/payments/connect/onboarding',
    run: async () => {
      const payment = await client.payments.startConnectOnboarding();
    },
  },

  {
    operation: 'createChargeCheckout',
    method: 'POST',
    path: '/api/v1/payments/connect/charges/{id}/checkout',
    run: async () => {
      const payment = await client.payments.createChargeCheckout('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/people',
    label: 'required params',
    run: async () => {
      const people = await client.people.list({
        limit: 50,
        offset: 0,
        includeArchived: 'false',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/people',
    label: 'all params',
    run: async () => {
      const people = await client.people.list({
        limit: 50,
        offset: 0,
        includeArchived: 'false',
        search: 'string',
      });
    },
  },

  {
    operation: 'createPerson',
    method: 'POST',
    path: '/api/v1/people',
    run: async () => {
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
    },
  },

  {
    operation: 'retrievePerson',
    method: 'GET',
    path: '/api/v1/people/{id}',
    run: async () => {
      const people = await client.people.retrievePerson('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'updatePerson',
    method: 'PATCH',
    path: '/api/v1/people/{id}',
    run: async () => {
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
    },
  },

  {
    operation: 'link',
    method: 'POST',
    path: '/api/v1/people/{id}/relationships',
    run: async () => {
      const people = await client.people.link('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        canCollect: true,
        hasParentalResponsibility: true,
        isEmergencyContact: true,
        relatedPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        relationship: 'parent',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/registrations',
    label: 'required params',
    run: async () => {
      const registration = await client.registrations.list({
        limit: 50,
        offset: 0,
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/registrations',
    label: 'all params',
    run: async () => {
      const registration = await client.registrations.list({
        limit: 50,
        offset: 0,
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'pending',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'register',
    method: 'POST',
    path: '/api/v1/registrations',
    run: async () => {
      const registration = await client.registrations.register({
        notes: 'string',
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/v1/registrations/{id}',
    run: async () => {
      const registration = await client.registrations.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        notes: 'string',
        status: 'active',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'listClubSummary',
    method: 'GET',
    path: '/api/v1/reports/club-summary',
    run: async () => {
      const report = await client.reports.listClubSummary();
    },
  },

  {
    operation: 'listFinanceSummary',
    method: 'GET',
    path: '/api/v1/reports/finance',
    run: async () => {
      const report = await client.reports.listFinanceSummary();
    },
  },

  {
    operation: 'listAttendanceSummary',
    method: 'GET',
    path: '/api/v1/reports/attendance',
    label: 'required params',
    run: async () => {
      const report = await client.reports.listAttendanceSummary({
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'listAttendanceSummary',
    method: 'GET',
    path: '/api/v1/reports/attendance',
    label: 'all params',
    run: async () => {
      const report = await client.reports.listAttendanceSummary({
        from: '2026-01-15T09:30:00.000Z',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        to: '2026-01-15T09:30:00.000Z',
      });
    },
  },

  {
    operation: 'listClubMembers',
    method: 'GET',
    path: '/api/v1/members',
    run: async () => {
      const role = await client.roles.listClubMembers();
    },
  },

  {
    operation: 'listAssignments',
    method: 'GET',
    path: '/api/v1/role-assignments',
    run: async () => {
      const role = await client.roles.listAssignments({
        includeEnded: 'false',
      });
    },
  },

  {
    operation: 'grantAssignment',
    method: 'POST',
    path: '/api/v1/role-assignments',
    run: async () => {
      const role = await client.roles.grantAssignment({
        role: 'admin',
        scope: 'organization',
        teamIds: [],
        userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'endAssignment',
    method: 'POST',
    path: '/api/v1/role-assignments/{id}/end',
    run: async () => {
      const role = await client.roles.endAssignment('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'listChecks',
    method: 'GET',
    path: '/api/v1/safeguarding/checks',
    label: 'required params',
    run: async () => {
      const safeguarding = await client.safeguarding.listChecks();
    },
  },

  {
    operation: 'listChecks',
    method: 'GET',
    path: '/api/v1/safeguarding/checks',
    label: 'all params',
    run: async () => {
      const safeguarding = await client.safeguarding.listChecks({
        expiresBefore: '2026-01-15',
        kind: 'dbs',
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'pending',
      });
    },
  },

  {
    operation: 'recordCheck',
    method: 'POST',
    path: '/api/v1/safeguarding/checks',
    run: async () => {
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
    },
  },

  {
    operation: 'updateCheck',
    method: 'PATCH',
    path: '/api/v1/safeguarding/checks/{id}',
    run: async () => {
      const safeguarding = await client.safeguarding.updateCheck('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        expiresOn: '2026-01-15',
        fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        issuedOn: '2026-01-15',
        reference: 'string',
        status: 'pending',
      });
    },
  },

  {
    operation: 'raiseConcern',
    method: 'POST',
    path: '/api/v1/safeguarding/concerns',
    run: async () => {
      const safeguarding = await client.safeguarding.raiseConcern({
        details: 'string',
        severity: 'low',
        subjectPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        summary: 'string',
      });
    },
  },

  {
    operation: 'listConcerns',
    method: 'GET',
    path: '/api/v1/safeguarding/concerns',
    label: 'required params',
    run: async () => {
      const safeguarding = await client.safeguarding.listConcerns();
    },
  },

  {
    operation: 'listConcerns',
    method: 'GET',
    path: '/api/v1/safeguarding/concerns',
    label: 'all params',
    run: async () => {
      const safeguarding = await client.safeguarding.listConcerns({
        assignedTo: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'open',
        subjectPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'retrieveConcern',
    method: 'GET',
    path: '/api/v1/safeguarding/concerns/{id}',
    run: async () => {
      const safeguarding = await client.safeguarding.retrieveConcern('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'updateConcern',
    method: 'PATCH',
    path: '/api/v1/safeguarding/concerns/{id}',
    run: async () => {
      const safeguarding = await client.safeguarding.updateConcern('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        assignedTo: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        closedReason: 'string',
        referredTo: 'string',
        severity: 'low',
        status: 'open',
      });
    },
  },

  {
    operation: 'createConcernNote',
    method: 'POST',
    path: '/api/v1/safeguarding/concerns/{id}/notes',
    run: async () => {
      const safeguarding = await client.safeguarding.createConcernNote(
        '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        {
          body: 'string',
        },
      );
    },
  },

  {
    operation: 'listSeasons',
    method: 'GET',
    path: '/api/v1/seasons',
    run: async () => {
      const team = await client.teams.listSeasons();
    },
  },

  {
    operation: 'createSeason',
    method: 'POST',
    path: '/api/v1/seasons',
    run: async () => {
      const team = await client.teams.createSeason({
        endsOn: '2026-01-15',
        isCurrent: true,
        name: 'string',
        startsOn: '2026-01-15',
      });
    },
  },

  {
    operation: 'updateSeason',
    method: 'PATCH',
    path: '/api/v1/seasons/{id}',
    run: async () => {
      const team = await client.teams.updateSeason('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        endsOn: '2026-01-15',
        isCurrent: true,
        name: 'string',
        startsOn: '2026-01-15',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/teams',
    label: 'required params',
    run: async () => {
      const team = await client.teams.list({
        includeArchived: 'false',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/teams',
    label: 'all params',
    run: async () => {
      const team = await client.teams.list({
        includeArchived: 'false',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/v1/teams',
    run: async () => {
      const team = await client.teams.create({
        ageGroup: 4,
        name: 'string',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        trainingVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/api/v1/teams/{id}',
    run: async () => {
      const team = await client.teams.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/v1/teams/{id}',
    run: async () => {
      const team = await client.teams.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        ageGroup: 4,
        name: 'string',
        seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        trainingVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        isActive: true,
      });
    },
  },

  {
    operation: 'listRoster',
    method: 'GET',
    path: '/api/v1/teams/{id}/members',
    run: async () => {
      const team = await client.teams.listRoster('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'createMember',
    method: 'POST',
    path: '/api/v1/teams/{id}/members',
    run: async () => {
      const team = await client.teams.createMember('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        role: 'player',
        shirtNumber: 1,
        startsOn: '2026-01-15',
      });
    },
  },

  {
    operation: 'endMembership',
    method: 'POST',
    path: '/api/v1/team-memberships/{id}/end',
    run: async () => {
      const team = await client.teams.endMembership('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/v1/venues',
    run: async () => {
      const venue = await client.venues.list({
        includeArchived: 'false',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/v1/venues',
    run: async () => {
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
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/api/v1/venues/{id}',
    run: async () => {
      const venue = await client.venues.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/v1/venues/{id}',
    run: async () => {
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
    },
  },

  {
    operation: 'listPitches',
    method: 'GET',
    path: '/api/v1/pitches',
    label: 'required params',
    run: async () => {
      const venue = await client.venues.listPitches({
        includeArchived: 'false',
      });
    },
  },

  {
    operation: 'listPitches',
    method: 'GET',
    path: '/api/v1/pitches',
    label: 'all params',
    run: async () => {
      const venue = await client.venues.listPitches({
        includeArchived: 'false',
        venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'createPitch',
    method: 'POST',
    path: '/api/v1/pitches',
    run: async () => {
      const venue = await client.venues.createPitch({
        format: '5v5',
        name: 'string',
        surface: 'grass',
        venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
    },
  },

  {
    operation: 'updatePitch',
    method: 'PATCH',
    path: '/api/v1/pitches/{id}',
    run: async () => {
      const venue = await client.venues.updatePitch('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        format: '5v5',
        name: 'string',
        surface: 'grass',
        isActive: true,
      });
    },
  },

  {
    operation: 'listHealth',
    method: 'GET',
    path: '/api/v1/people/{id}/health',
    run: async () => {
      const welfare = await client.welfare.listHealth('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'createMedicalRecord',
    method: 'POST',
    path: '/api/v1/people/{id}/medical-records',
    run: async () => {
      const welfare = await client.welfare.createMedicalRecord('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        details: 'string',
        emergencyNotes: 'string',
        endedOn: '2026-01-15',
        isEmergencyRelevant: true,
        kind: 'condition',
        name: 'string',
        startedOn: '2026-01-15',
      });
    },
  },

  {
    operation: 'updateMedicalRecord',
    method: 'PATCH',
    path: '/api/v1/medical-records/{id}',
    run: async () => {
      const welfare = await client.welfare.updateMedicalRecord('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        details: 'string',
        emergencyNotes: 'string',
        endedOn: '2026-01-15',
        isEmergencyRelevant: true,
        kind: 'condition',
        name: 'string',
        startedOn: '2026-01-15',
      });
    },
  },

  {
    operation: 'createAllergy',
    method: 'POST',
    path: '/api/v1/people/{id}/allergies',
    run: async () => {
      const welfare = await client.welfare.createAllergy('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        allergen: 'string',
        reaction: 'string',
        severity: 'mild',
        treatment: 'string',
      });
    },
  },

  {
    operation: 'updateAllergy',
    method: 'PATCH',
    path: '/api/v1/allergies/{id}',
    run: async () => {
      const welfare = await client.welfare.updateAllergy('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        allergen: 'string',
        reaction: 'string',
        severity: 'mild',
        treatment: 'string',
        archived: true,
      });
    },
  },

  {
    operation: 'listIncidents',
    method: 'GET',
    path: '/api/v1/incidents',
    label: 'required params',
    run: async () => {
      const welfare = await client.welfare.listIncidents({
        limit: 50,
        offset: 0,
      });
    },
  },

  {
    operation: 'listIncidents',
    method: 'GET',
    path: '/api/v1/incidents',
    label: 'all params',
    run: async () => {
      const welfare = await client.welfare.listIncidents({
        limit: 50,
        offset: 0,
        from: '2026-01-15T09:30:00.000Z',
        personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        to: '2026-01-15T09:30:00.000Z',
      });
    },
  },

  {
    operation: 'createIncident',
    method: 'POST',
    path: '/api/v1/incidents',
    run: async () => {
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
    },
  },

  {
    operation: 'retrieveIncident',
    method: 'GET',
    path: '/api/v1/incidents/{id}',
    run: async () => {
      const welfare = await client.welfare.retrieveIncident('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'updateIncident',
    method: 'PATCH',
    path: '/api/v1/incidents/{id}',
    run: async () => {
      const welfare = await client.welfare.updateIncident('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        actionTaken: 'string',
        followUpRequired: true,
        parentsNotifiedAt: '2026-01-15T09:30:00.000Z',
      });
    },
  },

  {
    operation: 'listQualifications',
    method: 'GET',
    path: '/api/v1/people/{id}/qualifications',
    run: async () => {
      const welfare = await client.welfare.listQualifications('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    },
  },

  {
    operation: 'createQualification',
    method: 'POST',
    path: '/api/v1/people/{id}/qualifications',
    run: async () => {
      const welfare = await client.welfare.createQualification('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        awardedBy: 'string',
        expiresOn: '2026-01-15',
        fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        issuedOn: '2026-01-15',
        kind: 'coaching',
        reference: 'string',
        title: 'string',
      });
    },
  },

  {
    operation: 'updateQualification',
    method: 'PATCH',
    path: '/api/v1/qualifications/{id}',
    run: async () => {
      const welfare = await client.welfare.updateQualification('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        awardedBy: 'string',
        expiresOn: '2026-01-15',
        fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        issuedOn: '2026-01-15',
        kind: 'coaching',
        reference: 'string',
        title: 'string',
      });
    },
  },
];

/**
 * How many cases run at once, capped at the number of cases there are.
 *
 * SCALAR_SMOKE_CONCURRENCY overrides the default; anything unparseable falls back to it.
 */
const smokeConcurrency = (caseCount: number): number => {
  const override = Number.parseInt(process.env['SCALAR_SMOKE_CONCURRENCY'] ?? '', 10);
  const limit = Number.isInteger(override) && override > 0 ? override : 32;
  return Math.min(limit, caseCount);
};

const main = async (): Promise<void> => {
  // SCALAR_SMOKE_FILTER (comma-separated) keeps only cases whose operation name or path matches
  // one of the needles, so a caller can smoke-test a subset. With no filter, every case runs.
  const filter = process.env['SCALAR_SMOKE_FILTER'];
  const needles = filter
    ? filter
        .split(',')
        .map((needle) => needle.trim())
        .filter(Boolean)
    : [];
  const selected =
    needles.length > 0
      ? cases.filter((testCase) =>
          needles.some((needle) => testCase.operation.includes(needle) || testCase.path.includes(needle)),
        )
      : cases;

  // Run the selected cases under a bounded worker pool rather than all at once. A large SDK has
  // hundreds of operations, and firing every request together exceeds what the client's transport
  // keeps connections for while the runner is already busy with other targets. Each worker pulls
  // the next index off a shared cursor and writes into a pre-sized array, so results stay in case
  // order however the workers interleave. The per-case body catches everything and never rejects,
  // so one failing operation still cannot block the others.
  const results: SmokeResult[] = new Array<SmokeResult>(selected.length);
  let cursor = 0;
  const runNext = async (): Promise<void> => {
    for (let index = cursor++; index < selected.length; index = cursor++) {
      const testCase = selected[index];
      if (!testCase) continue;
      const startedAt = Date.now();
      // `label` distinguishes the required-params run from the all-params run of the same
      // operation; it is omitted entirely when the operation contributed only one case.
      const identity = {
        operation: testCase.operation,
        method: testCase.method,
        path: testCase.path,
        ...(testCase.label ? { label: testCase.label } : {}),
      };
      try {
        await testCase.run();
        results[index] = { ...identity, status: 'passed', durationMs: Date.now() - startedAt };
      } catch (error) {
        // Prefer the stack so a failure points at the failing SDK call; fall back to the message.
        const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
        results[index] = {
          ...identity,
          status: 'failed',
          durationMs: Date.now() - startedAt,
          error: message,
        };
      }
    }
  };
  await Promise.all(Array.from({ length: smokeConcurrency(selected.length) }, runNext));
  const failed = results.filter((result) => result.status === 'failed');

  // With SCALAR_SMOKE_REPORT set, write a machine-readable report; otherwise print a table.
  const reportPath = process.env['SCALAR_SMOKE_REPORT'];
  if (reportPath) {
    writeFileSync(reportPath, JSON.stringify({ total: results.length, failed: failed.length, results }));
  } else {
    for (const result of results) {
      const suffix = result.label ? ` [${result.label}]` : '';
      if (result.status === 'passed')
        console.log(
          `\u2714 ${result.operation}${suffix} (${result.method} ${result.path}) ${result.durationMs}ms`,
        );
      else
        console.error(
          `\u2718 ${result.operation}${suffix} (${result.method} ${result.path})\n${result.error ?? ''}`,
        );
    }
    if (results.length === 0) {
      console.error('No code samples ran (empty SDK or a SCALAR_SMOKE_FILTER that matched nothing).');
    } else {
      console.log(`\n${results.length - failed.length}/${results.length} samples passed`);
    }
  }

  // An empty run (no operations, or a filter that matched nothing) is a failure, not a vacuous pass.
  if (failed.length > 0 || results.length === 0) process.exitCode = 1;
};

void main();
