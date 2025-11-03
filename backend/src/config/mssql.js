// backend/src/config/mssql.js
const sql = require('mssql');
const useAad = process.env.SQL_USE_MI === 'true';

let poolPromise;

async function createConfig() {
  if (useAad) {
    // Managed Identity (เปิดใช้ภายหลังที่ Azure)
    const { DefaultAzureCredential } = require('@azure/identity');
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://database.windows.net/.default');
    return {
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      options: { encrypt: true, trustServerCertificate: false },
      authentication: { type: 'azure-active-directory-access-token', options: { token: token.token } },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    };
  } else {
    // SQL Username/Password (เริ่มต้นแบบง่าย)
    return {
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      options: { encrypt: true, trustServerCertificate: false },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    };
  }
}

async function getPool() {
  if (!poolPromise) {
    const config = await createConfig();
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}

module.exports = { sql, getPool };
