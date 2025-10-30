// test/integration/usuarios.integration.test.js
require('dotenv').config({ path: '.env.test' });
const sql = require('mssql');

describe('Usuarios - Tests de Integración', () => {
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
    await pool.request().query('DELETE FROM Usuarios');
  });

  describe('CRUD de Usuarios', () => {
    test('debe crear un usuario correctamente', async () => {
      await pool.request()
        .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
        .input('UsuarioNombre', sql.NVarChar(100), 'Juan Pérez')
        .input('UsuarioEmail', sql.NVarChar(150), 'juan@example.com')
        .input('UsuarioDireccion', sql.NVarChar(150), 'Av. Principal 123')
        .input('UsuarioTelefono', sql.NVarChar(15), '987654321')
        .input('UsuarioEstado', sql.NChar(1), 'A')
        .input('UsuarioRol', sql.NVarChar(10), 'mesero')
        .query(`
          INSERT INTO Usuarios 
          (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
           UsuarioTelefono, UsuarioEstado, UsuarioRol)
          VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                  @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Usuarios WHERE UsuarioCodigo = \'USE0000001\'');
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].UsuarioNombre).toBe('Juan Pérez');
      expect(result.recordset[0].UsuarioEmail).toBe('juan@example.com');
      expect(result.recordset[0].UsuarioRol).toBe('mesero');
    });

    test('debe rechazar email duplicado', async () => {
      await pool.request()
        .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
        .input('UsuarioNombre', sql.NVarChar(100), 'Usuario 1')
        .input('UsuarioEmail', sql.NVarChar(150), 'duplicado@example.com')
        .input('UsuarioDireccion', sql.NVarChar(150), 'Dirección 1')
        .input('UsuarioTelefono', sql.NVarChar(15), '111111111')
        .input('UsuarioEstado', sql.NChar(1), 'A')
        .input('UsuarioRol', sql.NVarChar(10), 'admin')
        .query(`
          INSERT INTO Usuarios 
          (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
           UsuarioTelefono, UsuarioEstado, UsuarioRol)
          VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                  @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
        `);
      
      await expect(
        pool.request()
          .input('UsuarioCodigo', sql.NChar(10), 'USE0000002')
          .input('UsuarioNombre', sql.NVarChar(100), 'Usuario 2')
          .input('UsuarioEmail', sql.NVarChar(150), 'duplicado@example.com')
          .input('UsuarioDireccion', sql.NVarChar(150), 'Dirección 2')
          .input('UsuarioTelefono', sql.NVarChar(15), '222222222')
          .input('UsuarioEstado', sql.NChar(1), 'A')
          .input('UsuarioRol', sql.NVarChar(10), 'mesero')
          .query(`
            INSERT INTO Usuarios 
            (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
             UsuarioTelefono, UsuarioEstado, UsuarioRol)
            VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                    @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
          `)
      ).rejects.toThrow();
    });

    test('debe actualizar datos de usuario', async () => {
      await pool.request()
        .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
        .input('UsuarioNombre', sql.NVarChar(100), 'Juan Pérez')
        .input('UsuarioEmail', sql.NVarChar(150), 'juan@example.com')
        .input('UsuarioDireccion', sql.NVarChar(150), 'Av. Principal 123')
        .input('UsuarioTelefono', sql.NVarChar(15), '987654321')
        .input('UsuarioEstado', sql.NChar(1), 'A')
        .input('UsuarioRol', sql.NVarChar(10), 'mesero')
        .query(`
          INSERT INTO Usuarios 
          (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
           UsuarioTelefono, UsuarioEstado, UsuarioRol)
          VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                  @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
        `);
      
      await pool.request()
        .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
        .input('NuevoTelefono', sql.NVarChar(15), '999888777')
        .query(`
          UPDATE Usuarios 
          SET UsuarioTelefono = @NuevoTelefono 
          WHERE UsuarioCodigo = @UsuarioCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT * FROM Usuarios WHERE UsuarioCodigo = \'USE0000001\'');
      
      expect(result.recordset[0].UsuarioTelefono).toBe('999888777');
    });
  });

  describe('Validaciones de Estado', () => {
    test('debe validar estados A o I', async () => {
      await expect(
        pool.request()
          .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
          .input('UsuarioNombre', sql.NVarChar(100), 'Test')
          .input('UsuarioEmail', sql.NVarChar(150), 'test@example.com')
          .input('UsuarioDireccion', sql.NVarChar(150), 'Dir')
          .input('UsuarioTelefono', sql.NVarChar(15), '111111111')
          .input('UsuarioEstado', sql.NChar(1), 'X')
          .input('UsuarioRol', sql.NVarChar(10), 'admin')
          .query(`
            INSERT INTO Usuarios 
            (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
             UsuarioTelefono, UsuarioEstado, UsuarioRol)
            VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                    @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
          `)
      ).rejects.toThrow();
    });
  });

  describe('Filtros y Consultas', () => {
    beforeEach(async () => {
      const usuarios = [
        { codigo: 'USE0000001', nombre: 'Admin User', email: 'admin@example.com', rol: 'admin', estado: 'A' },
        { codigo: 'USE0000002', nombre: 'Mesero 1', email: 'mesero1@example.com', rol: 'mesero', estado: 'A' },
        { codigo: 'USE0000003', nombre: 'Cocinero 1', email: 'cocinero1@example.com', rol: 'cocinero', estado: 'A' },
        { codigo: 'USE0000004', nombre: 'Mesero Inactivo', email: 'mesero2@example.com', rol: 'mesero', estado: 'I' }
      ];
      
      for (const usr of usuarios) {
        await pool.request()
          .input('UsuarioCodigo', sql.NChar(10), usr.codigo)
          .input('UsuarioNombre', sql.NVarChar(100), usr.nombre)
          .input('UsuarioEmail', sql.NVarChar(150), usr.email)
          .input('UsuarioDireccion', sql.NVarChar(150), 'Dirección')
          .input('UsuarioTelefono', sql.NVarChar(15), '987654321')
          .input('UsuarioEstado', sql.NChar(1), usr.estado)
          .input('UsuarioRol', sql.NVarChar(10), usr.rol)
          .query(`
            INSERT INTO Usuarios 
            (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
             UsuarioTelefono, UsuarioEstado, UsuarioRol)
            VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                    @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
          `);
      }
    });

    test('debe filtrar usuarios por rol', async () => {
      const result = await pool.request()
        .query("SELECT * FROM Usuarios WHERE UsuarioRol = 'mesero'");
      
      expect(result.recordset.length).toBe(2);
    });

    test('debe contar usuarios activos', async () => {
      const result = await pool.request()
        .query("SELECT COUNT(*) as Total FROM Usuarios WHERE UsuarioEstado = 'A'");
      
      expect(result.recordset[0].Total).toBe(3);
    });

    test('debe buscar usuario por email', async () => {
      const result = await pool.request()
        .query("SELECT * FROM Usuarios WHERE UsuarioEmail = 'admin@example.com'");
      
      expect(result.recordset.length).toBe(1);
      expect(result.recordset[0].UsuarioRol).toBe('admin');
    });

    test('debe contar usuarios por rol', async () => {
      const result = await pool.request()
        .query(`
          SELECT UsuarioRol, COUNT(*) as Total
          FROM Usuarios
          GROUP BY UsuarioRol
        `);
      
      expect(result.recordset.length).toBe(3);
      const meseros = result.recordset.find(r => r.UsuarioRol === 'mesero');
      expect(meseros.Total).toBe(2);
    });
  });

  describe('Cambio de Estado', () => {
    test('debe cambiar usuario de activo a inactivo', async () => {
      await pool.request()
        .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
        .input('UsuarioNombre', sql.NVarChar(100), 'Test User')
        .input('UsuarioEmail', sql.NVarChar(150), 'test@example.com')
        .input('UsuarioDireccion', sql.NVarChar(150), 'Dir')
        .input('UsuarioTelefono', sql.NVarChar(15), '987654321')
        .input('UsuarioEstado', sql.NChar(1), 'A')
        .input('UsuarioRol', sql.NVarChar(10), 'mesero')
        .query(`
          INSERT INTO Usuarios 
          (UsuarioCodigo, UsuarioNombre, UsuarioEmail, UsuarioDireccion, 
           UsuarioTelefono, UsuarioEstado, UsuarioRol)
          VALUES (@UsuarioCodigo, @UsuarioNombre, @UsuarioEmail, @UsuarioDireccion,
                  @UsuarioTelefono, @UsuarioEstado, @UsuarioRol)
        `);
      
      await pool.request()
        .input('UsuarioCodigo', sql.NChar(10), 'USE0000001')
        .query(`
          UPDATE Usuarios 
          SET UsuarioEstado = 'I' 
          WHERE UsuarioCodigo = @UsuarioCodigo
        `);
      
      const result = await pool.request()
        .query('SELECT UsuarioEstado FROM Usuarios WHERE UsuarioCodigo = \'USE0000001\'');
      
      expect(result.recordset[0].UsuarioEstado.trim()).toBe('I');
    });
  });
});
