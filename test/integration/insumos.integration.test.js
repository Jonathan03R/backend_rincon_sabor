// test/integration/insumos.integration.test.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

describe('Insumos - Tests de Integración', () => {
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
    await pool.request().query('DELETE FROM Insumos');
  });

  describe('CRUD de Insumos', () => {
    test('debe crear un insumo correctamente', async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('InsumoNombre', sql.NVarChar(100), 'Arroz')
        .input('InsumoUnidadMedida', sql.NVarChar(20), 'kg')
        .input('InsumoStockActual', sql.Decimal(10, 2), 50.5)
        .input('InsumoCompraUnidad', sql.Decimal(10, 2), 3.50)
        .query(`
          INSERT INTO Insumos 
          (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
          VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].InsumoNombre).toBe('Arroz');
      expect(result.recordset[0].InsumoUnidadMedida).toBe('kg');
      expect(parseFloat(result.recordset[0].InsumoStockActual)).toBe(50.5);
      expect(parseFloat(result.recordset[0].InsumoCompraUnidad)).toBe(3.50);
    });

    test('debe actualizar stock de insumo', async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('InsumoNombre', sql.NVarChar(100), 'Arroz')
        .input('InsumoUnidadMedida', sql.NVarChar(20), 'kg')
        .input('InsumoStockActual', sql.Decimal(10, 2), 50)
        .input('InsumoCompraUnidad', sql.Decimal(10, 2), 3.50)
        .query(`
          INSERT INTO Insumos 
          (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
          VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
        `);
      
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('NuevoStock', sql.Decimal(10, 2), 75.5)
        .query(`
          UPDATE Insumos 
          SET InsumoStockActual = @NuevoStock 
          WHERE InsumoCodigo = @InsumoCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      expect(parseFloat(result.recordset[0].InsumoStockActual)).toBe(75.5);
    });

    test('debe eliminar un insumo', async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('InsumoNombre', sql.NVarChar(100), 'Arroz')
        .input('InsumoUnidadMedida', sql.NVarChar(20), 'kg')
        .input('InsumoStockActual', sql.Decimal(10, 2), 50)
        .input('InsumoCompraUnidad', sql.Decimal(10, 2), 3.50)
        .query(`
          INSERT INTO Insumos 
          (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
          VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
        `);
      
      await pool.request()
        .query('DELETE FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      const result = await pool.request()
        .query('SELECT * FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      expect(result.recordset.length).toBe(0);
    });
  });

  describe('Validaciones de Unidad de Medida', () => {
    test('debe aceptar unidades válidas', async () => {
      const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad'];
      
      for (let i = 0; i < unidadesValidas.length; i++) {
        await pool.request()
          .input('InsumoCodigo', sql.NChar(10), `INS000000${i + 1}`)
          .input('InsumoNombre', sql.NVarChar(100), `Insumo ${i + 1}`)
          .input('InsumoUnidadMedida', sql.NVarChar(20), unidadesValidas[i])
          .input('InsumoStockActual', sql.Decimal(10, 2), 10)
          .input('InsumoCompraUnidad', sql.Decimal(10, 2), 5)
          .query(`
            INSERT INTO Insumos 
            (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
            VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
          `);
      }
      
      const result = await pool.request().query('SELECT * FROM Insumos');
      expect(result.recordset.length).toBe(5);
    });
  });

  describe('Consultas de Stock', () => {
    beforeEach(async () => {
      const insumos = [
        { codigo: 'INS0000001', nombre: 'Arroz', stock: 50, precio: 3.50 },
        { codigo: 'INS0000002', nombre: 'Pollo', stock: 0, precio: 12.00 },
        { codigo: 'INS0000003', nombre: 'Tomate', stock: 5, precio: 2.50 },
        { codigo: 'INS0000004', nombre: 'Cebolla', stock: 100, precio: 1.80 }
      ];
      
      for (const ins of insumos) {
        await pool.request()
          .input('InsumoCodigo', sql.NChar(10), ins.codigo)
          .input('InsumoNombre', sql.NVarChar(100), ins.nombre)
          .input('InsumoUnidadMedida', sql.NVarChar(20), 'kg')
          .input('InsumoStockActual', sql.Decimal(10, 2), ins.stock)
          .input('InsumoCompraUnidad', sql.Decimal(10, 2), ins.precio)
          .query(`
            INSERT INTO Insumos 
            (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
            VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
          `);
      }
    });

    test('debe detectar insumos con stock bajo', async () => {
      const result = await pool.request()
        .query('SELECT * FROM Insumos WHERE InsumoStockActual < 10');
      
      expect(result.recordset.length).toBe(2);
      const nombres = result.recordset.map(r => r.InsumoNombre);
      expect(nombres).toContain('Pollo');
      expect(nombres).toContain('Tomate');
    });

    test('debe detectar insumos agotados', async () => {
      const result = await pool.request()
        .query('SELECT * FROM Insumos WHERE InsumoStockActual = 0');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].InsumoNombre).toBe('Pollo');
    });

    test('debe calcular stock total', async () => {
      const result = await pool.request()
        .query('SELECT SUM(InsumoStockActual) as StockTotal FROM Insumos');
      
      expect(parseFloat(result.recordset[0].StockTotal)).toBe(155);
    });

    test('debe calcular valor total del inventario', async () => {
      const result = await pool.request()
        .query(`
          SELECT SUM(InsumoStockActual * InsumoCompraUnidad) as ValorTotal 
          FROM Insumos
        `);
      
      const valorTotal = parseFloat(result.recordset[0].ValorTotal);
      expect(valorTotal).toBeCloseTo(367.5, 1);
    });
  });

  describe('Operaciones de Stock', () => {
    beforeEach(async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('InsumoNombre', sql.NVarChar(100), 'Arroz')
        .input('InsumoUnidadMedida', sql.NVarChar(20), 'kg')
        .input('InsumoStockActual', sql.Decimal(10, 2), 50)
        .input('InsumoCompraUnidad', sql.Decimal(10, 2), 3.50)
        .query(`
          INSERT INTO Insumos 
          (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
          VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
        `);
    });

    test('debe descontar stock correctamente', async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('Cantidad', sql.Decimal(10, 2), 10.5)
        .query(`
          UPDATE Insumos 
          SET InsumoStockActual = InsumoStockActual - @Cantidad 
          WHERE InsumoCodigo = @InsumoCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT InsumoStockActual FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      expect(parseFloat(result.recordset[0].InsumoStockActual)).toBe(39.5);
    });

    test('debe agregar stock correctamente', async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('Cantidad', sql.Decimal(10, 2), 25)
        .query(`
          UPDATE Insumos 
          SET InsumoStockActual = InsumoStockActual + @Cantidad 
          WHERE InsumoCodigo = @InsumoCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT InsumoStockActual FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      expect(parseFloat(result.recordset[0].InsumoStockActual)).toBe(75);
    });
  });

  describe('Validación de Decimales', () => {
    test('debe manejar decimales en stock', async () => {
      await pool.request()
        .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('InsumoNombre', sql.NVarChar(100), 'Aceite')
        .input('InsumoUnidadMedida', sql.NVarChar(20), 'l')
        .input('InsumoStockActual', sql.Decimal(10, 2), 12.75)
        .input('InsumoCompraUnidad', sql.Decimal(10, 2), 8.99)
        .query(`
          INSERT INTO Insumos 
          (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
          VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Insumos WHERE InsumoCodigo = \'INS0000001\'');
      
      expect(parseFloat(result.recordset[0].InsumoStockActual)).toBe(12.75);
      expect(parseFloat(result.recordset[0].InsumoCompraUnidad)).toBe(8.99);
    });
  });
});
