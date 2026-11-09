import { ref } from "vue";
import axios from "axios";
import { adminOprofesor, tokenHeader } from "./globalService";

export const COURSE_ACCESS_DENIED_MESSAGE =
  "No tienes acceso a este contenido porque no estás inscrito en el curso asignado.";

export const courseAccessNotice = ref("");

export function notifyCourseAccessDenied(
  message = COURSE_ACCESS_DENIED_MESSAGE
) {
  courseAccessNotice.value = message;
}

export function clearCourseAccessNotice() {
  courseAccessNotice.value = "";
}

function accessEndpoint(resource, id) {
  return resource === "quiz"
    ? `/quizzes/${id}/access`
    : `/questions/${id}/access`;
}

export function courseAccessGuard(resource, idParam = "id") {
  return async (to) => {
    if (adminOprofesor()) return true;

    const id = to.params[idParam];
    if (!id) return { path: "/inicio" };

    try {
      tokenHeader();
      const { data } = await axios.get(accessEndpoint(resource, id));
      if (data && data.allowed) return true;
      notifyCourseAccessDenied(
        (data && data.reason) || COURSE_ACCESS_DENIED_MESSAGE
      );
    } catch (error) {
      notifyCourseAccessDenied(
        (error && error.response && error.response.data &&
          error.response.data.message) || COURSE_ACCESS_DENIED_MESSAGE
      );
    }

    return { path: "/inicio" };
  };
}
