/**
 * 🤖 BotID Client Instrumentation
 * Protección avanzada contra bots en rutas sensibles
 * 
 * Este archivo se carga automáticamente en Next.js 15.3+
 * para proteger endpoints críticos del sistema CHRONOS
 */
import { initBotId } from 'botid/client/core'

// 🛡️ Definir rutas que necesitan protección contra bots
// Estas son rutas críticas para operaciones financieras y auth
initBotId({
  protect: [
    // 🔐 Autenticación
    {
      path: '/api/auth/*',
      method: 'POST',
    },
    // 💰 Operaciones financieras (ventas, pagos, movimientos)
    {
      path: '/api/ventas',
      method: 'POST',
    },
    {
      path: '/api/ventas/*',
      method: 'PUT',
    },
    {
      path: '/api/ventas/*',
      method: 'DELETE',
    },
    {
      path: '/api/movimientos',
      method: 'POST',
    },
    {
      path: '/api/pagos/*',
      method: 'POST',
    },
    // 🏦 Operaciones bancarias
    {
      path: '/api/bancos/*',
      method: 'POST',
    },
    {
      path: '/api/bancos/*',
      method: 'PUT',
    },
    // 📦 Ordenes de compra
    {
      path: '/api/ordenes/*',
      method: 'POST',
    },
    // 🤖 Chat AI
    {
      path: '/api/chat',
      method: 'POST',
    },
    // 👤 Admin endpoints
    {
      path: '/api/admin/*',
      method: 'POST',
    },
    {
      path: '/api/admin/*',
      method: 'PUT',
    },
    {
      path: '/api/admin/*',
      method: 'DELETE',
    },
  ],
})
