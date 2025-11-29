"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Phone, Mail, MapPin, Building2 } from "lucide-react"
import { firestoreService } from "@/frontend/app/lib/firebase/firestore-service"
import { useToast } from "@/frontend/app/hooks/use-toast"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"

interface ClienteFormData {
  nombre: string
  empresa: string
  telefono: string
  email: string
  direccion: string
}

interface CreateClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClienteFormData) => void
}

export default function CreateClienteModal({ isOpen, onClose, onSubmit }: CreateClienteModalProps) {
  const { toast } = useToast()
  const { triggerDataRefresh } = useAppStore()
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    telefono: "",
    email: "",
    direccion: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const clienteData = {
        nombre: formData.nombre,
        empresa: formData.empresa,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
      }

      // Crear cliente en Firestore
      await firestoreService.crearCliente(clienteData)

      // 🔄 Trigger para actualizar hooks de datos
      triggerDataRefresh()

      onSubmit(formData)

      toast({
        title: "Cliente Creado",
        description: `El cliente "${formData.nombre}" ha sido registrado exitosamente en Firestore.`,
      })

      // Limpiar formulario
      setFormData({
        nombre: "",
        empresa: "",
        telefono: "",
        email: "",
        direccion: "",
      })

      setStep(1)
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el cliente.",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setStep(1)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl z-50"
          >
            <div className="relative p-8 border-b border-gray-700/50 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5" />
              <button
                onClick={handleClose}
                className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-2">Nuevo Cliente</h2>
                <p className="text-gray-400 text-sm">Registra la información del cliente</p>

                {/* Step Progress */}
                <div className="flex gap-2 mt-6">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full bg-gray-700/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step >= s ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          <User className="w-4 h-4 inline mr-2" />
                          Nombre del Cliente
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="Ej: CLIENTE PREMIUM"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          <Building2 className="w-4 h-4 inline mr-2" />
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={formData.empresa}
                          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="Nombre de la empresa (opcional)"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!formData.nombre}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
                      >
                        Continuar →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="+52 ..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          placeholder="email@ejemplo.com"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Dirección
                        </label>
                        <textarea
                          value={formData.direccion}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                          placeholder="Dirección completa (opcional)"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-8 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
                      >
                        ← Atrás
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25"
                      >
                        Crear Cliente ✓
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
