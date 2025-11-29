"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Clock,
  Mail,
  FileText,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  Send,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Bell,
  Settings,
  Users,
  BarChart3,
  TrendingUp,
  Wallet,
  Package,
  Truck,
} from "lucide-react"
import { cn } from "@/app/lib/utils"

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES Y TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface ReporteProgramado {
  id: string
  nombre: string
  descripcion: string
  tipo: TipoReporte
  frecuencia: Frecuencia
  diasSemana?: number[] // 0-6 para semana
  diaDelMes?: number // 1-31 para mensual
  hora: string // HH:mm
  destinatarios: string[]
  formato: "pdf" | "excel" | "csv" | "json"
  filtros: Record<string, unknown>
  activo: boolean
  ultimaEjecucion?: Date
  proximaEjecucion?: Date
  historial: HistorialEjecucion[]
  createdAt: Date
  updatedAt: Date
}

interface HistorialEjecucion {
  id: string
  fecha: Date
  estado: "exito" | "error" | "pendiente"
  mensaje?: string
  archivoUrl?: string
  duracionMs?: number
}

type TipoReporte =
  | "ventas-diario"
  | "ventas-semanal"
  | "ventas-mensual"
  | "inventario"
  | "distribuidores"
  | "clientes"
  | "bancos"
  | "utilidades"
  | "general"
  | "personalizado"

type Frecuencia = "diaria" | "semanal" | "mensual" | "trimestral" | "anual" | "una-vez"

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIONES
// ═══════════════════════════════════════════════════════════════════════════════

