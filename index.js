// index.js
const express = require('express');
const cors = require('cors');

const mesasRouter = require ('./routes/mesas');
const usuariosRouter = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const insumosRouter = require('./routes/insumos');
const menuRouter = require('./routes/menu');
const pedidosRouter = require('./routes/pedidos');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/mesas', mesasRouter);
app.use('/usuarios', usuariosRouter);
app.use('/categorias', categoriasRouter);
app.use('/insumos', insumosRouter);
app.use('/menu', menuRouter);   
app.use('/pedidos', pedidosRouter);

module.exports = app;
