<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio de sesión</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding-start ion-padding-end">
      <ion-grid>
        <ion-row class="ion-align-items-center">
          <ion-col size-s="1" size-xs="1" size-md="4" size-lg="5" size-xl="5">
          </ion-col>
          <ion-col
            size-s="10"
            size-xs="10"
            size-md="4"
            size-lg="2"
            size-xl="2"
            class="ion-align-items-center"
          >
            <ion-card class="ion-padding">
              <ion-grid>
                <ion-row>
                  <ion-col
                    size-xs="5"
                    size-s="5"
                    size-md="5"
                    size-lg="5"
                    size-xl="5"
                  >
                  </ion-col>
                  <ion-col
                    size-xs="2"
                    size-s="2"
                    size-md="2"
                    size-lg="2"
                    size-xl="2"
                  >
                    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
                    <svg
                      fill="#989aa2"
                      class="color"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      viewBox="0 0 612 612"
                      style="enable-background: new 0 0 612 612"
                      xml:space="preserve"
                    >
                      <g>
                        <path
                          d="M612,167.008c0-0.252-1.479-0.49-1.509-0.735c-0.044-0.394-0.765-0.788-0.869-1.167c-0.082-0.297-0.579-0.565-0.698-0.847
		c-0.134-0.312-0.409-0.632-0.58-0.921c-0.163-0.29-0.49-0.535-0.698-0.795c-0.186-0.245-0.408-0.498-0.624-0.721
		c-0.253-0.245-0.572-0.438-0.854-0.646c-0.201-0.156-0.394-0.334-0.617-0.468c-0.044-0.022-0.097-0.029-0.134-0.059
		c-0.066-0.03-0.118-0.089-0.178-0.119L431.233,68.96l-20.412-11.035c-0.595-0.319-1.233-0.542-1.873-0.691L304.986,2.529
		c-2.185-1.159-4.8-1.144-6.97,0.03L3.805,160.551c-0.045,0.022-0.082,0.06-0.126,0.089c-0.037,0.015-0.074,0.022-0.111,0.044
		c-0.23,0.141-0.424,0.334-0.639,0.498c-0.282,0.208-0.58,0.394-0.825,0.639c-0.208,0.208-0.372,0.461-0.55,0.691
		c-0.216,0.275-0.461,0.528-0.639,0.833c-0.149,0.268-0.245,0.557-0.364,0.839c-0.134,0.312-0.297,0.609-0.394,0.937
		c-0.089,0.342,1.293,0.698,1.248,1.055c-0.037,0.282,1.278,0.55,1.278,0.84c0,0.015,0,0.03,0,0.052c0,0.015,0,0.03,0,0.044v264.213
		H0c0.007,7.431,1.241,7.742,3.641,9.103l294.226,168.275c1.144,0.646,2.407,1.628,3.671,1.628c1.248,0,2.489,0.021,3.611-0.603
		l300.229-169.435c2.438-1.36,3.708-1.538,3.716-8.969H612V167.104c0-0.015,0-0.03,0-0.044S612,167.03,612,167.008z M17.544,179.863
		l89.168,52.684v97.089l25.22-6.97l20.65,34.367l33.55-8.36l31.833,44.124l1.152-96.458l73.363,42.08v252.369L17.544,432.262
		V179.863z M307.341,338.434l289.798-158.697v252.487L307.341,590.922V338.434z M301.575,325.542l-73.363-41.634l281.69-156.758
		l76.269,40.125L301.575,325.542z M301.56,17.517l89.726,47.215L111.275,217.544l-88.589-50.269L301.56,17.517z"
                        />
                      </g>
                    </svg>
                  </ion-col>
                  <ion-col
                    size-xs="5"
                    size-s="5"
                    size-md="5"
                    size-lg="5"
                    size-xl="5"
                  >
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col>
                    <div class="ion-text-center">
                      <ion-text color="medium"><h3>PANDORA</h3></ion-text>
                      <ion-text v-if="error.estatus === 1" color="danger">
                        <br />
                        {{ error.data }}
                      </ion-text>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-grid>

              <ion-item>
                <ion-label color="medium" position="floating"
                  >Usuario</ion-label
                >
                <ion-input
                  v-model="login.code"
                  placeholder="Código de estudiante"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label color="medium" position="floating"
                  >Contraseña
                </ion-label>
                <ion-input
                  v-model="login.password"
                  type="password"
                  placeholder="Documento de identidad"
                ></ion-input>
              </ion-item>
              <ion-buttons
                class="ion-justify-content-center ion-padding-top ion-padding-bottom"
              >
                <ion-button
                  type="submit"
                  expand="full"
                  fill="outline"
                  shape="round"
                  color="primary"
                  class="ion-align-self-center"
                  @click="mostrar"
                >
                  <ion-label class="ion-text-center ion-padding">
                    Entrar
                  </ion-label>
                </ion-button>
              </ion-buttons>

              <ion-buttons
                class="ion-justify-content-center ion-padding-top ion-padding-bottom"
              >
                <ion-button
                  type="submit"
                  expand="full"
                  fill="outline"
                  shape="round"
                  color="medium"
                  class="ion-align-self-center"
                  @click="register"
                >
                  <ion-label class="ion-text-center ion-padding">
                    Registrarse
                  </ion-label>
                </ion-button>
              </ion-buttons>
            </ion-card>
          </ion-col>
          <ion-col size-s="1" size-xs="1" size-md="4" size-lg="5" size-xl="5">
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import axios from "axios";
import { selectedYear, tokenHeader, usuarioGet } from "../globalService";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonText,
} from "@ionic/vue";
import router from "../router";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonText,
  },
  setup() {
    const login = ref({
      code: "",
      password: "",
    });
    const error = ref({
      estatus: 0,
      data: "",
    });

    return {
      error,
      axios,
      login,
      async mostrar() {
        if (login.value.code == "" || login.value.password == "") {
          error.value.estatus = 1;
          error.value.data = "Debe ingresar usuario y contraseña";
        } else {
          await axios
            .post("/auth/login", login.value, {
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
            })
            .then(async (response) => {
              if (response.data.userLoged.accessToken == undefined) {
                error.value.estatus = 1;
                error.value.data = "Error al iniciar sesión";
              } else {
                localStorage.setItem(
                  "token",
                  "Bearer " + response.data.userLoged.accessToken
                );
                localStorage.setItem(
                  "usuario",
                  JSON.stringify(response.data.userLoged)
                );

                error.value.estatus = 0;

                tokenHeader();
              }
            })
            .then(async () => {
              await axios
                .get(`/users/${usuarioGet().id}/courses`)
                .then((response) => {
                  const cursosUsuario = response.data.map((assignacion) => ({
                    name: assignacion.course.name,
                    id: assignacion.course.id,
                    year: assignacion.year,
                  }));
                  localStorage.setItem(
                    "cursosUsuario",
                    JSON.stringify(cursosUsuario)
                  );
                  //si no hay un curso con el year igual a selectedYear() ,  localstorage year se convertira en el ultimo year de cursosUsuario

                  if (
                    cursosUsuario.length > 0 &&
                    !cursosUsuario.find((c) => c.year == selectedYear())
                  ) {
                    const year = cursosUsuario.sort(
                      (a, b) => b.year - a.year
                    )[0].year;
                    localStorage.setItem("year", JSON.stringify(year));
                  } else {
                    localStorage.setItem(
                      "year",
                      JSON.stringify(selectedYear())
                    );
                  }
                });

              await axios
                .get(`/periods?instituteId=${usuarioGet().institute.id}`)
                .then((response) => {
                  const periodos = response.data.map((periodo) => ({
                    name: periodo.name,
                    id: periodo.id,
                  }));
                  localStorage.setItem("periodos", JSON.stringify(periodos));
                });

              router.push("/inicio");
            });
        }
      },
      register() {
        router.push("/register");
      },
    };
  },
};
</script>
<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 10%;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}
</style>
