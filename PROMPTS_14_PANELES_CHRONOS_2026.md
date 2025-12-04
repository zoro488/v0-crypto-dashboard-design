# 🎯 PROMPTS COMPLETOS PARA LOS 14 PANELES
## CHRONOS 2026 - Sistema de Gestión Financiera

---

> **INSTRUCCIONES DE USO**:
> 1. Copia el prompt del panel que necesitas
> 2. Pégalo en v0.dev, Claude, o tu AI preferida
> 3. El prompt incluye TODO el contexto necesario
> 4. Cada prompt referencia las fórmulas y tipos correctos

---

## CONTEXTO GLOBAL (Incluir Siempre)

```
SISTEMA: CHRONOS 2026 - Gestión Financiera Ultra-Premium

STACK TECNOLÓGICO:
- Framework: Next.js 15 (App Router) + React 19 + TypeScript 5.6 strict
- Estilos: Tailwind CSS + shadcn/ui + CSS custom properties
- Estado: Zustand con persist middleware + IndexedDB
- Formularios: react-hook-form + @hookform/resolvers/zod
- Validación: Zod schemas
- Animaciones: Framer Motion 11
- Tablas: @tanstack/react-table
- Gráficos: Recharts
- Iconos: lucide-react

PALETA DE COLORES (OBLIGATORIA):
- Negro: #000000
- Violeta: #8B00FF
- Dorado: #FFD700
- Rosa: #FF1493
- Blanco: #FFFFFF
- PROHIBIDO: Cyan, turquesa, o cualquier tono azul-verdoso

NIVEL DE DISEÑO: Apple Vision Pro + Tesla App + Grok.com
- Glassmorphism extremo (blur 20px+, opacidad 3-10%)
- Sombras profundas con colores (violeta/rosa)
- Border radius: 16-24px
- Gradientes suaves (violeta→rosa, dorado→naranja)
- Animaciones fluidas 60fps

TIPOGRAFÍA:
- UI: Inter (font-sans)
- Montos: Space Grotesk (font-mono)
- Títulos: Bold, tracking-tight, gradient text

IDIOMA: Español (respuestas, UI, comentarios)
```

---

## PANEL 1: DASHBOARD

```
Crea el componente BentoDashboard.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoDashboard.tsx

IMPORTS REQUERIDOS:
- import { useAppStore } from '@/app/lib/store/useAppStore'
- import { calcularCapitalBanco } from '@/app/lib/formulas'
- import { BANCOS_CONFIG } from '@/app/lib/constants'
- import { motion, AnimatePresence } from 'framer-motion'
- import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
- import { Badge } from '@/components/ui/badge'
- import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from 'recharts'
- import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Users, Package } from 'lucide-react'

ESTRUCTURA:
```tsx
'use client'

