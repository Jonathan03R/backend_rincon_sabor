xp_create_subdir 'C:\DB\JRrestauranteBuenSabor'
GO

CREATE DATABASE JRrestauranteBuenSabor
	on primary 
	(name = 'Datos01JRrestauranteBuenSabor', filename = 'C:\DB\JRrestauranteBuenSabor\Datos01JRrestauranteBuenSabor.mdf', 
		Size = 10 MB, Maxsize = 5GB, Filegrowth = 100MB),
	(name = 'Datos02JRrestauranteBuenSabor', filename = 'C:\DB\JRrestauranteBuenSabor\Datos02JRrestauranteBuenSabor.mdf', 
		Size = 10 MB, Maxsize = 2GB),

	filegroup Empleados
	(name = 'Datos01Empleados', filename = 'C:\DB\JRrestauranteBuenSabor\Datos01Empleados.ndf', 
		Size = 20MB, Maxsize = 2GB, Filegrowth = 50MB),
	(name = 'Datos02Empleados', filename = 'C:\DB\JRrestauranteBuenSabor\Datos02Empleados.ndf', 
		Size = 20MB, Maxsize = 2GB, Filegrowth = 20MB),

	filegroup Comercial
	(name = 'Datos01Comercial', filename = 'C:\DB\JRrestauranteBuenSabor\Datos01Comercial.ndf', 
		Size = 10MB, Maxsize = 2GB),
	(name = 'Datos02Comercial', filename = 'C:\DB\JRrestauranteBuenSabor\Datos02Comercial.ndf', 
		Size = 20MB, Maxsize = 4GB, Filegrowth = 50MB)

	LOG ON 
    (name = 'JRrestauranteBuenSaborTransacciones', FILENAME = 'C:\DB\JRrestauranteBuenSabor\JRrestauranteBuenSaborTransacciones.ldf', 
		Size = 5MB, Maxsize = 2GB, Filegrowth = 100MB);
GO

USE JRrestauranteBuenSabor
GO

--CREACIÓN DE ESQUEMAS PARA QUE NO SALGA ERROR	
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
		constraint usuarioRolCk check (usuarioRol in ('Administrador', 'Cocina', 'Mesero'))
	) on Empleados
go

create table CategoriasProducto
	(
		CategoriaCodigo		nchar(10),
		CategoriaNombre		nvarchar(100),
		CategoriaEstado		nchar(1) default 'A',
		CategoriaDescripcion nvarchar(200),

		constraint CategoriaCodigoPk primary key (CategoriaCodigo),
		constraint CategoriaEstadoCk check (CategoriaEstado='A' or CategoriaEstado = 'I' ) -- A es activo I es inactivo
	) on comercial
go

create table Pedidos.Producto
	(
		ProductoCodigo		nchar(10),
		ProductoPlatos		nvarchar(100)not null,
		ProductoDescripcion nvarchar(500),
		ProductoPrecio		decimal(10,2) not null,
		ProductoEstado		nchar(1) default 'A',
		ProductoImage		image , 
		ProductoCategoriaCodigo	nchar(10),

		constraint ProductoCodigoFk primary key (ProductoCodigo),
		constraint ProductoCategoriaCodigoFk foreign key (ProductoCategoriaCodigo) references CategoriasProducto(CategoriaCodigo),
		constraint ProductoEstadoCk check (ProductoEstado = 'A' or ProductoEstado = 'I') -- lo mismo que arriba ñeñeñe 

	) on Comercial
go

create table Pedidos.Mesa 
	(
		MesaCodigo		nchar(10),
		MesaNumero		nvarchar(10) not null, 
		MesaEstado		nvarchar(20) default 'activa',

		constraint MesaCodigoPk primary key (MesaCodigo),
		constraint MesaEstadoCk check (MesaEstado in ('inactiva', 'ocupada', 'activa' )) --- blabla bla lo mismo  
	) on Empleados
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
	)on Empleados
go

create table Pedidos.DetallePedido
	(
	detallePedidoCodigo          nchar(10),
	detallePedidoSubtotal        decimal(10,2) not null, --precio unitario
	detallePedidoCantidad        numeric not null,
	detallePedidoEstado          nvarchar(20) default 'Pendiente',
	detallePedidoNotas		     nvarchar(200) ,
	detallePedidoPedidoCodigo    nchar(10), --foranea de pedidos
	detallePedidoProductoCodigo  nchar(10), -- foranea de productos
	constraint detallePedidoCodigoPK primary key (detallePedidoCodigo),
	constraint detallePedidoPedidoCodigoFk foreign key (detallePedidoPedidoCodigo) references Pedidos.Pedido(PedidoCodigo),
	constraint detallePedidoProductoCodigoFk foreign key (detallePedidoProductoCodigo) references Pedidos.Producto(ProductoCodigo),
	constraint detallePedidoEstadoCk check (detallePedidoEstado in ('Pendiente', 'Preparando', 'Listo', 'Servido', 'Cancelado'))
	) 
	on Empleados
go

--Guarda todos los movimientos de dinero: ventas, gastos, pagos a proveedores, sueldos, etc.


create table Finanzas.Transaccion (
    TransaccionCodigo			nchar(10) primary key,
    TransaccionFecha			datetime default getDate(),
    TransaccionTipo				varchar(20), -- Ingreso, Egreso
    TransaccionCategoria		varchar(50), -- Venta, Sueldo, Insumos, Mantenimiento, etc.
    TransaccionDescripcion		nvarchar(200),
    TransaccionMonto			decimal(10,2),
    TransaccionEstado			nchar(1) default 'A',
    constraint TransaccionEstadoCk check (TransaccionEstado in ('A', 'I')),
    constraint TransaccionTipoCk check (TransaccionTipo in ('Ingreso', 'Egreso'))
) 
go


--Registra con qué método se pagó: efectivo, tarjeta, transferencia, etc.
create table Finanzas.MetodoPago (
    MetodoCodigo        nchar(5) primary key,
    MetodoNombre        nvarchar(50) not null,
    MetodoEstado        nchar(1) default 'A',
    constraint MetodoEstadoCk check (MetodoEstado in ('A', 'I'))
) 
go

--Te permite llevar control por día de ingresos y egresos, para saber si "cuadró la caja".
create table Finanzas.CajaDiaria (
    CajaFecha        date primary key,
    CajaInicio       decimal(10,2), -- lo que había al abrir
    CajaIngreso      decimal(10,2),
    CajaEgreso       decimal(10,2),
    CajaFinal        decimal(10,2), -- lo que debe haber
    CajaEstado       nchar(1) default 'A'
) 
go






--=======================================================================================================================

--CREACION DE PROCEDIMIENTO ALMACENADO

create procedure Pedidos.Proc_ObtenerMesas
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
