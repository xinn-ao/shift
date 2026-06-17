import axios from 'axios';
import type { AxiosResponse } from 'axios';

const request = axios.create({
  baseURL: '',
  timeout: 5000,
  withCredentials: true,
});

request.interceptors.request.use(
  (config) => {
    // /api/login 以外だけJSON付与
    if (config.url !== '/api/login') {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    console.error('リクエスト異常：', error);
    return Promise.reject(error.response?.data || { msg: 'システムエラー' });
  }
);

export default request;