-- Portable schema for NaturaGraciela
-- Generated from original script, cleaned for cross-machine setup
USE [master]
GO
USE [master]
GO
/****** Object:  Database [NaturaGraciela]    Script Date: 28/9/2025 19:19:59 ******/
IF DB_ID('NaturaGraciela') IS NULL
BEGIN
    CREATE DATABASE [NaturaGraciela];
END
GO
USE [NaturaGraciela]
GO

USE [NaturaGraciela]
GO
/****** Object:  Table [dbo].[Clientes]    Script Date: 28/9/2025 19:19:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Clientes](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombreCompleto] [nvarchar](200) NOT NULL,
	[telefono] [nvarchar](50) NULL,
	[metodoPagoPref] [nvarchar](50) NULL,
	[creadoEn] [datetime2](7) NOT NULL,
	[actualizadoEn] [datetime2](7) NULL,
	[nombre] [nvarchar](100) NULL,
	[apellido] [nvarchar](100) NULL,
	[direccion] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CuotaPagos]    Script Date: 28/9/2025 19:19:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CuotaPagos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[cuotaId] [int] NOT NULL,
	[fecha] [datetime2](7) NOT NULL,
	[monto] [decimal](12, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cuotas]    Script Date: 28/9/2025 19:19:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cuotas](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[ventaId] [int] NOT NULL,
	[numero] [int] NOT NULL,
	[venceEl] [date] NOT NULL,
	[importe] [decimal](12, 2) NOT NULL,
	[pagada] [bit] NOT NULL,
	[pagadaEl] [date] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Cuotas] UNIQUE NONCLUSTERED 
(
	[ventaId] ASC,
	[numero] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Productos]    Script Date: 28/9/2025 19:19:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Productos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [varchar](100) NOT NULL,
	[detalle] [varchar](255) NULL,
	[pCosto] [decimal](10, 2) NULL,
	[pVenta] [decimal](10, 2) NULL,
	[fechaVencimiento] [date] NULL,
	[cantidad] [int] NULL,
	[activo] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VentaItems]    Script Date: 28/9/2025 19:19:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VentaItems](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[ventaId] [int] NOT NULL,
	[productoId] [int] NOT NULL,
	[cantidad] [int] NOT NULL,
	[precioUnitario] [decimal](12, 2) NOT NULL,
	[subtotal]  AS ([cantidad]*[precioUnitario]) PERSISTED,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Ventas]    Script Date: 28/9/2025 19:19:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Ventas](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[clienteId] [int] NOT NULL,
	[fecha] [date] NOT NULL,
	[total] [decimal](12, 2) NOT NULL,
	[esCredito] [bit] NOT NULL,
	[cuotasTotal] [int] NULL,
	[creadoEn] [datetime2](7) NOT NULL,
	[entregaInicial] [decimal](12, 2) NULL,
	[interesPct] [decimal](5, 2) NULL,
	[totalFinanciado] [decimal](12, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IX_Cuotas_Vence_Pagada]    Script Date: 28/9/2025 19:19:59 ******/
CREATE NONCLUSTERED INDEX [IX_Cuotas_Vence_Pagada] ON [dbo].[Cuotas]
(
	[pagada] ASC,
	[venceEl] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Productos_Vencimiento]    Script Date: 28/9/2025 19:19:59 ******/
CREATE NONCLUSTERED INDEX [IX_Productos_Vencimiento] ON [dbo].[Productos]
(
	[fechaVencimiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_VentaItems_productoId]    Script Date: 28/9/2025 19:19:59 ******/
CREATE NONCLUSTERED INDEX [IX_VentaItems_productoId] ON [dbo].[VentaItems]
(
	[productoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_VentaItems_ventaId]    Script Date: 28/9/2025 19:19:59 ******/
CREATE NONCLUSTERED INDEX [IX_VentaItems_ventaId] ON [dbo].[VentaItems]
(
	[ventaId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Ventas_cliente_fecha]    Script Date: 28/9/2025 19:19:59 ******/
CREATE NONCLUSTERED INDEX [IX_Ventas_cliente_fecha] ON [dbo].[Ventas]
(
	[clienteId] ASC,
	[fecha] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Ventas_clienteId]    Script Date: 28/9/2025 19:19:59 ******/
CREATE NONCLUSTERED INDEX [IX_Ventas_clienteId] ON [dbo].[Ventas]
(
	[clienteId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Clientes] ADD  DEFAULT (sysutcdatetime()) FOR [creadoEn]
GO
ALTER TABLE [dbo].[Clientes] ADD  CONSTRAINT [DF_Clientes_actualizadoEn]  DEFAULT (sysutcdatetime()) FOR [actualizadoEn]
GO
ALTER TABLE [dbo].[CuotaPagos] ADD  DEFAULT (sysdatetime()) FOR [fecha]
GO
ALTER TABLE [dbo].[Cuotas] ADD  DEFAULT ((0)) FOR [pagada]
GO
ALTER TABLE [dbo].[Productos] ADD  CONSTRAINT [DF_Productos_activo]  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[Ventas] ADD  DEFAULT (CONVERT([date],getdate())) FOR [fecha]
GO
ALTER TABLE [dbo].[Ventas] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[Ventas] ADD  DEFAULT ((0)) FOR [esCredito]
GO
ALTER TABLE [dbo].[Ventas] ADD  DEFAULT (sysutcdatetime()) FOR [creadoEn]
GO
ALTER TABLE [dbo].[CuotaPagos]  WITH CHECK ADD FOREIGN KEY([cuotaId])
REFERENCES [dbo].[Cuotas] ([id])
GO
ALTER TABLE [dbo].[Cuotas]  WITH CHECK ADD  CONSTRAINT [FK_Cuotas_Ventas] FOREIGN KEY([ventaId])
REFERENCES [dbo].[Ventas] ([id])
GO
ALTER TABLE [dbo].[Cuotas] CHECK CONSTRAINT [FK_Cuotas_Ventas]
GO
ALTER TABLE [dbo].[VentaItems]  WITH CHECK ADD  CONSTRAINT [FK_VentaItems_Productos] FOREIGN KEY([productoId])
REFERENCES [dbo].[Productos] ([id])
GO
ALTER TABLE [dbo].[VentaItems] CHECK CONSTRAINT [FK_VentaItems_Productos]
GO
ALTER TABLE [dbo].[VentaItems]  WITH CHECK ADD  CONSTRAINT [FK_VentaItems_Ventas] FOREIGN KEY([ventaId])
REFERENCES [dbo].[Ventas] ([id])
GO
ALTER TABLE [dbo].[VentaItems] CHECK CONSTRAINT [FK_VentaItems_Ventas]
GO
ALTER TABLE [dbo].[Ventas]  WITH CHECK ADD  CONSTRAINT [FK_Ventas_Clientes] FOREIGN KEY([clienteId])
REFERENCES [dbo].[Clientes] ([id])
GO
ALTER TABLE [dbo].[Ventas] CHECK CONSTRAINT [FK_Ventas_Clientes]
GO
ALTER TABLE [dbo].[Cuotas]  WITH CHECK ADD CHECK  (([importe]>=(0)))
GO
ALTER TABLE [dbo].[VentaItems]  WITH CHECK ADD CHECK  (([cantidad]>(0)))
GO
USE [master]
GO