export function BentoDashboard() {
  const { bancos, ventas, clientes, ordenesCompra } = useAppStore()
  
  // Cálculos de KPIs
  const capitalTotal = useMemo(() => 
    bancos.reduce((sum, b) => sum + b.capitalActual, 0), [bancos]
  )
  
  const ventasHoy = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0]
    return ventas.filter(v => v.fecha.startsWith(hoy))
      .reduce((sum, v) => sum + v.ingreso, 0)
  }, [ventas])
  
  // ... más cálculos
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a1a] to-[#1a0a2e] p-6">
      {/* Grid Bento 12 columnas */}
      <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
        
        {/* HEADER - Span 12 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8B00FF] to-[#FF1493] bg-clip-text text-transparent">
              CHRONOS
            </h1>
            <p className="text-gray-400 mt-1">
              {new Date().toLocaleDateString('es-MX', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </p>
          </div>
          <Avatar />
        </motion.div>
        
        {/* KPI CARDS - 4 cards, span 3 cada una */}
        {[
          { title: 'Capital Total', value: capitalTotal, icon: DollarSign, change: 12.5, color: 'violet' },
          { title: 'Ventas Hoy', value: ventasHoy, icon: TrendingUp, change: 5.2, color: 'gold' },
          { title: 'Ganancia Mes', value: gananciaMes, icon: ArrowUpRight, change: 23.1, color: 'pink' },
          { title: 'Deudas Pendientes', value: deudasPendientes, icon: Users, change: -8.3, color: 'violet' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="col-span-3"
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
        
        {/* BANCOS OVERVIEW - Span 8 */}
        <motion.div className="col-span-8">
          <Card className="bg-white/5 backdrop-blur-xl border-[#8B00FF]/20 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white">7 Bóvedas</CardTitle>
            </CardHeader>
            <CardContent>
              {bancos.map(banco => (
                <BancoBar key={banco.id} banco={banco} maxCapital={capitalTotal} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* ÚLTIMOS MOVIMIENTOS - Span 4 */}
        <motion.div className="col-span-4">
          <Card className="bg-white/5 backdrop-blur-xl border-[#8B00FF]/20 rounded-3xl h-full">
            <CardHeader>
              <CardTitle className="text-white">Últimos Movimientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-auto">
              {ultimosMovimientos.map((mov, i) => (
                <MovimientoItem key={mov.id} movimiento={mov} delay={i * 0.05} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* GRÁFICO TENDENCIA - Span 6 */}
        <motion.div className="col-span-6">
          <Card className="bg-white/5 backdrop-blur-xl border-[#8B00FF]/20 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white">Tendencia 30 días</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={datosTendencia}>
                  <defs>
                    <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradientGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF1493" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF1493" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="ingresos" stroke="#FFD700" fill="url(#gradientIngresos)" />
                  <Area type="monotone" dataKey="gastos" stroke="#FF1493" fill="url(#gradientGastos)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* PIE DISTRIBUCIÓN - Span 6 */}
        <motion.div className="col-span-6">
          {/* PieChart de distribución de capital */}
        </motion.div>
        
      </div>
    </div>
  )
}

// Subcomponentes
function KPICard({ title, value, icon: Icon, change, color }) { ... }
function BancoBar({ banco, maxCapital }) { ... }
function MovimientoItem({ movimiento, delay }) { ... }
```

ESTILOS ESPECÍFICOS:
- KPI Cards: background rgba(255,255,255,0.03), border 1px solid rgba(139,0,255,0.2)
- Montos grandes: font-family Space Grotesk, color #FFD700
- Variación positiva: text-green-400
- Variación negativa: text-red-400
- Hover en cards: scale(1.02), shadow-lg shadow-[#8B00FF]/20

ANIMACIONES:
- Entry staggered: delay 0.1s por elemento
- Números: animación countup 1.5s
- Charts: draw animation
- Hover: transition-all duration-300

DATOS:
- Usar useAppStore() para bancos, ventas, movimientos
- useMemo para todos los cálculos
- Actualizar cada 30s con useEffect

Genera el código COMPLETO y funcional.
```

---

## PANEL 2: VENTAS

```
Crea el componente BentoVentasPremium.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoVentasPremium.tsx

IMPORTS REQUERIDOS:
- import { useAppStore } from '@/app/lib/store/useAppStore'
- import { calcularVentaCompleta, calcularDistribucionGYA } from '@/app/lib/formulas'
- import type { Venta, NuevaVentaInput, BancoId } from '@/app/types'
- import { VentaSchema } from '@/app/lib/schemas/ventas.schema'
- import { useForm } from 'react-hook-form'
- import { zodResolver } from '@hookform/resolvers/zod'
- import { motion, AnimatePresence } from 'framer-motion'
- import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table'
- import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
- import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
- import { Input } from '@/components/ui/input'
- import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
- import { Button } from '@/components/ui/button'
- import { Badge } from '@/components/ui/badge'
- import { Slider } from '@/components/ui/slider'
- import { ShoppingCart, Plus, Search, Filter, Download } from 'lucide-react'

ESTRUCTURA PRINCIPAL:
```tsx
'use client'

export function BentoVentasPremium() {
  const { ventas, clientes, ordenesCompra, addVenta } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  
  // Formulario con react-hook-form + Zod
  const form = useForm<NuevaVentaInput>({
    resolver: zodResolver(VentaSchema),
    defaultValues: {
      cantidad: 1,
      precioVenta: 0,
      flete: 'Aplica',
      montoPagado: 0,
      metodoPago: 'efectivo',
    }
  })
  
  // Watch para preview en tiempo real
  const watchedValues = form.watch()
  
  // Preview de distribución calculada en tiempo real
  const previewDistribucion = useMemo(() => {
    if (!watchedValues.ocRelacionada) return null
    
    const oc = ordenesCompra.find(o => o.id === watchedValues.ocRelacionada)
    if (!oc) return null
    
    return calcularVentaCompleta({
      cantidad: watchedValues.cantidad || 0,
      precioVenta: watchedValues.precioVenta || 0,
      precioCompra: oc.costoDistribuidor,
      precioFlete: watchedValues.flete === 'Aplica' ? 500 : 0,
      montoPagado: watchedValues.montoPagado || 0,
    })
  }, [watchedValues, ordenesCompra])
  
  // OCs con stock disponible
  const ocsDisponibles = useMemo(() => 
    ordenesCompra.filter(oc => oc.stockActual > 0),
    [ordenesCompra]
  )
  
  // Submit handler
  const onSubmit = async (data: NuevaVentaInput) => {
    try {
      await addVenta(data)
      form.reset()
      setIsModalOpen(false)
      toast.success('Venta registrada exitosamente')
    } catch (error) {
      toast.error('Error al registrar venta')
    }
  }
  
  // Tabla config
  const columns = useMemo(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString('es-MX'),
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
    },
    {
      accessorKey: 'ocRelacionada',
      header: 'OC',
    },
    {
      accessorKey: 'cantidad',
      header: 'Cant.',
    },
    {
      accessorKey: 'ingreso',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.ingreso),
    },
    {
      accessorKey: 'distribucionBancos',
      header: 'Distribución',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-xs">
            BM: {formatCurrency(row.original.distribucionBancos.bovedaMonte, 'compact')}
          </Badge>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 text-xs">
            FL: {formatCurrency(row.original.distribucionBancos.fletes, 'compact')}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 text-xs">
            UT: {formatCurrency(row.original.distribucionBancos.utilidades, 'compact')}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'estadoPago',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estadoPago
        const colors = {
          completo: 'bg-green-500/20 text-green-400 border-green-500/30',
          parcial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          pendiente: 'bg-red-500/20 text-red-400 border-red-500/30',
        }
        return <Badge className={colors[estado]}>{estado}</Badge>
      },
    },
  ], [])
  
  const table = useReactTable({
    data: ventas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a1a] to-[#1a0a2e] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#8B00FF] to-[#FF1493] rounded-2xl">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Ventas</h1>
              <p className="text-gray-400">{ventas.length} registros</p>
            </div>
          </div>
          
          {/* Stats rápidos */}
          <div className="flex gap-4">
            <StatBadge label="Total Ventas" value={formatCurrency(totalVentas)} />
            <StatBadge label="Hoy" value={formatCurrency(ventasHoy)} />
            <StatBadge label="Pendientes" value={ventasPendientes.length} variant="warning" />
          </div>
          
          {/* Botón Nueva Venta */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#8B00FF] to-[#FF1493] hover:opacity-90 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-[#8B00FF]/30">
                <Plus className="w-5 h-5 mr-2" />
                Nueva Venta
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl bg-black/95 backdrop-blur-xl border-[#8B00FF]/30 rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  Registrar Nueva Venta
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* ROW 1: Cliente + OC */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clienteId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Cliente</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-[#8B00FF]/20 text-white">
                                <SelectValue placeholder="Seleccionar cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-black/95 border-[#8B00FF]/30">
                              {clientes.map(cliente => (
                                <SelectItem key={cliente.id} value={cliente.id}>
                                  {cliente.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ocRelacionada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">OC Relacionada</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-[#8B00FF]/20 text-white">
                                <SelectValue placeholder="Seleccionar OC" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-black/95 border-[#8B00FF]/30">
                              {ocsDisponibles.map(oc => (
                                <SelectItem key={oc.id} value={oc.id}>
                                  {oc.id} - Stock: {oc.stockActual} | ${oc.costoDistribuidor}/u
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* ROW 2: Cantidad + Precio */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cantidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Cantidad</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              className="bg-white/5 border-[#8B00FF]/20 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="precioVenta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Precio Venta (por unidad)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              className="bg-white/5 border-[#8B00FF]/20 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* ROW 3: Flete + Método Pago */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="flete"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Flete ($500/unidad)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-[#8B00FF]/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-black/95 border-[#8B00FF]/30">
                              <SelectItem value="Aplica">Aplica</SelectItem>
                              <SelectItem value="NoAplica">No Aplica</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="metodoPago"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Método de Pago</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-[#8B00FF]/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-black/95 border-[#8B00FF]/30">
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="crypto">Crypto</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* ROW 4: Monto Pagado con Slider */}
                  <FormField
                    control={form.control}
                    name="montoPagado"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel className="text-gray-300">Monto Pagado</FormLabel>
                          <span className="text-[#FFD700] font-mono">
                            {formatCurrency(field.value)} 
                            {previewDistribucion && (
                              <span className="text-gray-500 ml-2">
                                / {formatCurrency(previewDistribucion.totalVenta)}
                              </span>
                            )}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            onValueChange={([val]) => field.onChange(val)}
                            max={previewDistribucion?.totalVenta || 100000}
                            step={100}
                            className="mt-2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* PREVIEW DISTRIBUCIÓN EN TIEMPO REAL */}
                  {previewDistribucion && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gradient-to-r from-[#8B00FF]/10 to-[#FF1493]/10 rounded-2xl p-6 border border-[#8B00FF]/20"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">
                        📊 Preview Distribución
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <DistribucionBar 
                          label="Bóveda Monte" 
                          value={previewDistribucion.distribucionReal.bovedaMonte}
                          max={previewDistribucion.totalVenta}
                          color="blue"
                          description="COSTO"
                        />
                        <DistribucionBar 
                          label="Flete Sur" 
                          value={previewDistribucion.distribucionReal.fletes}
                          max={previewDistribucion.totalVenta}
                          color="orange"
                          description="FLETE"
                        />
                        <DistribucionBar 
                          label="Utilidades" 
                          value={previewDistribucion.distribucionReal.utilidades}
                          max={previewDistribucion.totalVenta}
                          color="green"
                          description="GANANCIA"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <div>
                          <span className="text-gray-400">Total Venta:</span>
                          <span className="text-2xl font-bold text-[#FFD700] ml-2 font-mono">
                            {formatCurrency(previewDistribucion.totalVenta)}
                          </span>
                        </div>
                        <Badge className={
                          previewDistribucion.estadoPago === 'completo' 
                            ? 'bg-green-500/20 text-green-400' 
                            : previewDistribucion.estadoPago === 'parcial'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }>
                          {previewDistribucion.estadoPago.toUpperCase()}
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Botones */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-[#8B00FF] to-[#FF1493] text-white px-8"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Venta'}
                    </Button>
                  </div>
                  
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </motion.div>
        
        {/* FILTROS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 flex-wrap"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input 
              placeholder="Buscar por cliente, OC, concepto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-[#8B00FF]/20 text-white"
            />
          </div>
          
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-40 bg-white/5 border-[#8B00FF]/20 text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="completo">Pagado</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="border-[#8B00FF]/30 text-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </motion.div>
        
        {/* TABLA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-[#8B00FF]/20 rounded-3xl overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="border-[#8B00FF]/10">
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="text-gray-400">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow 
                    key={row.id} 
                    className="border-[#8B00FF]/10 hover:bg-[#8B00FF]/5 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="text-white">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Paginación */}
            <div className="flex justify-between items-center p-4 border-t border-[#8B00FF]/10">
              <span className="text-gray-400">
                Mostrando {table.getRowModel().rows.length} de {ventas.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        
      </div>
    </div>
  )
}

// Subcomponentes
function StatBadge({ label, value, variant }) { ... }
function DistribucionBar({ label, value, max, color, description }) { ... }
```

LÓGICA CRÍTICA:
1. SIEMPRE usar calcularVentaCompleta() de formulas.ts para la distribución
2. precioCompra viene de la OC seleccionada (oc.costoDistribuidor)
3. Preview actualiza en tiempo real con form.watch()
4. Al submit:
   - Validar stock disponible
   - Crear venta con distribución calculada
   - Actualizar stock de OC (stockActual -= cantidad)
   - Actualizar deuda de cliente (si no es pago completo)
   - Actualizar capital de los 3 bancos (boveda_monte, flete_sur, utilidades)
   - Solo si estadoPago !== 'pendiente'

Genera el código COMPLETO y funcional.
```

---

## PANEL 3: ÓRDENES DE COMPRA

```
Crea el componente BentoOrdenesCompra.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoOrdenesCompra.tsx

IMPORTS:
- import { useAppStore } from '@/app/lib/store/useAppStore'
- import { calcularOrdenCompra } from '@/app/lib/formulas'
- import type { OrdenCompra, NuevaOrdenCompraInput, Distribuidor } from '@/app/types'

ESTRUCTURA:
- Header con título + stats (Total OCs, Stock disponible, Deuda proveedores)
- Botón "+ Nueva OC" abre modal
- Tabla con 13 columnas:
  1. ID (OC0001, OC0002...)
  2. Fecha
  3. Distribuidor
  4. Origen
  5. Cantidad (inicial)
  6. Stock Actual (con badge si bajo)
  7. Costo/Unidad
  8. Costo Total
  9. Pago Inicial
  10. Deuda
  11. Estado (badge: pendiente/parcial/pagado)
  12. Acciones (Ver | Editar | Pagar)

MODAL NUEVA OC:
- Select Distribuidor (de 6 distribuidores)
- Input Cantidad
- Input Costo Distribuidor (por unidad)
- Input Costo Transporte (por unidad, default 0)
- Input Pago Inicial (opcional)
- Select Banco Origen (si hay pago inicial)

CÁLCULOS (usar formulas.ts):
```typescript
const resultado = calcularOrdenCompra({
  cantidad,
  costoDistribuidor,
  costoTransporte,
  pagoInicial,
})
// resultado = { costoPorUnidad, costoTotal, deuda, estado, stockInicial }
```

PREVIEW EN MODAL:
- Mostrar costo por unidad
- Mostrar costo total
- Mostrar deuda resultante
- Mostrar estado (pendiente/parcial/pagado)

ON SUBMIT:
- Generar ID único (OC + número secuencial)
- Crear OC con stockActual = cantidad
- Si pagoInicial > 0: reducir capital del banco origen
- Actualizar deuda del distribuidor

DISEÑO:
- Mismo estilo glassmorphism que ventas
- Badges de estado con colores
- Stock bajo (<10%): badge rojo
- Hover en filas: highlight

Genera el código COMPLETO y funcional.
```

---

## PANEL 4-10: BANCO (Template Reutilizable)

```
Crea el componente BentoBanco.tsx REUTILIZABLE para los 7 bancos.

UBICACIÓN: app/components/panels/BentoBanco.tsx

PROPS:
```typescript
interface BentoBancoProps {
  bancoId: BancoId  // 'boveda_monte' | 'boveda_usa' | 'utilidades' | 'flete_sur' | 'azteca' | 'leftie' | 'profit'
}
```

IMPORTS:
- import { useAppStore } from '@/app/lib/store/useAppStore'
- import { calcularCapitalBanco, calcularBalanceBanco } from '@/app/lib/formulas'
- import { BANCOS_CONFIG } from '@/app/lib/constants'
- import type { Banco, Movimiento, BancoId } from '@/app/types'

ESTRUCTURA:
```tsx
export function BentoBanco({ bancoId }: BentoBancoProps) {
  const { bancos, movimientos, addMovimiento, addTransferencia } = useAppStore()
  
  // Obtener banco actual
  const banco = bancos.find(b => b.id === bancoId)
  const config = BANCOS_CONFIG.find(c => c.id === bancoId)
  
  // Filtrar movimientos de este banco
  const movimientosBanco = movimientos.filter(m => m.bancoId === bancoId)
  const ingresos = movimientosBanco.filter(m => m.tipoMovimiento === 'ingreso')
  const gastos = movimientosBanco.filter(m => m.tipoMovimiento === 'gasto')
  const transferencias = movimientosBanco.filter(m => 
    m.tipoMovimiento === 'transferencia_entrada' || m.tipoMovimiento === 'transferencia_salida'
  )
  
  return (
    <div className="min-h-screen p-6" style={{
      background: `linear-gradient(135deg, #000 0%, ${config.colorHex}20 100%)`
    }}>
      {/* HEADER BANCO */}
      <motion.div className="flex items-center gap-6 mb-8">
        <div className={`p-4 rounded-3xl bg-gradient-to-br ${config.color}`}>
          <BancoIcon icon={config.icon} className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">{config.nombre}</h1>
          <p className="text-gray-400">{config.descripcion}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-gray-400">Capital Actual</p>
          <p className="text-5xl font-bold font-mono" style={{ color: '#FFD700' }}>
            {formatCurrency(banco.capitalActual)}
          </p>
          <p className={`text-sm ${variacion >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {variacion >= 0 ? '+' : ''}{variacion.toFixed(1)}% vs mes anterior
          </p>
        </div>
      </motion.div>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <KPICard 
          title="Ingresos del Mes" 
          value={ingresosDelMes} 
          icon={ArrowUpRight}
          color="green"
        />
        <KPICard 
          title="Gastos del Mes" 
          value={gastosDelMes} 
          icon={ArrowDownRight}
          color="red"
        />
        <KPICard 
          title="Balance Neto" 
          value={ingresosDelMes - gastosDelMes} 
          icon={TrendingUp}
          color={ingresosDelMes - gastosDelMes >= 0 ? 'green' : 'red'}
        />
      </div>
      
      {/* TABS */}
      <Tabs defaultValue="resumen">
        <TabsList className="bg-white/5 mb-6">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos ({ingresos.length})</TabsTrigger>
          <TabsTrigger value="gastos">Gastos ({gastos.length})</TabsTrigger>
          <TabsTrigger value="transferencias">Transferencias ({transferencias.length})</TabsTrigger>
          <TabsTrigger value="cortes">Cortes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumen">
          {/* Gráfico de área últimos 30 días */}
          {/* Top 5 conceptos ingreso/gasto */}
        </TabsContent>
        
        <TabsContent value="ingresos">
          {/* Header con botón "+ Ingreso" */}
          {/* Tabla de ingresos */}
          {/* Modal para nuevo ingreso */}
        </TabsContent>
        
        <TabsContent value="gastos">
          {/* Header con botón "+ Gasto" */}
          {/* Tabla de gastos */}
          {/* Modal para nuevo gasto */}
        </TabsContent>
        
        <TabsContent value="transferencias">
          {/* Header con botón "+ Transferencia" */}
          {/* Lista de transferencias entrada/salida */}
          {/* Modal para nueva transferencia */}
        </TabsContent>
        
        <TabsContent value="cortes">
          {/* Cards de cortes por periodo */}
          {/* Botón generar nuevo corte */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

MODAL NUEVO INGRESO:
- Input Concepto
- Input Monto
- DatePicker Fecha
- Input Origen (opcional)
- Input Referencia (opcional, ID de venta u OC)

MODAL NUEVO GASTO:
- Input Concepto
- Input Monto
- DatePicker Fecha
- Input Destino (opcional)
- Input Referencia (opcional)

MODAL TRANSFERENCIA:
- Select Banco Destino (otros 6 bancos)
- Input Monto
- Input Concepto

LÓGICA:
- Al crear ingreso: historicoIngresos += monto
- Al crear gasto: historicoGastos += monto
- Al transferir: 
  - Banco origen: historicoGastos += monto (o transferenciaSalida)
  - Banco destino: historicoIngresos += monto (o transferenciaEntrada)

COLORES POR BANCO:
```typescript
const BANCO_COLORS = {
  boveda_monte: { gradient: 'from-blue-500 to-cyan-500', hex: '#3B82F6' },
  boveda_usa: { gradient: 'from-red-500 to-blue-500', hex: '#EF4444' },
  utilidades: { gradient: 'from-green-500 to-emerald-500', hex: '#10B981' },
  flete_sur: { gradient: 'from-orange-500 to-amber-500', hex: '#F97316' },
  azteca: { gradient: 'from-purple-500 to-pink-500', hex: '#A855F7' },
  leftie: { gradient: 'from-yellow-500 to-orange-500', hex: '#EAB308' },
  profit: { gradient: 'from-indigo-500 to-purple-500', hex: '#6366F1' },
}
```

Genera el código COMPLETO y funcional.
```

---

## PANEL 11: DISTRIBUIDORES

```
Crea el componente BentoDistribuidores.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoDistribuidores.tsx

DATOS: 6 distribuidores (PACMAN, Q-MAYA, A/X, etc.)

ESTRUCTURA:
- Header con título + total distribuidores + deuda total a proveedores
- Grid de 6 cards (uno por distribuidor)
- Botón "+ Nuevo Distribuidor"

CARD DISTRIBUIDOR:
```tsx
<Card className="bg-white/5 backdrop-blur-xl border-[#8B00FF]/20 rounded-3xl p-6">
  <div className="flex items-center gap-4 mb-4">
    <Avatar>{distribuidor.nombre[0]}</Avatar>
    <div>
      <h3 className="text-xl font-bold text-white">{distribuidor.nombre}</h3>
      <p className="text-gray-400">{distribuidor.empresa || 'Sin empresa'}</p>
    </div>
    <Badge className={deuda > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}>
      {deuda > 0 ? 'Con deuda' : 'Al día'}
    </Badge>
  </div>
  
  <div className="grid grid-cols-2 gap-4 mb-4">
    <Stat label="Total Órdenes" value={formatCurrency(distribuidor.totalOrdenesCompra)} />
    <Stat label="Total Pagado" value={formatCurrency(distribuidor.totalPagado)} />
    <Stat label="Deuda" value={formatCurrency(distribuidor.deudaTotal)} color="red" />
    <Stat label="# Órdenes" value={distribuidor.numeroOrdenes} />
  </div>
  
  <div className="flex gap-2">
    <Button variant="outline" size="sm">Ver Órdenes</Button>
    <Button variant="outline" size="sm">Registrar Pago</Button>
    <Button variant="ghost" size="sm">Editar</Button>
  </div>
</Card>
```

MODAL NUEVO DISTRIBUIDOR:
- Input Nombre *
- Input Empresa
- Input Contacto
- Input Teléfono
- Input Email
- Input Dirección

MODAL REGISTRAR PAGO:
- Monto a pagar
- Banco origen (para registrar gasto)
- Referencia

LÓGICA:
- Al registrar pago: 
  - Reducir deuda del distribuidor
  - Crear movimiento de gasto en banco origen
  - Actualizar OCs relacionadas si aplica

Genera el código COMPLETO y funcional.
```

---

## PANEL 12: CLIENTES

```
Crea el componente BentoClientesPremium.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoClientesPremium.tsx

DATOS: 31 clientes

ESTRUCTURA:
- Header con título + total clientes + deuda total de clientes
- Tabla con columnas:
  1. Nombre
  2. Teléfono
  3. Total Ventas (suma histórica)
  4. Total Pagado
  5. Deuda Actual
  6. # Compras
  7. Última Compra
  8. Estado (activo/inactivo)
  9. Acciones (Ver | Editar | Abonar)

FILTROS:
- Búsqueda por nombre
- Filtro estado
- Filtro deuda (con deuda / sin deuda)
- Ordenar por deuda, ventas, última compra

MODAL VER CLIENTE (Drawer):
- Info completa del cliente
- Lista de sus ventas
- Historial de pagos
- Gráfico de compras por mes

MODAL REGISTRAR ABONO:
- Monto del abono
- Banco destino
- Método de pago

LÓGICA ABONO:
```typescript
// Al registrar abono de cliente:
// 1. Reducir deuda del cliente
// 2. Distribuir abono a los 3 bancos proporcionalmente
// Usar: calcularDistribucionAbono() de formulas.ts

const distribucion = calcularDistribucionAbono(
  ventaOriginal.distribucionBancos,
  ventaOriginal.totalVenta,
  montoAbono
)

// distribucion = { bovedaMonte: X, fletes: Y, utilidades: Z }
// Actualizar cada banco con su parte
```

Genera el código COMPLETO y funcional.
```

---

## PANEL 13: ALMACÉN

```
Crea el componente BentoAlmacenPremium.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoAlmacenPremium.tsx

TABS:
1. Stock Actual
2. Entradas
3. Salidas
4. Cortes de Inventario

TAB STOCK ACTUAL:
- Grid de cards de productos
- Cada card muestra:
  - Nombre producto
  - SKU
  - Stock actual (con indicador visual)
  - Valor unitario
  - Valor total (stock × valor)
  - Estado: Óptimo | Bajo | Crítico | Agotado
  - Última entrada/salida

CÁLCULO DE ESTADOS:
```typescript
const getEstadoStock = (actual: number, minimo: number) => {
  if (actual === 0) return 'agotado'      // Rojo
  if (actual <= minimo) return 'critico'  // Naranja
  if (actual <= minimo * 2) return 'bajo' // Amarillo
  return 'optimo'                          // Verde
}
```

TAB ENTRADAS:
- Tabla de movimientos tipo='entrada'
- Generalmente vienen de OCs
- Columnas: Fecha | Producto | Cantidad | OC Relacionada | Valor

TAB SALIDAS:
- Tabla de movimientos tipo='salida'
- Generalmente son ventas
- Columnas: Fecha | Producto | Cantidad | Venta Relacionada | Cliente

LÓGICA:
- Stock viene de las OCs (stockActual de cada OC)
- Entrada = cuando se crea OC
- Salida = cuando se hace venta

RESUMEN SUPERIOR:
- Total productos
- Valor total inventario
- Productos bajo stock
- Productos agotados

Genera el código COMPLETO y funcional.
```

---

## PANEL 14: REPORTES

```
Crea el componente BentoReportes.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoReportes.tsx

ESTRUCTURA:
- Header con título + botones de acciones
- Grid de templates de reportes predefinidos
- Constructor de reportes custom

TEMPLATES PREDEFINIDOS:
1. Ventas del Mes
2. Estado de Bancos
3. Deudas por Cobrar
4. Deudas por Pagar
5. Inventario Valorizado
6. Comparativo Periodo

CADA TEMPLATE:
```tsx
<Card onClick={() => generarReporte(template.id)}>
  <CardHeader>
    <div className="flex items-center gap-3">
      <template.icon className="w-8 h-8 text-[#8B00FF]" />
      <CardTitle>{template.nombre}</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-gray-400">{template.descripcion}</p>
    <div className="flex gap-2 mt-4">
      <Badge>PDF</Badge>
      <Badge>Excel</Badge>
    </div>
  </CardContent>
</Card>
```

MODAL GENERAR REPORTE:
- DateRangePicker: periodo
- Filtros según tipo de reporte
- Preview del reporte
- Botones: Generar PDF | Exportar Excel | Enviar por Email

CONSTRUCTOR CUSTOM:
- Drag & drop de widgets
- Widgets disponibles:
  - Tabla de datos
  - Gráfico de línea
  - Gráfico de barras
  - KPI Card
  - Texto/Título
- Configuración por widget
- Guardar como template

Genera el código COMPLETO y funcional.
```

---

## PANEL 15: GASTOS Y ABONOS (G&A)

```
Crea el componente BentoGastosAbonos.tsx para CHRONOS 2026.

UBICACIÓN: app/components/panels/BentoGastosAbonos.tsx

DATOS: 302 registros de gastos_abonos.csv

TABS:
1. Todos (302)
2. Gastos (filtro tipo='gasto')
3. Abonos (filtro tipo='abono')

TABLA PRINCIPAL:
Columnas:
1. Fecha
2. Tipo (badge: gasto=rojo, abono=verde)
3. Origen (cliente/fuente)
4. Valor
5. TC (tipo cambio)
6. Pesos (valor × tc)
7. Destino (banco)
8. Concepto
9. Acciones

FILTROS:
- DateRange
- Tipo (gasto/abono)
- Banco destino
- Búsqueda por origen/concepto

RESUMEN SUPERIOR:
- Total gastos (suma)
- Total abonos (suma)
- Balance neto

MODAL NUEVO REGISTRO:
- Select Tipo: Gasto | Abono
- Input Origen
- Input Valor
- Input TC (default 1 para MXN)
- Select Banco Destino
- Input Concepto

Genera el código COMPLETO y funcional.
```

---

## SUBCOMPONENTES REUTILIZABLES

### KPICard

```
Crea el componente KPICard.tsx reutilizable.

Props:
- title: string
- value: number
- icon: LucideIcon
- change?: number (variación %)
- color?: 'violet' | 'gold' | 'pink' | 'green' | 'red'
- sparklineData?: number[]

Estructura:
- Card con glassmorphism
- Icono animado (pulse suave)
- Título pequeño (text-gray-400)
- Valor grande (text-3xl, font-mono, color dorado)
- Variación con flecha y color
- Sparkline mini (opcional)

Animaciones:
- Entry: fade + slide up
- Hover: scale(1.02) + shadow
- Valor: countup animation
```

### StatBadge

```
Crea el componente StatBadge.tsx reutilizable.

Props:
- label: string
- value: string | number
- variant?: 'default' | 'success' | 'warning' | 'danger'

Estructura:
- Badge compacto
- Label pequeño + valor en bold
- Colores según variant
```

### DistribucionBar

```
Crea el componente DistribucionBar.tsx para mostrar distribución a bancos.

Props:
- label: string ('Bóveda Monte', 'Flete Sur', 'Utilidades')
- value: number
- max: number
- color: 'blue' | 'orange' | 'green'
- description: string ('COSTO', 'FLETE', 'GANANCIA')

Estructura:
- Label + description
- Barra de progreso animada (value/max × 100%)
- Valor formateado ($XXX,XXX)
- Color de fondo según banco
```

---

## HELPERS Y UTILS

### formatCurrency

```typescript
// app/lib/utils/formatters.ts

export function formatCurrency(
  value: number, 
  style: 'full' | 'compact' = 'full'
): string {
  if (style === 'compact') {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
```

### formatDate

```typescript
export function formatDate(
  date: string | Date, 
  style: 'short' | 'long' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (style === 'long') {
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
```

---

## NOTAS FINALES

1. **SIEMPRE usar formulas.ts** para cualquier cálculo financiero
2. **SIEMPRE validar con Zod** antes de submit
3. **SIEMPRE actualizar el store** después de cada operación
4. **NUNCA usar cyan** ni tonos azul-verdosos
5. **SIEMPRE aplicar glassmorphism** (blur 20px+, opacidad 3-10%)
6. **SIEMPRE animar con Framer Motion** (entry, hover, exit)

---

*Documento: PROMPTS_14_PANELES_CHRONOS_2026.md*
*Versión: 1.0.0*
*Fecha: 2024-12-XX*
