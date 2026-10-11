import axios from 'axios';

const api = axios.create({baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, ''), 
                        timeout: 15000, withCredentials:true}    
);

api.interceptors.request.use(async config=>{
    if(!['get','head','options'].includes((config.method||'get').toLowerCase())){
        const {data}=await api.get('/auth/csrf');
        config.headers[data.headerName]=data.token;
        }
    return config;
});

api.interceptors.response.use(response=>response,error=>{
    if(error.response?.status===401&&!['/auth/me','/auth/login'].includes(error.config?.url))window.dispatchEvent(new Event('roam:session-expired'));
    return Promise.reject(error);
});


export const getSession = () => api.get('/auth/me');
export const login = credentials => api.post('/auth/login', credentials);
export const register = details => api.post('/auth/register', details);
export const logout = () => api.post('/auth/logout');
export const getCars = () => api.get('/cars');
export const getOwnerCars = () => api.get('/fleet');
export const getRentals = () => api.get('/rentals');
export const deleteCar = id => api.delete(`/cars/${id}`);
export const addCar = car => api.post('/add', car);
export const getRentInfo = (id, days) => api.get(`/rent-info/${id}`, {params:{days}});
export const rentCar = (id, days) => api.post(`/rent/${id}`, null, {params:{days}});
export const returnCar = id => api.post(`/return/${id}`);
export const suggestCars = (fuelType, travelers) => api.get('/suggest', {params:{fuelType, travelers}});
export const errorMessage = e => typeof e.response?.data === 'string' ? e.response.data : e.response?.data?.message || e.message || 'Something went wrong.';
