'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, CreditCard, ArrowRightLeft, DollarSign } from 'lucide-react'

interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  time: number
  type: 'ingreso' | 'egreso' | 'transferencia'
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  life: number
}

interface BankAccount {
  id: string
  name: string
  balance: number
  x: number
  y: number
  color: string
  ripples: Ripple[]
}

interface Ripple {
  radius: number
  maxRadius: number
  opacity: number
}

interface FinancialRiverFlowProps {
  accounts?: BankAccount[]
  transactions?: Omit<Transaction, 'x' | 'y' | 'vx' | 'vy' | 'radius' | 'life'>[]
  width?: number
  height?: number
  className?: string
}

export function FinancialRiverFlow({
  accounts,
  transactions,
  width = 900,
  height = 600,
  className = '',
}: FinancialRiverFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const transactionsRef = useRef<Transaction[]>([])
  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Datos por defecto
  const defaultAccounts: BankAccount[] = [
    { id: 'main', name: 'Cuenta Principal', balance: 1250000, x: 150, y: 300, color: '#3b82f6', ripples: [] },
    { id: 'operations', name: 'Operaciones', balance: 380000, x: 450, y: 200, color: '#10b981', ripples: [] },
    { id: 'savings', name: 'Ahorros', balance: 520000, x: 450, y: 400, color: '#f59e0b', ripples: [] },
    { id: 'investment', name: 'Inversiones', balance: 890000, x: 750, y: 300, color: '#8b5cf6', ripples: [] },
  ]

  const bankAccounts = accounts || defaultAccounts

  // Crear transacción visual
  const createTransaction = (tx: Omit<Transaction, 'x' | 'y' | 'vx' | 'vy' | 'radius' | 'life'>) => {
    const fromAccount = bankAccounts.find(a => a.id === tx.from)
    const toAccount = bankAccounts.find(a => a.id === tx.to)
    
    if (!fromAccount || !toAccount) return

    const angle = Math.atan2(toAccount.y - fromAccount.y, toAccount.x - fromAccount.x)
    const speed = 2 + Math.random()

    transactionsRef.current.push({
      ...tx,
      x: fromAccount.x,
      y: fromAccount.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.log(tx.amount) * 2 + 5,
      life: 100,
    })

    // Crear ripple en cuenta origen
    fromAccount.ripples.push({ radius: 0, maxRadius: 60, opacity: 1 })
  }

  // Generar transacciones aleatorias
  useEffect(() => {
    const interval = setInterval(() => {
      const accounts = bankAccounts.map(a => a.id)
      const from = accounts[Math.floor(Math.random() * accounts.length)]
      let to = accounts[Math.floor(Math.random() * accounts.length)]
      while (to === from) {
        to = accounts[Math.floor(Math.random() * accounts.length)]
      }

      const types: ('ingreso' | 'egreso' | 'transferencia')[] = ['ingreso', 'egreso', 'transferencia']
      createTransaction({
        id: `tx-${Date.now()}`,
        from,
        to,
        amount: 1000 + Math.random() * 50000,
        time: Date.now(),
        type: types[Math.floor(Math.random() * types.length)],
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [bankAccounts])

  // Animación del canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fondo con gradiente de agua
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bgGradient.addColorStop(0, 'rgba(10, 20, 40, 1)')
      bgGradient.addColorStop(0.5, 'rgba(20, 30, 60, 1)')
      bgGradient.addColorStop(1, 'rgba(10, 20, 40, 1)')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dibujar corrientes de agua entre cuentas
      bankAccounts.forEach((fromAccount, i) => {
        bankAccounts.slice(i + 1).forEach(toAccount => {
          const gradient = ctx.createLinearGradient(
            fromAccount.x, fromAccount.y,
            toAccount.x, toAccount.y,
          )
          gradient.addColorStop(0, `${fromAccount.color}15`)
          gradient.addColorStop(0.5, `${fromAccount.color}08`)
          gradient.addColorStop(1, `${toAccount.color}15`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = 40
          ctx.lineCap = 'round'

          // Curva Bézier para la corriente
          const cp1x = fromAccount.x + (toAccount.x - fromAccount.x) * 0.3
          const cp1y = fromAccount.y + 50
          const cp2x = fromAccount.x + (toAccount.x - fromAccount.x) * 0.7
          const cp2y = toAccount.y - 50

          ctx.beginPath()
          ctx.moveTo(fromAccount.x, fromAccount.y)
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toAccount.x, toAccount.y)
          ctx.stroke()

          // Líneas de flujo animadas (efecto de agua)
          for (let j = 0; j < 3; j++) {
            const offset = (Date.now() * 0.0005 + j * 0.33) % 1
            const t = offset
            
            const x = Math.pow(1-t, 3) * fromAccount.x +
                     3 * Math.pow(1-t, 2) * t * cp1x +
                     3 * (1-t) * Math.pow(t, 2) * cp2x +
                     Math.pow(t, 3) * toAccount.x
            
            const y = Math.pow(1-t, 3) * fromAccount.y +
                     3 * Math.pow(1-t, 2) * t * cp1y +
                     3 * (1-t) * Math.pow(t, 2) * cp2y +
                     Math.pow(t, 3) * toAccount.y

            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fillStyle = `${fromAccount.color}60`
            ctx.fill()
          }
        })
      })

      // Actualizar y dibujar ripples
      bankAccounts.forEach(account => {
        account.ripples = account.ripples.filter(ripple => {
          ripple.radius += 2
          ripple.opacity -= 0.02

          if (ripple.opacity <= 0) return false

          ctx.strokeStyle = `${account.color}${Math.floor(ripple.opacity * 255).toString(16).padStart(2, '0')}`
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(account.x, account.y, ripple.radius, 0, Math.PI * 2)
          ctx.stroke()

          return true
        })
      })

      // Dibujar cuentas bancarias
      bankAccounts.forEach(account => {
        const isHovered = hoveredAccount === account.id
        const radius = isHovered ? 70 : 60

        // Glow effect
        if (isHovered) {
          ctx.shadowBlur = 40
          ctx.shadowColor = account.color
        }

        // Gradiente de la cuenta
        const accountGradient = ctx.createRadialGradient(
          account.x - 15, account.y - 15, 0,
          account.x, account.y, radius,
        )
        accountGradient.addColorStop(0, `${account.color}ff`)
        accountGradient.addColorStop(1, `${account.color}cc`)

        ctx.beginPath()
        ctx.arc(account.x, account.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = accountGradient
        ctx.fill()

        // Borde
        ctx.strokeStyle = isHovered ? '#ffffff' : `${account.color}80`
        ctx.lineWidth = isHovered ? 4 : 2
        ctx.stroke()

        ctx.shadowBlur = 0

        // Icono
        ctx.fillStyle = '#ffffff'
        ctx.font = '30px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💰', account.x, account.y)
      })

      // Actualizar y dibujar transacciones (burbujas)
      transactionsRef.current = transactionsRef.current.filter(tx => {
        tx.x += tx.vx
        tx.y += tx.vy
        tx.life -= 1

        if (tx.life <= 0) {
          // Crear ripple en cuenta destino
          const toAccount = bankAccounts.find(a => a.id === tx.to)
          if (toAccount) {
            const distance = Math.sqrt((tx.x - toAccount.x) ** 2 + (tx.y - toAccount.y) ** 2)
            if (distance < 80) {
              toAccount.ripples.push({ radius: 0, maxRadius: 50, opacity: 1 })
              return false
            }
          }
        }

        // Gravedad hacia cuenta destino
        const toAccount = bankAccounts.find(a => a.id === tx.to)
        if (toAccount) {
          const dx = toAccount.x - tx.x
          const dy = toAccount.y - tx.y
          const distance = Math.sqrt(dx ** 2 + dy ** 2)
          
          if (distance > 10) {
            const force = 0.05
            tx.vx += (dx / distance) * force
            tx.vy += (dy / distance) * force
          }
        }

        // Color según tipo
        const color = tx.type === 'ingreso' ? '#10b981' :
                     tx.type === 'egreso' ? '#ef4444' : '#3b82f6'

        // Gradiente de la burbuja
        const bubbleGradient = ctx.createRadialGradient(
          tx.x - tx.radius * 0.3,
          tx.y - tx.radius * 0.3,
          0,
          tx.x,
          tx.y,
          tx.radius,
        )
        bubbleGradient.addColorStop(0, `${color}ff`)
        bubbleGradient.addColorStop(0.7, `${color}cc`)
        bubbleGradient.addColorStop(1, `${color}66`)

        // Burbuja principal
        ctx.beginPath()
        ctx.arc(tx.x, tx.y, tx.radius, 0, Math.PI * 2)
        ctx.fillStyle = bubbleGradient
        ctx.fill()

        // Brillo en la burbuja
        const highlightGradient = ctx.createRadialGradient(
          tx.x - tx.radius * 0.4,
          tx.y - tx.radius * 0.4,
          0,
          tx.x - tx.radius * 0.4,
          tx.y - tx.radius * 0.4,
          tx.radius * 0.6,
        )
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.beginPath()
        ctx.arc(tx.x - tx.radius * 0.3, tx.y - tx.radius * 0.3, tx.radius * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = highlightGradient
        ctx.fill()

        // Monto en la burbuja
        if (tx.radius > 10) {
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`$${Math.floor(tx.amount / 1000)}k`, tx.x, tx.y)
        }

        return tx.life > 0
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [bankAccounts, hoveredAccount])

  // Detectar hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found = false
    for (const account of bankAccounts) {
      const distance = Math.sqrt((x - account.x) ** 2 + (y - account.y) ** 2)
      if (distance < 60) {
        setHoveredAccount(account.id)
        found = true
        break
      }
    }
    if (!found) setHoveredAccount(null)
  }

  return (
    <div className={`relative ${className}`}>
      <motion.canvas
        ref={canvasRef}
        width={width}
        height={height}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl cursor-pointer"
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onMouseMove={handleMouseMove}
      />

      {/* Tooltip cuenta */}
      <AnimatePresence>
        {hoveredAccount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-black/80 rounded-xl px-6 py-4 border border-white/20">
              {(() => {
                const account = bankAccounts.find(a => a.id === hoveredAccount)
                if (!account) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${account.color}30` }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: account.color }} />
                      </div>
                      <p className="text-white font-bold">{account.name}</p>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${(account.balance / 1000).toFixed(0)}k
                    </div>
                    <p className="text-white/60 text-xs mt-1">
                      {transactionsRef.current.filter(tx => tx.from === account.id || tx.to === account.id).length} transacciones activas
                    </p>
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <p className="text-white text-xs font-semibold mb-3">Flujo Financiero</p>
        <div className="space-y-2">
          {bankAccounts.map(account => (
            <div key={account.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: account.color }}
              />
              <p className="text-white/80 text-xs">{account.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/60 text-xs">
            💰 {transactionsRef.current.length} transacciones en tránsito
          </p>
        </div>
      </div>
    </div>
  )
}
