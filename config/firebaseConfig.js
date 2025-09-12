var admin = require("firebase-admin");

var serviceAccount = require("../riconsabor-b1447-firebase-adminsdk-fbsvc-fdf93c4d88.json"); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;