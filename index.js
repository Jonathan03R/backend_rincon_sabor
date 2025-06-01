// index.js
const express = require('express');
const cors = require('cors');

const mesasRouter = require ('./routes/mesas');
const usuariosRouter = require('./routes/usuarios');


const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/mesas', mesasRouter);
app.use('/usuarios', usuariosRouter);


module.exports = app;
