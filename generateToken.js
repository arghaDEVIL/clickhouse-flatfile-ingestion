const jwt = require('jsonwebtoken');

// Secret key (store this in an environment variable or keep it private)
const secretKey = 'your-secret-key';

// Payload: the data you want to encode in the token
const payload = {
  userId: 123,
  username: 'testuser',
  role: 'admin', // You can include any custom claims here
};

// Options for token expiration
const options = {
  expiresIn: '1h', // Token expires in 1 hour
};

// Generate the JWT token
const token = jwt.sign(payload, secretKey, options);

console.log('Generated JWT:', token);
