"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Calendar, Filter, Search, Download, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface AdvancedFilterBarProps {
  onSearch?: (query: string) => void
  onFilterChange?: (filters: any) => void
  onExport?: () => void
  onRefresh?: () => void
  showDateRange?: boolean
  showExport?: boolean
  filterOptions?: { label: string; value: string }[]
}

export function AdvancedFilterBar({
  onSearch,
  onFilterChange,
  onExport,
  onRefresh,
  showDateRange = true,
  showExport = true,
  filterOptions = [],
}: AdvancedFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30d")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch?.(e.target.value)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value)
    onFilterChange?.({ filter: value, dateRange })
  }

  const handleDateChange = (value: string) => {
    setDateRange(value)
    onFilterChange?.({ filter: selectedFilter, dateRange: value })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 p-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl"
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Buscar..."
          className="pl-10 bg-zinc-800/50 border-zinc-700/50 focus:border-purple-500/50"
        />
      </div>

      {/* Filter Select */}
      {filterOptions.length > 0 && (
        <Select value={selectedFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px] bg-zinc-800/50 border-zinc-700/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Date Range */}
      {showDateRange && (
        <Select value={dateRange} onValueChange={handleDateChange}>
          <SelectTrigger className="w-[140px] bg-zinc-800/50 border-zinc-700/50">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
            <SelectItem value="1y">Último año</SelectItem>
            <SelectItem value="all">Todo el tiempo</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onRefresh && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon" onClick={onRefresh} className="border-zinc-700/50 bg-transparent">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
        {showExport && onExport && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon" onClick={onExport} className="border-zinc-700/50 bg-transparent">
              <Download className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
