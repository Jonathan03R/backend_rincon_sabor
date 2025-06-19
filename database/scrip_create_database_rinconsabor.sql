
use db_ab9cf2_jrrestaurantebuens
go


--CREACI�N DE ESQUEMAS PARA QUE NO SALGA ERROR	
IF not exists 
	(select name from sys.schemas where name = 'Ventas')
		Begin
			Execute('Create schema Ventas')
		End
GO

IF not exists 
	(select name from sys.schemas where name = 'Pedidos')
		Begin
			Execute('Create schema Pedidos')
		End
GO

IF not exists 
	(select name from sys.schemas where name = 'Finanzas')
		Begin
			Execute('Create schema Finanzas')
		End
GO


create table Usuarios
	(
		UsuarioCodigo		nchar(10),
		UsuarioNombre		nvarchar(100),
		UsuarioEmail		nvarchar(150) unique not null,
		UsuarioDireccion	nvarchar(150),
		UsuarioTelefono		nvarchar(15),
		UsuarioFechaRegistro datetime default getDate(),
		UsuarioEstado		nchar(1) default 'A',
		UsuarioRol			nvarchar(10),
	
		constraint usuarioCodigoPk primary key (usuarioCodigo),
		constraint usuarioEstadoCk check (usuarioEstado = 'A' or usuarioEstado = 'I'), -- A es activo y I es inactivo
		constraint usuarioRolCk check (usuarioRol in ('admin', 'cocinero', 'mesero'))
	) 
go

create table CategoriasProducto
	(
		CategoriaCodigo		nchar(10),
		CategoriaNombre		nvarchar(100),
		CategoriaEstado		nchar(1) default 'A',
		CategoriaDescripcion nvarchar(200),

		constraint CategoriaCodigoPk primary key (CategoriaCodigo),
		constraint CategoriaEstadoCk check (CategoriaEstado='A' or CategoriaEstado = 'I' ) -- A es activo I es inactivo
	) 
go

create table Pedidos.Mesa 
	(
		MesaCodigo		nchar(10),
		MesaNumero		nvarchar(10) not null, 
		MesaEstado		nvarchar(20) default 'activa',

		constraint MesaCodigoPk primary key (MesaCodigo),
		constraint MesaEstadoCk check (MesaEstado in ('inactiva', 'ocupada', 'activa' )) --- blabla bla lo mismo  
	) 
go

UPDATE Pedidos.Mesa SET MesaEstado = 'disponible' WHERE MesaEstado = 'activa';
UPDATE Pedidos.Mesa SET MesaEstado = 'ocupada' WHERE MesaEstado = 'inactiva';

-- Paso 2: Elimina el CHECK constraint viejo
ALTER TABLE Pedidos.Mesa DROP CONSTRAINT MesaEstadoCk;

-- Paso 3: Elimina el DEFAULT viejo
ALTER TABLE Pedidos.Mesa DROP CONSTRAINT DF_MesaEstado;

-- Paso 4: Agrega el nuevo CHECK constraint
ALTER TABLE Pedidos.Mesa
ADD CONSTRAINT MesaEstadoCk
CHECK (MesaEstado IN ('disponible', 'ocupada', 'esperando', 'mantenimiento'));

-- Paso 5: Agrega el nuevo DEFAULT
ALTER TABLE Pedidos.Mesa
ADD CONSTRAINT DF_MesaEstado
DEFAULT 'disponible' FOR MesaEstado;

go
create table Pedidos.Pedido
	(
		PedidoCodigo		nchar(10),
		PedidoFechaHora		datetime default getDate(),
		PedidoTotal			decimal(10,2) not null,
		PedidoEstado		nvarchar(20) default 'Pendiente',
		PedidoMesaCodigo	nchar(10) --foranea :D

		constraint PedidoCodigoPk primary key (PedidoCodigo),
		constraint PedidoEstadoCk check (PedidoEstado in ('Pendiente', 'En cocina', 'Listo', 'Servido', 'Cancelado')),
		constraint PedidoMesaCodigoFk foreign key (PedidoMesaCodigo) references Pedidos.Mesa(MesaCodigo)
	)
go




create table Insumos 
(
	InsumoCodigo		nchar(10),
	InsumoNombre		nvarchar(200),
	InsumoUnidadMedida	nvarchar(50) not null, -- Kg, unidad, litro
	InsumoStockActual	decimal(10,2) not null default 0,
	InsumoCompraUnidad	decimal(10,2) not null default 0,
	InsumoEstado		nchar(1) default 'A' --A activo I Inactivo

	constraint InsumoCodigoPk primary key (InsumoCodigo),
	constraint InsumoEstadoCk check (InsumoEstado = 'A' or InsumoEstado ='I' )
)
go


