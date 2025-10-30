// test/integration/menu.integration.test.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

describe('Menú - Tests de Integración', () => {
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
    await pool.request().query('DELETE FROM RecetaDetalles');
    await pool.request().query('DELETE FROM Recetas');
    await pool.request().query('DELETE FROM Pedidos.Menu');
    await pool.request().query('DELETE FROM Insumos');
    await pool.request().query('DELETE FROM CategoriasProducto');
    
    // Crear categoría de prueba
    await pool.request()
      .input('CategoriaCodigo', sql.NChar(10), 'CAT0000001')
      .input('CategoriaNombre', sql.NVarChar(50), 'Platos Principales')
      .input('CategoriaDescripcion', sql.NVarChar(200), 'Descripción')
      .input('CategoriaEstado', sql.NChar(1), 'A')
      .query(`
        INSERT INTO CategoriasProducto 
        (CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado)
        VALUES (@CategoriaCodigo, @CategoriaNombre, @CategoriaDescripcion, @CategoriaEstado)
      `);
    
    // Crear insumos de prueba
    await pool.request()
      .input('InsumoCodigo', sql.NChar(10), 'INS0000001')
      .input('InsumoNombre', sql.NVarChar(100), 'Arroz')
      .input('InsumoUnidadMedida', sql.NVarChar(20), 'kg')
      .input('InsumoStockActual', sql.Decimal(10, 2), 100)
      .input('InsumoCompraUnidad', sql.Decimal(10, 2), 3.50)
      .query(`
        INSERT INTO Insumos 
        (InsumoCodigo, InsumoNombre, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad)
        VALUES (@InsumoCodigo, @InsumoNombre, @InsumoUnidadMedida, @InsumoStockActual, @InsumoCompraUnidad)
      `);
  });

  describe('Menú con Receta (MenuEsPreparado = A)', () => {
    test('debe crear un menú con receta', async () => {
      // Crear menú
      await pool.request()
        .input('MenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('MenuPlatos', sql.NVarChar(100), 'Arroz con Pollo')
        .input('MenuDescripcion', sql.NVarChar(200), 'Delicioso plato')
        .input('MenuPrecio', sql.Decimal(10, 2), 15.50)
        .input('MenuEsPreparado', sql.NChar(1), 'A')
        .input('MenuCategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .query(`
          INSERT INTO Pedidos.Menu 
          (MenuCodigo, MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, MenuCategoriaCodigo)
          VALUES (@MenuCodigo, @MenuPlatos, @MenuDescripcion, @MenuPrecio, @MenuEsPreparado, @MenuCategoriaCodigo)
        `);
      
      // Crear receta
      await pool.request()
        .input('RecetaCodigo', sql.NChar(10), 'REC0000001')
        .input('RecetaMenuCodigo', sql.NChar(10), 'MEN0000001')
        .query(`
          INSERT INTO Recetas (RecetaCodigo, RecetaMenuCodigo)
          VALUES (@RecetaCodigo, @RecetaMenuCodigo)
        `);
      
      // Crear detalle de receta
      await pool.request()
        .input('DetalleRecetaCodigo', sql.NChar(10), 'DER0000001')
        .input('DetalleRecetaCodigoReceta', sql.NChar(10), 'REC0000001')
        .input('DetalleInsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('DetalleCantidad', sql.Decimal(10, 2), 0.5)
        .query(`
          INSERT INTO RecetaDetalles 
          (DetalleRecetaCodigo, DetalleRecetaCodigoReceta, DetalleInsumoCodigo, DetalleCantidad)
          VALUES (@DetalleRecetaCodigo, @DetalleRecetaCodigoReceta, @DetalleInsumoCodigo, @DetalleCantidad)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Pedidos.Menu WHERE MenuCodigo = \'MEN0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].MenuPlatos).toBe('Arroz con Pollo');
      expect(result.recordset[0].MenuEsPreparado.trim()).toBe('A');
    });

    test('debe obtener menú con sus recetas', async () => {
      // Crear menú
      await pool.request()
        .input('MenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('MenuPlatos', sql.NVarChar(100), 'Arroz con Pollo')
        .input('MenuDescripcion', sql.NVarChar(200), 'Delicioso plato')
        .input('MenuPrecio', sql.Decimal(10, 2), 15.50)
        .input('MenuEsPreparado', sql.NChar(1), 'A')
        .input('MenuCategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .query(`
          INSERT INTO Pedidos.Menu 
          (MenuCodigo, MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, MenuCategoriaCodigo)
          VALUES (@MenuCodigo, @MenuPlatos, @MenuDescripcion, @MenuPrecio, @MenuEsPreparado, @MenuCategoriaCodigo)
        `);
      
      // Crear receta
      await pool.request()
        .input('RecetaCodigo', sql.NChar(10), 'REC0000001')
        .input('RecetaMenuCodigo', sql.NChar(10), 'MEN0000001')
        .query(`
          INSERT INTO Recetas (RecetaCodigo, RecetaMenuCodigo)
          VALUES (@RecetaCodigo, @RecetaMenuCodigo)
        `);
      
      // Crear detalle
      await pool.request()
        .input('DetalleRecetaCodigo', sql.NChar(10), 'DER0000001')
        .input('DetalleRecetaCodigoReceta', sql.NChar(10), 'REC0000001')
        .input('DetalleInsumoCodigo', sql.NChar(10), 'INS0000001')
        .input('DetalleCantidad', sql.Decimal(10, 2), 0.5)
        .query(`
          INSERT INTO RecetaDetalles 
          (DetalleRecetaCodigo, DetalleRecetaCodigoReceta, DetalleInsumoCodigo, DetalleCantidad)
          VALUES (@DetalleRecetaCodigo, @DetalleRecetaCodigoReceta, @DetalleInsumoCodigo, @DetalleCantidad)
        `);
      
      const result = await pool.request()
        .query(`
          SELECT m.*, r.RecetaCodigo, rd.DetalleInsumoCodigo, rd.DetalleCantidad
          FROM Pedidos.Menu m
          LEFT JOIN Recetas r ON m.MenuCodigo = r.RecetaMenuCodigo
          LEFT JOIN RecetaDetalles rd ON r.RecetaCodigo = rd.DetalleRecetaCodigoReceta
          WHERE m.MenuCodigo = 'MEN0000001'
        `);
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].RecetaCodigo.trim()).toBe('REC0000001');
      expect(parseFloat(result.recordset[0].DetalleCantidad)).toBe(0.5);
    });
  });

  describe('Menú Directo (MenuEsPreparado = I)', () => {
    test('debe crear un menú con venta directa', async () => {
      await pool.request()
        .input('MenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('MenuPlatos', sql.NVarChar(100), 'Inca Kola 1L')
        .input('MenuDescripcion', sql.NVarChar(200), 'Bebida gaseosa')
        .input('MenuPrecio', sql.Decimal(10, 2), 5.00)
        .input('MenuEsPreparado', sql.NChar(1), 'I')
        .input('MenuCategoriaCodigo', sql.NChar(10), 'CAT0000001')
        .input('MenuInsumoCodigo', sql.NChar(10), 'INS0000001')
        .query(`
          INSERT INTO Pedidos.Menu 
          (MenuCodigo, MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, 
           MenuCategoriaCodigo, MenuInsumoCodigo)
          VALUES (@MenuCodigo, @MenuPlatos, @MenuDescripcion, @MenuPrecio, 
                  @MenuEsPreparado, @MenuCategoriaCodigo, @MenuInsumoCodigo)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Pedidos.Menu WHERE MenuCodigo = \'MEN0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].MenuEsPreparado.trim()).toBe('I');
      expect(result.recordset[0].MenuInsumoCodigo.trim()).toBe('INS0000001');
    });
  });

  describe('Consultas de Menú', () => {
    beforeEach(async () => {
      const menus = [
        { codigo: 'MEN0000001', nombre: 'Arroz con Pollo', precio: 15.50, esPreparado: 'A' },
        { codigo: 'MEN0000002', nombre: 'Lomo Saltado', precio: 18.00, esPreparado: 'A' },
        { codigo: 'MEN0000003', nombre: 'Inca Kola', precio: 5.00, esPreparado: 'I' }
      ];
      
      for (const menu of menus) {
        await pool.request()
          .input('MenuCodigo', sql.NChar(10), menu.codigo)
          .input('MenuPlatos', sql.NVarChar(100), menu.nombre)
          .input('MenuDescripcion', sql.NVarChar(200), `Descripción de ${menu.nombre}`)
          .input('MenuPrecio', sql.Decimal(10, 2), menu.precio)
          .input('MenuEsPreparado', sql.NChar(1), menu.esPreparado)
          .input('MenuCategoriaCodigo', sql.NChar(10), 'CAT0000001')
          .query(`
            INSERT INTO Pedidos.Menu 
            (MenuCodigo, MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, MenuCategoriaCodigo)
            VALUES (@MenuCodigo, @MenuPlatos, @MenuDescripcion, @MenuPrecio, @MenuEsPreparado, @MenuCategoriaCodigo)
          `);
      }
    });

    test('debe obtener todos los menús', async () => {
      const result = await pool.request()
        .query('SELECT * FROM Pedidos.Menu');
      
      expect(result.recordset.length).toBe(3);
    });

    test('debe filtrar menús preparados', async () => {
      const result = await pool.request()
        .query("SELECT * FROM Pedidos.Menu WHERE MenuEsPreparado = 'A'");
      
      expect(result.recordset.length).toBe(2);
    });

    test('debe calcular precio promedio', async () => {
      const result = await pool.request()
        .query('SELECT AVG(MenuPrecio) as PrecioPromedio FROM Pedidos.Menu');
      
      const promedio = parseFloat(result.recordset[0].PrecioPromedio);
      expect(promedio).toBeCloseTo(12.83, 1);
    });

    test('debe buscar menú por nombre', async () => {
      const result = await pool.request()
        .query("SELECT * FROM Pedidos.Menu WHERE MenuPlatos LIKE '%Pollo%'");
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].MenuPlatos).toBe('Arroz con Pollo');
    });
  });

  describe('Actualización de Menú', () => {
    test('debe actualizar precio de menú', async () => {
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
      
      await pool.request()
        .input('MenuCodigo', sql.NChar(10), 'MEN0000001')
        .input('NuevoPrecio', sql.Decimal(10, 2), 17.00)
        .query(`
          UPDATE Pedidos.Menu 
          SET MenuPrecio = @NuevoPrecio 
          WHERE MenuCodigo = @MenuCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT MenuPrecio FROM Pedidos.Menu WHERE MenuCodigo = \'MEN0000001\'');
      
      expect(parseFloat(result.recordset[0].MenuPrecio)).toBe(17.00);
    });
  });
});
