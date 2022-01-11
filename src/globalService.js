import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

export function usuarioGet() {
  if (localStorage.getItem('usuario') == undefined){
    return null;
  } else{
    return JSON.parse(localStorage.getItem('usuario'));
  }
    
}

 

export function validateUser(){
    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
    axios.get("/user/loged").then((response) => {
        if(response.data.message == 'Unauthenticated') {
          localStorage.removeItem('usuario')
        }else 
        {
          localStorage.setItem("usuario", JSON.stringify(response.data));
        }
        
    });
}
