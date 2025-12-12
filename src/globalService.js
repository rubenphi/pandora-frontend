import { reactive } from "vue";

import axios from "axios";
import { Capacitor } from "@capacitor/core";

// 1. Estado reactivo para la configuración de la API
export const apiState = reactive({
  isBaseUrlInitialized: false,
  baseUrl: null,
});

// 2. Función para establecer y guardar la nueva IP

// 3. Función para inicializar la baseURL al arrancar la app
export function initializeBaseUrl(ip) {
  if (ip) {
    localStorage.setItem("backend_ip", ip);
    localStorage.setItem("appLinked", "true");
  }
  let url = null;
  const storedIp = localStorage.getItem("backend_ip");

  if (storedIp) {
    url = `http://${storedIp}`;
  } else if (!Capacitor.isNativePlatform()) {
    // Implementación para web
    const puerto = "3000";
    url =
      window.location.protocol +
      "//" +
      window.location.host.split(":")[0] +
      ":" +
      puerto +
      "/";
  }

  if (url) {
    axios.defaults.baseURL = url;
    apiState.baseUrl = url;
  }
  apiState.isBaseUrlInitialized = true;
}
export function isStrictHttpIp(str) {
  const strictRegex =
    /^https?:\/\/(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d):(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3})$/;

  return strictRegex.test(str);
}
// 4. Función restaurada para compatibilidad. Devuelve la URL actual.
export function basedeURL() {
  return apiState.baseUrl;
}

// --- Se mantienen las otras funciones existentes ---

export function tokenHeader() {
  axios.defaults.headers.common["Authorization"] =
    localStorage.getItem("token");
}

export function usuarioGet() {
  if (localStorage.getItem("usuario") == undefined) {
    return false;
  } else {
    return JSON.parse(localStorage.getItem("usuario"));
  }
}

