import axios from "axios";

const UPLOAD_URL = "/files/upload-multiple";

function normalizeImageName(name) {
  const raw = String(name || "")
    .trim()
    .replace(/\\/g, "/");
  return (raw.split("/").pop() || "").toLowerCase();
}

function withoutPhoto(question) {
  if (!question.photo) {
    return question;
  }
  const next = { ...question };
  delete next.photo;
  return next;
}

export function findImageFile(files, name) {
  const key = normalizeImageName(name);
  return files.find((file) => normalizeImageName(file.name) === key) || null;
}

export function collectReferencedImages(questions) {
  const seen = new Set();
  const names = [];
  questions.forEach((question) => {
    const key = normalizeImageName(question.photo);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    names.push(question.photo);
  });
  return names;
}

export function findMissingImages(questions, files) {
  return collectReferencedImages(questions).filter(
    (name) => !findImageFile(files, name),
  );
}

export function buildImagePreviews(files) {
  const previews = {};
  files.forEach((file) => {
    const key = normalizeImageName(file.name);
    if (!previews[key]) {
      previews[key] = URL.createObjectURL(file);
    }
  });
  return previews;
}

export function revokeImagePreviews(previews) {
  Object.values(previews || {}).forEach((url) => URL.revokeObjectURL(url));
}

export function previewForPhoto(previews, name) {
  return previews[normalizeImageName(name)] || "";
}

export async function resolveQuestionPhotos(questions, files, onProgress) {
  const matched = collectReferencedImages(questions)
    .map((name) => findImageFile(files, name))
    .filter(Boolean);

  if (matched.length === 0) {
    return { questions: questions.map(withoutPhoto), uploaded: 0 };
  }

  const formData = new FormData();
  matched.forEach((file) => formData.append("files", file, file.name));

  const response = await axios.post(UPLOAD_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });

  const uploaded = response.data || [];
  const urlByName = new Map(
    uploaded.map((item) => [normalizeImageName(item.originalname), item.url]),
  );

  return {
    questions: questions.map((question) => {
      const url = urlByName.get(normalizeImageName(question.photo));
      return url ? { ...question, photo: url } : withoutPhoto(question);
    }),
    uploaded: uploaded.length,
  };
}
