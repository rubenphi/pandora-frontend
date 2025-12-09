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
          resolve();
        };
      })
      .catch((err) => {
        console.error("Error al acceder a la cámara: ", err);
        reject(err);
      });
  });
}
