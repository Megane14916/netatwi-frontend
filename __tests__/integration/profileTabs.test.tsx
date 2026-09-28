import { fireEvent, screen } from "@testing-library/react";
import UserProfilePage from "@/app/profile/[screen_name]/page";
import { installApiMock } from "@/__tests__/support/network";
import { renderWithProviders } from "@/__tests__/support/render";
import type { ResultPost } from "@/types/domain";

jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock("@/features/posts/hooks/usePrefetchedComments", () => ({ usePrefetchedComments: () => ({}) }));
jest.mock("@/components/ResultPostCard", () => ({
  __esModule: true,
  default: ({ post }: { post: ResultPost }) => <div>{post.content}</div>,
}));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

const dtoPost = (id: number, content: string) => ({
  post_id: id,
  content,
  created_at: "2026-01-01T00:00:00Z",
  user: { name: "Author", screen_name: "author", profile_image_url: null },
});

it("renders the three profile tabs from mocked API responses", async () => {
  const api = installApiMock();
  try {
    api.reply("GET", "/api/me", {
      logged_in: true,
      user: { id: 10, name: "User", screen_name: "user", profile_image_url: null },
    });
    api.reply("GET", "/api/profile/user", {
      user: { id: 10, name: "User", screen_name: "user", profile_image_url: null },
      posts: [dtoPost(1, "My post")],
      likes: [dtoPost(2, "Liked post")],
      bookmarks: [dtoPost(3, "Saved post")],
    });
    renderWithProviders(<UserProfilePage params={{ screen_name: "user" }} />);

    expect(await screen.findByText("My post")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "いいね" }));
    expect(screen.getByText("Liked post")).toBeInTheDocument();
    expect(screen.queryByText("My post")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
    expect(screen.getByText("Saved post")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ポスト" }));
    expect(screen.getByText("My post")).toBeInTheDocument();
    api.assertDone();
  } finally {
    api.restore();
  }
});
