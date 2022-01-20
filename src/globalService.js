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

export function basedeURL() {
  return "https://pandora-quiz.herokuapp.com/"
}

export function booltoInt(data) {
    if (data == true) {
      return 1
    } else {
      return 0
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
}
