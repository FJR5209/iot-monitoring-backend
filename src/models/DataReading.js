/*
 * =================================================================
 * FICHEIRO A CRIAR: src/models/DataReading.js
 * DESCRIÇÃO: Modelo para uma leitura de dados do sensor.
 * =================================================================
 */
import mongoose from 'mongoose';

const dataReadingSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const DataReading = mongoose.model('DataReading', dataReadingSchema);
export default DataReading;
