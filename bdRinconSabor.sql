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
--tabla de prueba
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100),
    Correo NVARCHAR(100),
    Rol NVARCHAR(50)
);

INSERT INTO Usuarios (Nombre, Correo, Rol) VALUES
('Ana Pérez', 'ana.perez@email.com', 'Mesero'),
('Luis García', 'luis.garcia@email.com', 'Cocinero'),
('Carmen Torres', 'carmen.torres@email.com', 'Administrador');
go

CREATE TABLE Pedidos.Mesa
	(
	mesaCodigo         nchar(10),
	mesaNumero         nvarchar(10) not null,
	mesaEstado         nvarchar(1),  
	constraint mesaCodigoPK primary key (mesaCodigo)
	) 
	ON Empleados
GO

CREATE TABLE Pedidos.Plato
	(
	platoCodigo          nchar (10),
	platoNombre          nvarchar(100) not null,
	platoDescripcion     nvarchar(255),
	platoPrecio          decimal(10,2) not null,
	platoDisponible      bit not null,
	constraint platoCodigoPK primary key (platoCodigo)
	) 
	on Empleados
GO

CREATE TABLE Pedidos.Pedido
	(
	pedidoCodigo       nchar(10),
	pedidomesaCodigo   nchar(10),
	pedidoFechaHora    datetime default getDate(),
	pedidoTotal        decimal(10,2) not null,
	PedidoEstado       nvarchar(1),
	constraint pedidoCodigoPK primary key (pedidoCodigo),
	constraint pedidomesaCodigoFK foreign key (pedidomesaCodigo) references Pedidos.Mesa(mesaCodigo)
	) 
	on Empleados
GO

CREATE TABLE Pedidos.Categoria
	(
	categoriaCodigo			nchar(6),
	categoriaEntradas		nvarchar(20),
	categoriaFondos			nvarchar(20),
	categoriaBebidas		nvarchar(20),
	categoriaplatoCodigo	nchar (10),
	categoriaEstado			nchar(1),
	constraint categoriaCodigoPK primary key (categoriaCodigo),
	constraint categoriaplatoCodigoFK foreign key (categoriaplatoCodigo) references Pedidos.Plato(platoCodigo)
	)
	on Empleados
GO


CREATE TABLE Pedidos.DetallePedido
	(
	detallePedidoCodigo          nchar(10),
	detallePedidoPedidoCodigo    nchar(10),
	detallePedidoPlatoCodigo     nchar(10),
	detallePedidoCantidad        numeric not null,
	detallePedidoSubtotal        decimal(10,2) not null,
	constraint detallePedidoCodigoPK primary key (detallePedidoCodigo),
	constraint detallePedidoPedidoCodigoFK foreign key (detallePedidoPedidoCodigo) references Pedidos.Pedido(pedidoCodigo),
	constraint detallePedidoPlatoCodigoFK foreign key (detallePedidoPlatoCodigo) references Pedidos.Plato(platoCodigo)
	) 
	on Empleados
GO


CREATE TABLE Finanzas.Ingreso
	(
	ingresoCodigo         nchar(10),
	ingresoPedidoCodigo   nchar(10),
	ingresoFecha      datetime default getDate(),
	ingresoMonto      decimal(10,2) not null,
	ingresoMedioPago  nvarchar(20) not null,
	constraint ingresoCodigoPK primary key (ingresoCodigo),
	constraint ingresoPedidoCodigoFK foreign key (ingresoPedidoCodigo) references Pedidos.Pedido(pedidoCodigo)
	) 
	on Empleados
GO

CREATE TABLE Finanzas.Gasto
	(
	gastoCodigo       nchar(10),
	gastoFecha        datetime default getDate(),
	gastoMonto        decimal(10,2) not null,
	gastoDescripcion  nvarchar(255) not null,
	constraint gastoCodigoPK primary key (gastoCodigo)
	) 
	on Empleados
GO