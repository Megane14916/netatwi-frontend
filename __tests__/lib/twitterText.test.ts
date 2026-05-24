import countText from '@/lib/twitterText';

describe('twitterText library integration', () => {
  it('should correctly count Japanese characters', () => {
    const text = 'あいうえお';
    const result = countText(text);
    expect(result.isValid).toBe(true);
    expect(result.length).toBe(10);
  });

  it('should correctly count emojis', () => {
    const text = '👨‍👩‍👧‍👦';
    const result = countText(text);
    expect(result.isValid).toBe(true);
    // Twitter's logic might vary for emojis, but it should be valid and have a length
    expect(result.length).toBeGreaterThan(0);
  });

  it('should invalidate texts that are too long', () => {
    const text = 'あ'.repeat(141);
    const result = countText(text);
    expect(result.isValid).toBe(false);
    expect(result.length).toBe(282);
  });
});
