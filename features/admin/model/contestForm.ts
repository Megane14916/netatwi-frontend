import type {
  AdminCreateContestPayload,
  AdminManagedContest,
  AdminUpdateContestPayload,
} from "@/types/api";

export const createInitialContestForm = (): AdminCreateContestPayload => ({
  name: "",
  type: "grandprix",
  hasQualifier: true,
  advancementNumerator: 1,
  advancementDenominator: 3,
  qualifierJudgeAwardAdvancement: false,
  hasTheme: false,
  theme: "",
  scoringMethod: "judge",
  imageRule: "required",
  isVotingVisible: false,
  startTime: "",
  endTime: "",
  votingEndTime: "",
  judgePassword: "",
  generalVoteWeight: 0,
  judgeMaxScore: 20,
  qualifierHasTheme: false,
  qualifierTheme: "",
  qualifierScoringMethod: "judge",
  qualifierImageRule: "none",
  qualifierIsVotingVisible: false,
  qualifierStartTime: "",
  qualifierEndTime: "",
  qualifierVotingEndTime: "",
  qualifierJudgePassword: "",
  qualifierGeneralVoteWeight: 0,
  qualifierJudgeMaxScore: 20,
});

export const updateContestFormField = <K extends keyof AdminCreateContestPayload>(
  current: AdminCreateContestPayload,
  field: K,
  value: AdminCreateContestPayload[K],
): AdminCreateContestPayload => {
  const next = { ...current, [field]: value };
  if (field === "type" && value === "grandprix") {
    return {
      ...next,
      hasQualifier: true,
      advancementNumerator: 1,
      advancementDenominator: 3,
      qualifierJudgeAwardAdvancement: false,
      scoringMethod: "judge",
      judgeMaxScore: 20,
      generalVoteWeight: 0,
      hasTheme: false,
      isVotingVisible: false,
      imageRule: "required",
      qualifierScoringMethod: "judge",
      qualifierJudgeMaxScore: 20,
      qualifierGeneralVoteWeight: 0,
      qualifierHasTheme: false,
      qualifierIsVotingVisible: false,
      qualifierImageRule: "none",
    };
  }
  if (field === "type" && value === "daily") {
    return {
      ...next,
      hasQualifier: false,
      scoringMethod: "user",
      hasTheme: false,
      imageRule: "optional",
      isVotingVisible: true,
    };
  }
  if (field === "scoringMethod" && value === "judge") next.generalVoteWeight = 0;
  if (field === "qualifierScoringMethod" && value === "judge") {
    next.qualifierGeneralVoteWeight = 0;
  }
  return next;
};

const toIso = (value: string): string => new Date(value).toISOString();

export const buildCreateContestPayload = (
  form: AdminCreateContestPayload,
): AdminCreateContestPayload => ({
  ...form,
  startTime: toIso(form.startTime),
  endTime: toIso(form.endTime),
  votingEndTime: toIso(form.votingEndTime),
  ...(form.hasQualifier && form.qualifierStartTime
    ? { qualifierStartTime: toIso(form.qualifierStartTime) }
    : {}),
  ...(form.hasQualifier && form.qualifierEndTime
    ? { qualifierEndTime: toIso(form.qualifierEndTime) }
    : {}),
  ...(form.hasQualifier && form.qualifierVotingEndTime
    ? { qualifierVotingEndTime: toIso(form.qualifierVotingEndTime) }
    : {}),
});

export const buildUpdateContestPayload = (
  contest: AdminManagedContest,
): AdminUpdateContestPayload => {
  const { id: _id, ...fields } = contest;
  return {
    ...fields,
    startTime: toIso(contest.startTime),
    endTime: toIso(contest.endTime),
    votingEndTime: toIso(contest.votingEndTime),
  };
};

export const clearCreatedContestFields = (
  form: AdminCreateContestPayload,
): AdminCreateContestPayload => ({
  ...form,
  name: "",
  theme: "",
  startTime: "",
  endTime: "",
  votingEndTime: "",
  judgePassword: "",
  qualifierTheme: "",
  qualifierStartTime: "",
  qualifierEndTime: "",
  qualifierVotingEndTime: "",
  qualifierJudgePassword: "",
});
