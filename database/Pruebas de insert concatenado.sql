use db_ab9cf2_jrrestaurantebuens
go


INSERT INTO Pedidos.Mesa (MesaCodigo, MesaNumero, MesaEstado) VALUES
    ('MES0000001', '1', 'activa'),
    ('MES0000002', '2', 'activa'),
    ('MES0000003', '3', 'activa'),
    ('MES0000004', '4', 'activa'),
    ('MES0000005', '5', 'activa'),
    ('MES0000006', '6', 'activa'),
    ('MES0000007', '7', 'activa'),
    ('MES0000008', '8', 'activa'),
    ('MES0000009', '9', 'activa'),
    ('MES0000010', '10', 'activa'),
    ('MES0000011', '11', 'activa'),
    ('MES0000012', '12', 'activa');
go

UPDATE Pedidos.Mesa
SET MesaEstado = 'inactiva'
WHERE MesaNumero = 1;  

UPDATE Pedidos.Mesa
SET MesaEstado = 'ocupada'
WHERE MesaNumero = 2;
select * from Insumos
go
update Insumos
set  InsumoStockActual = 0
where InsumoCodigo = 'INS0000003'

INSERT INTO Usuarios (
    UsuarioCodigo,
    UsuarioNombre,
    UsuarioEmail,
    UsuarioDireccion,
    UsuarioTelefono,
    UsuarioRol
)
VALUES
('USE0000001', 'Cabeza Herrera, Freed Alexander', 'fcabezahe@ucvvitual.edu.pe', 'Av. Los Héroes 123', '987654321', 'admin'),
('USE0000002', 'De La Cruz Dominguez, Maritza Noemi', 'mcruzdom@ucvvirtual.edu.pe', 'Jr. Las Flores 456', '912345678', 'admin'),
('USE0000003', 'Layza Fernandez, Marycris Rubi', 'mlayzafe@ucvvirtual.edu.pe', 'Calle Lima 789', '923456789', 'admin'),
('USE0000004', 'Lujan Zavaleta, Roberto Felix', 'rlujanza@ucvvirtual.edu.pe', 'Av. Grau 101', '934567890', 'admin'),
('USE0000005', 'Roque Gonzales, Jonathan Jesús', 'jroquego@ucvvirtual.edu.pe', 'Jr. San Martín 202', '945678901', 'admin'),
('USE0000006', 'Usuario 1 Cocinero ', 'user01@gmail.com', 'direccion 123', '656565656', 'cocinero'  ),
('USE0000007', 'Usuario 2 Mesero ', 'user02@gmail.com', 'direccion 345', '984645754', 'mesero'  )
go


INSERT INTO Usuarios (
    UsuarioCodigo,
    UsuarioNombre,
    UsuarioEmail,
    UsuarioDireccion,
    UsuarioTelefono,
    UsuarioRol
)
SELECT
    'USE' + RIGHT('0000000' + CAST(
        ISNULL(MAX(CAST(SUBSTRING(UsuarioCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR
    ), 7),
    'Juan Pérez',
    'juan.perez@email.com7',
    'Calle Principal 123',
    '987654321',
    'mesero'
FROM Usuarios
WHERE LEFT(UsuarioCodigo, 3) = 'USE';

go


CREATE PROCEDURE InsertarUsuario
    @UsuarioNombre NVARCHAR(100),
    @UsuarioEmail NVARCHAR(150),
    @UsuarioDireccion NVARCHAR(150),
    @UsuarioTelefono NVARCHAR(15),
    @UsuarioRol NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NuevoCodigo NCHAR(10);

    -- Bloqueo para evitar concurrencia
    BEGIN TRAN;

    SELECT @NuevoCodigo = 'USE' + RIGHT('0000000' + CAST(
        ISNULL(MAX(CAST(SUBSTRING(UsuarioCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR
    ), 7)
    FROM Usuarios WITH (UPDLOCK, HOLDLOCK)
    WHERE LEFT(UsuarioCodigo, 3) = 'USE';

    INSERT INTO Usuarios (
        UsuarioCodigo,
        UsuarioNombre,
        UsuarioEmail,
        UsuarioDireccion,
        UsuarioTelefono,
        UsuarioRol
    )
    VALUES (
        @NuevoCodigo,
        @UsuarioNombre,
        @UsuarioEmail,
        @UsuarioDireccion,
        @UsuarioTelefono,
        @UsuarioRol
    );

    COMMIT;
END;
GO


EXEC InsertarUsuario
    @UsuarioNombre = 'María López',
    @UsuarioEmail = 'maria.lopez@email.2com',
    @UsuarioDireccion = 'Av. Siempre Viva 742',
    @UsuarioTelefono = '123456789',
    @UsuarioRol = 'cocinero';

	
select * from Usuarios
go

insert into Pedidos.Pedido (
	PedidoCodigo,
	PedidoFechaHora,
	PedidoTotal,
	PedidoEstado,
	PedidoMesaCodigo
) values (
	'PED0000001',
	getdate(),
	50.00,
	'Pendiente',
	'MES0000005'
);
go

SELECT * FROM Pedidos.Mesa
go

insert into Pedidos.DetallePedido (
	detallePedidoCodigo,
	detallePedidoSubtotal,
	detallePedidoCantidad,
	detallePedidoEstado,
	detallePedidoNotas,
	detallePedidoPedidoCodigo,
	detallePedidoMenuCodigo
) values (
	'DPE0000001',
	25.00,
	2,
	'Pendiente',
	'Sin cebolla',
	'PED0000001',
	'MEN0000001'
);


insert into Pedidos.DetallePedido (
	detallePedidoCodigo,
	detallePedidoSubtotal,
	detallePedidoCantidad,
	detallePedidoEstado,
	detallePedidoNotas,
	detallePedidoPedidoCodigo,
	detallePedidoMenuCodigo
) values (
	'DPE0000002',
	45.00,
	3,
	'Pendiente',
	'Sin tomate',
	'PED0000001',
	'MEN0000002'
);



SELECT * FROM Pedidos.Menu
go
