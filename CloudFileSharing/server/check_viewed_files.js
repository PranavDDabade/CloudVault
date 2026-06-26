const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const File = require('./models/File');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const viewedFiles = await File.find({ viewCount: { $gt: 0 } });
  console.log('Viewed files:', viewedFiles.length);
  process.exit(0);
});