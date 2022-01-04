import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}
/*
export function usuarioGet() {
    return JSON.parse(localStorage.getItem('usuario'));
}
*/

let usuario = '';
export async function guardaDato(){
    tokenHeader();
    await axios.get("/user/loged").then((response) => {
        localStorage.setItem("usuario", JSON.stringify(response.data));
        console.log(localStorage.getItem('usuario'));
        usuario = JSON.parse(localStorage.getItem('usuario'));
      });

}
export  function usuarioGet() {
guardaDato()

return usuario;
}


export function datoprueba() {
    return 'hola';
}


