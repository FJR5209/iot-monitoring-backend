/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/models/Device.js
 * DESCRIÇÃO: Removido o campo 'deviceId' que causava o conflito.
 * A chave única de autenticação do hardware é a 'deviceKey'.
 * =================================================================
 */
import mongoose from 'mongoose';
import { randomBytes } from 'crypto';

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome do dispositivo é obrigatório.'],
    trim: true
  },
  deviceKey: {
    type: String,
    unique: true,
    default: () => randomBytes(20).toString('hex'),
    select: false
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  settings: {
    tempMin: { type: Number, default: 2 },
    tempMax: { type: Number, default: 8 }
  },
  lastContact: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'alert'],
    default: 'inactive'
  },
  lastAlertSent: {
    type: Date
  }
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);
export default Device;
