import axios from "axios";

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

//JSON.parse(localStorage.getItem("periodos"))
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
export function basedeURL() {
  var puerto = "3000";
  return (
    window.location.protocol +
    "//" +
    window.location.host.split(":")[0] +
    ":" +
    puerto +
    "/"
  );
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

export async function QuizSinNotas(cursoId, usuario) {
  let quizzes = [];
  let notas = [];

  try {
    const response = await axios.get(
      `/quizzes?courseId=${cursoId}&periodId=${selectedPeriod()}&year=${selectedYear()}&instituteId=${
        usuario.value.institute.id
      }&exist=true`,
      tokenHeader()
    );
    quizzes = response.data;
  } catch (error) {
    console.error("Error al cargar las lecciones:", error);
  }

  try {
    const response = await axios.get(
      `/grades?courseId=${cursoId}&periodId=${selectedPeriod()}&year=${selectedYear()}&instituteId=${
        usuario.value.institute.id
      }`,
      tokenHeader()
    );
    notas = response.data;
  } catch (error) {
    console.error("Error al cargar las notas:", error);
  }

  // Paso 1: Obtener los IDs de las lecciones que sí tienen notas
  const idsConNotas = new Set(notas.map((nota) => nota.gradableItem.id));

  // Paso 2: Filtrar las lecciones que no tienen nota
  const quizzesSinNotas = quizzes.filter(
    (gradableItem) => !idsConNotas.has(gradableItem.id)
  );

  // Paso 3: Filtrar las lecciones sin nota pero que sí tienen respuestas
  const leccionesConRespuestas = [];

  for (const gradableItem of quizzesSinNotas) {
    try {
      const response = await axios.get(
        `/answers?quizId=${gradableItem.id}`,
        tokenHeader()
      );

      // Solo agregar si hay al menos una respuesta
      if (Array.isArray(response.data) && response.data.length > 0) {
        leccionesConRespuestas.push(gradableItem);
      }
    } catch (error) {
      console.error(
        `Error al obtener respuestas para la lección ${gradableItem.id}:`,
        error
      );
    }
  }

  return leccionesConRespuestas;
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
        "data:image/png;base64,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";
      break;
  }
  return retorno;
}
