import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserProfilePage from "@/app/profile/[screen_name]/page";
import { getProfile } from "@/lib/api/endpoints/profile";
import { setPostBookmark, type BookmarkState } from "@/lib/api/endpoints/posts";
import type { ResultPost, User, UserProfile } from "@/types/domain";

const mockToast = jest.fn();
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 10, name: "User", screenName: "user", profileImageUrl: null, isAdmin: false } }),
}));
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock("@/lib/api/endpoints/profile", () => ({ getProfile: jest.fn(), withdrawCurrentUser: jest.fn() }));
jest.mock("@/lib/api/endpoints/posts", () => ({ setPostBookmark: jest.fn(), setPostLike: jest.fn() }));
jest.mock("@/features/posts/hooks/usePrefetchedComments", () => ({ usePrefetchedComments: () => ({}) }));
jest.mock("@/features/posts/components/result/ResultComments", () => ({ ResultComments: () => null }));
jest.mock("@/components/Twemoji", () => ({ __esModule: true, default: ({ text }: { text: string }) => text }));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

const user: User = { id: 10, name: "User", screenName: "user", profileImageUrl: null, isAdmin: false };
const post: ResultPost = {
  id: 11, content: "ブックマーク対象", images: [], createdAt: "2026-01-01T00:00:00Z",
  score: 1, rank: null, commentCount: 0, hasCommented: false,
  user: { name: "投稿者", screenName: "author", profileImageUrl: null },
  voters: [], bookmarkCount: 3, isBookmarked: true, awards: [], myVotes: 1, isAdvanced: false,
};
const profile: UserProfile = { user, posts: [], bookmarks: [post], likes: [post] };
const deferred = () => {
  let resolve!: (state: BookmarkState) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<BookmarkState>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getProfile).mockResolvedValue(profile);
  jest.mocked(setPostBookmark).mockReset();
});

const removeThenAddAcrossTabs = async () => {
  render(<UserProfilePage params={{ screen_name: "user" }} />);
  await screen.findByRole("heading", { name: "User" });
  fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
  fireEvent.click(screen.getByTitle("ブックマークを外す"));
  expect(screen.getByText("ブックマークした投稿はありません")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "いいね" }));
  fireEvent.click(screen.getByTitle("ブックマーク"));
};

it("waits for removal before sending the add requested after a card remount", async () => {
  const first = deferred();
  const second = deferred();
  jest.mocked(setPostBookmark).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  await removeThenAddAcrossTabs();
  expect(setPostBookmark).toHaveBeenCalledTimes(1);
  expect(setPostBookmark).toHaveBeenNthCalledWith(1, 11, false);

  await act(async () => first.resolve({ isBookmarked: false, bookmarkCount: 2 }));
  expect(setPostBookmark).toHaveBeenCalledTimes(2);
  expect(setPostBookmark).toHaveBeenNthCalledWith(2, 11, true);
  await act(async () => second.resolve({ isBookmarked: true, bookmarkCount: 3 }));
  expect(screen.getByTitle("ブックマークを外す")).toHaveTextContent("3");
  fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
  expect(screen.getByText(post.content)).toBeInTheDocument();
  expect(screen.getByTitle("ブックマークを外す")).toHaveTextContent("3");
});

it("restores the last confirmed removal when the queued add fails", async () => {
  const first = deferred();
  const second = deferred();
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  try {
    jest.mocked(setPostBookmark).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    await removeThenAddAcrossTabs();
    await act(async () => first.resolve({ isBookmarked: false, bookmarkCount: 2 }));
    await act(async () => second.reject(new Error("failed")));
    expect(screen.getByTitle("ブックマーク")).toHaveTextContent("2");
    fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
    expect(screen.getByText("ブックマークした投稿はありません")).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
  } finally {
    consoleError.mockRestore();
  }
});

it("processes different posts independently", async () => {
  const first = deferred();
  const second = deferred();
  jest.mocked(getProfile).mockResolvedValue({ ...profile, bookmarks: [post, { ...post, id: 12 }] });
  jest.mocked(setPostBookmark).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  render(<UserProfilePage params={{ screen_name: "user" }} />);
  await screen.findByRole("heading", { name: "User" });
  fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
  fireEvent.click(screen.getAllByTitle("ブックマークを外す")[0]);
  fireEvent.click(screen.getByTitle("ブックマークを外す"));
  await waitFor(() => expect(setPostBookmark).toHaveBeenCalledTimes(2));
  expect(setPostBookmark).toHaveBeenNthCalledWith(1, 11, false);
  expect(setPostBookmark).toHaveBeenNthCalledWith(2, 12, false);
  await act(async () => {
    first.resolve({ isBookmarked: false, bookmarkCount: 2 });
    second.resolve({ isBookmarked: false, bookmarkCount: 2 });
  });
});
