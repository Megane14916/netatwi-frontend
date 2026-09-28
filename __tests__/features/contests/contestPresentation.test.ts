import {
  getContestStatus,
  getGrandPrixStep,
  getGrandPrixProgress,
  getVisibleDailyContests,
  isContestType,
} from "@/features/contests/model/contestPresentation";
import type { ContestSummary } from "@/types/domain";

const contest = (overrides: Partial<ContestSummary> = {}): ContestSummary => ({
  id: 1,
  name: "大会",
  theme: null,
  hasTheme: false,
  hasQualifier: false,
  type: "daily",
  parentContestId: null,
  startTime: "2026-01-01T00:00:00.000Z",
  endTime: "2026-01-02T00:00:00.000Z",
  votingEndTime: "2026-01-03T00:00:00.000Z",
  totalPosters: 0,
  totalVoters: 0,
  totalJudges: 0,
  ...overrides,
});

describe("contest presentation", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("日時から大会状態を判定する", () => {
    expect(getContestStatus(contest(), now)).toBe("ongoing");
    expect(getContestStatus(contest({ endTime: "2026-01-01T06:00:00.000Z" }), now)).toBe("voting");
  });

  it("予選と決勝から現在のGP進行を導出する", () => {
    const qualifier = contest({ id: 10, type: "grandprix", endTime: "2026-01-02T00:00:00.000Z" });
    const finals = contest({ id: 11, type: "grandprix", parentContestId: 10, startTime: "2026-01-03T00:00:00.000Z" });
    const progress = getGrandPrixProgress([finals, qualifier], now);
    expect(progress).toMatchObject({ step: 0, displayContest: qualifier, qualifier, finals });
  });

  it.each([
    ["2026-01-01T09:59:59.000Z", 0],
    ["2026-01-01T10:00:00.000Z", 1],
    ["2026-01-01T11:00:00.000Z", 2],
    ["2026-01-01T13:00:00.000Z", 3],
    ["2026-01-01T14:00:00.000Z", 4],
  ] as const)("予選・決勝の境界 %s で進行段階 %s を返す", (at, step) => {
    const qualifier = contest({ id: 10, type: "grandprix", endTime: "2026-01-01T10:00:00.000Z", votingEndTime: "2026-01-01T11:00:00.000Z" });
    const finals = contest({ id: 11, type: "grandprix", parentContestId: 10, endTime: "2026-01-01T13:00:00.000Z", votingEndTime: "2026-01-01T14:00:00.000Z" });
    expect(getGrandPrixStep(finals, qualifier, new Date(at))).toBe(step);
  });

  it("1時間より先のデイリーを非表示にして状態順に並べる", () => {
    const soon = contest({ id: 2, startTime: "2026-01-01T12:30:00.000Z", endTime: "2026-01-02T00:00:00.000Z" });
    const later = contest({ id: 3, startTime: "2026-01-01T14:00:00.000Z" });
    expect(getVisibleDailyContests([later, soon], 5, now)).toEqual([
      { contest: soon, status: "upcoming" },
    ]);
  });

  it("過去データは大会名を分類のフォールバックに使う", () => {
    expect(isContestType(contest({ type: undefined as never, name: "デイリー #1" }), "daily")).toBe(true);
  });
});
