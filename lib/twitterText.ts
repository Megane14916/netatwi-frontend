import twitter from 'twitter-text';

export interface TextCountResult {
  length: number;
  permillage: number;
  isValid: boolean;
  remaining: number;
}

/**
 * Twitter(X)の文字数カウントルールに従ってテキストをカウント
 * - 日本語・中国語・韓国語は2文字としてカウント
 * - URLは23文字固定
 * - 最大280文字（重み付き）
 */
export const countText = (text: string): TextCountResult => {
  try {
    const result = twitter.parseTweet(text);
    return {
      length: result.weightedLength,
      permillage: result.permillage,
      isValid: result.valid,
      remaining: 280 - result.weightedLength
    };
  } catch {
    // フォールバック処理
    return countTextFallback(text);
  }
};

/**
 * twitter-textライブラリが使えない場合のフォールバック
 */
const countTextFallback = (text: string): TextCountResult => {
  // URLを23文字に置換して計算
  const urlRegex = /https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+/g;
  const processedText = text.replace(urlRegex, 'x'.repeat(23));
  
  let length = 0;
  for (let i = 0; i < processedText.length; i++) {
    const charCode = processedText.charCodeAt(i);
    // 半角英数字・半角記号・改行などは1、それ以外(全角)は2
    if ((charCode >= 0x00 && charCode <= 0x80) || (charCode === 0xf8f0) || (charCode >= 0xff61 && charCode <= 0xff9f)) {
      length += 1;
    } else {
      length += 2;
    }
  }
  
  const max = 280;
  const permillage = Math.floor((length / max) * 1000);
  return {
    length: length,
    permillage: permillage,
    isValid: length > 0 && length <= max,
    remaining: max - length
  };
};

export default countText;
