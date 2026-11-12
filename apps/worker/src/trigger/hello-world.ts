import { logger, task, wait } from "@trigger.dev/sdk";

const SIMULATED_WORK_SECONDS = 2;

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { name?: string }) => {
    const name = payload.name ?? "world";
    logger.info(`Hello, ${name}!`);

    await wait.for({ seconds: SIMULATED_WORK_SECONDS });

    return { message: `Hello, ${name}!` };
  },
});
