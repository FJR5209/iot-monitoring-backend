/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/models/Device.js
 * DESCRIÇÃO: Corrigida a definição do schema para garantir um deviceId único.
 * =================================================================
 */
const mongoose = require('mongoose');
const { randomBytes } = require('crypto');

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome do dispositivo é obrigatório.'],
    trim: true
  },
  // CORREÇÃO: O campo 'deviceId' que causava o erro foi removido.
  // A chave única de autenticação é a 'deviceKey'.
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


// Antes de continuar, vamos garantir que o índice problemático seja removido.
// Este código só será executado uma vez.
deviceSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Tenta remover o índice antigo que causava o erro.
            await mongoose.connection.collection('devices').dropIndex('deviceId_1');
            console.log("Índice 'deviceId_1' removido com sucesso.");
        } catch (error) {
            // Ignora o erro se o índice não existir, o que é esperado após a primeira execução.
            if (error.codeName !== 'IndexNotFound') {
                console.error("Erro ao tentar remover o índice 'deviceId_1':", error);
            }
        }
    }
    next();
});


const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;