import axios from "axios";

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

export let usuario = axios.get("/user/loged").then((response) => {
    return response.data;
  }); 
