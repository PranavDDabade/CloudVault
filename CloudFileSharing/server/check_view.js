const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const File = require('./models/File');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOne();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  const file = await File.findOne({ owner: user._id });
  if (!file) {
    console.log('No file found for user');
    process.exit(0);
  }
  
  console.log('Before ViewCount:', file.viewCount);

  const res = await fetch('http://localhost:5000/api/files/' + file._id, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  const text = await res.text();
  console.log('STATUS:', res.status);
  
  const updatedFile = await File.findById(file._id);
  console.log('After ViewCount:', updatedFile.viewCount);
  process.exit(0);
});