export function periodosGet() {
  if (localStorage.getItem("periodos") == undefined) {
    return false;
  } else {
    //alphabetical order by name
    return JSON.parse(localStorage.getItem("periodos")).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}

export function selectedYear() {
  if (localStorage.getItem("year") == undefined) {
    return new Date().getFullYear();
  } else {
    return parseInt(JSON.parse(localStorage.getItem("year")), 10);
  }
}

export function selectedPeriod() {
  localStorage.getItem("periodoSelected");
  if (localStorage.getItem("periodoSelected") == undefined) {
    return 1;
  } else {
    return parseInt(JSON.parse(localStorage.getItem("periodoSelected")), 10);
  }
}

export const numerosOrdinales = [
  "Primera pregunta",
  "Segunda Pregunta",
  "Tercera Pregunta",
  "Cuarta Pregunta",
  "Quinta Pregunta",
  "Sexta Pregunta",
  "Séptima Pregunta",
  "Octava Pregunta",
  "Novena Pregunta",
  "Décima Pregunta",
  "Undécima Pregunta",
  "Duodécima Pregunta",
  "Decimotercera Pregunta",
  "Decimocuarta Pregunta",
  "Decimoquinta Pregunta",
  "Decimosexta Pregunta",
  "Decimoséptima Pregunta",
  "Decimoctava Pregunta",
  "Decimonovena Pregunta",
  "Vigésima Pregunta",
  "Vigesimoprimera Pregunta",
  "Vigesimosegunda Pregunta",
  "Vigesimotercera Pregunta",
  "Vigesimocuarta Pregunta",
  "Vigesimoquinta Pregunta",
  "Vigesimosexta Pregunta",
  "Vigesimoseptima Pregunta",
  "Vigesimoctava Pregunta",
  "Vigesimonovena Pregunta",
  "Trigésima Pregunta",
  "Trigésimoprimera Pregunta",
  "Trigésimosegunda Pregunta",
  "Trigésimotercera Pregunta",
  "Trigésimocuarta Pregunta",
  "Trigésimoquinta Pregunta",
  "Trigésimosexta Pregunta",
  "Trigésimoseptima Pregunta",
  "Trigésimoctava Pregunta",
  "Trigésimonovena Pregunta",
  "Cuadragésima Pregunta",
  "Cuadragésimoprimera Pregunta",
  "Cuadragésimosegunda Pregunta",
  "Cuadragésimotercera Pregunta",
  "Cuadragésimocuarta Pregunta",
  "Cuadragésimoquinta Pregunta",
  "Cuadragésimosexta Pregunta",
  "Cuadragésimoseptima Pregunta",
  "Cuadragésimoctava Pregunta",
  "Cuadragésimonovena Pregunta",
  "Quincuagésima Pregunta",
  "Quincuagésimoprimera Pregunta",
  "Quincuagésimosegunda Pregunta",
  "Quincuagésimotercera Pregunta",
  "Quincuagésimocuarta Pregunta",
  "Quincuagésimoquinta Pregunta",
  "Quincuagésimosexta Pregunta",
  "Quincuagésimoseptima Pregunta",
  "Quincuagésimoctava Pregunta",
  "Quincuagésimonovena Pregunta",
  "Sexagésima Pregunta",
  "Sexagésimoprimera Pregunta",
  "Sexagésimosegunda Pregunta",
  "Sexagésimotercera Pregunta",
  "Sexagésimocuarta Pregunta",
  "Sexagésimoquinta Pregunta",
  "Sexagésimosexta Pregunta",
  "Sexagésimoseptima Pregunta",
  "Sexagésimoctava Pregunta",
  "Sexagésimonovena Pregunta",
  "Septuagésima Pregunta",
  "Septuagésimoprimera Pregunta",
  "Septuagésimosegunda Pregunta",
  "Septuagésimotercera Pregunta",
  "Septuagésimocuarta Pregunta",
  "Septuagésimoquinta Pregunta",
  "Septuagésimosexta Pregunta",
  "Septuagésimoseptima Pregunta",
  "Septuagésimoctava Pregunta",
  "Septuagésimonovena Pregunta",
  "Octogésima Pregunta",
  "Octogésimoprimera Pregunta",
  "Octogésimosegunda Pregunta",
  "Octogésimotercera Pregunta",
  "Octogésimocuarta Pregunta",
  "Octogésimoquinta Pregunta",
  "Octogésimosexta Pregunta",
  "Octogésimoseptima Pregunta",
  "Octogésimoctava Pregunta",
  "Octogésimonovena Pregunta",
  "Nonagésima Pregunta",
  "Nonagésimoprimera Pregunta",
  "Nonagésimosegunda Pregunta",
  "Nonagésimotercera Pregunta",
  "Nonagésimocuarta Pregunta",
  "Nonagésimoquinta Pregunta",
  "Nonagésimosexta Pregunta",
  "Nonagésimoseptima Pregunta",
  "Nonagésimoctava Pregunta",
  "Nonagésimonovena Pregunta",
  "Centésima Pregunta",
];

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function numeroOrdinal(index, ordinal) {
  const ordinalEncontradoIndex = numerosOrdinales.indexOf(ordinal);
  if (ordinalEncontradoIndex != -1) {
    return ordinalEncontradoIndex + 1;
  } else {
    return index + 1;
  }
}

export function booltoInt(data) {
  if (data == true) {
    return 1;
  } else {
    return 0;
  }
}

export function adminOprofesor() {
  tokenHeader();
  if (
    usuarioGet().rol == "admin" ||
    usuarioGet().rol == "director" ||
    usuarioGet().rol == "teacher" ||
    usuarioGet().rol == "coordinator"
  ) {
    return true;
  } else if (usuarioGet().rol == "student") {
    return false;
  }
}

export function adminOdirectivo() {
  tokenHeader();
  if (
    usuarioGet().rol == "admin" ||
    usuarioGet().rol == "director" ||
    usuarioGet().rol == "coordinator"
  ) {
    return true;
  } else if (usuarioGet().rol == "student") {
    return false;
  } else if (usuarioGet().rol == "teacher") {
    return false;
  }
}

export function defaultFile(name) {
  var retorno = "";
  switch (name) {
    case "thumbnail":
      retorno =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAIABJREFUeJzt3XuUXGWZ7/Hneao6FxIgCTcvDFcZbpKFzAAqSIueaJTurr2ru1BHNOMtqMh4B5XRJowgIt51FEbPEccZcTpDVXfgTBzOOMMcvI6zTkBl6Qw6juIVQRKBkK5d73v+ICiJ5NJJdT+76v1+spyLVbs+oYKvX9dVXtvEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABA/1DvgG4ZGxt7YlEUj4sx7iMiFe8eAED/UNUoIptjjD+bnJy8S0Sid9Pe6tkBMDw8fEi1Wn2RiDxPRJ4mIvs6JwEA0vCbGOPXVfWmarV6/cTExM+9g/ZEzw2Aer1+TAjhnar6IhGpevcAAJJWiMj1RVGsWbdu3Z3eMTPRMwNgcHCwunTp0nfFGC82s3nePQAAPCKEMG1m77n33nvffcsttxTePbujJwZAnucHhxBuMLMzvFsAANiREMKXzazebDZ/6d2yK6UfALVa7Q/M7Esi8iTvFgAAdsOdIYRnTU5O/tg7ZGfMO2Bnsiw7QET+UTj4AwB6x5PM7OZzzjlnqXfIzpR5AGiM8XNmdpx3CAAAM3TswMDA56TEr7SX9nz5LMteY2av9+4AAGBPqOoxxx133M+/+93vftO75bGUcpmcc845S+fNm/cDEVni3QIAwF74dQjhqMnJyfu8Q7ZXyrcABgYG/kw4+AMAet9SVf0z74jHUrpXABqNRmV6evouM3ucdwsAAHsrhPCzefPm/cHExETHu+XRSvcKQKfTOZuDPwCgX5jZ4zudzlneHdsr3QCIMa7wbgAAoJtijM/xbtheGQfAqd4NAAB0U4zxdO+G7ZVxABzj3QAAQDepaukuaFe6ASAiB3gHAADQTSGEg7wbtle6AWBmC70bAADoJjNb4N2wvdINAAAAMPsYAAAAJIgBAABAghgAAAAkiAEAAECCGAAAACSIAQAAQIIYAAAAJIgBAABAghgAAAAkiAEAAECCGAAAACSIAQAAQIIYAAAAJIgBAABAghgAAAAkiAEAAECCGAAAACSIAQAAQIIYAAAAJIgBAABAgqreAb0qxvhe7wYASI2qni8iS7w7+gEDYA+1Wq23eTcAQGryPB8TBkBX8BYAAAAJYgAAAJAgBgAAAAliAAAAkCAGAAAACWIAAACQIAYAAAAJYgAAAJAgBgAAAAliAAAAkCAGAAAACWIAAACQIAYAAAAJYgAAAJAgBgAAAAliAAAAkCAGAAAACWIAAACQIAYAAAAJYgAAAJAgBgAAAAliAAAAkKCqdwBKT/M8f5yIHC8iR4nIESJysIgcICL7i8i8EMKAmRUhhGkze1BE7okx/kpVfxRC+C9V/d7AwMD3JyYmOm5/CgDANhgA2MbKlSvnL1y48IwY45mqeoaInCIiB+7s/2Nm2/yviIiqbvPPpqenN+d5/i0R+aqI3Bpj/OdWq3XPbPwZAAC7xgCAnHPOOUvnzZuXiUguIs8SkUWPHMC7xcwWishpW3+9XlVjnuffEJGpoij+bt26dXd29QEBADvFAEhUo9GoFEWxQkReFUIYFpGBOU5QETldRE6vVquX12q1fzOzT2/evPnz69ev3zTHLQCQHAZAYhqNxuKiKF5eFMUbRORIkW1fuvdiZqeKyKnz58+/Os/zT4cQPjQ5OflD7y4A6FcMgESsWLFi0eLFi183PT19kZkt8+7ZETNbLCKvF5HXZVn22RjjZQwBAOg+B...";
      break;
  }
  return retorno;
}

export async function QuizSinNotas(cursoId, usuario, onlyGroupQuizzes = false) {
  try {
    tokenHeader();
    const response = await axios.get(`/quizzes/pending-grading`, {
      params: {
        courseId: cursoId,
        periodId: selectedPeriod(),
        year: selectedYear(),
        instituteId: usuario.value.institute.id,
      },
    });
    const quizzes = response.data || [];

    // Filter only group quizzes if requested
    if (onlyGroupQuizzes) {
      return quizzes.filter((quiz) => quiz.quizType === "group");
    }

    return quizzes;
  } catch (error) {
    console.error("Error fetching pending quizzes:", error);
    return [];
  }
}
