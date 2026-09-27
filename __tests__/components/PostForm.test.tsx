import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PostForm from "@/components/venue/PostForm";
import { updatePost } from "@/lib/api/endpoints/posts";
import { getContest, getContestPosts } from "@/lib/api/endpoints/contests";
import type { Contest, Post } from "@/types/domain";

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 10, name: "投稿者", screenName: "author", profileImageUrl: null, isAdmin: false } }),
}));
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock("@/lib/api/endpoints/posts", () => ({
  createPost: jest.fn(), updatePost: jest.fn(), deletePost: jest.fn(),
}));
jest.mock("@/lib/api/endpoints/contests", () => ({ getContest: jest.fn(), getContestPosts: jest.fn() }));
jest.mock("@/lib/imageCompression", () => ({ compressImage: jest.fn((file: File) => Promise.resolve(file)) }));
jest.mock("@/features/posts/components/MyPostDisplay", () => ({
  MyPostDisplay: ({ isEditing, onStartEdit }: { isEditing: boolean; onStartEdit: () => void }) =>
    isEditing ? null : <button onClick={onStartEdit}>編集する</button>,
}));
jest.mock("@/components/RichTextEditor", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLTextAreaElement, { content: string; onChange: (content: string) => void }>(
      function Editor({ content, onChange }, ref) {
        return <textarea ref={ref} aria-label="本文" value={content} onChange={event => onChange(event.target.value)} />;
      },
    ),
  };
});

const contest: Contest = {
  id: 1, name: "大会", theme: null, hasTheme: false, hasQualifier: false,
  type: "daily", parentContestId: null,
  startTime: "2026-01-01T00:00:00Z", endTime: "2099-01-01T00:00:00Z", votingEndTime: "2099-01-02T00:00:00Z",
  totalPosters: 1, totalVoters: 0, totalJudges: 0,
  scoringMethod: "general", imageRule: "optional", isVotingVisible: true,
  advancementNumerator: null, advancementDenominator: null, judgeAwardAdvancement: false,
  generalVoteWeight: 1, judgeMaxScore: 10, isAdvancedToFinal: null,
  resultCommentTop: null, resultCommentBottom: null, postCount: 1,
};
const savedPost: Post = {
  id: 1, userId: 10, content: "保存済み本文", images: ["https://example.com/saved.png"],
  createdAt: "2026-01-01T00:00:00Z", myVotes: null, myJudgeAward: false,
  myJudgeComment: null, hasCommented: false, commentCount: 0,
};

const revokeObjectURL = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn(() => "blob:new-image") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  jest.mocked(updatePost).mockResolvedValue({ ...savedPost, content: "編集中の本文" });
  jest.mocked(getContest).mockReset();
  jest.mocked(getContestPosts).mockReset();
});

it("preserves unsaved text, removed images and added files when the post list revalidates", async () => {
  const view = render(<PostForm contestId={1} providedContest={contest} providedPosts={[savedPost]} />);
  fireEvent.click(screen.getByRole("button", { name: "編集する" }));
  expect(screen.getByRole("textbox", { name: "本文" })).toHaveValue(savedPost.content);
  fireEvent.change(screen.getByRole("textbox", { name: "本文" }), { target: { value: "編集中の本文" } });

  const oldPreview = screen.getByAltText("preview");
  fireEvent.click(oldPreview.parentElement!.querySelector("button")!);
  const file = new File(["new image"], "new.png", { type: "image/png" });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText("preview")).toHaveAttribute("src", "blob:new-image"));

  view.rerender(<PostForm contestId={1} providedContest={{ ...contest, postCount: 2 }} providedPosts={[
    { ...savedPost, images: [...savedPost.images] },
    { ...savedPost, id: 2, userId: 20, content: "他の人の新規投稿" },
  ]} />);
  expect(screen.getByRole("textbox", { name: "本文" })).toHaveValue("編集中の本文");
  expect(screen.getAllByAltText("preview")).toHaveLength(1);
  expect(screen.getByAltText("preview")).toHaveAttribute("src", "blob:new-image");
  expect(revokeObjectURL).not.toHaveBeenCalledWith("blob:new-image");

  fireEvent.click(screen.getByRole("button", { name: "更新する" }));
  await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
  const [contestId, postId, data, userId] = jest.mocked(updatePost).mock.calls[0];
  expect([contestId, postId, userId]).toEqual([1, 1, 10]);
  expect(data.get("content")).toBe("編集中の本文");
  expect(data.get("kept_images")).toBe("[]");
  expect(data.getAll("images")).toEqual([file]);
  await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
});

it("loads the latest saved post when cancelling and starting a new edit", () => {
  const view = render(<PostForm contestId={1} providedContest={contest} providedPosts={[savedPost]} />);
  fireEvent.click(screen.getByRole("button", { name: "編集する" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "未保存の本文" } });
  const updated = { ...savedPost, content: "別画面で保存された本文", images: ["https://example.com/updated.png"] };
  view.rerender(<PostForm contestId={1} providedContest={contest} providedPosts={[updated]} />);
  expect(screen.getByRole("textbox")).toHaveValue("未保存の本文");
  fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
  fireEvent.click(screen.getByRole("button", { name: "編集する" }));
  expect(screen.getByRole("textbox")).toHaveValue(updated.content);
  expect(screen.getByAltText("preview")).toHaveAttribute("src", updated.images[0]);
});

it("keeps the required-image restriction when fetching posts fails", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  try {
    jest.mocked(getContest).mockResolvedValue({ ...contest, imageRule: "required" });
    jest.mocked(getContestPosts).mockRejectedValue(new Error("posts failed"));
    render(<PostForm contestId={1} />);
    const editor = await screen.findByRole("textbox", { name: "本文" });
    fireEvent.change(editor, { target: { value: "画像なしの本文" } });
    expect(screen.getByRole("button", { name: "投稿する" })).toBeDisabled();
    expect(getContestPosts).toHaveBeenCalledWith(1);
  } finally {
    consoleError.mockRestore();
  }
});

it("keeps the final-round eligibility restriction when fetching posts fails", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  try {
    jest.mocked(getContest).mockResolvedValue({ ...contest, isAdvancedToFinal: false, parentContestId: 2 });
    jest.mocked(getContestPosts).mockRejectedValue(new Error("posts failed"));
    render(<PostForm contestId={1} isFinalRound />);
    await screen.findByText("予選通過者のみ投稿できます。");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "投稿する" })).not.toBeInTheDocument();
  } finally {
    consoleError.mockRestore();
  }
});