create table Pedidos.Menu
	(
		MenuCodigo		nchar(10),
		MenuPlatos		nvarchar(100)not null,
		MenuDescripcion nvarchar(500),
		MenuPrecio		decimal(10,2) not null, --- este seria el precio de venta
		MenuEstado		nchar(1) default 'A',
		MenuImageUrl		nvarchar(max) , 
		MenuEsPreparado nchar(1) not null, -- 'A' Si tiene receta o 'I' si no tiene receta
		MenuInsumoCodigo nchar(10) null, -- solo si es vendible sin receta asi que posiblemnte sea null
		MenuCategoriaCodigo	nchar(10),

		constraint MenuCodigoFk primary key (MenuCodigo),
		constraint MenuCategoriaCodigoFk foreign key (MenuCategoriaCodigo) references CategoriasProducto(CategoriaCodigo),
		constraint MenuInsumoCodigoFk foreign key (MenuInsumoCodigo) references Insumos(InsumoCodigo),
		constraint MenuEsPreparadoCk check (MenuEsPreparado = 'A' or MenuEsPreparado = 'I'),
		constraint MenuEstadoCk check (MenuEstado = 'A' or MenuEstado = 'I') -- lo mismo que arriba �e�e�e 

	)
go


create table Recetas
(
	RecetaCodigo		nchar(10),
	RecetaMenuCodigo	nchar(10) unique, --- un menu solo deberiatener una receta.
	RecetaEstado		nchar(1) default 'A'
	constraint RecetaCodigoPk primary key (RecetaCodigo),
	constraint RecetaMenuFk foreign key (RecetaMenuCodigo) references Pedidos.Menu (MenuCodigo),
	constraint RecetaEstadoCk check(RecetaEstado = 'A'  or RecetaEstado = 'I')
)
go


create table RecetaDetalles
(
	RecetaDetalleCodigo				nchar(10),
	RecetaDetalleReceta				nchar(10),
	RecetaDetalleInsumo				nchar(10),
	RecetaDetalleCantidadporPlato	decimal (10,2)  not null , -- cuanto de ese insumo lleva el plato

	constraint RecetaDetalleCodigoPk primary key (RecetaDetalleCodigo),
	constraint RecetaDetalleRecetaFk foreign key (RecetaDetalleReceta) references Recetas(RecetaCodigo),
	constraint RecetaDetalleInsumoFk foreign key (RecetaDetalleInsumo) references Insumos (InsumoCodigo)
)
go


create table Pedidos.DetallePedido
	(
	detallePedidoCodigo          nchar(10),
	detallePedidoSubtotal        decimal(10,2) not null, --precio unitario
	detallePedidoCantidad        numeric not null,
	detallePedidoEstado          nvarchar(20) default 'Pendiente',
	detallePedidoNotas		     nvarchar(200) ,
	detallePedidoPedidoCodigo    nchar(10), --foranea de pedidos
	detallePedidoMenuCodigo  nchar(10), -- foranea de productos
	constraint detallePedidoCodigoPK primary key (detallePedidoCodigo),
	constraint detallePedidoPedidoCodigoFk foreign key (detallePedidoPedidoCodigo) references Pedidos.Pedido(PedidoCodigo),
	constraint detallePedidoProductoCodigoFk foreign key (detallePedidoMenuCodigo) references Pedidos.Menu(MenuCodigo),
	constraint detallePedidoEstadoCk check (detallePedidoEstado in ('Pendiente', 'Preparando', 'Listo', 'Servido', 'Cancelado'))
	) 
	
go

CREATE TYPE Pedidos.TipoDetallePedido AS TABLE
(
    detallePedidoCodigo        nchar(10),
    detallePedidoSubtotal      decimal(10,2),
    detallePedidoCantidad      numeric,
    detallePedidoEstado        nvarchar(20),
    detallePedidoNotas         nvarchar(200),
    detallePedidoMenuCodigo    nchar(10)
)
GO






--=======================================================================================================================

--CREACION DE PROCEDIMIENTO ALMACENADO

create or alter procedure Pedidos.Proc_ObtenerMesas
as
	begin
		select 
			MesaCodigo,
			MesaNumero,
			MesaEstado
		from
			Pedidos.Mesa
	end
go


--procedimiento almacenado para obtener al usuario por su correo electronico
--=============================================================================================================================================
--								USUARIOS
--=============================================================================================================================================


create or alter procedure Proc_ObtenerUsuarioPorCorreo
	@correo nvarchar(150)
as
	begin
		select
			
			UsuarioCodigo,
			UsuarioNombre,
			UsuarioEmail,
			UsuarioDireccion,	
			UsuarioTelefono,
			UsuarioFechaRegistro,
			UsuarioEstado,	
			UsuarioRol		
		FROM Usuarios
		where UsuarioEmail = @correo
	end
