import { alertController } from "@ionic/vue";

export const STUDENT_SURVEY_KEYS = {
  STORAGE: "omr_student_survey_responses",
  COUNTER: "omr_student_survey_counter",
  SESSION: "omr_student_survey_session",
};

export const PARENT_SURVEY_KEYS = {
  STORAGE: "omr_parent_survey_responses",
  COUNTER: "omr_parent_survey_counter",
  SESSION: "omr_parent_survey_session",
};

export function getLocalData(keys) {
  try {
    const responsesStr = localStorage.getItem(keys.STORAGE);
    const counterStr = localStorage.getItem(keys.COUNTER);
    const sessionStr = localStorage.getItem(keys.SESSION);
    return {
      responses: responsesStr ? JSON.parse(responsesStr) : [],
      counter: counterStr ? parseInt(counterStr, 10) : 1,
      session: sessionStr ? JSON.parse(sessionStr) : null,
    };
  } catch (e) {
    console.warn("Error reading local survey data:", e);
    return { responses: [], counter: 1, session: null };
  }
}

export function saveLocalData(keys, responses, counter, session) {
  try {
    localStorage.setItem(keys.STORAGE, JSON.stringify(responses));
    localStorage.setItem(keys.COUNTER, String(counter));
    if (session) {
      localStorage.setItem(
        keys.SESSION,
        JSON.stringify({
          id: session.id,
          label: session.label,
          year: session.year,
        })
      );
    }
    return true;
  } catch (e) {
    console.warn("Error saving local survey data:", e);
    return false;
  }
}

export function clearLocalData(keys) {
  try {
    localStorage.removeItem(keys.STORAGE);
    localStorage.removeItem(keys.COUNTER);
    localStorage.removeItem(keys.SESSION);
  } catch (e) {
    console.warn("Error clearing local survey data:", e);
  }
}

export async function confirmLocalDataOverwrite(
  savedSessionLabel,
  actionType = "nueva"
) {
  const sessionName = savedSessionLabel || "otra sesión";
  const actionText =
    actionType === "nueva"
      ? "iniciar una sesión nueva"
      : "ingresar a esta sesión";

  let confirmed = false;
  const alert = await alertController.create({
    header: "Datos locales existentes",
    message: `Hay una sesión de datos locales existente ligada a "${sessionName}". Si va a ${actionText}, esos datos locales se perderán.`,
    buttons: [
      {
        text: "Cancelar",
        role: "cancel",
        handler: () => {
          confirmed = false;
        },
      },
      {
        text: "Continuar y borrar locales",
        role: "destructive",
        handler: () => {
          confirmed = true;
        },
      },
    ],
  });

  await alert.present();
  await alert.onDidDismiss();
  return confirmed;
}
