import { act, fireEvent, render, screen } from '@testing-library/react';
import ResultPostCard from '@/components/ResultPostCard';
import { setPostBookmark, setPostLike } from '@/lib/api/endpoints/posts';

jest.mock('@/components/Twemoji', () => ({ text }: { text: string }) => text);
jest.mock('@/lib/api/endpoints/posts', () => ({ setPostBookmark: jest.fn(), setPostLike: jest.fn() }));
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));

const mockPost = {
  id: 1,
  content: 'テスト投稿',
  images: [],
  user: {
    screenName: 'testuser',
    name: 'Test User',
    profileImageUrl: 'http://example.com/image.jpg'
  },
  createdAt: '2026-05-24T10:00:00Z',
  score: 150,
  rank: 1,
  commentCount: 0,
  hasCommented: false,
  bookmarkCount: 0,
  isBookmarked: false,
  voters: [],
  awards: [],
  myVotes: null,
  isAdvanced: false,
};

describe('ResultPostCard Component', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should render post content and user name', () => {
    render(
      <ResultPostCard
        post={mockPost}
        currentUser={{
          id: 2,
          screenName: 'currentUser',
          name: 'Current User',
          profileImageUrl: null,
          isAdmin: false,
        }}
        contestScoringMethod="general"
      />
    );
    
    expect(screen.getByText('テスト投稿')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('1位')).toBeInTheDocument();
  });

  it('optimistically likes a judge-scored post and rolls back on failure', async () => {
    let reject!: (error: Error) => void;
    jest.mocked(setPostLike).mockReturnValue(new Promise((_, rejectPromise) => { reject = rejectPromise; }));
    render(<ResultPostCard post={mockPost} currentUser={{
      id: 2, screenName: 'viewer', name: 'Viewer', profileImageUrl: null, isAdmin: false,
    }} contestScoringMethod="judge" />);
    fireEvent.click(screen.getByTitle('いいね'));
    expect(screen.getByTitle('いいね')).toHaveTextContent('1');
    expect(setPostLike).toHaveBeenCalledWith(1, true);
    await act(async () => reject(new Error('failed')));
    expect(screen.getByTitle('いいね')).toHaveTextContent('0');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('optimistically bookmarks a post and rolls back on failure', async () => {
    let reject!: (error: Error) => void;
    jest.mocked(setPostBookmark).mockReturnValue(new Promise((_, rejectPromise) => { reject = rejectPromise; }));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(<ResultPostCard post={mockPost} currentUser={{
        id: 2, screenName: 'viewer', name: 'Viewer', profileImageUrl: null, isAdmin: false,
      }} contestScoringMethod="judge" />);
      fireEvent.click(screen.getByTitle('ブックマーク'));
      expect(screen.getByTitle('ブックマークを外す')).toHaveTextContent('1');
      expect(setPostBookmark).toHaveBeenCalledWith(1, true);
      await act(async () => reject(new Error('failed')));
      expect(screen.getByTitle('ブックマーク')).toHaveTextContent('0');
    } finally {
      consoleError.mockRestore();
    }
  });
});
