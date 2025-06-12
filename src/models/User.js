/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/models/User.js
 * DESCRIÇÃO: Novos campos para nome, telefone, chave do WhatsApp e recuperação de senha.
 * =================================================================
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'O nome é obrigatório.'] },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phoneNumber: { type: String, trim: true }, // Número para notificações
  whatsappApiKey: { type: String, trim: true }, // Chave API do CallMeBot do próprio utilizador
  role: { type: String, enum: ['admin', 'viewer'], default: 'viewer' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); next(); });
userSchema.methods.comparePassword = async function(candidatePassword) { return await bcrypt.compare(candidatePassword, this.password); };
userSchema.methods.createPasswordResetToken = function() { const resetToken = crypto.randomBytes(32).toString('hex'); this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); this.passwordResetExpires = Date.now() + 10 * 60 * 1000; return resetToken; };

const User = mongoose.model('User', userSchema);
module.exports = User;
