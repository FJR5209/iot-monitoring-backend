import mongoose from 'mongoose';

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

export default connectDB;