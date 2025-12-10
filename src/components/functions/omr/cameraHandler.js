export function startCamera(OMR_STATE) {
  return new Promise((resolve, reject) => {
    const video = document.getElementById("video");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          OMR_STATE.video = video;
          OMR_STATE.stream = stream; // Store the stream
          resolve();
        };
      })
      .catch((err) => {
        console.error("Error al acceder a la cámara: ", err);
        reject(err);
      });
  });
}

export function stopCamera(OMR_STATE) {
  if (OMR_STATE.stream) {
    OMR_STATE.stream.getTracks().forEach(track => track.stop());
    OMR_STATE.video.srcObject = null;
    OMR_STATE.stream = null;
  }
}
