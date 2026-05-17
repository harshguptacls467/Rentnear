import React from 'react';
import { Link } from 'react-router-dom';

const Products = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">All Products</h1>
      <ul className="list-disc pl-5">
        <li><Link to="/products/1" className="text-primary hover:underline">Product 1</Link></li>
        <li><Link to="/products/2" className="text-primary hover:underline">Product 2</Link></li>
      </ul>
    </div>
  );
};

export default Products;
