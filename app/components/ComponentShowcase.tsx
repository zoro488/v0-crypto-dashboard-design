/**
 * 🎨 SHOWCASE DE COMPONENTES MEJORADOS - Chronos v2.0
 * 
 * Este archivo demuestra todas las mejoras implementadas en el sistema de diseño.
 * Úsalo como referencia para implementar nuevos componentes.
 */

import { motion } from 'framer-motion'
import { Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card'

export default function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-black p-8 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold text-gradient-blue mb-4">
          Chronos Design System v2.0
        </h1>
        <p className="text-white/60 text-lg">
          Componentes premium con animaciones fluidas y efectos glassmorphism
        </p>
      </motion.div>

      {/* Buttons Showcase */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white mb-6">Botones Premium</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Variante Default</CardTitle>
              <CardDescription>Gradiente azul con shadow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <Sparkles className="w-4 h-4" />
                Button Default
              </Button>
              <Button size="lg" className="w-full">
                Large Button
              </Button>
              <Button size="sm" className="w-full">
                Small Button
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Variante Premium</CardTitle>
              <CardDescription>Gradiente animado purple-pink</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="premium" className="w-full">
                <Zap className="w-4 h-4" />
                Premium Action
              </Button>
              <Button variant="premium" size="lg" className="w-full">
                Large Premium
              </Button>
              <Button variant="premium" size="sm" className="w-full">
                Small Premium
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Variante Glass</CardTitle>
              <CardDescription>Glassmorphism con backdrop-blur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="glass" className="w-full">
                Glass Button
              </Button>
              <Button variant="outline" className="w-full">
                Outline Button
              </Button>
              <Button variant="ghost" className="w-full">
                Ghost Button
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Variante Success</CardTitle>
              <CardDescription>Gradiente emerald-green</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="success" className="w-full">
                <TrendingUp className="w-4 h-4" />
                Success Action
              </Button>
              <Button variant="destructive" className="w-full">
                Destructive Action
              </Button>
              <Button variant="secondary" className="w-full">
                Secondary Action
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Tamaños Icon</CardTitle>
              <CardDescription>Botones de iconos</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-center">
              <Button variant="premium" size="icon">
                <Sparkles className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="icon-lg">
                <Zap className="w-6 h-6" />
              </Button>
              <Button variant="success" size="icon-sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges Showcase */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white mb-6">Badges Mejorados</h2>
        
        <Card variant="premium" hover glow>
          <CardHeader>
            <CardTitle>Todas las Variantes de Badge</CardTitle>
            <CardDescription>Con glassmorphism y animaciones</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="gradient">
              <Sparkles className="w-3 h-3" />
              Gradient
            </Badge>
          </CardContent>
        </Card>
      </section>

      {/* Cards Showcase */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white mb-6">Cards Premium</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="default" hover>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Glass básico</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">
                Perfecto para contenido general con efecto hover lift.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Ultra transparente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">
                Máxima transparencia para overlays sutiles.
              </p>
            </CardContent>
          </Card>

          <Card variant="premium" hover glow>
            <CardHeader>
              <CardTitle>Premium Card</CardTitle>
              <CardDescription>Con gradiente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">
                Gradiente de fondo para destacar contenido importante.
              </p>
            </CardContent>
          </Card>

          <Card variant="glow" hover>
            <CardHeader>
              <CardTitle>Glow Card</CardTitle>
              <CardDescription>Con shadow blue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">
                Shadow azul permanente con glow al hover.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Utility Classes Showcase */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white mb-6">Clases Utilitarias</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Gradientes de Texto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="text-3xl font-bold text-gradient">
                Text Gradient Default
              </h3>
              <h3 className="text-3xl font-bold text-gradient-blue">
                Text Gradient Blue
              </h3>
              <h3 className="text-3xl font-bold text-gradient-purple">
                Text Gradient Purple
              </h3>
            </CardContent>
          </Card>

          <Card variant="glass" hover>
            <CardHeader>
              <CardTitle>Text Glow Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="text-2xl font-bold text-white text-glow">
                Text Glow White
              </h3>
              <h3 className="text-2xl font-bold text-white text-glow-blue">
                Text Glow Blue
              </h3>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Animated Elements */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white mb-6">Elementos Animados</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            className="h-48 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-center justify-center animate-gradient"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-white text-xl font-bold text-center">
              Gradiente Animado
            </p>
          </motion.div>

          <motion.div
            className="h-48 rounded-2xl glass-strong p-6 flex items-center justify-center hover-lift"
          >
            <p className="text-white text-xl font-bold text-center">
              Hover Lift
            </p>
          </motion.div>

          <motion.div
            className="h-48 rounded-2xl glass-panel p-6 flex items-center justify-center hover-glow"
          >
            <p className="text-white text-xl font-bold text-center">
              Hover Glow
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-12 pb-6 border-t border-white/10"
      >
        <p className="text-white/40 text-sm">
          Chronos Design System v2.0 - Optimizado para máximo rendimiento y experiencia visual
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Badge variant="gradient">
            <Sparkles className="w-3 h-3" />
            30+ Mejoras
          </Badge>
          <Badge variant="success">
            <Zap className="w-3 h-3" />
            60 FPS
          </Badge>
          <Badge variant="purple">
            <TrendingUp className="w-3 h-3" />
            Premium Design
          </Badge>
        </div>
      </motion.div>
    </div>
  )
}
