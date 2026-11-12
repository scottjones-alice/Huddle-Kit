import { describe, expect, it, vi } from "vitest";

import { NotificationError, createNotifications } from "../src/index";
import type { NovuLike } from "../src/index";

type Trigger = NovuLike["trigger"];

const processed = (transactionId = "tx_1") => ({
  result: { acknowledged: true, status: "processed", transactionId },
});

const fakeNovu = (trigger: Trigger = vi.fn<Trigger>()) => {
  const cancel = vi.fn<NovuLike["cancel"]>().mockResolvedValue({});
  const create = vi
    .fn<NovuLike["subscribers"]["create"]>()
    .mockResolvedValue({});
  const remove = vi
    .fn<NovuLike["subscribers"]["delete"]>()
    .mockResolvedValue({});
  const novu: NovuLike = {
    cancel,
    subscribers: { create, delete: remove },
    trigger,
  };
  return { cancel, create, novu, remove };
};

const welcome = {
  payload: { getStartedUrl: "https://huddlekit.com", name: "Alex" },
  to: "user_2",
  workflow: "welcome",
} as const;

describe(createNotifications, () => {
  it("triggers the workflow with its Novu identifier", async () => {
    const trigger = vi.fn<Trigger>().mockResolvedValue(processed());
    const { novu } = fakeNovu(trigger);

    const result = await createNotifications(novu).send({
      ...welcome,
      actorId: "user_1",
      transactionId: "tx_1",
    });

    expect(result).toStrictEqual({ transactionId: "tx_1" });
    expect(trigger).toHaveBeenCalledWith({
      actor: "user_1",
      payload: welcome.payload,
      to: "user_2",
      transactionId: "tx_1",
      workflowId: "welcome",
    });
  });

  it("rejects when Novu does not process the trigger", async () => {
    const trigger = vi.fn<Trigger>().mockResolvedValue({
      result: { acknowledged: true, status: "no_workflow_steps_defined" },
    });
    const { novu } = fakeNovu(trigger);

    await expect(createNotifications(novu).send(welcome)).rejects.toMatchObject(
      { code: "trigger_rejected" }
    );
  });

  it("wraps transport failures in a NotificationError", async () => {
    const trigger = vi
      .fn<Trigger>()
      .mockRejectedValue(new Error("network down"));
    const { novu } = fakeNovu(trigger);

    const promise = createNotifications(novu).send({
      payload: {
        inviteUrl: "https://huddlekit.com/i/1",
        inviterName: "Sam",
        teamName: "Team",
      },
      to: "user_2",
      workflow: "team-invite",
    });

    await expect(promise).rejects.toBeInstanceOf(NotificationError);
    await expect(promise).rejects.toMatchObject({ code: "trigger_failed" });
  });

  it("upserts and deletes subscribers", async () => {
    const { create, novu, remove } = fakeNovu();
    const notifications = createNotifications(novu);

    await notifications.upsertSubscriber({
      email: "alex@example.com",
      subscriberId: "user_1",
    });
    await notifications.deleteSubscriber("user_1");

    expect(create).toHaveBeenCalledWith({
      email: "alex@example.com",
      subscriberId: "user_1",
    });
    expect(remove).toHaveBeenCalledWith("user_1");
  });

  it("cancels a transaction", async () => {
    const { cancel, novu } = fakeNovu();

    await createNotifications(novu).cancel("tx_1");

    expect(cancel).toHaveBeenCalledWith("tx_1");
  });

  it("reports subscriber failures with their own code", async () => {
    const { create, novu } = fakeNovu();
    create.mockRejectedValue(new Error("boom"));

    await expect(
      createNotifications(novu).upsertSubscriber({ subscriberId: "user_1" })
    ).rejects.toMatchObject({ code: "subscriber_failed" });
  });
});
