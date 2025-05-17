import axios from 'axios';

const BASE_URL = "http://localhost:8080";

export const getCars = () => axios.get(`${BASE_URL}/cars`);
export const addCar = (car) => {
  return axios.post(`${BASE_URL}/add`, car, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const getRentInfo = (id, days) =>
  axios.get(`${BASE_URL}/rent-info/${id}`, {
    params: { days }
  });

export const rentCar = (id, days) =>
  axios.post(`${BASE_URL}/rent/${id}`, null, {
    params: { days }
  });

export const suggestCars = (fuelType, travelers) => {
  return axios.get(`${BASE_URL}/suggest`, {
    params: {
      fuelType,
      travelers
    }
  });
};