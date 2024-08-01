module.exports = {
  mongodbUri: process.env.MONGODB_URI,
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET,
};
