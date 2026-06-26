const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOne();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  const res = await fetch('http://localhost:5000/api/files/stats', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', text);
  process.exit(0);
});