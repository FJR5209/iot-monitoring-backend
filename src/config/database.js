import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Ligado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro ao ligar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);

export default connectDB;