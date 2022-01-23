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
  var puerto = '8080';
  return window.location.protocol + '//' + window.location.host.split(':')[0] + ':' + puerto + '/' ;
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


