import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

export function usuarioGet() {
  if (localStorage.getItem('usuario') == undefined){
    return false;
  } else{
    return JSON.parse(localStorage.getItem('usuario'));
  }
    
}

 

export function adminOprofesor(){
   tokenHeader()
   if (usuarioGet().rol == 'admin') {
     return true;
   } else if (usuarioGet().rol == 'profesor') {
     return true;
   } else {
     return false;
   }
   
   usuarioGet()
}
