import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Product Details</h1>
      <p>Viewing details for product ID: {id}</p>
    </div>
  );
};

export default ProductDetail;
