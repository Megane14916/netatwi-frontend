"use client";

import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Smile,
  Heart,
  Info,
  CheckCircle,
  Trophy,
  ShieldCheck,
  Clock,
  X,
  User,
  Users,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Award,
  Image as ImageIcon,
  UserStar,
  Share2,
  Edit2,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import TimeAgo from "@/components/TimeAgo";
import EmojiPicker, {
  EmojiClickData,
  Theme,
  EmojiStyle,
  SkinTonePickerLocation,
} from "emoji-picker-react";
import Twemoji from "@/components/Twemoji";
import dayjs from "dayjs";
import JudgeLoginButton from "@/components/venue/JudgeLoginButton";
import PostForm from "@/components/venue/PostForm";
import ImageGrid from "@/components/ImageGrid";
import ResultPostCard from "@/components/ResultPostCard";
import CommentList from "@/components/CommentList";
import RichTextEditor, {
  RichTextEditorHandle,
} from "@/components/RichTextEditor";
import ProgressRing from "@/components/ProgressRing";
import { countText, TextCountResult } from "@/lib/twitterText";

const API_PREFIX = "";

// --- 型定義 ---
interface Contest {
  id: number;
  name: string;
  theme: string | null;
  hasTheme: boolean;
  hasQualifier: boolean;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  generalVoteWeight: number;
  judgeMaxScore: number;
  imageRule: string;
  isVotingVisible: boolean;
  advancementNumerator?: number | null;
  advancementDenominator?: number | null;
  parentContestId?: number;
  isAdvancedToFinal?: boolean | null;
  scoringMethod: string;
  type: string;
  resultCommentTop?: string | null;
  resultCommentBottom?: string | null;
}

interface Post {
  id: number;
  content: string;
  images?: string[]; // 画像URLリスト
  created_at: string;
  user_id: number;
  myVotes: number;
  myJudgeAward?: boolean;
  myJudgeComment?: string | null;
  hasCommented?: boolean;
}

interface Voter {
  screen_name: string;
  name: string;
  count: number;
  is_judge: boolean;
}

interface JudgeObj {
  screen_name: string;
  name: string;
  profile_image_url: string | null;
}

interface ResultPost {
  rank: number | null;
  post_id: number;
  content: string;
  images?: string[];
  created_at: string;
  score: number;
  user: {
    screen_name: string;
    name: string;
    profile_image_url: string | null;
  };
  voters: Voter[];
  bookmarkCount: number;
  isBookmarked: boolean;
  awards: string[];
  is_advanced?: boolean;
}

interface JudgeAwardResult {
  judge: JudgeObj;
  comment: string | null;
  post: {
    post_id: number;
    content: string;
    images?: string[];
    user: {
      screen_name: string;
      name: string;
      profile_image_url: string | null;
    };
    created_at: string;
  };
}

type ContestStatus = "upcoming" | "ongoing" | "voting" | "closed";

// --- UIコンポーネント ---

// 画像グリッドコンポーネント

