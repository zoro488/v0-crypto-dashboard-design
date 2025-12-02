/**
 * 🤖 CHAT/IA - Funciones Convex
 * 
 * Almacenamiento de mensajes y historial de chat en tiempo real.
 */

import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

// ===== QUERIES =====

export const listMessages = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query('messages').order('desc')
    
    if (args.userId) {
      q = ctx.db.query('messages')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId))
        .order('desc')
    }
    
    const messages = await q.take(args.limit || 100)
    return messages.reverse() // Orden cronológico
  },
})

export const getLastMessages = query({
  args: { 
    count: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const count = args.count || 10
    
    let q = ctx.db.query('messages').order('desc')
    
    if (args.userId) {
      q = ctx.db.query('messages')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId))
        .order('desc')
    }
    
    const messages = await q.take(count)
    return messages.reverse()
  },
})

// ===== MUTATIONS =====

export const addMessage = mutation({
  args: {
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    content: v.string(),
    toolCalls: v.optional(v.array(v.object({
      name: v.string(),
      arguments: v.string(),
      result: v.optional(v.string()),
    }))),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      ...args,
      timestamp: Date.now(),
    })
  },
})

export const addToolResult = mutation({
  args: {
    messageId: v.id('messages'),
    toolName: v.string(),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message || !message.toolCalls) {
      throw new Error('Mensaje no encontrado o sin tool calls')
    }

    const updatedToolCalls = message.toolCalls.map(tc => 
      tc.name === args.toolName 
        ? { ...tc, result: args.result }
        : tc,
    )

    await ctx.db.patch(args.messageId, { toolCalls: updatedToolCalls })
  },
})

export const clearHistory = mutation({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let messages
    
    if (args.userId) {
      messages = await ctx.db
        .query('messages')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId))
        .collect()
    } else {
      messages = await ctx.db.query('messages').collect()
    }

    for (const msg of messages) {
      await ctx.db.delete(msg._id)
    }

    return { deleted: messages.length }
  },
})

// ===== ANALYTICS =====

export const trackEvent = mutation({
  args: {
    event: v.string(),
    properties: v.optional(v.any()),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('analytics_events', {
      ...args,
      timestamp: Date.now(),
    })
  },
})

export const getEventStats = query({
  args: { 
    event: v.optional(v.string()),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db.query('analytics_events').collect()
    
    if (args.event) {
      events = events.filter(e => e.event === args.event)
    }
    
    if (args.since !== undefined) {
      const sinceTime = args.since
      events = events.filter(e => e.timestamp >= sinceTime)
    }

    // Agrupar por evento
    const grouped = events.reduce((acc, e) => {
      acc[e.event] = (acc[e.event] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: events.length,
      byEvent: grouped,
    }
  },
})
