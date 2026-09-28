import type { ResultPost } from "./post";
import type { User } from "./user";

export interface UserProfile {
  user: User;
  posts: ResultPost[];
  bookmarks: ResultPost[];
  likes: ResultPost[];
}
