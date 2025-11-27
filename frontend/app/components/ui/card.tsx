import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/frontend/app/lib/utils"

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode
  variant?: "default" | "glass" | "premium" | "glow"
  hover?: boolean
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant = "default", hover = true, glow = false, ...props }, ref) => {
    const variants = {
      default: "bg-white/5 backdrop-blur-lg border border-white/10",
      glass: "bg-white/[0.02] backdrop-blur-xl border border-white/5",
      premium: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10",
      glow: "bg-white/5 backdrop-blur-lg border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl p-6 transition-all duration-300",
          variants[variant],
          hover && "hover:border-white/20 hover:shadow-xl hover:-translate-y-1",
          glow && "hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        {...props}
      >
        {children as any}
      </motion.div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-bold tracking-tight text-white", className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-white/50", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
