import type { Banco, BancoId } from '@/app/types'

/**
 * Configuración base de los 7 bancos/bóvedas del sistema
 * Esta es la estructura de configuración, NO datos - los valores reales vienen de Firestore
 */
export const BANCOS_CONFIG: Array<{
  id: BancoId
  nombre: string
  icon: string
  color: string
  tipo: 'boveda' | 'utilidades' | 'gastos' | 'operativo'
  descripcion: string
  moneda: 'MXN' | 'USD'
}> = [
  {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    icon: 'building',
    color: 'from-blue-500 to-cyan-500',
    tipo: 'boveda',
    descripcion: 'Capital principal de operaciones',
    moneda: 'MXN',
  },
  {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    icon: 'flag',
    color: 'from-red-500 to-blue-500',
    tipo: 'boveda',
    descripcion: 'Capital en dólares/USA',
    moneda: 'USD',
  },
  {
    id: 'utilidades',
    nombre: 'Utilidades',
    icon: 'diamond',
    color: 'from-green-500 to-emerald-500',
    tipo: 'utilidades',
    descripcion: 'Ganancias netas del negocio',
    moneda: 'MXN',
  },
  {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    icon: 'truck',
    color: 'from-orange-500 to-amber-500',
    tipo: 'gastos',
    descripcion: 'Capital para gastos de transporte',
    moneda: 'MXN',
  },
  {
    id: 'azteca',
    nombre: 'Azteca',
    icon: 'store',
    color: 'from-purple-500 to-pink-500',
    tipo: 'operativo',
    descripcion: 'Cuenta bancaria externa Azteca',
    moneda: 'MXN',
  },
  {
    id: 'leftie',
    nombre: 'Leftie',
    icon: 'briefcase',
    color: 'from-yellow-500 to-orange-500',
    tipo: 'operativo',
    descripcion: 'Capital de negocio secundario',
    moneda: 'MXN',
  },
  {
    id: 'profit',
    nombre: 'Profit',
    icon: 'trending-up',
    color: 'from-indigo-500 to-purple-500',
    tipo: 'operativo',
    descripcion: 'Utilidades distribuidas',
    moneda: 'MXN',
  },
]

/**
 * @deprecated Use BANCOS_CONFIG y lee los datos reales desde Firestore
 * Array vacío - los datos con valores vienen de Firestore
 */
export const BANCOS: Banco[] = []
