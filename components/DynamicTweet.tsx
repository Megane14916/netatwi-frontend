import { Tweet } from "react-tweet";

export default function DynamicTweet({ id }: { id: string }) {
  return <Tweet id={id} />;
}
