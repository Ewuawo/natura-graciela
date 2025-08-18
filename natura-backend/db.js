// db.js
const sql = require("mssql");
require("dotenv").config();

/**
 * Permite usar:
 *  - DB_SERVER=MSI               (instancia default)
 *  - DB_SERVER=MSI\SQLEXPRESS    (instancia nombrada)
 * y resuelve automáticamente host/instancia/puerto.
 */
function buildConfigFromEnv() {
  const rawServer = process.env.DB_SERVER || "localhost";
  const [host, instanceName] = rawServer.split("\\");

  // Si hay instancia nombrada, NO fuerces puerto (SQL Browser la resuelve)
  const explicitPort = (process.env.DB_PORT || "").trim();
  const port = instanceName
    ? undefined
    : explicitPort
    ? Number(explicitPort)
    : 1433;

  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: host,
    database: process.env.DB_DATABASE,
    ...(port ? { port } : {}), // sólo agrega port si existe
    options: {
      // En local/desarrollo:
      encrypt: false,
      trustServerCertificate: true,
      ...(instanceName ? { instanceName } : {}),
      enableArithAbort: true,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

const config = buildConfigFromEnv();

// Logs útiles para diagnosticar
console.log("🗄️  SQL config:", {
  server: config.server,
  instanceName: config.options.instanceName || "(default)",
  port: config.port || "(resolved by SQL Browser)",
  database: config.database,
});

const pool = new sql.ConnectionPool(config);
const poolPromise = pool
  .connect()
  .then(() => {
    console.log("✅ Conectado a SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Error conectando a SQL Server:", err.message);
    throw err;
  });

module.exports = { sql, poolPromise };
