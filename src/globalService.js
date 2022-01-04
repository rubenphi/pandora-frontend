import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

export function usuarioGet() {
    return JSON.parse(localStorage.getItem('usuario'));
}

 

export function validateUser(){
    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
    axios.get("/user/loged").then((response) => {
        if(response.data.message == 'Unauthenticated') {
          return false
        }else 
        {
          localStorage.setItem("usuario", JSON.stringify(response.data));
          return true
        }
        
    });
}
