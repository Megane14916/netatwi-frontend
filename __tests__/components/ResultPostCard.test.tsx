import { render, screen } from '@testing-library/react';
import ResultPostCard from '@/components/ResultPostCard';

jest.mock('@/components/Twemoji', () => ({ text }: { text: string }) => text);

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
});
