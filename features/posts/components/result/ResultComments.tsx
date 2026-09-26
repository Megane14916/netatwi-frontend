import CommentList from "@/components/CommentList";
import type { Comment, User } from "@/types/domain";

interface ResultCommentsProps {
  postId: number;
  currentUser: User | null;
  isOpen: boolean;
  initialComments?: Comment[];
  onClose: () => void;
  onAdded: () => void;
  onDeleted: () => void;
}

export function ResultComments(props: ResultCommentsProps) {
  return (
    <CommentList
      postId={props.postId}
      currentUser={props.currentUser}
      contestStatus="closed"
      isOpenProp={props.isOpen}
      initialComments={props.initialComments}
      onClose={props.onClose}
      onCommentAdded={props.onAdded}
      onCommentDeleted={props.onDeleted}
    />
  );
}