const TIPOS_REPORTE = [
  { id: "ventas-diario", label: "Ventas Diarias", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
  { id: "ventas-semanal", label: "Ventas Semanales", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
  { id: "ventas-mensual", label: "Ventas Mensuales", icon: FileText, color: "from-purple-500 to-pink-500" },
  { id: "inventario", label: "Estado de Inventario", icon: Package, color: "from-orange-500 to-amber-500" },
  { id: "distribuidores", label: "Reporte Distribuidores", icon: Truck, color: "from-indigo-500 to-violet-500" },
  { id: "clientes", label: "Cartera de Clientes", icon: Users, color: "from-teal-500 to-cyan-500" },
  { id: "bancos", label: "Estado de Bancos", icon: Wallet, color: "from-rose-500 to-red-500" },
  { id: "utilidades", label: "Reporte de Utilidades", icon: TrendingUp, color: "from-yellow-500 to-orange-500" },
] as const

const FRECUENCIAS = [
  { id: "diaria", label: "Diaria" },
  { id: "semanal", label: "Semanal" },
  { id: "mensual", label: "Mensual" },
  { id: "trimestral", label: "Trimestral" },
  { id: "anual", label: "Anual" },
  { id: "una-vez", label: "Una vez" },
] as const

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const FORMATOS = [
  { id: "pdf", label: "PDF", ext: ".pdf" },
  { id: "excel", label: "Excel", ext: ".xlsx" },
  { id: "csv", label: "CSV", ext: ".csv" },
  { id: "json", label: "JSON", ext: ".json" },
] as const

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function ScheduledReports() {
  const [reportes, setReportes] = useState<ReporteProgramado[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<ReporteProgramado>>({
    nombre: "",
    descripcion: "",
    tipo: "ventas-diario",
    frecuencia: "diaria",
    hora: "08:00",
    destinatarios: [],
    formato: "pdf",
    filtros: {},
    activo: true,
    diasSemana: [1], // Lunes por defecto
    diaDelMes: 1,
  })

  const [nuevoDestinatario, setNuevoDestinatario] = useState("")

  // Simular carga de reportes desde Firestore
  useEffect(() => {
    const mockReportes: ReporteProgramado[] = [
      {
        id: "1",
        nombre: "Reporte de Ventas Diario",
        descripcion: "Resumen de ventas del día anterior con desglose por distribuidor",
        tipo: "ventas-diario",
        frecuencia: "diaria",
        hora: "07:00",
        destinatarios: ["admin@chronos.com", "gerencia@chronos.com"],
        formato: "pdf",
        filtros: {},
        activo: true,
        ultimaEjecucion: new Date(Date.now() - 86400000),
        proximaEjecucion: new Date(Date.now() + 86400000),
        historial: [
          { id: "h1", fecha: new Date(Date.now() - 86400000), estado: "exito", duracionMs: 2340 },
          { id: "h2", fecha: new Date(Date.now() - 172800000), estado: "exito", duracionMs: 2150 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        nombre: "Inventario Semanal",
        descripcion: "Estado completo del inventario con alertas de stock bajo",
        tipo: "inventario",
        frecuencia: "semanal",
        diasSemana: [1], // Lunes
        hora: "06:00",
        destinatarios: ["almacen@chronos.com"],
        formato: "excel",
        filtros: {},
        activo: true,
        ultimaEjecucion: new Date(Date.now() - 604800000),
        proximaEjecucion: new Date(Date.now() + 172800000),
        historial: [
          { id: "h3", fecha: new Date(Date.now() - 604800000), estado: "exito", duracionMs: 4520 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        nombre: "Utilidades Mensuales",
        descripcion: "Resumen de utilidades del mes con comparativo histórico",
        tipo: "utilidades",
        frecuencia: "mensual",
        diaDelMes: 1,
        hora: "05:00",
        destinatarios: ["contabilidad@chronos.com", "gerencia@chronos.com"],
        formato: "pdf",
        filtros: {},
        activo: false,
        ultimaEjecucion: new Date(Date.now() - 2592000000),
        historial: [
          { id: "h4", fecha: new Date(Date.now() - 2592000000), estado: "error", mensaje: "Timeout en generación" },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    setReportes(mockReportes)
  }, [])

  // Handlers
  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      nombre: "",
      descripcion: "",
      tipo: "ventas-diario",
      frecuencia: "diaria",
      hora: "08:00",
      destinatarios: [],
      formato: "pdf",
      filtros: {},
      activo: true,
      diasSemana: [1],
      diaDelMes: 1,
    })
  }

  const handleEdit = (reporte: ReporteProgramado) => {
    setIsCreating(true)
    setEditingId(reporte.id)
    setFormData(reporte)
  }

  const handleSave = () => {
    if (!formData.nombre || !formData.tipo) return

    if (editingId) {
      // Editar existente
      setReportes((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, ...formData, updatedAt: new Date() } as ReporteProgramado
            : r
        )
      )
    } else {
      // Crear nuevo
      const nuevoReporte: ReporteProgramado = {
        id: Date.now().toString(),
        nombre: formData.nombre || "",
        descripcion: formData.descripcion || "",
        tipo: formData.tipo as TipoReporte,
        frecuencia: formData.frecuencia as Frecuencia,
        hora: formData.hora || "08:00",
        destinatarios: formData.destinatarios || [],
        formato: formData.formato || "pdf",
        filtros: formData.filtros || {},
        activo: formData.activo ?? true,
        diasSemana: formData.diasSemana,
        diaDelMes: formData.diaDelMes,
        historial: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setReportes((prev) => [...prev, nuevoReporte])
    }

    setIsCreating(false)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    setReportes((prev) => prev.filter((r) => r.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, activo: !r.activo } : r))
    )
  }

  const handleRunNow = async (id: string) => {
    setLoading(true)
    // Simular ejecución
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setReportes((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ultimaEjecucion: new Date(),
              historial: [
                {
                  id: Date.now().toString(),
                  fecha: new Date(),
                  estado: "exito" as const,
                  duracionMs: 2345,
                },
                ...r.historial,
              ],
            }
          : r
      )
    )
    setLoading(false)
  }

  const handleAddDestinatario = () => {
    if (nuevoDestinatario && nuevoDestinatario.includes("@")) {
      setFormData((prev) => ({
        ...prev,
        destinatarios: [...(prev.destinatarios || []), nuevoDestinatario],
      }))
      setNuevoDestinatario("")
    }
  }

  const handleRemoveDestinatario = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      destinatarios: (prev.destinatarios || []).filter((d) => d !== email),
    }))
  }

  const handleToggleDiaSemana = (dia: number) => {
    setFormData((prev) => {
      const dias = prev.diasSemana || []
      if (dias.includes(dia)) {
        return { ...prev, diasSemana: dias.filter((d) => d !== dia) }
      }
      return { ...prev, diasSemana: [...dias, dia].sort() }
    })
  }

  // Calcular próxima ejecución (simplificado)
  const calcularProximaEjecucion = (reporte: ReporteProgramado): string => {
    const ahora = new Date()
    const [horas, minutos] = reporte.hora.split(":").map(Number)

    let proxima = new Date(ahora)
    proxima.setHours(horas, minutos, 0, 0)

    if (proxima <= ahora) {
      proxima.setDate(proxima.getDate() + 1)
    }

    return proxima.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Reportes Programados
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Automatiza la generación y envío de reportes
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreate}
          className="btn-premium px-4 py-2 rounded-xl text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Reporte
        </motion.button>
      </div>

      {/* Lista de reportes programados */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {reportes.map((reporte) => {
            const tipoConfig = TIPOS_REPORTE.find((t) => t.id === reporte.tipo)
            const IconoTipo = tipoConfig?.icon || FileText

            return (
              <motion.div
                key={reporte.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "crystal-card p-6 relative overflow-hidden",
                  !reporte.activo && "opacity-60"
                )}
              >
                {/* Indicador de color */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
                    tipoConfig?.color || "from-gray-500 to-gray-600"
                  )}
                />

                <div className="flex items-start gap-4 pl-4">
                  {/* Icono */}
                  <div
                    className={cn(
                      "p-3 rounded-xl bg-gradient-to-br flex-shrink-0",
                      tipoConfig?.color || "from-gray-500 to-gray-600"
                    )}
                  >
                    <IconoTipo className="w-5 h-5 text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-semibold text-white truncate">
                        {reporte.nombre}
                      </h4>
                      {reporte.activo ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                          Pausado
                        </span>
                      )}
                    </div>

                    <p className="text-white/60 text-sm mb-3">
                      {reporte.descripcion}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {/* Frecuencia */}
                      <div className="flex items-center gap-1.5 text-white/50">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="capitalize">{reporte.frecuencia}</span>
                      </div>

                      {/* Hora */}
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{reporte.hora}</span>
                      </div>

                      {/* Formato */}
                      <div className="flex items-center gap-1.5 text-white/50">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="uppercase">{reporte.formato}</span>
                      </div>

                      {/* Destinatarios */}
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{reporte.destinatarios.length} destinatarios</span>
                      </div>

                      {/* Próxima ejecución */}
                      {reporte.activo && (
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Próxima: {calcularProximaEjecucion(reporte)}</span>
                        </div>
                      )}
                    </div>

                    {/* Historial reciente */}
                    {reporte.historial.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-white/40">Última:</span>
                        {reporte.historial[0].estado === "exito" ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Éxito ({reporte.historial[0].duracionMs}ms)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            Error: {reporte.historial[0].mensaje}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRunNow(reporte.id)}
                      disabled={loading}
                      className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-white/60 hover:text-blue-400 transition-colors"
                      title="Ejecutar ahora"
                    >
                      <Play className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleActive(reporte.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        reporte.activo
                          ? "bg-white/5 hover:bg-orange-500/20 text-white/60 hover:text-orange-400"
                          : "bg-white/5 hover:bg-green-500/20 text-white/60 hover:text-green-400"
                      )}
                      title={reporte.activo ? "Pausar" : "Activar"}
                    >
                      {reporte.activo ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(reporte)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(reporte.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {reportes.length === 0 && !isCreating && (
          <div className="crystal-card p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <h4 className="text-lg font-medium text-white mb-2">
              No hay reportes programados
            </h4>
            <p className="text-white/50 text-sm mb-4">
              Crea tu primer reporte automatizado
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className="btn-premium px-4 py-2 rounded-xl text-white inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Reporte
            </motion.button>
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="crystal-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">
                {editingId ? "Editar Reporte" : "Nuevo Reporte Programado"}
              </h3>

              <div className="space-y-6">
                {/* Nombre y descripción */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Nombre del Reporte *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                      placeholder="Ej: Ventas del día"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Tipo de Reporte *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tipo: e.target.value as TipoReporte,
                        }))
                      }
                      className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    >
                      {TIPOS_REPORTE.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 resize-none"
                    rows={2}
                    placeholder="Descripción opcional del reporte..."
                  />
                </div>

                {/* Frecuencia */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Frecuencia *
                    </label>
                    <select
                      value={formData.frecuencia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          frecuencia: e.target.value as Frecuencia,
                        }))
                      }
                      className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    >
                      {FRECUENCIAS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Hora de Envío *
                    </label>
                    <input
                      type="time"
                      value={formData.hora}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hora: e.target.value }))
                      }
                      className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Formato *
                    </label>
                    <select
                      value={formData.formato}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          formato: e.target.value as ReporteProgramado["formato"],
                        }))
                      }
                      className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    >
                      {FORMATOS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label} ({f.ext})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Días de semana (solo para semanal) */}
                {formData.frecuencia === "semanal" && (
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Días de la Semana
                    </label>
                    <div className="flex gap-2">
                      {DIAS_SEMANA.map((dia, index) => (
                        <button
                          key={index}
                          onClick={() => handleToggleDiaSemana(index)}
                          className={cn(
                            "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                            formData.diasSemana?.includes(index)
                              ? "bg-blue-500 text-white"
                              : "bg-white/5 text-white/60 hover:bg-white/10"
                          )}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Día del mes (solo para mensual) */}
                {formData.frecuencia === "mensual" && (
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Día del Mes
                    </label>
                    <select
                      value={formData.diaDelMes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          diaDelMes: parseInt(e.target.value),
                        }))
                      }
                      className="w-full bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                        <option key={dia} value={dia}>
                          {dia}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Destinatarios */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Destinatarios
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={nuevoDestinatario}
                      onChange={(e) => setNuevoDestinatario(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddDestinatario()}
                      className="flex-1 bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                      placeholder="email@ejemplo.com"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddDestinatario}
                      className="px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Lista de destinatarios */}
                  {formData.destinatarios && formData.destinatarios.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.destinatarios.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-white/80 text-sm"
                        >
                          <Mail className="w-3 h-3" />
                          {email}
                          <button
                            onClick={() => handleRemoveDestinatario(email)}
                            className="ml-1 hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle activo */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, activo: !prev.activo }))
                    }
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      formData.activo ? "bg-green-500" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                        formData.activo ? "left-6" : "left-0.5"
                      )}
                    />
                  </button>
                  <span className="text-white/70 text-sm">
                    {formData.activo ? "Reporte activo" : "Reporte pausado"}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={!formData.nombre}
                  className="btn-premium px-6 py-2.5 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? "Guardar Cambios" : "Crear Reporte"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ScheduledReports
