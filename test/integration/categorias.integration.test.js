// test/integration/categorias.integration.test.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

describe('Categorías - Tests de Integración', () => {
  let pool;

  beforeAll(async () => {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };
    
    pool = await sql.connect(config);
  });

  afterAll(async () => {
    await pool.close();
  });

  beforeEach(async () => {
    await pool.request().query('DELETE FROM CategoriasProducto');
  });

  describe('CRUD de Categorías', () => {
    test('debe crear una categoría', async () => {
      await pool.request()
        .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .input('CategoriaNombre', sql.NVarChar(50), 'Entradas')
        .input('CategoriaDescripcion', sql.NVarChar(200), 'Platos de entrada')
        .input('CategoriaEstado', sql.NChar(1), 'A')
        .query(`
          INSERT INTO CategoriasProducto 
          (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
          VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM CategoriasProducto WHERE CategoriaCodigo = \'CAT0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].CategoriaNombre).toBe('Entradas');
    });

    test('debe actualizar una categoría', async () => {
      await pool.request()
        .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .input('CategoriaNombre', sql.NVarChar(50), 'Entradas')
        .input('CategoriaDescripcion', sql.NVarChar(200), 'Descripción inicial')
        .input('CategoriaEstado', sql.NChar(1), 'A')
        .query(`
          INSERT INTO CategoriasProducto 
          (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
          VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
        `);
      
      await pool.request()
        .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .input('NuevoNombre', sql.NVarChar(50), 'Aperitivos')
        .query(`
          UPDATE CategoriasProducto 
          SET CategoriaNombre = @NuevoNombre 
          WHERE CategoriaCodigo = @CategoriaCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM CategoriasProducto WHERE CategoriaCodigo = \'CAT0000001\'');
      
      expect(result.recordset[0].CategoriaNombre).toBe('Aperitivos');
    });

    test('debe eliminar una categoría', async () => {
      await pool.request()
        .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .input('CategoriaNombre', sql.NVarChar(50), 'Entradas')
        .input('CategoriaDescripcion', sql.NVarChar(200), 'Descripción')
        .input('CategoriaEstado', sql.NChar(1), 'A')
        .query(`
          INSERT INTO CategoriasProducto 
          (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
          VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
        `);
      
      await pool.request()
        .query('DELETE FROM CategoriasProducto WHERE CategoriaCodigo = \'CAT0000001\'');
      
      const result = await pool.request()
        .query('SELECT * FROM CategoriasProducto WHERE CategoriaCodigo = \'CAT0000001\'');
      
      expect(result.recordset.length).toBe(0);
    });
  });

  describe('Validaciones de Constraint', () => {
    test('debe validar estado A o I', async () => {
      await expect(
        pool.request()
          .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
          .input('CategoriaNombre', sql.NVarChar(50), 'Test')
          .input('CategoriaDescripcion', sql.NVarChar(200), 'Desc')
          .input('CategoriaEstado', sql.NChar(1), 'X')
          .query(`
            INSERT INTO CategoriasProducto 
            (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
            VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
          `)
      ).rejects.toThrow();
    });
  });

  describe('Filtrado de Categorías', () => {
    beforeEach(async () => {
      const categorias = [
        { codigo: 'CAT0000001', nombre: 'Entradas', estado: 'A' },
        { codigo: 'CAT0000002', nombre: 'Platos Principales', estado: 'A' },
        { codigo: 'CAT0000003', nombre: 'Postres', estado: 'I' }
      ];
      
      for (const cat of categorias) {
        await pool.request()
          .input('CategoriaCodigo', sql.NChar(10), cat.codigo)
          .input('CategoriaNombre', sql.NVarChar(50), cat.nombre)
          .input('CategoriaDescripcion', sql.NVarChar(200), `Descripción ${cat.nombre}`)
          .input('CategoriaEstado', sql.NChar(1), cat.estado)
          .query(`
            INSERT INTO CategoriasProducto 
            (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
            VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
          `);
      }
    });

    test('debe obtener solo categorías activas', async () => {
      const result = await pool.request()
        .query("SELECT * FROM CategoriasProducto WHERE CategoriaEstado = 'A'");
      
      expect(result.recordset.length).toBe(2);
    });

    test('debe contar categorías por estado', async () => {
      const result = await pool.request()
        .query(`
          SELECT CategoriaEstado, COUNT(*) as Total
          FROM CategoriasProducto
          GROUP BY CategoriaEstado
        `);
      
      const activas = result.recordset.find(r => r.CategoriaEstado.trim() === 'A');
      const inactivas = result.recordset.find(r => r.CategoriaEstado.trim() === 'I');
      
      expect(activas.Total).toBe(2);
      expect(inactivas.Total).toBe(1);
    });
  });
});
