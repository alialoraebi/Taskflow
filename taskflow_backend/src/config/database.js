import mongoose from 'mongoose';

const resolveConnectionString = () => {
  const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
    USE_SRV,
  } = process.env;

  if (!DB_HOST || !DB_NAME) {
    throw new Error('Missing MongoDB configuration. Provide DB_HOST and DB_NAME.');
  }

  const port = DB_PORT || 27017;
  const user = DB_USER || '';
  const password = DB_PASSWORD || '';
  const credentials = user ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` : '';
  const protocol = USE_SRV === 'true' ? 'mongodb+srv' : 'mongodb';
  const hostSegment = USE_SRV === 'true' ? DB_HOST : `${DB_HOST}:${port}`;
  return `${protocol}://${credentials}${hostSegment}/${DB_NAME}`;
};

export const connectDatabase = async () => {
  try {
    const connectionString = resolveConnectionString();
    console.log('Attempting MongoDB connection...');
    const conn = await mongoose.connect(connectionString, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export default connectDatabase;
