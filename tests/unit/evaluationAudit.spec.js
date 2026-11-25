import {
  calculateFinalGrade,
  calculateNumericAverage,
  classifyAuditItem,
  SubmissionStatus,
} from "@/composables/useEvaluation";

describe("useEvaluation separation of grade, submissionStatus and audit", () => {
  it("returns null when no criteria are evaluated (unsubmitted / unevaluated)", () => {
    const criteria = [
      { id: 1, score: 50 },
      { id: 2, score: 50 },
    ];
    const evaluation = {
      101: {
        1: { value: null, id: null },
        2: { value: null, id: null },
      },
    };

    const result = calculateFinalGrade(101, evaluation, criteria);
    expect(result).toBeNull();
    // Original missing criteria remain null
    expect(evaluation[101][1].value).toBeNull();
    expect(evaluation[101][2].value).toBeNull();
  });

  it("returns 0 only when criteria are explicitly evaluated as 0", () => {
    const criteria = [{ id: 1, score: 100 }];
    const evaluation = {
      102: {
        1: { value: 0, id: 5 },
      },
    };

    expect(calculateFinalGrade(102, evaluation, criteria)).toBe(0);
  });

  it("distinguishes NO_SUBMISSION, PENDING_GRADING, GRADED_ZERO, and NEEDS_REVIEW", () => {
    expect(classifyAuditItem(SubmissionStatus.NOT_SUBMITTED, null)).toBe(
      "NO_SUBMISSION"
    );
    expect(classifyAuditItem(SubmissionStatus.SUBMITTED, null)).toBe(
      "PENDING_GRADING"
    );
    expect(classifyAuditItem(SubmissionStatus.SUBMITTED, 0)).toBe(
      "GRADED_ZERO"
    );
    expect(classifyAuditItem(SubmissionStatus.UNKNOWN, null)).toBe(
      "NEEDS_REVIEW"
    );
    expect(classifyAuditItem(SubmissionStatus.SUBMITTED, 4.2)).toBe("GRADED");
  });

  it("calculates averages including real 0s and excluding null grades", () => {
    expect(
      calculateNumericAverage([
        { grade: null },
        { grade: 4.0 },
        { grade: null },
      ])
    ).toBe(4.0);

    expect(
      calculateNumericAverage([{ grade: 0 }, { grade: 4.0 }])
    ).toBe(2.0);

    expect(calculateNumericAverage([{ grade: null }])).toBe(0);
  });
});