const GeneralVoteButton = ({
  postId,
  isLiked,
  onToggle,
  disabled,
}: {
  postId: number;
  isLiked: boolean;
  onToggle: (postId: number, val: number) => void;
  disabled: boolean;
}) => (
  <button
    onClick={() => onToggle(postId, isLiked ? 0 : 1)}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-all group ${
      isLiked
        ? "text-pink-500 bg-pink-50 dark:bg-pink-900/40 border border-pink-200 dark:border-pink-800"
        : "text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/40 hover:text-pink-500 border border-transparent hover:border-pink-200 dark:hover:border-pink-800 active:bg-pink-50 dark:active:bg-pink-900/40 active:text-pink-500"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? "fill-current" : ""}`} />
    <span className="text-xs md:text-sm font-bold">{isLiked ? "いいね！" : "いいね"}</span>
  </button>
);

const JudgeVoteSelector = ({
  postId,
  currentScore,
  onSelect,
  disabled,
  maxScore,
}: {
  postId: number;
  currentScore: number;
  onSelect: (postId: number, val: number) => void;
  disabled: boolean;
  maxScore: number;
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 inline-flex flex-col justify-center">
      <div className="flex justify-between items-center mb-1.5 px-1 gap-3">
        <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> 審査員評価
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">満点: {maxScore}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max={maxScore}
          step="0.1"
          value={currentScore || ""}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onSelect(postId, isNaN(val) ? 0 : Math.min(val, maxScore));
          }}
          disabled={disabled}
          className="w-20 bg-white dark:bg-black border border-indigo-200 rounded-lg px-2 py-1 text-right text-black dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm"
          placeholder="0"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">点</span>
      </div>
    </div>
  );
};

const JudgeAwardSelector = ({
  postId,
  isSelected,
  onSelect,
  comment,
  onCommentChange,
  disabled,
}: {
  postId: number;
  isSelected: boolean;
  onSelect: (postId: number) => void;
  comment: string;
  onCommentChange: (val: string) => void;
  disabled: boolean;
}) => (
  <div className="mt-4 px-1 border-t border-gray-200 dark:border-gray-800 pt-4 w-full">
    <label
      className={`flex items-center cursor-pointer ${disabled ? "opacity-50" : ""} group`}
    >
      <input
        type="radio"
        name="judgeAward"
        checked={isSelected}
        onChange={() => onSelect(postId)}
        disabled={disabled}
        className="w-4 h-4 text-yellow-500 border-gray-300 dark:border-gray-700 focus:ring-yellow-500 flex-shrink-0 cursor-pointer"
      />
      <span
        className={`ml-2 text-xs font-bold flex items-center transition-colors ${isSelected ? "text-yellow-600" : "text-gray-500 dark:text-gray-400 group-hover:text-yellow-600"}`}
      >
        <Trophy className="w-3.5 h-3.5 mr-1" /> 審査員賞に選ぶ
      </span>
    </label>
    {isSelected && (
      <div className="mt-3 w-full animate-fade-in">
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="選評コメントを入力してください..."
          className="w-full bg-white dark:bg-black border border-yellow-300 rounded-lg p-3 text-sm text-black dark:text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm resize-y min-h-[80px]"
          disabled={disabled}
        />
      </div>
    )}
  </div>
);

// 自分の投稿表示用
const MyPostDisplay = ({
  post,
  isEditing,
  onStartEdit,
  isDeadlinePassed,
  user,
}: any) => (
  <div className={`mb-4 ${isEditing ? "pb-4 border-b border-gray-200 dark:border-gray-800" : ""}`}>
    <div className="flex items-start gap-3">
      <div className="flex-none">
        <img
          src={user?.profile_image_url || "https://via.placeholder.com/40"}
          alt={user?.screen_name}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover bg-white dark:bg-black"
          onError={(e) =>
            (e.currentTarget.src = "https://via.placeholder.com/40")
          }
        />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="font-bold text-black dark:text-white mr-1">
              {user?.name || user?.screen_name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">@{user?.screen_name}</span>
          </div>
          <TimeAgo timestamp={post.created_at} />
        </div>
        <div className="mt-1 text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap">
          <Twemoji text={post.content} />
        </div>
        {post.images && (
          <div className="mt-2">
            <ImageGrid images={post.images} />
          </div>
        )}
      </div>
    </div>
    {!isEditing && !isDeadlinePassed && (
      <div className="text-right mt-3 pt-3">
        <button
          onClick={onStartEdit}
          className="text-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 px-3 py-1.5 rounded-full transition-colors inline-flex items-center justify-end ml-auto gap-1 font-bold"
        >
          <Edit2 className="w-4 h-4 fill-current" /> 編集する
        </button>
      </div>
    )}
    {!isEditing && isDeadlinePassed && (
      <div className="text-right mt-3 pt-3 text-xs text-red-500 flex justify-end items-center font-bold">
        {" "}
        <Clock className="w-3.5 h-3.5 mr-1" /> 編集受付終了{" "}
      </div>
    )}
  </div>
);

export default function VenueDetailPage() {
  const params = useParams();
  const contestId = parseInt(params?.id as string, 10);
  const { user, judgeContests, refetchUser } = useAuth();

  const [contest, setContest] = useState<Contest | null>(null);
  const [contestStatus, setContestStatus] = useState<ContestStatus | null>(
    null,
  );
  const [posts, setPosts] = useState<Post[]>([]);

  const [results, setResults] = useState<ResultPost[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "random">("desc");
  const [sortedResults, setSortedResults] = useState<ResultPost[]>([]);
  const [judgeAwardsResults, setJudgeAwardsResults] = useState<
    JudgeAwardResult[]
  >([]);

  useEffect(() => {
    let newResults = [...results];
    if (sortOrder === "desc") {
      newResults.reverse();
    } else if (sortOrder === "random") {
      newResults.sort(() => Math.random() - 0.5);
    }
    setSortedResults(newResults);
  }, [results, sortOrder]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPosters, setTotalPosters] = useState<number | null>(null);
  const [totalVoters, setTotalVoters] = useState<number | null>(null);
  const [totalJudges, setTotalJudges] = useState<number | null>(null);

  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [hasPosted, setHasPosted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 画像アップロード用
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [votes, setVotes] = useState<{ [postId: number]: number }>({});
  const [judgeAwardSelection, setJudgeAwardSelection] = useState<{
    postId: number | null;
    comment: string;
  }>({ postId: null, comment: "" });

  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
  const [voteSubmitMessage, setVoteSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPostDeadlineExceeded, setIsPostDeadlineExceeded] = useState(false);
  const [isVoteDeadlineExceeded, setIsVoteDeadlineExceeded] = useState(false);

  const [resultTab, setResultTab] = useState<"ranking" | "awards">("ranking");

  const isJudgeMode = judgeContests.includes(contestId);

  const isVotePeriod = !isVoteDeadlineExceeded && contestStatus === "voting";
  const canVote = contestStatus === "voting" && user;
  const showVoteUI =
    contestStatus === "voting" &&
    ((contest?.scoringMethod !== "judge" && user) || isJudgeMode);
  const voteUIDisabled = false;
  const isVoteSubmitDisabled = isSubmittingVotes || isVoteDeadlineExceeded;

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [hideJudgeBanner, setHideJudgeBanner] = useState(false);

  // 文字数カウント状態を追加
  const [textCount, setTextCount] = useState<TextCountResult>({
    length: 0,
    permillage: 0,
    isValid: false,
    remaining: 280,
  });
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [sessionCommentedPosts, setSessionCommentedPosts] = useState<
    Record<number, boolean>
  >({});
  const toggleComments = (postId: number) =>
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  const handleCommentAdded = (postId: number) =>
    setSessionCommentedPosts((prev) => ({ ...prev, [postId]: true }));
  const handleCommentDeleted = (postId: number) =>
    setSessionCommentedPosts((prev) => ({ ...prev, [postId]: false }));

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const editorRef = useRef<RichTextEditorHandle>(null);

  // 文字数カウントの更新
  useEffect(() => {
    setTextCount(countText(newPostContent));
  }, [newPostContent]);

  const maxTotalScore = useMemo(() => {
    if (!contest || !results || results.length === 0) return 0;

    // 投票した審査員のユニーク数をカウント
    const uniqueJudges = new Set<string>();
    results.forEach((post) => {
      post.voters.forEach((voter) => {
        if (voter.is_judge) uniqueJudges.add(voter.screen_name);
      });
    });

    return (
      uniqueJudges.size * contest.judgeMaxScore + contest.generalVoteWeight
    );
  }, [contest, results]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("voted") === "true") {
        setShowSuccessBanner(true);
        // URLをクリーンにする
        window.history.replaceState({}, "", window.location.pathname);
        // 数秒後にバナーを消す
        setTimeout(() => setShowSuccessBanner(false), 5000);
      }
    }
  }, []);

  // 絵文字ピッカーの外側クリック検知
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // 画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalImages = selectedImages.length + files.length;
      if (totalImages > 4) {
        alert("画像は最大4枚までです。");
        return;
      }

      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);

      // プレビューURL生成
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviews]);
    }
  };

  // 画像削除処理
  const removeImage = (index: number) => {
    const targetUrl = previewUrls[index];

    // 1. previewUrls から削除 (非破壊的)
    setPreviewUrls((prev) => {
      const newArr = prev.filter((_, i) => i !== index);
      return newArr;
    });

    // 2. Blobだった場合 (新規画像)、selectedImages からも対応するファイルを削除
    if (targetUrl.startsWith("blob:")) {
      // targetUrlがプレビュー内の何番目のBlobかを探す
      // (URL.createObjectURL で生成されたURLは一意なので、それを使って特定も可能だが、
      //  selectedImagesにはURL情報がないので、インデックスで同期をとる必要がある)

      // 削除前の配列において、index番目より前にあるBlobの数を数える
      const blobIndex = previewUrls
        .slice(0, index)
        .filter((u) => u.startsWith("blob:")).length;

      setSelectedImages((prev) => {
        const newArr = [...prev];
        newArr.splice(blobIndex, 1);
        return newArr;
      });

      URL.revokeObjectURL(targetUrl); // メモリ解放
    }
  };

  // データ取得
  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
        setVoteSubmitMessage(null);
        setUserHasVoted(false);
        setPosts([]);
        setResults([]);
        setHasPosted(false);
        setIsEditing(false);
        setTotalPosters(null);
        setTotalVoters(null);
        setTotalJudges(null);
      }

      const contestRes = await fetch(
        `${API_PREFIX}/api/contests/${contestId}`,
        { credentials: "include" },
      );
      if (!contestRes.ok) throw new Error("大会情報の取得に失敗しました");
      const contestData = await contestRes.json();
      setContest(contestData);

      const now = new Date();
      const startTime = new Date(contestData.startTime);
      const endTime = new Date(contestData.endTime);
      const votingEndTime = new Date(contestData.votingEndTime);
      let currentStatus: ContestStatus = "closed";
      if (now < startTime) currentStatus = "upcoming";
      else if (now >= startTime && now < endTime) currentStatus = "ongoing";
      else if (now >= endTime && now < votingEndTime) currentStatus = "voting";
      setContestStatus(currentStatus);

      setIsPostDeadlineExceeded(now >= endTime);
      setIsVoteDeadlineExceeded(now >= votingEndTime);

      if (currentStatus === "closed") {
        const resultsRes = await fetch(
          `${API_PREFIX}/api/contests/${contestId}/results`,
          { credentials: "include" },
        );
        if (!resultsRes.ok) throw new Error("結果の取得に失敗しました。");
        const resultsData = await resultsRes.json();
        setResults(resultsData.results || []);
        setJudgeAwardsResults(resultsData.judgeAwards || []);
        setTotalPosters(resultsData.totalPosters);
        setTotalVoters(resultsData.totalVoters);
        setTotalJudges(resultsData.totalJudges);
        // if (resultsData.judgeAwards && resultsData.judgeAwards.length > 0) setResultTab('awards');
      } else {
        const postsRes = await fetch(
          `${API_PREFIX}/api/contests/${contestId}/posts`,
          { credentials: "include", cache: "no-store" },
        );
        if (!postsRes.ok) throw new Error("投稿一覧の取得に失敗しました");
        const postsData = await postsRes.json();
        const allPosts: Post[] = postsData.posts;
        setUserHasVoted(postsData.userHasVotedInContest);
        setTotalPosters(postsData.totalPosters);

        if (user) {
          const myPost = allPosts.find((p) => p.user_id === user.id);
          if (myPost) {
            setHasPosted(true);
            if (currentStatus === "ongoing") {
              setPosts([myPost]);
              setNewPostContent(myPost.content);
            }
          } else {
            setHasPosted(false);
            if (currentStatus === "ongoing") {
              setPosts([]);
            }
          }
          if (currentStatus === "voting") {
            const shuffled = [...allPosts].sort(() => Math.random() - 0.5);
            setPosts(shuffled);
            const initialVotes: { [key: number]: number } = {};
            let currentTotal = 0;

            // 審査員賞の復元ロジック
            let awardPostId: number | null = null;
            let awardComment = "";

            shuffled.forEach((post) => {
              const voteVal = post.myVotes || 0;
              initialVotes[post.id] = voteVal;
              currentTotal += voteVal;

              // APIから返ってきた審査員賞情報をStateにセット
              if (post.myJudgeAward) {
                awardPostId = post.id;
                awardComment = post.myJudgeComment || "";
              }
            });
            setVotes(initialVotes);
            setTotalVotes(currentTotal);
            if (awardPostId) {
              setJudgeAwardSelection({
                postId: awardPostId,
                comment: awardComment,
              });
            }
          }
        } else {
          if (currentStatus === "voting") {
            const shuffled = [...allPosts].sort(() => Math.random() - 0.5);
            setPosts(shuffled);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) fetchData();
  }, [contestId, user]);

  // 集計中の自動リロード用タイマー
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const isAggregating = contestStatus === "closed" && results.length > 0 && results.some((r) => r.rank === null);

    if (isAggregating) {
      intervalId = setInterval(() => {
        fetchData(true);
      }, 10000); // 10秒に1回
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [contestStatus, results, contestId]);

  useEffect(() => {
    if (!contest) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setIsPostDeadlineExceeded(now >= new Date(contest.endTime));
      setIsVoteDeadlineExceeded(now >= new Date(contest.votingEndTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  const handleStartEdit = () => {
    if (posts.length > 0) {
      const post = posts[0];
      setNewPostContent(post.content);
      setPreviewUrls(post.images || []);
      setSelectedImages([]); // 新規追加分はリセット
      setIsEditing(true);
    }
  };

  // 投稿処理 (FormDataを使用)
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostDeadlineExceeded) return;

    // 文字数チェック
    const check = countText(newPostContent);
    if (!check.isValid && newPostContent.trim().length > 0) {
      alert("文字数制限（280文字）を超えています");
      return;
    }

    // 画像必須チェック
    if (
      contest?.imageRule === "required" &&
      previewUrls.length === 0 &&
      selectedImages.length === 0
    ) {
      alert("画像を1枚以上添付してください");
      return;
    }

    // エディタの内容は state (newPostContent) に同期されている前提
    if ((!newPostContent.trim() && previewUrls.length === 0) || !user) return;

    setIsSubmitting(true);
    setPostError(null);
    const url = isEditing
      ? `${API_PREFIX}/api/contests/${contestId}/posts/${posts[0]?.id}`
      : `${API_PREFIX}/api/contests/${contestId}/posts`;
    const method = isEditing ? "PUT" : "POST";

    const formData = new FormData();
    formData.append("content", newPostContent);

    if (isEditing) {
      // Blob以外のURL（=既存の画像）のみをリスト化して送信
      const keptImages = previewUrls.filter((url) => !url.startsWith("blob:"));
      formData.append("kept_images", JSON.stringify(keptImages));
    }
    selectedImages.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch(url, {
        method,
        body: formData, // JSONではなくFormDataを送信
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "投稿に失敗しました");
      }
      const data = await res.json();
      const updatedPost = { ...data, user_id: user.id };

      setNewPostContent("");
      setSelectedImages([]);
      setPreviewUrls([]);
      setPosts([updatedPost]);
      setHasPosted(true);
      setIsEditing(false);
      setPostError(null);
      alert("投稿しました！");
    } catch (err: any) {
      setPostError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    // ref経由でエディタに絵文字画像を挿入
    if (editorRef.current) {
      editorRef.current.insertEmoji(emojiData.emoji);
    } else {
      // フォールバック (textarea使用時など)
      setNewPostContent((prev) => prev + emojiData.emoji);
    }
  };

  const handleVoteChange = (postId: number, newCount: number) => {
    // 変更点: 一般投票でも再投票可能にするため、userHasVoted チェックを削除
    setVotes((prev) => {
      const updated = { ...prev, [postId]: newCount };
      setTotalVotes(Object.values(updated).reduce((sum, c) => sum + c, 0));
      return updated;
    });
    setVoteSubmitMessage(null);
  };

  const handleJudgeAwardSelect = (postId: number) => {
    setJudgeAwardSelection((prev) =>
      prev.postId === postId
        ? { postId: null, comment: "" }
        : { postId, comment: "" },
    );
  };
  const handleJudgeCommentChange = (val: string) => {
    setJudgeAwardSelection((prev) => ({ ...prev, comment: val }));
  };

  const handleSubmitVotes = async () => {
    if (isVoteDeadlineExceeded) {
      alert("終了しました。");
      return;
    }
    if (!confirm("投票を確定しますか？")) return;
    setIsSubmittingVotes(true);
    setVoteSubmitMessage(null);
    const payload: any = { votes };
    if (isJudgeMode && judgeAwardSelection.postId)
      payload.judgeAward = judgeAwardSelection;
    try {
      const response = await fetch(
        `${API_PREFIX}/api/contests/${contestId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );
      const data = await response.json();
      if (response.ok) {
        setUserHasVoted(true);
        setShowSuccessBanner(true);
        setVoteSubmitMessage({ type: "success", text: "投票が完了しました！" });
        if (isJudgeMode) alert("投票と審査員賞を保存しました！");
        else setTimeout(() => setShowSuccessBanner(false), 5000);
      } else {
        setVoteSubmitMessage({
          type: "error",
          text: data.error || "投票に失敗しました。",
        });
      }
    } catch (err) {
      setVoteSubmitMessage({ type: "error", text: "エラーが発生しました。" });
    } finally {
      setIsSubmittingVotes(false);
    }
  };

  const renderTitle = (name: string) => {
    if (!name.includes("ネタツイグランプリ")) return name;
    const parts = name.split("ネタツイグランプリ");
    return (
      <>
        {parts[0] && <span className="block mb-1">{parts[0]}</span>}
        <span className="block">ネタツイグランプリ</span>
        {parts[1] && <span className="block mt-1">{parts[1]}</span>}
      </>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-black dark:text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  if (!contest)
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-black dark:text-white">
        大会が見つかりません。
      </div>
    );

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col overflow-clip">
      {/* Top Parallel Background */}
      <div className="absolute left-0 top-0 w-full h-[280px] md:h-[320px] overflow-hidden z-0 select-none pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(15deg,#1DA1F2,#70c8f7)] overflow-hidden flex items-center justify-center">
          <div className="absolute w-[350%] h-[400%] md:w-[200%] md:h-[300%] -rotate-[15deg] opacity-[0.07] text-white font-black text-5xl md:text-7xl tracking-widest flex flex-col justify-center gap-0">
            {Array.from({ length: 14 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className={`h-10 md:h-16 flex items-center whitespace-nowrap gap-8 leading-none ${
                  rowIndex % 2 === 0
                    ? "translate-x-0"
                    : "translate-x-16 scale-y-[-1] scale-x-[-1] mt-2 md:mt-4"
                }`}
              >
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <span key={colIndex}>NETATWEET GRANDPRIX</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-10 relative z-20">
        {/* ヘッダー下に浮かせる固定アラート群 */}
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl flex flex-col gap-2 pointer-events-none">
          {/* 投票完了バナー */}
          {showSuccessBanner && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center shadow-lg animate-fade-in-down pointer-events-auto">
              <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0 text-green-500" />
              <div>
                <p className="font-bold text-lg">投票が完了しました！</p>
                <p className="text-sm">
                  期間内であれば何度でも投票内容を更新できます。
                </p>
              </div>
            </div>
          )}

          {isJudgeMode && contestStatus === "voting" && !hideJudgeBanner && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-sm pointer-events-auto">
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0 text-yellow-600" />
                <span>現在、審査員として投票中です。</span>
              </div>
              <button
                onClick={() => setHideJudgeBanner(true)}
                className="ml-4 p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {contestStatus === "ongoing" && isPostDeadlineExceeded && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-sm animate-pulse pointer-events-auto">
              {" "}
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-red-500" />{" "}
              <div>
                {" "}
                <p className="font-bold">投稿受け付けは終了しました</p>{" "}
                <p className="text-xs opacity-80">
                  集計中または投票フェーズへの移行待ちです。
                </p>{" "}
              </div>{" "}
            </div>
          )}
          {contestStatus === "voting" && isVoteDeadlineExceeded && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-sm animate-pulse pointer-events-auto">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-bold">投票期間は終了しました</p>
                <p className="text-xs opacity-80">
                  集計中または結果発表待ちです。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ヘッダーエリア (タイトルとお題のみ) - 背景の中央に配置 */}
        <div className="relative flex flex-col justify-center h-[280px] md:h-[320px] -mt-10 mb-6">
          <div className="mt-2">
            <h1 className="font-extrabold text-white text-left drop-shadow-md text-4xl md:text-6xl tracking-tight leading-tight">
              {renderTitle(contest.name)}
            </h1>
            {contest.hasTheme && contest.theme && (
              <div className="text-[15px] md:text-lg font-bold text-white/90 mt-3 text-left drop-shadow">
                お題: {contest.theme}
              </div>
            )}
          </div>
        </div>

        {/* アクションボタンエリア (Xでポスト、審査員ログインなど) */}
        <div className="flex justify-between items-center w-full mb-8 pt-2">
          <div className="flex items-center gap-2">
            {/* 審査員ボタン: 投票期間のみ表示、かつ審査員が含まれる場合のみ */}
            {!isJudgeMode &&
              isVotePeriod &&
              contest.scoringMethod !== "user" && (
                <JudgeLoginButton
                  contestId={contestId}
                  onLoginSuccess={async () => {
                    await refetchUser();
                    await fetchData();
                  }}
                />
              )}
            {isJudgeMode && (
              <span className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs md:text-sm rounded-full font-bold shadow-sm border border-gray-200 dark:border-gray-800">
                審査員モード
              </span>
            )}
          </div>

          <button
            onClick={() => {
              const url = window.location.href;
              const text = `${contest.name}\n${url}\n\n#ネタツイグランプリ`;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                "_blank",
              );
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-black dark:bg-white px-4 py-2 text-[13px] md:text-[14px] font-bold text-white dark:text-black transition hover:bg-black/80 dark:hover:bg-gray-200 whitespace-nowrap shadow-none border border-transparent"
          >
            <Share2 className="w-4 h-4" />
            Xでポスト
          </button>
        </div>

        {/* 各種バッジ・ルール */}
        <div className="mb-8 pl-1">
          <div className="flex flex-col gap-2 text-[15px] font-medium text-black/80 dark:text-white/80 mb-5">
            {(contestStatus === "ongoing" || contestStatus === "upcoming") && (
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                {contestStatus === "upcoming" ? "投稿開始: " + dayjs(contest.startTime).format("MM/DD HH:mm") : "投稿締切: " + dayjs(contest.endTime).format("MM/DD HH:mm")}
              </div>
            )}
            {contestStatus === "voting" && (
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                投票締切: {dayjs(contest.votingEndTime).format("MM/DD HH:mm")}
              </div>
            )}
            {(contestStatus === "ongoing" || contestStatus === "upcoming") && (
              <div className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                画像投稿:{" "}
                {contest.imageRule === "required"
                  ? "1枚以上必須"
                  : contest.imageRule === "none"
                    ? "不可"
                    : "可"}
              </div>
            )}
            {contest.advancementNumerator != null &&
              contest.advancementDenominator != null && (
                <div className="flex items-center">
                  <Award className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                  予選通過率: {contest.advancementNumerator}/
                  {contest.advancementDenominator}
                </div>
              )}
            {contestStatus === "closed" && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center">
                  <Users className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                  投稿: {totalPosters ?? 0}人
                </span>
                {contest.scoringMethod !== "judge" && (
                  <span className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                    投票: {totalVoters ?? 0}人
                  </span>
                )}
                {contest.scoringMethod !== "user" && (
                  <span className="flex items-center">
                    <UserStar className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                    審査員: {totalJudges ?? 0}人
                  </span>
                )}
              </div>
            )}
            {contestStatus === "voting" && (
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                投稿数: {totalPosters ?? 0}
              </div>
            )}

            {/* ルール・概要 */}
            {contestStatus === "ongoing" && (
              <div className="flex items-start w-full">
                <Info className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-[#1DA1F2]" />
                <p>投稿は一人一つのみ、期限内なら何回でも編集できます。</p>
              </div>
            )}
            {contestStatus === "voting" && showVoteUI && (
              <div className="flex items-start w-full">
                <Info className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-[#1DA1F2]" />
                <p>投票は期限内なら何回でも編集できます。</p>
              </div>
            )}
            <div className="mt-1">
              <Link
                href="/rules"
                className="inline-block text-[#1DA1F2] font-bold text-sm hover:underline"
              >
                ルールを詳しく見る→
              </Link>
            </div>
          </div>
        </div>

        {/* 投稿期間・準備中 */}
        {contestStatus === "upcoming" && (
          <div className="pb-[450px]">
            <div className="text-center py-20 text-black/80 dark:text-white/80 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              投稿開始までしばらくお待ちください。
            </div>
          </div>
        )}
        {contestStatus === "ongoing" && (
          <div className="pb-[450px]">
            <PostForm
              contestId={contestId}
              isFinalRound={!!contest.parentContestId}
              onPostSuccess={() => fetchData()}
            />
          </div>
        )}

        {/* 投票期間 */}
        {contestStatus === "voting" && (
          <div className="mb-24">
            {!contest.isVotingVisible && !isJudgeMode ? (
              <div className="text-center py-20 text-black/50 dark:text-white/50 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                現在投票期間中のため、投稿は非公開です。
              </div>
            ) : (
              <div className="-mx-4 md:mx-0 bg-white dark:bg-black md:rounded-2xl border-y border-[#d9e1e7] dark:border-gray-800 md:border-x shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {posts.length > 0 ? (
                  posts.map((post) => {
                    return (
                      <div
                        key={post.id}
                        className="p-4 sm:p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="flex-none">
                            {user && String(post.user_id) === String(user.id) ? (
                                <img 
                                  src={user.profile_image_url || 'https://via.placeholder.com/40'} 
                                  alt={user.name} 
                                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover" 
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                                </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              {user && String(post.user_id) === String(user.id) ? (
                                  <span className="font-bold text-black dark:text-white text-sm">
                                    {user.name}
                                  </span>
                              ) : (
                                  <span className="font-bold text-black dark:text-white text-sm hover:underline cursor-pointer">
                                    匿名さん
                                  </span>
                              )}
                            </div>
                            <div className="text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere] mb-2">
                              {post.content}{'\u200B'}
                            </div>
                            {post.images && post.images.length > 0 && (
                              <div className="mt-2">
                                <ImageGrid images={post.images} />
                              </div>
                            )}

                            {/* 投票UIとコメントボタン（横並び） */}
                            <div className="flex items-end justify-between gap-2 w-full mt-2">
                              {/* 左側: 審査員モード評価点 */}
                              <div className="flex-grow">
                                {showVoteUI && isJudgeMode && (
                                  <JudgeVoteSelector
                                    postId={post.id}
                                    currentScore={votes[post.id] || 0}
                                    onSelect={handleVoteChange}
                                    disabled={Boolean(isVoteDeadlineExceeded || (user && String(post.user_id) === String(user.id)))}
                                    maxScore={contest.judgeMaxScore || 10}
                                  />
                                )}
                              </div>

                              {/* 右側: コメントボタン・一般投票ボタン */}
                              <div className="flex items-center justify-end gap-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleComments(post.id)}
                                  className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-all group ${
                                    openComments[post.id] ||
                                    post.hasCommented ||
                                    sessionCommentedPosts[post.id]
                                      ? "text-[#1DA1F2] bg-[#1DA1F2]/10 border border-[#1DA1F2]/20"
                                      : "text-gray-500 dark:text-gray-400 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] border border-transparent hover:border-[#1DA1F2]/20"
                                  }`}
                                >
                                  <MessageSquare
                                    className={`w-4 h-4 md:w-5 md:h-5 ${openComments[post.id] || post.hasCommented || sessionCommentedPosts[post.id] ? "fill-current" : ""}`}
                                  />
                                  <span className="text-xs md:text-sm font-bold">
                                    コメント
                                  </span>
                                </button>

                                {showVoteUI && !isJudgeMode && (
                                  <GeneralVoteButton
                                    postId={post.id}
                                    isLiked={votes[post.id] === 1}
                                    onToggle={handleVoteChange}
                                    disabled={
                                      Boolean(voteUIDisabled || isVoteDeadlineExceeded || (user && String(post.user_id) === String(user.id)))
                                    }
                                  />
                                )}
                              </div>
                            </div>

                            {/* コメント機能 (一般) */}
                            <div className={`mt-3 border-t border-gray-200 dark:border-gray-800 ${!openComments[post.id] ? "hidden" : ""}`}>
                              <CommentList
                                postId={post.id}
                                currentUser={user}
                                contestStatus="voting"
                                isAlwaysOpen={true}
                                onClose={() =>
                                  setOpenComments((prev) => ({
                                    ...prev,
                                    [post.id]: false,
                                  }))
                                }
                                onCommentAdded={() =>
                                  handleCommentAdded(post.id)
                                }
                                onCommentDeleted={() =>
                                  handleCommentDeleted(post.id)
                                }
                              />
                            </div>

                            {/* 審査員賞/コメント */}
                            {showVoteUI && isJudgeMode && (
                              <div className="w-full">
                                <JudgeAwardSelector
                                  postId={post.id}
                                  isSelected={
                                    judgeAwardSelection.postId === post.id
                                  }
                                  onSelect={handleJudgeAwardSelect}
                                  comment={judgeAwardSelection.comment}
                                  onCommentChange={handleJudgeCommentChange}
                                  disabled={
                                    Boolean(voteUIDisabled || isVoteDeadlineExceeded || (user && String(post.user_id) === String(user.id)))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-black/50 dark:text-white/50">
                    投稿がありません。
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 結果発表 */}
        {contestStatus === "closed" && (
          <div className="space-y-8 pb-12">
            {results.length === 0 ? (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
                投稿がありませんでした。
              </div>
            ) : results.some((r) => r.rank === null) ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mt-8 px-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2] mx-auto mb-4" />
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  現在、結果を集計中です
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  結果が発表されるまでしばらくお待ちください。
                </p>
              </div>
            ) : (
              <>
                {contest.resultCommentTop && (
                  <div className="whitespace-pre-wrap text-black/80 dark:text-white/80 leading-relaxed px-2 break-words [line-break:anywhere]">
                    {contest.resultCommentTop ? contest.resultCommentTop + '\u200B' : null}
                  </div>
                )}

                {/* 結果のタイムライン (並び替え考慮のコンテナ) */}
                <div className="-mx-4 md:mx-0 bg-white dark:bg-black md:rounded-2xl border-y border-[#d9e1e7] dark:border-gray-800 md:border-x shadow-sm overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-5 py-3 font-bold text-black dark:text-white flex justify-between items-center">
                    <span>ランキング</span>
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(
                          e.target.value as "asc" | "desc" | "random",
                        )
                      }
                      className="text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded px-2 py-1 focus:outline-none focus:border-[#1DA1F2]"
                    >
                      <option value="asc">昇順</option>
                      <option value="desc">降順</option>
                      <option value="random">ランダム</option>
                    </select>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sortedResults.map((result, index) => {
                      let showBorder = false;
                      if (sortOrder === "asc") {
                        showBorder = Boolean(
                          index > 0 &&
                          sortedResults[index - 1].is_advanced &&
                          !result.is_advanced,
                        );
                      } else if (sortOrder === "desc") {
                        showBorder = Boolean(
                          index > 0 &&
                          !sortedResults[index - 1].is_advanced &&
                          result.is_advanced,
                        );
                      }
                      return (
                        <Fragment key={result.post_id}>
                          {showBorder &&
                            contest.advancementNumerator != null &&
                            contest.advancementDenominator != null && (
                              <div className="py-3 bg-red-50/50 border-y border-red-200 flex items-center justify-center">
                                <span className="text-red-500 font-bold text-xs tracking-widest flex items-center">
                                  <div className="w-12 h-px bg-red-300 mr-3"></div>
                                  予選通過ボーダー
                                  <div className="w-12 h-px bg-red-300 ml-3"></div>
                                </span>
                              </div>
                            )}
                          <ResultPostCard
                            post={result}
                            currentUser={user}
                            contestScoringMethod={contest.scoringMethod}
                          />
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* 審査員賞 */}
                {contest.scoringMethod !== "general" &&
                  judgeAwardsResults.length > 0 && (
                    <div className="mt-24">
                      <h2 className="text-3xl font-bold text-black dark:text-white mb-12 mt-24 flex items-center px-2">
                        <Award className="w-8 h-8 mr-3 text-[#1DA1F2]" />
                        審査員賞
                      </h2>
                      <div className="space-y-12">
                        {judgeAwardsResults.map((award, idx) => {
                          const fullPost = results.find(
                            (r) => r.post_id === award.post.post_id,
                          );
                          return (
                            <div key={idx} className="px-2">
                              {/* Header */}
                              <div className="flex items-center gap-3 mb-4">
                                <Link
                                  href={`/profile/${encodeURIComponent(award.judge.screen_name)}`}
                                >
                                  <img
                                    src={
                                      award.judge.profile_image_url ||
                                      "https://via.placeholder.com/40"
                                    }
                                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover bg-white dark:bg-black"
                                  />
                                </Link>
                                <Link
                                  href={`/profile/${encodeURIComponent(award.judge.screen_name)}`}
                                  className="text-xl font-bold text-black dark:text-white hover:underline"
                                >
                                  {award.judge.name}
                                </Link>
                                <span className="text-xl font-bold text-black dark:text-white">
                                  賞
                                </span>
                              </div>

                              {/* Post */}
                              {fullPost ? (
                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-black shadow-sm">
                                  <ResultPostCard
                                    post={fullPost}
                                    currentUser={user}
                                    contestScoringMethod={contest.scoringMethod}
                                    hideVotersAndComments={true}
                                  />
                                </div>
                              ) : (
                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-black p-4 shadow-sm">
                                  <p className="whitespace-pre-wrap break-words [line-break:anywhere]">{award.post.content}{'\u200B'}</p>
                                </div>
                              )}

                              {/* Judge Comment */}
                              <div className="text-black/90 dark:text-white/90 text-base leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere] ml-1">
                                {award.comment ? award.comment + '\u200B' : "（コメントなし）"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {contest.resultCommentBottom && (
                  <div
                    className={`whitespace-pre-wrap break-words [line-break:anywhere] text-black/80 dark:text-white/80 leading-relaxed px-2 ${contest.scoringMethod !== "general" && judgeAwardsResults.length > 0 ? "mt-12 pt-12 border-t border-gray-200 dark:border-gray-800" : "mt-12"}`}
                  >
                    {contest.resultCommentBottom ? contest.resultCommentBottom + '\u200B' : null}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 投票確定ボタン (固定) */}
      {showVoteUI && (
        <div className="sticky bottom-0 w-full z-50 bg-white dark:bg-black/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 flex justify-center mt-auto">
          <button
            onClick={handleSubmitVotes}
            disabled={isSubmittingVotes}
            className="w-full max-w-md mx-auto py-3.5 px-6 rounded-full font-bold bg-[#1DA1F2] hover:bg-[#1788cc] text-white shadow-md flex items-center justify-center transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed text-[15px]"
          >
            {isSubmittingVotes ? (
              <Loader2 className="animate-spin mr-2 w-5 h-5" />
            ) : null}
            {isSubmittingVotes
              ? "送信中..."
              : userHasVoted
                ? "投票を更新する"
                : "投票を確定する"}
          </button>
        </div>
      )}
    </div>
  );
}
