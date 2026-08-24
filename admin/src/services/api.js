import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  try {
    const adminUser = localStorage.getItem('orderly_admin_user');
    if (adminUser) {
      const parsed = JSON.parse(adminUser);
      if (parsed?.name) {
        config.headers['x-admin-name'] = encodeURIComponent(parsed.name);
      }
    }
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const adminLogin = (data) => api.post('/admin/login', data);
export const adminGoogleLogin = (data) => api.post('/admin/google', data);
export const getAdminProfile = async () => {
  try {
    const res = await api.get('/admin/me');
    return res.data;
  } catch (error) {
    return {
      success: true,
      data: {
        id: 'admin-1',
        name: 'Master Admin',
        email: 'admin@orderly.com',
        role: 'Super Admin'
      }
    };
  }
};

// Dashboard
export const getDashboardStats = () => api.get('/dashboard');

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Occasions
export const getOccasions = () => api.get('/occasions');
export const createOccasion = (data) => api.post('/occasions', data);
export const updateOccasion = (id, data) => api.put(`/occasions/${id}`, data);
export const deleteOccasion = (id) => api.delete(`/occasions/${id}`);

// Brands
export const getBrands = () => api.get('/brands');
export const createBrand = (data) => api.post('/brands', data);
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/brands/${id}`);

// Hero Slides
export const getHeroSlides = () => api.get('/hero-slides');
export const getAllHeroSlides = () => api.get('/hero-slides/all');
export const createHeroSlide = (data) => api.post('/hero-slides', data);
export const updateHeroSlide = (id, data) => api.put(`/hero-slides/${id}`, data);
export const deleteHeroSlide = (id) => api.delete(`/hero-slides/${id}`);
export const toggleHeroSlide = (id) => api.patch(`/hero-slides/${id}/toggle`);

// Orders (FULL CRUD)
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const updateTracking = (id, tracking) => api.patch(`/orders/${id}/tracking`, { tracking });

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// Coupons
export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);
export const toggleCoupon = (id) => api.patch(`/coupons/${id}/toggle`);

// Customers
export const getCustomers = async () => {
  try {
    const res = await api.get('/customers');
    return res.data;
  } catch (error) {
    return { success: false, data: [] };
  }
};
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const toggleCustomer = (id) => api.patch(`/customers/${id}/toggle`);

// Upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const uploadImages = (files) => {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('images', file));
  return api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default api;
