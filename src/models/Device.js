/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/models/Device.js
 * DESCRIÇÃO: Adicionado um novo campo 'lastAlertSent' para controlar o envio de alertas.
 * =================================================================
 */
const mongoose = require('mongoose');
const { randomBytes } = require('crypto');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  deviceKey: { type: String, unique: true, default: () => randomBytes(20).toString('hex'), select: false },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  settings: {
    tempMin: { type: Number, default: 2 },
    tempMax: { type: Number, default: 8 }
  },
  lastContact: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'alert'], default: 'inactive' },
  // NOVO CAMPO: Guarda a data e hora do último alerta enviado para este dispositivo.
  lastAlertSent: { type: Date }
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;