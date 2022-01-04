import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}
/*
export function usuarioGet() {
    return JSON.parse(localStorage.getItem('usuario'));
}
*/
export async function usuarioGet() {
    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
    await axios.get("/user/loged").then((response) => {
        localStorage.setItem("usuario", JSON.stringify(response.data));
      });
      return JSON.parse(localStorage.getItem('usuario'));
}

export function datoprueba() {
    return 'hola';
}


