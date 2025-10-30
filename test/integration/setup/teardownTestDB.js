// test/integration/setup/teardownTestDB.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

module.exports = async () => {
  console.log('\n🧹 Limpiando base de datos de test...\n');
  
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: 'master',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  let pool;

  try {
    pool = await sql.connect(config);
    
    // Verificar si existe
    const exists = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = '${process.env.DB_NAME}'
    `);
    
    if (exists.recordset.length > 0) {
      // Forzar cierre de conexiones
      await pool.request().query(`
        ALTER DATABASE ${process.env.DB_NAME} SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      `);
      
      // Eliminar base de datos
      await pool.request().query(`
        DROP DATABASE ${process.env.DB_NAME};
      `);
      
      console.log('✓ Base de datos de test eliminada');
    }
    
    await pool.close();
    console.log('✅ Limpieza completada\n');
    
  } catch (error) {
    console.error('❌ Error eliminando base de datos:', error.message);
    if (pool) await pool.close();
  }
};
