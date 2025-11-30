'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle, AlertCircle, XCircle, Zap } from 'lucide-react'
import { useState } from 'react'

interface Activity {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  time: string
}

interface ActivityTimelineWidgetProps {
  activities: Activity[]
}

const iconMap = {
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Zap,
}

const colorMap = {
  success: 'from-emerald-500 to-green-400',
  warning: 'from-amber-500 to-orange-400',
  error: 'from-rose-500 to-red-400',
  info: 'from-blue-500 to-cyan-400',
}

export default function ActivityTimelineWidget({ activities = [] }: ActivityTimelineWidgetProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative col-span-12 lg:col-span-4 h-[400px] rounded-[32px] overflow-hidden"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 backdrop-blur-xl border border-white/10" />

      <div className="relative h-full p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Actividad Reciente</h3>
            <p className="text-white/40 text-xs">Últimas acciones del sistema</p>
          </div>

          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-400 shadow-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {activities.slice(0, 6).map((activity, index) => {
            const Icon = iconMap[activity.type]
            const isExpanded = expandedId === activity.id

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="relative"
              >
                {/* Timeline Line */}
                {index < activities.length - 1 && (
                  <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gradient-to-b from-white/20 to-transparent" />
                )}

                {/* Activity Card */}
                <motion.div
                  whileHover={{ x: 5 }}
                  onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                  className="relative pl-12 cursor-pointer"
                >
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.4 }}
                    className={`absolute left-0 top-1 w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[activity.type]} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </motion.div>

                  {/* Content */}
                  <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{activity.title}</p>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="text-white/60 text-xs mt-1"
                            >
                              {activity.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <span className="text-white/40 text-xs whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
