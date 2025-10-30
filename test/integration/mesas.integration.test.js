// test/integration/mesas.integration.test.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

describe('Mesas - Tests de Integración con SQL Server', () => {
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
    // Limpiar datos antes de cada test
    await pool.request().query('DELETE FROM Pedidos.Mesa');
  });

  describe('Inserción de Mesas', () => {
    test('debe insertar una mesa correctamente', async () => {
      await pool.request()
        .input('MesaCodigo', sql.NChar(10), 'MES0000001')
        .input('MesaNumero', sql.Int, 1)
        .input('MesaCapacidad', sql.Int, 4)
        .input('MesaEstado', sql.NChar(1), 'D')
        .query(`
          INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
          VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Pedidos.Mesa WHERE MesaCodigo = \'MES0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].MesaCodigo.trim()).toBe('MES0000001');
      expect(result.recordset[0].MesaNumero).toBe(1);
      expect(result.recordset[0].MesaCapacidad).toBe(4);
      expect(result.recordset[0].MesaEstado.trim()).toBe('D');
    });

    test('debe rechazar inserción con código duplicado', async () => {
      await pool.request()
        .input('MesaCodigo', sql.NChar(10), 'MES0000001')
        .input('MesaNumero', sql.Int, 1)
        .input('MesaCapacidad', sql.Int, 4)
        .input('MesaEstado', sql.NChar(1), 'D')
        .query(`
          INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
          VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
        `);
      
      await expect(
        pool.request()
          .input('MesaCodigo', sql.NChar(10), 'MES0000001')
          .input('MesaNumero', sql.Int, 2)
          .input('MesaCapacidad', sql.Int, 2)
          .input('MesaEstado', sql.NChar(1), 'D')
          .query(`
            INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
            VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
          `)
      ).rejects.toThrow();
    });
  });

  describe('Consulta de Mesas Sucias', () => {
    beforeEach(async () => {
      // Insertar datos de prueba
      const mesas = [
        { codigo: 'MES0000001', numero: 1, capacidad: 4, estado: 'S' },
        { codigo: 'MES0000002', numero: 2, capacidad: 2, estado: 'D' },
        { codigo: 'MES0000003', numero: 3, capacidad: 6, estado: 'S' },
        { codigo: 'MES0000004', numero: 4, capacidad: 4, estado: 'O' }
      ];
      
      for (const mesa of mesas) {
        await pool.request()
          .input('MesaCodigo', sql.NChar(10), mesa.codigo)
          .input('MesaNumero', sql.Int, mesa.numero)
          .input('MesaCapacidad', sql.Int, mesa.capacidad)
          .input('MesaEstado', sql.NChar(1), mesa.estado)
          .query(`
            INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
            VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
          `);
      }
    });

    test('debe obtener mesas sucias desde SQL Server', async () => {
      const result = await pool.request()
        .query("SELECT * FROM Pedidos.Mesa WHERE MesaEstado = 'S'");
      
      const mesasSucias = result.recordset;
      
      expect(mesasSucias.length).toBe(2);
      expect(mesasSucias[0].MesaCodigo.trim()).toBe('MES0000001');
      expect(mesasSucias[1].MesaCodigo.trim()).toBe('MES0000003');
    });

    test('debe contar mesas por estado', async () => {
      const result = await pool.request()
        .query(`
          SELECT MesaEstado, COUNT(*) as Total
          FROM Pedidos.Mesa
          GROUP BY MesaEstado
        `);
      
      const estadisticas = result.recordset;
      
      expect(estadisticas.length).toBe(3);
      
      const sucias = estadisticas.find(e => e.MesaEstado.trim() === 'S');
      const disponibles = estadisticas.find(e => e.MesaEstado.trim() === 'D');
      const ocupadas = estadisticas.find(e => e.MesaEstado.trim() === 'O');
      
      expect(sucias.Total).toBe(2);
      expect(disponibles.Total).toBe(1);
      expect(ocupadas.Total).toBe(1);
    });

    test('debe filtrar mesas disponibles', async () => {
      const result = await pool.request()
        .query("SELECT * FROM Pedidos.Mesa WHERE MesaEstado = 'D'");
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].MesaNumero).toBe(2);
    });
  });

  describe('Actualización de Estados', () => {
    beforeEach(async () => {
      await pool.request()
        .input('MesaCodigo', sql.NChar(10), 'MES0000001')
        .input('MesaNumero', sql.Int, 1)
        .input('MesaCapacidad', sql.Int, 4)
        .input('MesaEstado', sql.NChar(1), 'S')
        .query(`
          INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
          VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
        `);
    });

    test('debe actualizar mesa sucia a disponible', async () => {
      await pool.request()
        .input('MesaCodigo', sql.NChar(10), 'MES0000001')
        .input('NuevoEstado', sql.NChar(1), 'D')
        .query(`
          UPDATE Pedidos.Mesa 
          SET MesaEstado = @NuevoEstado 
          WHERE MesaCodigo = @MesaCodigo
        `);
      
      const result = await pool.request()
        .input('MesaCodigo', sql.NChar(10), 'MES0000001')
        .query('SELECT MesaEstado FROM Pedidos.Mesa WHERE MesaCodigo = @MesaCodigo');
      
      expect(result.recordset[0].MesaEstado.trim()).toBe('D');
    });

    test('debe rechazar estado inválido por constraint', async () => {
      await expect(
        pool.request()
          .input('MesaCodigo', sql.NChar(10), 'MES0000001')
          .input('NuevoEstado', sql.NChar(1), 'X')
          .query(`
            UPDATE Pedidos.Mesa 
            SET MesaEstado = @NuevoEstado 
            WHERE MesaCodigo = @MesaCodigo
          `)
      ).rejects.toThrow();
    });
  });

  describe('Capacidad de Mesas', () => {
    test('debe calcular capacidad total del restaurante', async () => {
      const mesas = [
        { codigo: 'MES0000001', numero: 1, capacidad: 4, estado: 'D' },
        { codigo: 'MES0000002', numero: 2, capacidad: 2, estado: 'O' },
        { codigo: 'MES0000003', numero: 3, capacidad: 6, estado: 'D' }
      ];
      
      for (const mesa of mesas) {
        await pool.request()
          .input('MesaCodigo', sql.NChar(10), mesa.codigo)
          .input('MesaNumero', sql.Int, mesa.numero)
          .input('MesaCapacidad', sql.Int, mesa.capacidad)
          .input('MesaEstado', sql.NChar(1), mesa.estado)
          .query(`
            INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
            VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
          `);
      }
      
      const result = await pool.request()
        .query('SELECT SUM(MesaCapacidad) as CapacidadTotal FROM Pedidos.Mesa');
      
      expect(result.recordset[0].CapacidadTotal).toBe(12);
    });
  });
});
