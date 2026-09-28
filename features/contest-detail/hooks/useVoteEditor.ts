"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/types/domain";
import {
  createInitialVoteState,
  voteEditorReducer,
  type VoteEditorAction,
  type VoteEditorState,
} from "../model/voting";

export const useVoteEditor = (posts: Post[]) => {
  const initialState = useMemo(() => createInitialVoteState(posts), [posts]);
  const [editedState, setEditedState] = useState<VoteEditorState | null>(null);
  const state = editedState ?? initialState;

  const dispatch = (action: VoteEditorAction) => {
    setEditedState((current) => voteEditorReducer(current ?? initialState, action));
  };

  return {
    state,
    dispatch,
  };
};
