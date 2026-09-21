import { render, screen } from '@testing-library/react';
import ResultPostCard from '@/components/ResultPostCard';

jest.mock('@/components/Twemoji', () => ({ text }: { text: string }) => text);

const mockPost = {
  post_id: 1,
  content: 'テスト投稿',
  user: {
    screen_name: 'testuser',
    name: 'Test User',
    profile_image_url: 'http://example.com/image.jpg'
  },
  created_at: '2026-05-24T10:00:00Z',
  score: 150,
  rank: 1,
  bookmarkCount: 0,
  isBookmarked: false,
  voters: []
};

describe('ResultPostCard Component', () => {
  it('should render post content and user name', () => {
    render(
      <ResultPostCard
        post={mockPost}
        currentUser={{
          id: 2,
          screen_name: 'currentUser',
          name: 'Current User',
          profile_image_url: null,
        }}
        contestScoringMethod="general"
      />
    );
    
    expect(screen.getByText('テスト投稿')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('1位')).toBeInTheDocument();
  });
});
