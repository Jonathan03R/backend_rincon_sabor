var admin = require("firebase-admin");

var serviceAccount = require("./app-rincon-sabor-flutter-firebase-adminsdk-fbsvc-6cadf848d1.json"); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;