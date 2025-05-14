// index.js
const express = require('express');
const cors = require('cors');

const mesasRouter = require ('./routes/mesas');


const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/mesas', mesasRouter);


module.exports = app;
