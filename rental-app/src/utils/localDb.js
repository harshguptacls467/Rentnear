import { MOCK_PRODUCTS, MOCK_BOOKINGS, MOCK_REVIEWS } from '../data/mockData';

export const getLocalProducts = () => {
  const data = localStorage.getItem('rentnear_local_products');
  if (!data) {
    localStorage.setItem('rentnear_local_products', JSON.stringify(MOCK_PRODUCTS));
    return MOCK_PRODUCTS;
  }
  return JSON.parse(data);
};

export const saveLocalProducts = (products) => {
  localStorage.setItem('rentnear_local_products', JSON.stringify(products));
};

export const getLocalBookings = () => {
  const data = localStorage.getItem('rentnear_local_bookings');
  if (!data) {
    localStorage.setItem('rentnear_local_bookings', JSON.stringify(MOCK_BOOKINGS));
    return MOCK_BOOKINGS;
  }
  return JSON.parse(data);
};

export const saveLocalBookings = (bookings) => {
  localStorage.setItem('rentnear_local_bookings', JSON.stringify(bookings));
};

export const getLocalUsers = () => {
  const data = localStorage.getItem('rentnear_local_users');
  return data ? JSON.parse(data) : {};
};

export const saveLocalUsers = (users) => {
  localStorage.setItem('rentnear_local_users', JSON.stringify(users));
};

export const getLocalReviews = () => {
  const data = localStorage.getItem('rentnear_local_reviews');
  if (!data) {
    localStorage.setItem('rentnear_local_reviews', JSON.stringify(MOCK_REVIEWS));
    return MOCK_REVIEWS;
  }
  return JSON.parse(data);
};

export const saveLocalReviews = (reviews) => {
  localStorage.setItem('rentnear_local_reviews', JSON.stringify(reviews));
};
