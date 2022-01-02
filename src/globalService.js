import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}



export async  function usuarioGet() { 
    await axios.get("/user/loged").then((response) => {
    return response.data;
  }) 
}

 


