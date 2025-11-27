"use client"

import { motion } from "framer-motion"
import { TrendingUp, Package, Star } from "lucide-react"
import { useState } from "react"

interface Product {
  id: string
  name: string
  sales: number
  revenue: number
  trend: number
}

interface TopProductsWidgetProps {
  products: Product[]
}

export default function TopProductsWidget({ products = [] }: TopProductsWidgetProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative col-span-12 md:col-span-6 lg:col-span-4 h-[400px] rounded-[32px] overflow-hidden"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 backdrop-blur-xl border border-white/10" />

      <div className="relative h-full p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Top Productos</h3>
            <p className="text-white/40 text-xs">Más vendidos este mes</p>
          </div>

          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg"
          >
            <Star className="w-5 h-5 text-white" />
          </motion.div>
        </div>

        {/* Products List */}
        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          {products.slice(0, 5).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className="relative group"
            >
              {/* Rank Badge */}
              <motion.div
                animate={{
                  scale: hoveredIndex === index ? 1.1 : 1,
                  rotate: hoveredIndex === index ? 360 : 0,
                }}
                transition={{ duration: 0.4 }}
                className={`absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                    : index === 1
                      ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                      : index === 2
                        ? "bg-gradient-to-br from-orange-400 to-amber-600 text-white"
                        : "bg-white/10 text-white/60"
                }`}
              >
                {index + 1}
              </motion.div>

              {/* Product Card */}
              <motion.div
                whileHover={{ x: 5 }}
                className="ml-6 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Package className="w-4 h-4 text-amber-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{product.name}</p>
                      <p className="text-white/40 text-xs">{product.sales} unidades vendidas</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-white font-bold">${product.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{product.trend}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
