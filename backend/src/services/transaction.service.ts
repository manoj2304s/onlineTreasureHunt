import mongoose, { ClientSession } from "mongoose";

const isTransactionUnsupportedError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Transaction numbers are only allowed on a replica set") ||
    message.includes("not supported") ||
    message.includes("replica set member or mongos")
  );
};

export const runWithOptionalTransaction = async <T>(
  operation: (session: ClientSession | null) => Promise<T>,
) => {
  const session = await mongoose.startSession();

  try {
    let execution: T | undefined;
    await session.withTransaction(async () => {
      execution = await operation(session);
    });

    if (execution === undefined) {
      throw new Error("Transaction execution did not produce a result");
    }
    return execution;
  } catch (error) {
    if (isTransactionUnsupportedError(error)) {
      return operation(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
