import Level from "../models/level.model";
import { ClientSession } from "mongoose";

const shuffleNumbers = (numbers: number[]) => {
  const shuffled = [...numbers];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = shuffled[i];
    shuffled[i] = shuffled[j] as number;
    shuffled[j] = current as number;
  }
  return shuffled;
};

const isValidLevelOrder = (order: number[], levelNumbers: number[]) => {
  if (order.length !== levelNumbers.length) {
    return false;
  }

  const orderSet = new Set(order);
  if (orderSet.size !== levelNumbers.length) {
    return false;
  }

  return levelNumbers.every((levelNumber) => orderSet.has(levelNumber));
};

const createInitialLevelOrder = (
  levelNumbers: number[],
  currentLevelIndex: number,
  currentLevelNumber: number | null,
) => {
  if (
    currentLevelNumber !== null &&
    currentLevelIndex >= 1 &&
    currentLevelIndex <= levelNumbers.length
  ) {
    const remaining = shuffleNumbers(
      levelNumbers.filter((levelNumber) => levelNumber !== currentLevelNumber),
    );
    remaining.splice(currentLevelIndex - 1, 0, currentLevelNumber);
    return remaining;
  }

  return shuffleNumbers(levelNumbers);
};

export const ensureUserLevelOrder = async (
  user: any,
  session: ClientSession | null = null,
) => {
  const levelsQuery = Level.find().select("levelNumber -_id").lean();
  if (session) {
    levelsQuery.session(session);
  }
  const levels = await levelsQuery;
  const levelNumbers = levels
    .map((level) => level.levelNumber)
    .sort((a, b) => a - b);

  if (levelNumbers.length === 0) {
    return [];
  }

  const existingOrder = Array.isArray(user.levelOrder) ? user.levelOrder : [];
  if (isValidLevelOrder(existingOrder, levelNumbers)) {
    return existingOrder;
  }

  const currentLevelIndex =
    typeof user.currentLevel === "number" && user.currentLevel > 0
      ? user.currentLevel
      : 1;
  const currentLevelNumber = levelNumbers.includes(user.currentLevel)
    ? user.currentLevel
    : null;

  user.levelOrder = createInitialLevelOrder(
    levelNumbers,
    currentLevelIndex,
    currentLevelNumber,
  );
  if (session) {
    await user.save({ session });
  } else {
    await user.save();
  }

  return user.levelOrder;
};

export const getMappedLevelNumber = (user: any, levelOrder: number[]) => {
  const currentLevelIndex = user.currentLevel - 1;

  if (currentLevelIndex < 0 || currentLevelIndex >= levelOrder.length) {
    return null;
  }

  return levelOrder[currentLevelIndex];
};
