"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { BANCOS } from "@/lib/constants"
import type { Banco, OrdenCompra, Venta, Distribuidor, Cliente, Producto } from "@/types"

interface AppContextType {
  bancos: Banco[]
  ordenesCompra: OrdenCompra[]
  ventas: Venta[]
  distribuidores: Distribuidor[]
  clientes: Cliente[]
  almacen: Producto[]
  loading: boolean
  setBancos: (bancos: Banco[]) => void
  setOrdenesCompra: (ordenes: OrdenCompra[]) => void
  setVentas: (ventas: Venta[]) => void
  setDistribuidores: (distribuidores: Distribuidor[]) => void
  setClientes: (clientes: Cliente[]) => void
  setAlmacen: (productos: Producto[]) => void
}

const AppContext = createContext<AppContextType>({
  bancos: [],
  ordenesCompra: [],
  ventas: [],
  distribuidores: [],
  clientes: [],
  almacen: [],
  loading: true,
  setBancos: () => {},
  setOrdenesCompra: () => {},
  setVentas: () => {},
  setDistribuidores: () => {},
  setClientes: () => {},
  setAlmacen: () => {},
})

export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: ReactNode }) {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [almacen, setAlmacen] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initBancos: Banco[] = BANCOS.map((banco) => ({
      id: banco.id,
      nombre: banco.nombre,
      color: banco.color,
      capitalActual: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      ingresos: [],
      gastos: [],
      cortes: [],
      transferencias: [],
    }))

    setBancos(initBancos)
    setLoading(false)
  }, [])

  return (
    <AppContext.Provider
      value={{
        bancos,
        ordenesCompra,
        ventas,
        distribuidores,
        clientes,
        almacen,
        loading,
        setBancos,
        setOrdenesCompra,
        setVentas,
        setDistribuidores,
        setClientes,
        setAlmacen,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
