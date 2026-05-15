import { ref } from "vue";
import axios from "axios";
import { tokenHeader } from "../globalService";

/**
 * Composable for shared toast state across evaluation views.
 */
export function useToast() {
  const isSuccessToastOpen = ref(false);
  const isErrorToastOpen = ref(false);
  const errorMessage = ref("");

  const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
  const setErrorToastOpen = (val, message = "") => {
    isErrorToastOpen.value = val;
    errorMessage.value = message;
  };

  return {
    isSuccessToastOpen,
    isErrorToastOpen,
    errorMessage,
    setSuccessToastOpen,
    setErrorToastOpen,
  };
}

/**
 * Calculates a student's final grade on a 0–5 scale based on criterion scores.
 *
 * @param {number|string} studentId
 * @param {Object} evaluationObj - { [studentId]: { [criterionId]: { value, id } } }
 * @param {Array}  criteriaArr   - [{ id, score, ... }]
 * @returns {number}
 */
export function calculateFinalGrade(studentId, evaluationObj, criteriaArr) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let hasAnyEvaluation = false;

  for (const criterionId in evaluationObj[studentId]) {
    const entry = evaluationObj[studentId][criterionId];
    if (entry.value !== null) {
      hasAnyEvaluation = true;
    }
    const value = entry.value === null ? 0 : entry.value;
    const criterion = criteriaArr.find((c) => c.id == criterionId);
    if (criterion) {
      maxPossibleScore += criterion.score;
      totalScore += value;
    }
  }

  if (maxPossibleScore === 0) return 0;
  if (!hasAnyEvaluation) return null;
  return (totalScore / maxPossibleScore) * 5;
}

/**
 * Creates or updates a single student-criterion score via the API.
 *
 * @param {number|null} scoreId  - Existing score ID for PATCH, or null for POST.
 * @param {Object}      payload  - { studentId, criterionId, score, instituteId, activityId, [permissionId] }
 * @returns {Promise<Object>}    - The saved/updated score entity from the API.
 */
export async function saveCriterionScore(scoreId, payload) {
  if (scoreId) {
    const response = await axios.patch(
      `/student-criterion-scores/update/${scoreId}`,
      payload,
      tokenHeader()
    );
    return response.data;
  } else {
    const response = await axios.post(
      `/student-criterion-scores/create`,
      payload,
      tokenHeader()
    );
    return response.data;
  }
}
