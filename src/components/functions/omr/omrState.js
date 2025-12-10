let OMR_STATE = {
  stream: null,
};
let cv;

export function initializeOmrState() {
  return OMR_STATE;
}

export function setCv(cvInstance) {
  cv = cvInstance;
}

export function getCv() {
  return cv;
}
