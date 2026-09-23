import type { Post } from "@/types/domain";

export type RandomSource = () => number;

export const shufflePostIds = (
  postIds: number[],
  random: RandomSource = Math.random,
): number[] => {
  const shuffled = [...postIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

export const reconcilePostOrder = (
  storedOrder: unknown,
  currentPostIds: number[],
  random: RandomSource = Math.random,
): number[] => {
  const currentIds = new Set(currentPostIds);
  const seen = new Set<number>();
  const retained = Array.isArray(storedOrder)
    ? storedOrder.filter((id): id is number => {
        if (!Number.isInteger(id) || !currentIds.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
    : [];
  const missing = currentPostIds.filter((id) => !seen.has(id));
  return [...retained, ...shufflePostIds(missing, random)];
};

export const sortPostsByOrder = (posts: Post[], postOrder: number[]): Post[] => {
  const order = new Map(postOrder.map((postId, index) => [postId, index]));
  return [...posts].sort(
    (left, right) =>
      (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
};

export type JudgeSortOrder = "original" | "asc" | "desc";

export const sortPostsByScore = (
  posts: Post[],
  votes: Record<number, number>,
  order: JudgeSortOrder,
): Post[] => {
  if (order === "original") return posts;
  const direction = order === "desc" ? -1 : 1;
  return [...posts].sort(
    (left, right) => ((votes[left.id] ?? 0) - (votes[right.id] ?? 0)) * direction,
  );
};