go

EXEC Proc_ObtenerUsuarioPorCorreo @Correo = 'fcabezahe@ucvvitual.edu.pe';
go

-- ver todos los usuarios:
create or alter procedure Proc_ListarUsuarios
as
	begin
		select
			[UsuarioCodigo], 
			[UsuarioNombre], 
			[UsuarioEmail], 
			[UsuarioDireccion], 
			[UsuarioTelefono], 
			[UsuarioFechaRegistro], 
			[UsuarioEstado], 
			[UsuarioRol]
		from Usuarios
		order by 
			case when lower(UsuarioRol) = 'admin' then 1 else 0 end, 
			UsuarioNombre asc
	end
go

-- Cambiar estado del usuario:

CREATE or alter PROCEDURE Proc_CambiarEstadoUsuario
    @UsuarioCodigo NCHAR(10),
    @NuevoEstado NCHAR(1)
AS
BEGIN
    SET NOCOUNT ON;

    IF @NuevoEstado NOT IN ('A', 'I')
    BEGIN
        RAISERROR('Estado inv�lido. Solo se permite A o I.', 16, 1);
        RETURN;
    END

    UPDATE Usuarios
    SET UsuarioEstado = @NuevoEstado
    WHERE UsuarioCodigo = @UsuarioCodigo
      AND UsuarioRol <> 'admin';

    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('No se encontr� el usuario con ese c�digo.', 16, 1);
    END
END;
GO

-- Eliminar un usuario:

create or alter procedure Proc_EliminarUsuario
@Codigo nchar(10)
as
begin
	delete from Usuarios
	where UsuarioCodigo = @Codigo
end
go

-- Agregar Usuario :

CREATE or alter PROCEDURE Proc_CrearUsuario
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


create or alter procedure Proc_ActualizarUsuario
	@UsuarioCodigo		nchar(10),
	@UsuarioNombre		nvarchar(100),
	@UsuarioEmail		nvarchar(150),
	@UsuarioDireccion	nvarchar(150),
	@UsuarioTelefono	nvarchar(15),
	@UsuarioEstado		nchar(1),
	@UsuarioRol			nvarchar(10)
as
begin
	update Usuarios
	set
		UsuarioNombre = @UsuarioNombre,
		UsuarioEmail = @UsuarioEmail,
		UsuarioDireccion = @UsuarioDireccion,
		UsuarioTelefono = @UsuarioTelefono,
		UsuarioEstado = @UsuarioEstado,
		UsuarioRol = @UsuarioRol
	where UsuarioCodigo = @UsuarioCodigo
end
go


--=============================================================================================================================================
--								CATEGORIA
--=============================================================================================================================================




--Procedimiento para mostrar categorias

create or alter procedure Proc_MostrarCategorias
as
	begin
		select 
		c.CategoriaCodigo,
		c.CategoriaNombre,
		c.CategoriaDescripcion,
		c.CategoriaEstado
		from CategoriasProducto as C
	end
go

--Procedimiento para mostrrar los productos con sus categoria

CREATE OR ALTER PROCEDURE Proc_MostrarMenuCompleto
AS
BEGIN
  SELECT
    m.MenuCodigo,
    m.MenuPlatos,
    m.MenuDescripcion,
    m.MenuPrecio,
    m.MenuEstado,
    m.MenuImageUrl,
    m.MenuEsPreparado,
    c.CategoriaCodigo,
    c.CategoriaNombre,
    c.CategoriaDescripcion,
    c.CategoriaEstado,
    i.InsumoCodigo,
    i.InsumoNombre,
    i.InsumoUnidadMedida,
    i.InsumoStockActual,
    i.InsumoCompraUnidad,
    i.InsumoEstado,

    -- �Disponible?
    CASE 
      WHEN m.MenuEsPreparado = 'I' 
        THEN CASE WHEN i.InsumoStockActual > 0 THEN 1 ELSE 0 END
      WHEN m.MenuEsPreparado = 'A'
        THEN CASE 
          WHEN EXISTS(
            SELECT 1
              FROM RecetaDetalles rd
              JOIN Insumos ins
                ON ins.InsumoCodigo = rd.RecetaDetalleInsumo
             WHERE rd.RecetaDetalleReceta = r.RecetaCodigo
               AND ins.InsumoStockActual < rd.RecetaDetalleCantidadporPlato
          ) THEN 0 ELSE 1 
        END
      ELSE 0
    END AS MenuDisponible,

    -- LISTA DE INSUMOS QUE FALTAN (solo para preparados)
    CASE 
      WHEN m.MenuEsPreparado = 'A' THEN
        ISNULL((
          SELECT STRING_AGG(
                   ins.InsumoNombre 
                   + ' (faltan ' 
                   + CAST(rd.RecetaDetalleCantidadporPlato - ins.InsumoStockActual AS VARCHAR(10)) 
                   + ')'
                 , ', ')
            FROM Recetas r
            JOIN RecetaDetalles rd
              ON rd.RecetaDetalleReceta = r.RecetaCodigo
            JOIN Insumos ins
              ON ins.InsumoCodigo = rd.RecetaDetalleInsumo
           WHERE r.RecetaMenuCodigo = m.MenuCodigo
             AND ins.InsumoStockActual < rd.RecetaDetalleCantidadporPlato
        ), '')
      ELSE ''
    END AS InsumosFaltantes

  FROM Pedidos.Menu m
  INNER JOIN CategoriasProducto c 
    ON m.MenuCategoriaCodigo = c.CategoriaCodigo
  LEFT JOIN Insumos i 
    ON m.MenuInsumoCodigo = i.InsumoCodigo
  LEFT JOIN Recetas r
    ON r.RecetaMenuCodigo = m.MenuCodigo
  ORDER BY c.CategoriaNombre, m.MenuPlatos;
