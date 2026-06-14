import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: '65af3b123456789012345678', role: 'customer' }, 'vijjureddy20060830', { expiresIn: '1d' });

const payload = {
  pickupLocation: {
    address: 'Store location',
    latitude: 17.44,
    longitude: 78.39,
  },
  deliveryLocation: {
    address: '123 Main St, Hyd',
    fullAddress: '123 Main St, Hyd',
    latitude: 17.45,
    longitude: 78.40,
  },
  packageDetails: '2x Amul Milk',
  commerceItems: [
    {
      productName: 'Amul Milk',
      quantity: 2,
      unitPrice: 30,
      category: 'Dairy'
    }
  ],
  price: 60,
  deliveryFee: 0,
  platformFee: 0,
  taxAmount: 0,
  paymentMethod: 'online',
  shopId: '65af3b123456789012345678',
};

fetch('http://localhost:5003/api/orders/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
