'use strict';

// Punto de entrada para el runtime serverless de Vercel. Vercel invoca este módulo como un
// handler de request (req, res) por cada pedido bajo /api/*; una app de Express es directamente
// compatible con esa firma, así que solo reexportamos la app ya configurada (sin app.listen()).
module.exports = require('../server/app');