END
GO

--=============================================================================================================================================
--								PRODUCTO MENU
--=============================================================================================================================================



--sirve para poder insertar un producto

CREATE OR ALTER PROCEDURE Proc_InsertarMenu
  @MenuPlatos             NVARCHAR(100),
  @MenuDescripcion        NVARCHAR(500) = NULL,
  @MenuPrecio             DECIMAL(10,2),
  @MenuImageUrl           NVARCHAR(MAX) = NULL,
  @MenuEsPreparado        NCHAR(1),
  @MenuInsumoCodigo       NCHAR(10) = NULL,
  @MenuCategoriaCodigo    NCHAR(10)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @NuevoCodigo NCHAR(10);

  BEGIN TRAN;

  SELECT @NuevoCodigo = 'MEN' + RIGHT('0000000' + CAST(
      ISNULL(MAX(CAST(SUBSTRING(MenuCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR
  ), 7)
  FROM Pedidos.Menu WITH (UPDLOCK, HOLDLOCK)
  WHERE LEFT(MenuCodigo, 3) = 'MEN';

  INSERT INTO [Pedidos].[Menu]
  (
    [MenuCodigo],
    [MenuPlatos],
    [MenuDescripcion],
    [MenuPrecio],
    [MenuImageUrl],
    [MenuEsPreparado],
    [MenuInsumoCodigo],
    [MenuCategoriaCodigo]
  )
  VALUES
  (
    @NuevoCodigo,
    @MenuPlatos,
    @MenuDescripcion,
    @MenuPrecio,
    @MenuImageUrl,
    @MenuEsPreparado,
    @MenuInsumoCodigo,
    @MenuCategoriaCodigo
  );

  COMMIT;

  SELECT @NuevoCodigo AS MenuCodigoCreado;
END
GO

--esto procedimiento alamcenado sirve para agregar o actualizar un producto que no tiene imagen 
CREATE OR ALTER PROCEDURE Pedidos.Proc_ActualizarImagenMenu
    @MenuCodigo NCHAR(10),
    @MenuImageUrl NVARCHAR(MAX)
AS
BEGIN
    UPDATE Pedidos.Menu
    SET MenuImageUrl = @MenuImageUrl
    WHERE MenuCodigo = @MenuCodigo
END
GO




--=============================================================================================================================================
--								INSUMOS
--=============================================================================================================================================

CREATE OR ALTER PROCEDURE Proc_InsertarInsumo
  @InsumoNombre       NVARCHAR(200),
  @InsumoUnidadMedida NVARCHAR(50),
  @InsumoStockActual  DECIMAL(10,2),
  @InsumoCompraUnidad DECIMAL(10,2)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @NuevoCodigo NCHAR(10);

  BEGIN TRAN;

  SELECT @NuevoCodigo = 'INS' + RIGHT('0000000' + CAST(
      ISNULL(MAX(CAST(SUBSTRING(InsumoCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR
  ), 7)
  FROM Insumos WITH (UPDLOCK, HOLDLOCK)
  WHERE LEFT(InsumoCodigo, 3) = 'INS';

  INSERT INTO Insumos
  (
    InsumoCodigo,
    InsumoNombre,
    InsumoUnidadMedida,
    InsumoStockActual,
    InsumoCompraUnidad
  )
  VALUES
  (
    @NuevoCodigo,
    @InsumoNombre,
    @InsumoUnidadMedida,
    @InsumoStockActual,
    @InsumoCompraUnidad
  );

  COMMIT;

  SELECT @NuevoCodigo AS InsumoCodigoCreado;
END
GO


create or alter procedure Proc_ListarInsumos 
as
begin
	select [InsumoCodigo], [InsumoNombre], [InsumoUnidadMedida], [InsumoStockActual], [InsumoCompraUnidad], [InsumoEstado]
	from Insumos
	end
go

CREATE or alter PROCEDURE Proc_ActualizarInsumo
  @Codigo        nchar(10),
  @Nombre        nvarchar(200),
  @UnidadMedida  nvarchar(50),
  @StockActual   decimal(10,2),
  @CompraUnidad  decimal(10,2)
AS
BEGIN
  UPDATE Insumos
  SET
    InsumoNombre = @Nombre,
    InsumoUnidadMedida = @UnidadMedida,
    InsumoStockActual = @StockActual,
    InsumoCompraUnidad = @CompraUnidad
  WHERE InsumoCodigo = @Codigo
END
GO
--=============================================================================================================================================
--								MESAS
--=============================================================================================================================================C
CREATE OR ALTER PROCEDURE Pedidos.Proc_CambiarEstadoMesa
	@MesaCodigo nchar(10),
	@nuevoEstado nvarchar(20)
AS
BEGIN
	UPDATE Pedidos.Mesa
	SET MesaEstado = @nuevoEstado
	WHERE MesaCodigo = @MesaCodigo;
END
go

--=============================================================================================================================================
--								RECETAS
--=============================================================================================================================================C
CREATE OR ALTER PROCEDURE Proc_CrearReceta
	@RecetaMenuCodigo nchar(10)
as
begin
	SET NOCOUNT ON;

	DECLARE @NuevoCodigo NCHAR(10);

	BEGIN TRAN;

	SELECT @NuevoCodigo = 'REC' + RIGHT('0000000' + CAST(
      ISNULL(MAX(CAST(SUBSTRING(RecetaCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR
	), 7)
	FROM Recetas WITH (UPDLOCK, HOLDLOCK)
	WHERE LEFT(RecetaCodigo, 3) = 'REC';
	

	INSERT INTO Recetas
	(
	RecetaCodigo, RecetaMenuCodigo) 
	VALUES
	(
		@NuevoCodigo,
		@RecetaMenuCodigo
	)
	COMMIT;

  SELECT @NuevoCodigo AS RecetaCodigoCreado;
  end
go

--=============================================================================================================================================
--								DETALLES RECETAS
--=============================================================================================================================================


create or alter procedure Proc_CrearDetalleReceta
	@RecetaDetalleReceta		nchar(10),
	@RecetaDetalleInsumo				nchar(10),
	@RecetaCantidadPorPlato		decimal(10,2)
as 
	begin
	SET NOCOUNT ON;

	DECLARE @NuevoCodigo NCHAR(10);

	BEGIN TRAN;

	SELECT @NuevoCodigo = 'DER' + RIGHT('0000000' + CAST(
      ISNULL(MAX(CAST(SUBSTRING(RecetaDetalleCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR
	), 7)
	FROM RecetaDetalles WITH (UPDLOCK, HOLDLOCK)
	WHERE LEFT(RecetaDetalleCodigo, 3) = 'DER';
	

	INSERT INTO RecetaDetalles
	([RecetaDetalleCodigo], [RecetaDetalleReceta], [RecetaDetalleInsumo], [RecetaDetalleCantidadporPlato]) 
	VALUES
	(
		@NuevoCodigo,
		@RecetaDetalleReceta,
		@RecetaDetalleInsumo,
		@RecetaCantidadPorPlato
	)
	COMMIT;

  SELECT @NuevoCodigo AS RecetaDetalleCodigoCreado;
  end


go




-- 1) Elimina todos los detalles de receta para una receta dada
CREATE OR ALTER PROCEDURE Proc_EliminarRecetaDetalles
  @RecetaCodigo    NCHAR(10)
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM RecetaDetalles
  WHERE RecetaDetalleReceta = @RecetaCodigo;
END
GO

-- 2) Elimina la receta asociada a un men�
CREATE OR ALTER PROCEDURE Proc_EliminarReceta
  @MenuCodigo      NCHAR(10)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @RecetaCodigo NCHAR(10);

  SELECT @RecetaCodigo = RecetaCodigo
  FROM Recetas
  WHERE RecetaMenuCodigo = @MenuCodigo;

  IF @RecetaCodigo IS NOT NULL
  BEGIN
    EXEC Proc_EliminarRecetaDetalles @RecetaCodigo;
    DELETE FROM Recetas
    WHERE RecetaCodigo = @RecetaCodigo;
  END
END
GO

-- 3) Elimina el insumo asociado al men� no-preparable
CREATE OR ALTER PROCEDURE Proc_EliminarInsumoDeMenu
  @MenuCodigo      NCHAR(10)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @InsumoCodigo NCHAR(10);
  SELECT @InsumoCodigo = MenuInsumoCodigo
  FROM Pedidos.Menu
  WHERE MenuCodigo = @MenuCodigo;

  IF @InsumoCodigo IS NOT NULL
    DELETE FROM Insumos
    WHERE InsumoCodigo = @InsumoCodigo;
END
GO

-- 4) Elimina el men� y sus dependencias en una sola transacci�n
CREATE OR ALTER PROCEDURE Proc_EliminarMenu
  @MenuCodigo      NCHAR(10)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRAN;

    DECLARE @EsPreparado NCHAR(1);
    DECLARE @InsumoCodigo NCHAR(10);

    -- 1. Verificar si existe y obtener tipo y posible insumo
    SELECT 
      @EsPreparado     = MenuEsPreparado,
      @InsumoCodigo    = MenuInsumoCodigo
    FROM Pedidos.Menu
    WHERE MenuCodigo = @MenuCodigo;

    IF @EsPreparado IS NULL
    BEGIN
      RAISERROR('Men� no encontrado: %s', 16, 1, @MenuCodigo);
      ROLLBACK;
      RETURN;
    END

    -- 2. Si es preparado, eliminar receta
    IF @EsPreparado = 'A'
      EXEC Proc_EliminarReceta @MenuCodigo;

    -- 3. Eliminar todos los detalles de pedido que apuntan a este men�
    DELETE FROM Pedidos.DetallePedido
    WHERE detallePedidoMenuCodigo = @MenuCodigo;

    -- 4. Eliminar men�
    DELETE FROM Pedidos.Menu
    WHERE MenuCodigo = @MenuCodigo;

    -- 5. Si no es preparado y tiene insumo, eliminar insumo
    IF @EsPreparado = 'I' AND @InsumoCodigo IS NOT NULL
      DELETE FROM Insumos WHERE InsumoCodigo = @InsumoCodigo;

    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK;

    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrSeverity INT = ERROR_SEVERITY();
    RAISERROR(@ErrMsg, @ErrSeverity, 1);
  END CATCH
END
GO



--=============================================================================================================================================
--								PEDIDOS
--=============================================================================================================================================

--PROCEDIMIENTO ALMACENADO PARA OBTENER EL PEDIDO DEPENDIENDO DEL CODIGO DE MESA:

CREATE OR ALTER PROCEDURE Proc_ObtenerPedidoPorMesa
  @MesaCodigo nchar(10)
AS
BEGIN
  SET NOCOUNT ON;

  -- 1) Determinar el pedido m�s reciente de la mesa
  DECLARE @PedidoCodigo nchar(10);
  SELECT TOP 1
    @PedidoCodigo = p.PedidoCodigo
  FROM Pedidos.Pedido p
  WHERE p.PedidoMesaCodigo = @MesaCodigo
  ORDER BY p.PedidoFechaHora DESC;

  -- 2) Si no existe, salimos sin devolver filas
  IF @PedidoCodigo IS NULL
    RETURN;

  -- 3) Si existe, devolvemos todos sus detalles
  SELECT
    p.PedidoCodigo,
    p.PedidoFechaHora,
    p.PedidoTotal,
    p.PedidoEstado,
    dp.detallePedidoCodigo,
    dp.detallePedidoSubtotal,
    dp.detallePedidoCantidad,
    dp.detallePedidoEstado,
    dp.detallePedidoNotas,
    m.MenuCodigo,
    m.MenuPlatos,
    m.MenuPrecio,
    m.MenuDescripcion,
    m.MenuImageUrl,
    m.MenuEstado,
    m.MenuEsPreparado
  FROM Pedidos.Pedido p
    INNER JOIN Pedidos.DetallePedido dp 
      ON dp.detallePedidoPedidoCodigo = p.PedidoCodigo
    INNER JOIN Pedidos.Menu m 
      ON m.MenuCodigo = dp.detallePedidoMenuCodigo
  WHERE p.PedidoCodigo = @PedidoCodigo
  ORDER BY dp.detallePedidoCodigo;
END
GO

exec Proc_ObtenerPedidoPorMesa @MesaCodigo = 'MES0000005'
go

CREATE OR ALTER PROCEDURE Pedidos.Proc_ActualizarDetallesPedido
    @PedidoCodigo nchar(10),
    @Detalles Pedidos.TipoDetallePedido READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Eliminar los detalles que ya no est�n
    DELETE FROM Pedidos.DetallePedido
    WHERE detallePedidoPedidoCodigo = @PedidoCodigo
      AND detallePedidoCodigo NOT IN (
          SELECT detallePedidoCodigo FROM @Detalles WHERE detallePedidoCodigo <> ''
      );

    -- 2. Actualizar los que existen
    UPDATE dp
    SET 
        dp.detallePedidoSubtotal = d.detallePedidoSubtotal,
        dp.detallePedidoCantidad = d.detallePedidoCantidad,
        dp.detallePedidoEstado   = d.detallePedidoEstado,
        dp.detallePedidoNotas    = d.detallePedidoNotas,
        dp.detallePedidoMenuCodigo = d.detallePedidoMenuCodigo
    FROM Pedidos.DetallePedido dp
    INNER JOIN @Detalles d ON dp.detallePedidoCodigo = d.detallePedidoCodigo
    WHERE dp.detallePedidoPedidoCodigo = @PedidoCodigo;

    -- 3. Insertar nuevos con c�digo generado
    ;WITH CodigosBase AS (
        SELECT ISNULL(MAX(CAST(SUBSTRING(detallePedidoCodigo, 4, 7) AS INT)), 0) AS MaxCodigo
        FROM Pedidos.DetallePedido WITH (UPDLOCK, HOLDLOCK)
        WHERE LEFT(detallePedidoCodigo, 3) = 'DPE'
    )
    INSERT INTO Pedidos.DetallePedido (
        detallePedidoCodigo,
        detallePedidoSubtotal,
        detallePedidoCantidad,
        detallePedidoEstado,
        detallePedidoNotas,
        detallePedidoPedidoCodigo,
        detallePedidoMenuCodigo
    )
    SELECT 
        'DPE' + RIGHT('0000000' + CAST(c.MaxCodigo + ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS VARCHAR), 7),
        d.detallePedidoSubtotal,
        d.detallePedidoCantidad,
        d.detallePedidoEstado,
        d.detallePedidoNotas,
        @PedidoCodigo,
        d.detallePedidoMenuCodigo
    FROM @Detalles d
    CROSS JOIN CodigosBase c
    WHERE d.detallePedidoCodigo = ''
END
GO

select * from Pedidos.DetallePedido
go



CREATE OR ALTER PROCEDURE Pedidos.Proc_CrearPedido
    @MesaCodigo NCHAR(10),
    @Detalles Pedidos.TipoDetallePedido READONLY
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PedidoCodigo NCHAR(10), @Total DECIMAL(10,2);

    -- Generar nuevo c�digo
    SELECT @PedidoCodigo = 'PED' + RIGHT('0000000' + CAST(
        ISNULL(MAX(CAST(SUBSTRING(PedidoCodigo, 4, 7) AS INT)), 0) + 1 AS VARCHAR), 7)
    FROM Pedidos.Pedido WITH (UPDLOCK, HOLDLOCK);

    -- Calcular total
    SELECT @Total = SUM(detallePedidoSubtotal * detallePedidoCantidad) FROM @Detalles;

    -- Insertar pedido
    INSERT INTO Pedidos.Pedido (
        PedidoCodigo,
        PedidoTotal,
        PedidoMesaCodigo
    )
    VALUES (
        @PedidoCodigo,
        @Total,
        @MesaCodigo
    );

    -- Insertar detalles con c�digo generado
    ;WITH CodigosBase AS (
        SELECT ISNULL(MAX(CAST(SUBSTRING(detallePedidoCodigo, 4, 7) AS INT)), 0) AS MaxCodigo
        FROM Pedidos.DetallePedido WITH (UPDLOCK, HOLDLOCK)
        WHERE LEFT(detallePedidoCodigo, 3) = 'DPE'
    )
    INSERT INTO Pedidos.DetallePedido (
        detallePedidoCodigo,
        detallePedidoSubtotal,
        detallePedidoCantidad,
        detallePedidoEstado,
        detallePedidoNotas,
        detallePedidoPedidoCodigo,
        detallePedidoMenuCodigo
    )
    SELECT 
        'DPE' + RIGHT('0000000' + CAST(c.MaxCodigo + ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS VARCHAR), 7),
        d.detallePedidoSubtotal,
        d.detallePedidoCantidad,
        d.detallePedidoEstado,
        d.detallePedidoNotas,
        @PedidoCodigo,
        d.detallePedidoMenuCodigo
    FROM @Detalles d
    CROSS JOIN CodigosBase c
    WHERE d.detallePedidoCodigo = '';

END
GO

--eliminar un pedido 
CREATE OR ALTER PROCEDURE Proc_EliminarPedidoPorCodigo
    @PedidoCodigo nchar(10)
AS
BEGIN
    -- Eliminar detalles del pedido (si existen)
    DELETE FROM Pedidos.DetallePedido
    WHERE detallePedidoPedidoCodigo = @PedidoCodigo;

    -- Eliminar el pedido
    DELETE FROM Pedidos.Pedido
    WHERE PedidoCodigo = @PedidoCodigo;
END
GO


-- Creas en SQL Server un SP que reciba MenuCodigo y Cantidad 
CREATE or alter PROCEDURE Proc_ProcesarMenu
  @MenuCodigo   NCHAR(10),
  @Cantidad     DECIMAL(10,2)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;
  
  -- 1) cargar detalles de receta
  SELECT rd.RecetaDetalleInsumo AS InsumoCodigo,
         rd.RecetaDetalleCantidadporPlato AS CantidadPorPlato
  INTO   #tmp
  FROM   Recetas r
  JOIN   RecetaDetalles rd 
    ON r.RecetaCodigo = rd.RecetaDetalleReceta
  WHERE  r.RecetaMenuCodigo = @MenuCodigo
    AND  r.RecetaEstado     = 'A';

  IF NOT EXISTS(SELECT 1 FROM #tmp)
  BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR('Receta no encontrada',16,1);
    RETURN;
  END

  -- 2) descontar stock
  UPDATE i
  SET    i.InsumoStockActual = i.InsumoStockActual 
                              - t.CantidadPorPlato * @Cantidad
  FROM   Insumos i
  JOIN   #tmp t ON i.InsumoCodigo = t.InsumoCodigo
  WHERE  i.InsumoStockActual >= t.CantidadPorPlato * @Cantidad;

  IF @@ROWCOUNT <> (SELECT COUNT(*) FROM #tmp)
  BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR('Stock insuficiente',16,1);
    RETURN;
  END

  COMMIT TRANSACTION;
END
GO

-- Caso receta inexistente
EXEC Proc_ProcesarMenu @MenuCodigo = 'NOEXISTE', @Cantidad = 1;
-- Caso stock insuficiente (usa un valor muy alto)
EXEC Proc_ProcesarMenu @MenuCodigo = 'MEN0000001', @Cantidad = 1


select * from Insumos
go

select * from Pedidos.Menu
go

CREATE OR ALTER PROCEDURE Pedidos.Proc_DevolverStockMenu
  @MenuCodigo   NCHAR(10),
  @Cantidad     DECIMAL(10,2)
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE i
    SET i.InsumoStockActual = i.InsumoStockActual
                              + t.CantidadPorPlato * @Cantidad
  FROM Insumos i
  JOIN (
    SELECT rd.RecetaDetalleInsumo     AS InsumoCodigo,
           rd.RecetaDetalleCantidadporPlato AS CantidadPorPlato
      FROM Recetas r
      JOIN RecetaDetalles rd
        ON r.RecetaCodigo = rd.RecetaDetalleReceta
     WHERE r.RecetaMenuCodigo = @MenuCodigo
       AND r.RecetaEstado     = 'A'
  ) t ON i.InsumoCodigo = t.InsumoCodigo;
END
GO

CREATE OR ALTER PROCEDURE Pedidos.Proc_ObtenerTodosLosPedidos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.PedidoCodigo,
        p.PedidoFechaHora,
        p.PedidoTotal,
        p.PedidoEstado,
        p.PedidoMesaCodigo,
        m.MesaNumero,
        m.MesaEstado,
        dp.detallePedidoCodigo,
        dp.detallePedidoSubtotal,
        dp.detallePedidoCantidad,
        dp.detallePedidoEstado,
        dp.detallePedidoNotas,
        menu.MenuCodigo,
        menu.MenuPlatos,
        menu.MenuPrecio,
        menu.MenuDescripcion,
        menu.MenuImageUrl,
        menu.MenuEsPreparado,
        c.CategoriaNombre AS MenuCategoria
    FROM Pedidos.Pedido p
    INNER JOIN Pedidos.Mesa m ON p.PedidoMesaCodigo = m.MesaCodigo
    INNER JOIN Pedidos.DetallePedido dp ON dp.detallePedidoPedidoCodigo = p.PedidoCodigo
    INNER JOIN Pedidos.Menu menu ON menu.MenuCodigo = dp.detallePedidoMenuCodigo
    LEFT JOIN CategoriasProducto c ON menu.MenuCategoriaCodigo = c.CategoriaCodigo
    ORDER BY 
        CASE p.PedidoEstado
            WHEN 'Pendiente' THEN 1
            WHEN 'En cocina' THEN 2
            WHEN 'Listo' THEN 3
            WHEN 'Servido' THEN 4
            WHEN 'Cancelado' THEN 5
            ELSE 6
        END,
        p.PedidoFechaHora ASC;
END
GO
