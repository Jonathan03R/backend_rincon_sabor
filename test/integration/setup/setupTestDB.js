// test/integration/setup/setupTestDB.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('\n🔧 Configurando base de datos de test...\n');
  
  const masterConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: 'master',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  let masterPool;

  try {
    // Conectar a master
    masterPool = await sql.connect(masterConfig);
    console.log('✓ Conectado a SQL Server (master)');
    
    // Verificar si la base de datos existe
    const dbExists = await masterPool.request().query(`
      SELECT name FROM sys.databases WHERE name = '${process.env.DB_NAME}'
    `);
    
    if (dbExists.recordset.length > 0) {
      console.log('⚠ Base de datos de test ya existe, eliminando...');
      
      // Forzar cierre de conexiones
      await masterPool.request().query(`
        ALTER DATABASE ${process.env.DB_NAME} SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      `);
      
      // Eliminar base de datos
      await masterPool.request().query(`
        DROP DATABASE ${process.env.DB_NAME};
      `);
      
      console.log('✓ Base de datos anterior eliminada');
    }
    
    // Crear nueva base de datos
    await masterPool.request().query(`
      CREATE DATABASE ${process.env.DB_NAME};
    `);
    console.log('✓ Base de datos de test creada');
    
    await masterPool.close();
    
    // Conectar a la nueva base de datos
    const testConfig = { ...masterConfig, database: process.env.DB_NAME };
    const testPool = await sql.connect(testConfig);
    console.log('✓ Conectado a base de datos de test');
    
    // Crear esquemas
    console.log('⚙ Creando esquemas...');
    await testPool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.schemas WHERE name = 'Ventas')
        EXECUTE('CREATE SCHEMA Ventas');
      
      IF NOT EXISTS (SELECT name FROM sys.schemas WHERE name = 'Pedidos')
        EXECUTE('CREATE SCHEMA Pedidos');
      
      IF NOT EXISTS (SELECT name FROM sys.schemas WHERE name = 'Finanzas')
        EXECUTE('CREATE SCHEMA Finanzas');
    `);
    console.log('✓ Esquemas creados');
    
    // Crear tablas básicas para tests
    console.log('⚙ Creando tablas...');
    
    // Tabla Usuarios
    await testPool.request().query(`
      CREATE TABLE Usuarios (
        UsuarioCodigo NCHAR(10) PRIMARY KEY,
        UsuarioNombre NVARCHAR(100),
        UsuarioEmail NVARCHAR(150) UNIQUE NOT NULL,
        UsuarioDireccion NVARCHAR(150),
        UsuarioTelefono NVARCHAR(15),
        UsuarioFechaRegistro DATETIME DEFAULT GETDATE(),
        UsuarioEstado NCHAR(1) DEFAULT 'A',
        UsuarioRol NVARCHAR(10),
        CONSTRAINT usuarioEstadoCk CHECK (UsuarioEstado IN ('A', 'I'))
      );
    `);
    
    // Tabla CategoriasProducto
    await testPool.request().query(`
      CREATE TABLE CategoriasProducto (
        CategoriaCodigo NCHAR(10) PRIMARY KEY,
        CategoriaNombre NVARCHAR(50) NOT NULL,
        CategoriaDescripcion NVARCHAR(200),
        CategoriaEstado NCHAR(1) DEFAULT 'A',
        CONSTRAINT categoriaEstadoCk CHECK (CategoriaEstado IN ('A', 'I'))
      );
    `);
    
    // Tabla Insumos
    await testPool.request().query(`
      CREATE TABLE Insumos (
        InsumoCodigo NCHAR(10) PRIMARY KEY,
        InsumoNombre NVARCHAR(100) NOT NULL,
        InsumoUnidadMedida NVARCHAR(20),
        InsumoStockActual DECIMAL(10,2) DEFAULT 0,
        InsumoCompraUnidad DECIMAL(10,2)
      );
    `);
    
    // Tabla Pedidos.Mesa
    await testPool.request().query(`
      CREATE TABLE Pedidos.Mesa (
        MesaCodigo NCHAR(10) PRIMARY KEY,
        MesaNumero INT NOT NULL,
        MesaCapacidad INT,
        MesaEstado NCHAR(1) DEFAULT 'D',
        CONSTRAINT mesaEstadoCk CHECK (MesaEstado IN ('D', 'O', 'S', 'R'))
      );
    `);
    
    // Tabla Pedidos.Menu
    await testPool.request().query(`
      CREATE TABLE Pedidos.Menu (
        MenuCodigo NCHAR(10) PRIMARY KEY,
        MenuPlatos NVARCHAR(100),
        MenuDescripcion NVARCHAR(200),
        MenuPrecio DECIMAL(10,2),
        MenuEsPreparado NCHAR(1),
        MenuCategoriaCodigo NCHAR(10),
        MenuImageUrl NVARCHAR(500),
        MenuInsumoCodigo NCHAR(10),
        FOREIGN KEY (MenuCategoriaCodigo) REFERENCES CategoriasProducto(CategoriaCodigo)
      );
    `);
    
    // Tabla Recetas
    await testPool.request().query(`
      CREATE TABLE Recetas (
        RecetaCodigo NCHAR(10) PRIMARY KEY,
        RecetaMenuCodigo NCHAR(10),
        FOREIGN KEY (RecetaMenuCodigo) REFERENCES Pedidos.Menu(MenuCodigo)
      );
    `);
    
    // Tabla RecetaDetalles
    await testPool.request().query(`
      CREATE TABLE RecetaDetalles (
        DetalleRecetaCodigo NCHAR(10) PRIMARY KEY,
        DetalleRecetaCodigoReceta NCHAR(10),
        DetalleInsumoCodigo NCHAR(10),
        DetalleCantidad DECIMAL(10,2),
        FOREIGN KEY (DetalleRecetaCodigoReceta) REFERENCES Recetas(RecetaCodigo),
        FOREIGN KEY (DetalleInsumoCodigo) REFERENCES Insumos(InsumoCodigo)
      );
    `);
    
    // Tabla Pedidos.Pedido
    await testPool.request().query(`
      CREATE TABLE Pedidos.Pedido (
        PedidoCodigo NCHAR(10) PRIMARY KEY,
        PedidoMesaCodigo NCHAR(10),
        PedidoFecha DATETIME DEFAULT GETDATE(),
        PedidoEstado NVARCHAR(20) DEFAULT 'Pendiente',
        PedidoTotal DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (PedidoMesaCodigo) REFERENCES Pedidos.Mesa(MesaCodigo)
      );
    `);
    
    // Tabla Pedidos.DetallePedido
    await testPool.request().query(`
      CREATE TABLE Pedidos.DetallePedido (
        DetallePedidoCodigo NCHAR(10) PRIMARY KEY,
        DetallePedidoCodigoPedido NCHAR(10),
        DetallePedidoMenuCodigo NCHAR(10),
        DetallePedidoCantidad INT,
        DetallePedidoPrecio DECIMAL(10,2),
        DetallePedidoEstado NVARCHAR(20) DEFAULT 'Pendiente',
        FOREIGN KEY (DetallePedidoCodigoPedido) REFERENCES Pedidos.Pedido(PedidoCodigo),
        FOREIGN KEY (DetallePedidoMenuCodigo) REFERENCES Pedidos.Menu(MenuCodigo)
      );
    `);
    
    console.log('✓ Tablas creadas');
    
    await testPool.close();
    
    console.log('✅ Base de datos de test lista\n');
    
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error.message);
    if (masterPool) await masterPool.close();
    throw error;
  }
};
