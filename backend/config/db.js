const mongoose = require('mongoose');

const withDbName = (mongoUri, defaultDbName) => {
  if (!mongoUri) return mongoUri;
  try {
    const url = new URL(mongoUri);
    const pathname = url.pathname ?? '';
    const hasDbName = pathname.length > 1;
    if (hasDbName) return mongoUri;
    url.pathname = `/${defaultDbName}`;
    return url.toString();
  } catch {
    return mongoUri;
  }
};

const connectDB = async () => {
  try {
    const uri = withDbName(process.env.MONGO_URI, process.env.MONGO_DB_NAME || 'pdf_manager');
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  } catch (error) {
    console.error(` Error: ${error.message}`);
 
    process.exit(1);
  }
};

module.exports = connectDB;
