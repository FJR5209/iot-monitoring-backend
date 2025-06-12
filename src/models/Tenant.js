
/*
 * =================================================================
 * FICHEIRO A CRIAR: src/models/Tenant.js
 * DESCRIÇÃO: Modelo para o Tenant (a empresa/cliente).
 * =================================================================
 */
const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome da empresa é obrigatório.'],
    trim: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
module.exports = Tenant;

