import {
  buildCreateContestPayload,
  buildUpdateContestPayload,
  createInitialContestForm,
  updateContestFormField,
} from "@/features/admin/model/contestForm";
import type { AdminManagedContest } from "@/types/api";

describe("admin contest form", () => {
  it("大会種別に応じた既定値へ切り替える", () => {
    const daily = updateContestFormField(createInitialContestForm(), "type", "daily");
    expect(daily).toMatchObject({
      type: "daily",
      hasQualifier: false,
      scoringMethod: "user",
      imageRule: "optional",
      isVotingVisible: true,
    });
  });

  it("作成payloadの日付をISO形式へ変換する", () => {
    const form = {
      ...createInitialContestForm(),
      startTime: "2026-01-01T09:00",
      endTime: "2026-01-02T09:00",
      votingEndTime: "2026-01-03T09:00",
      qualifierStartTime: "2025-12-28T09:00",
      qualifierEndTime: "2025-12-29T09:00",
      qualifierVotingEndTime: "2025-12-30T09:00",
    };
    const payload = buildCreateContestPayload(form);
    expect(payload.startTime).toBe(new Date(form.startTime).toISOString());
    expect(payload.qualifierVotingEndTime).toBe(
      new Date(form.qualifierVotingEndTime).toISOString(),
    );
  });

  it("更新payloadからIDを除外する", () => {
    const contest: AdminManagedContest = {
      id: 1,
      name: "大会",
      theme: null,
      startTime: "2026-01-01T09:00",
      endTime: "2026-01-02T09:00",
      votingEndTime: "2026-01-03T09:00",
      type: "daily",
      scoringMethod: "user",
      imageRule: "optional",
      generalVoteWeight: 1,
      judgeMaxScore: 20,
      isVotingVisible: true,
      advancementNumerator: null,
      advancementDenominator: null,
      judgeAwardAdvancement: false,
      resultCommentTop: null,
      resultCommentBottom: null,
    };
    expect(buildUpdateContestPayload(contest)).not.toHaveProperty("id");
  });
});
