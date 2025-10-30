// test/integration/pedidos.integration.test.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

describe('Pedidos - Tests de Integración', () => {
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
    await pool.request().query('DELETE FROM Pedidos.DetallePedido');
    await pool.request().query('DELETE FROM Pedidos.Pedido');
    await pool.request().query('DELETE FROM Pedidos.Menu');
    await pool.request().query('DELETE FROM Pedidos.Mesa');
    await pool.request().query('DELETE FROM CategoriasProducto');
    
    // Crear datos de prueba
    await pool.request()
      .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
      .input('CategoriaNombre', sql.NVarChar(50), 'Platos')
      .input('CategoriaDescripcion', sql.NVarChar(200), 'Desc')
      .input('CategoriaEstado', sql.NChar(1), 'A')
      .query(`
        INSERT INTO CategoriasProducto 
        (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
        VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
      `);
    
    await pool.request()
      .input('MesaCodigo', sql.NChar(10), 'MES0000001')
      .input('MesaNumero', sql.Int, 1)
      .input('MesaCapacidad', sql.Int, 4)
      .input('MesaEstado', sql.NChar(1), 'O')
      .query(`
        INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
        VALUES (@MesaCodigo, @MesaNumero, @MesaCapacidad, @MesaEstado)
      `);
    
    await pool.request()
      .input('MenuCodigo', sql.NChar(10), 'MEN0000001')
      .input('MenuPlatos', sql.NVarChar(100), 'Arroz con Pollo')
      .input('MenuDescripcion', sql.NVarChar(200), 'Plato delicioso')
      .input('MenuPrecio', sql.Decimal(10, 2), 15.50)
      .input('MenuEsPreparado', sql.NChar(1), 'A')
      .input('MenuCategoriaCodigo', sql.NChar(10), 'CAT0000001')
      .query(`
        INSERT INTO Pedidos.Menu 
        (MenuCodigo, MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, MenuCategoriaCodigo)
        VALUES (@MenuCodigo, @MenuPlatos, @MenuDescripcion, @MenuPrecio, @MenuEsPreparado, @MenuCategoriaCodigo)
      `);
  });

  describe('CRUD de Pedidos', () => {
    test('debe crear un pedido completo', async () => {
      // Crear pedido
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000001')
        .input('PedidoMesaCodigo', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 15.50)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo, @PedidoMesaCodigo, @PedidoEstado, @PedidoTotal)
        `);
      
      // Crear detalle
      await pool.request()
        .input('DetallePedidoCodigo', sql.NChar(10), 'DPE0000001')
        .input('DetallePedidoCodigoPedido', sql.NChar(10), 'PED0000001')
        .input('DetallePedidoMenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('DetallePedidoCantidad', sql.Int, 1)
        .input('DetallePedidoPrecio', sql.Decimal(10, 2), 15.50)
        .input('DetallePedidoEstado', sql.NVarChar(20), 'Pendiente')
        .query(`
          INSERT INTO Pedidos.DetallePedido 
          (DetallePedidoCodigo, DetallePedidoCodigoPedido, DetallePedidoMenuCodigo, 
           DetallePedidoCantidad, DetallePedidoPrecio, DetallePedidoEstado)
          VALUES (@DetallePedidoCodigo, @DetallePedidoCodigoPedido, @DetallePedidoMenuCodigo,
                  @DetallePedidoCantidad, @DetallePedidoPrecio, @DetallePedidoEstado)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Pedidos.Pedido WHERE PedidoCodigo = \'PED0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(parseFloat(result.recordset[0].PedidoTotal)).toBe(15.50);
    });

    test('debe obtener pedido con sus detalles', async () => {
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000001')
        .input('PedidoMesaCodigo', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 15.50)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo, @PedidoMesaCodigo, @PedidoEstado, @PedidoTotal)
        `);
      
      await pool.request()
        .input('DetallePedidoCodigo', sql.NChar(10), 'DPE0000001')
        .input('DetallePedidoCodigoPedido', sql.NChar(10), 'PED0000001')
        .input('DetallePedidoMenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('DetallePedidoCantidad', sql.Int, 1)
        .input('DetallePedidoPrecio', sql.Decimal(10, 2), 15.50)
        .input('DetallePedidoEstado', sql.NVarChar(20), 'Pendiente')
        .query(`
          INSERT INTO Pedidos.DetallePedido 
          (DetallePedidoCodigo, DetallePedidoCodigoPedido, DetallePedidoMenuCodigo, 
           DetallePedidoCantidad, DetallePedidoPrecio, DetallePedidoEstado)
          VALUES (@DetallePedidoCodigo, @DetallePedidoCodigoPedido, @DetallePedidoMenuCodigo,
                  @DetallePedidoCantidad, @DetallePedidoPrecio, @DetallePedidoEstado)
        `);
      
      const result = await pool.request()
        .query(`
          SELECT p.*, d.DetallePedidoCodigo, d.DetallePedidoCantidad, d.DetallePedidoPrecio
          FROM Pedidos.Pedido p
          INNER JOIN Pedidos.DetallePedido d ON p.PedidoCodigo = d.DetallePedidoCodigoPedido
          WHERE p.PedidoCodigo = 'PED0000001'
        `);
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].DetallePedidoCodigo.trim()).toBe('DPE0000001');
    });
  });

  describe('Estados de Pedidos', () => {
    beforeEach(async () => {
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000001')
        .input('PedidoMesaCodigo', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 15.50)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo, @PedidoMesaCodigo, @PedidoEstado, @PedidoTotal)
        `);
    });

    test('debe actualizar estado de pedido', async () => {
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000001')
        .input('NuevoEstado', sql.NVarChar(20), 'En cocina')
        .query(`
          UPDATE Pedidos.Pedido 
          SET PedidoEstado = @NuevoEstado 
          WHERE PedidoCodigo = @PedidoCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT PedidoEstado FROM Pedidos.Pedido WHERE PedidoCodigo = \'PED0000001\'');
      
      expect(result.recordset[0].PedidoEstado).toBe('En cocina');
    });

    test('debe filtrar pedidos pendientes', async () => {
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000002')
        .input('PedidoMesaCodigo', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Servido')
        .input('PedidoTotal', sql.Decimal(10, 2), 20.00)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo, @PedidoMesaCodigo, @PedidoEstado, @PedidoTotal)
        `);
      
      const result = await pool.request()
        .query("SELECT * FROM Pedidos.Pedido WHERE PedidoEstado = 'Pendiente'");
      
      expect(result.recordset.length).toBe(1);
    });
  });

  describe('Cálculos de Totales', () => {
    test('debe calcular total de pedido correctamente', async () => {
      await pool.request()
        .input('MenuCodigo2', sql.NChar(10), 'MEN0000002')
        .input('MenuPlatos', sql.NVarChar(100), 'Lomo Saltado')
        .input('MenuDescripcion', sql.NVarChar(200), 'Plato')
        .input('MenuPrecio', sql.Decimal(10, 2), 18.00)
        .input('MenuEsPreparado', sql.NChar(1), 'A')
        .input('MenuCategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .query(`
          INSERT INTO Pedidos.Menu 
          (MenuCodigo, MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, MenuCategoriaCodigo)
          VALUES (@MenuCodigo2, @MenuPlatos, @MenuDescripcion, @MenuPrecio, @MenuEsPreparado, @MenuCategoriaCodigo)
        `);
      
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000001')
        .input('PedidoMesaCodigo', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 0)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo, @PedidoMesaCodigo, @PedidoEstado, @PedidoTotal)
        `);
      
      await pool.request()
        .input('DetallePedidoCodigo1', sql.NChar(10), 'DPE0000001')
        .input('DetallePedidoCodigoPedido', sql.NChar(10), 'PED0000001')
        .input('DetallePedidoMenuCodigo1', sql.NChar(10), 'MEN0000001')
        .input('DetallePedidoCantidad', sql.Int, 2)
        .input('DetallePedidoPrecio1', sql.Decimal(10, 2), 15.50)
        .input('DetallePedidoEstado', sql.NVarChar(20), 'Pendiente')
        .query(`
          INSERT INTO Pedidos.DetallePedido 
          (DetallePedidoCodigo, DetallePedidoCodigoPedido, DetallePedidoMenuCodigo, 
           DetallePedidoCantidad, DetallePedidoPrecio, DetallePedidoEstado)
          VALUES (@DetallePedidoCodigo1, @DetallePedidoCodigoPedido, @DetallePedidoMenuCodigo1,
                  @DetallePedidoCantidad, @DetallePedidoPrecio1, @DetallePedidoEstado)
        `);
      
      await pool.request()
        .input('DetallePedidoCodigo2', sql.NChar(10), 'DPE0000002')
        .input('DetallePedidoCodigoPedido', sql.NChar(10), 'PED0000001')
        .input('DetallePedidoMenuCodigo2', sql.NChar(10), 'MEN0000002')
        .input('DetallePedidoCantidad', sql.Int, 1)
        .input('DetallePedidoPrecio2', sql.Decimal(10, 2), 18.00)
        .input('DetallePedidoEstado', sql.NVarChar(20), 'Pendiente')
        .query(`
          INSERT INTO Pedidos.DetallePedido 
          (DetallePedidoCodigo, DetallePedidoCodigoPedido, DetallePedidoMenuCodigo, 
           DetallePedidoCantidad, DetallePedidoPrecio, DetallePedidoEstado)
          VALUES (@DetallePedidoCodigo2, @DetallePedidoCodigoPedido, @DetallePedidoMenuCodigo2,
                  @DetallePedidoCantidad, @DetallePedidoPrecio2, @DetallePedidoEstado)
        `);
      
      const result = await pool.request()
        .query(`
          SELECT SUM(DetallePedidoCantidad * DetallePedidoPrecio) as Total
          FROM Pedidos.DetallePedido
          WHERE DetallePedidoCodigoPedido = 'PED0000001'
        `);
      
      const total = parseFloat(result.recordset[0].Total);
      expect(total).toBe(49.00); // (2 * 15.50) + (1 * 18.00)
    });
  });

  describe('Consultas de Pedidos por Mesa', () => {
    test('debe obtener pedidos de una mesa específica', async () => {
      await pool.request()
        .input('MesaCodigo2', sql.NChar(10), 'MES0000002')
        .input('MesaNumero', sql.Int, 2)
        .input('MesaCapacidad', sql.Int, 2)
        .input('MesaEstado', sql.NChar(1), 'O')
        .query(`
          INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaCapacidad, MesaEstado)
          VALUES (@MesaCodigo2, @MesaNumero, @MesaCapacidad, @MesaEstado)
        `);
      
      await pool.request()
        .input('PedidoCodigo1', sql.NChar(10), 'PED0000001')
        .input('PedidoMesaCodigo1', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 15.50)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo1, @PedidoMesaCodigo1, @PedidoEstado, @PedidoTotal)
        `);
      
      await pool.request()
        .input('PedidoCodigo2', sql.NChar(10), 'PED0000002')
        .input('PedidoMesaCodigo2', sql.NChar(10), 'MES0000002')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 20.00)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo2, @PedidoMesaCodigo2, @PedidoEstado, @PedidoTotal)
        `);
      
      const result = await pool.request()
        .query("SELECT * FROM Pedidos.Pedido WHERE PedidoMesaCodigo = 'MES0000001'");
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].PedidoCodigo.trim()).toBe('PED0000001');
    });
  });

  describe('Eliminación de Pedidos', () => {
    test('debe eliminar pedido y sus detalles', async () => {
      await pool.request()
        .input('PedidoCodigo', sql.NChar(10), 'PED0000001')
        .input('PedidoMesaCodigo', sql.NChar(10), 'MES0000001')
        .input('PedidoEstado', sql.NVarChar(20), 'Pendiente')
        .input('PedidoTotal', sql.Decimal(10, 2), 15.50)
        .query(`
          INSERT INTO Pedidos.Pedido 
          (PedidoCodigo, PedidoMesaCodigo, PedidoEstado, PedidoTotal)
          VALUES (@PedidoCodigo, @PedidoMesaCodigo, @PedidoEstado, @PedidoTotal)
        `);
      
      await pool.request()
        .input('DetallePedidoCodigo', sql.NChar(10), 'DPE0000001')
        .input('DetallePedidoCodigoPedido', sql.NChar(10), 'PED0000001')
        .input('DetallePedidoMenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('DetallePedidoCantidad', sql.Int, 1)
        .input('DetallePedidoPrecio', sql.Decimal(10, 2), 15.50)
        .input('DetallePedidoEstado', sql.NVarChar(20), 'Pendiente')
        .query(`
          INSERT INTO Pedidos.DetallePedido 
          (DetallePedidoCodigo, DetallePedidoCodigoPedido, DetallePedidoMenuCodigo, 
           DetallePedidoCantidad, DetallePedidoPrecio, DetallePedidoEstado)
          VALUES (@DetallePedidoCodigo, @DetallePedidoCodigoPedido, @DetallePedidoMenuCodigo,
                  @DetallePedidoCantidad, @DetallePedidoPrecio, @DetallePedidoEstado)
        `);
      
      // Eliminar detalles primero
      await pool.request()
        .query("DELETE FROM Pedidos.DetallePedido WHERE DetallePedidoCodigoPedido = 'PED0000001'");
      
      // Eliminar pedido
      await pool.request()
        .query("DELETE FROM Pedidos.Pedido WHERE PedidoCodigo = 'PED0000001'");
      
      const resultPedido = await pool.request()
        .query('SELECT * FROM Pedidos.Pedido WHERE PedidoCodigo = \'PED0000001\'');
      
      const resultDetalles = await pool.request()
        .query('SELECT * FROM Pedidos.DetallePedido WHERE DetallePedidoCodigoPedido = \'PED0000001\'');
      
      expect(resultPedido.recordset.length).toBe(0);
      expect(resultDetalles.recordset.length).toBe(0);
    });
  });
});
