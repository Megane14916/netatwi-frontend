import { render, screen } from '@testing-library/react';
import ResultPostCard from '@/components/ResultPostCard';

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
        currentUser={{ screen_name: 'currentUser' }}
        contestScoringMethod="general"
      />
    );
    
    expect(screen.getByText('テスト投稿')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('1位')).toBeInTheDocument();
  });
});
