

export function tokenHeader() {

    axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}
