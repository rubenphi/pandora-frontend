import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

export function usuarioGet() {
    return JSON.parse(localStorage.getItem('usuario'));
}

 


