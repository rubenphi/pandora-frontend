import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}



export function usuarioGet() { 
    tokenHeader();
    axios.get("/user/loged").then((response) => {
    return response.data;
  }) 
}

 


