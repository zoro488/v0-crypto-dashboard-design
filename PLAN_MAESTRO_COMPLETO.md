# 🚀 **PLAN MAESTRO COMPLETO - FLOWDISTRIBUTOR ULTRA PREMIUM**

## 📋 **ÍNDICE**

1. [🎨 Header & Sidebar Ultra Modernos](#header-sidebar-ultra-modernos)
2. [⚙️ Configuración MCP Tools & Settings](#configuracion-mcp-tools)
3. [Configuración del Entorno](#configuración-completa)
4. [Arquitectura del Sistema](#arquitectura)
5. [14 Paneles Ultra Premium](#paneles)
6. [Componentes UI Avanzados](#componentes-ui)
7. [Lógica de Negocio](#lógica-negocio)
8. [Animaciones y Transiciones](#animaciones)
9. [Sistema de IA](#sistema-ia)
10. [Testing y Calidad](#testing)
11. [Deployment](#deployment)
12. [Roadmap de Implementación](#roadmap)

---

## 🎨 **1. HEADER & SIDEBAR ULTRA MODERNOS**

> **🎯 Referencias Pinterest Analizadas:**
>
> - **Glassmorphism + Gradients** - Diseño moderno con blur effects y transparencias
> - **Animated Dashboards** - Transiciones fluidas y micro-interacciones
> - **SaaS Productivity UI** - Acciones rápidas, navegación eficiente
> - **Dark Mode + Futuristic** - Paleta oscura con acentos vibrantes y efectos glow
> - **Data Visualization** - Charts interactivos, métricas en tiempo real

---

### 🔝 **HEADER PRINCIPAL - TOP NAVIGATION**

```typescript
interface HeaderUltraModerno {
  layout: {
    height: '72px',
    position: 'sticky-top',
    zIndex: 1000,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    backdropFilter: 'blur(24px) saturate(180%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(102,126,234,0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // ===================================================================
  // SECCIÓN IZQUIERDA: LOGO + BREADCRUMB DINÁMICO
  // ===================================================================
  leftSection: {
    logo: {
      type: 'animated-gradient-3d',
      text: 'FlowDistributor',
      icon: '💎',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      animation: {
        idle: 'glow-pulse-soft',
        hover: 'scale-rotate-glow',
        active: 'shimmer-wave'
      },
      effects: {
        textShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
        transform: 'perspective(1000px) rotateY(-5deg)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      onClick: 'navigate-dashboard-smooth',
      tooltip: 'Ir al Dashboard Principal'
    },

    breadcrumb: {
      display: 'smart-animated-path',
      maxVisible: 4,
      collapseStrategy: 'middle-ellipsis',

      separator: {
        icon: '→',
        animation: 'slide-fade-scale',
        hoverEffect: 'color-shift-primary',
        color: 'rgba(255,255,255,0.3)'
      },

      items: [
        {
          label: 'Dashboard',
          icon: '🏠',
          active: false,
          onClick: 'navigate',
          animation: 'fade-slide-in'
        },
        {
          label: 'Ventas',
          icon: '💰',
          active: false,
          badge: { count: 12, color: 'green', pulse: true }
        },
        {
          label: 'Nueva Venta',
          icon: '➕',
          active: true,
          gradient: true
        }
      ],

      animations: {
        enter: 'slide-in-right-bounce',
        exit: 'slide-out-left-fade',
        update: 'morph-transition',
        duration: 350,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },

      features: {
        clickable: true,
        showTooltip: true,
        smartCollapse: true,
        keyboardNav: true,
        contextMenu: true,
        recentPaths: true
      }
    }
  };

  // ===================================================================
  // SECCIÓN CENTRAL: BÚSQUEDA GLOBAL AI + ACCIONES RÁPIDAS
  // ===================================================================
  centerSection: {
    quickActions: {
      display: 'floating-button-group',
      position: 'center-left',

      buttons: [
        {
          id: 'new-sale',
          icon: '💰',
          label: 'Nueva Venta',
          color: 'green',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          shortcut: 'Ctrl+N',
          onClick: 'openModalVenta',
          animation: 'pulse-glow-green',
          badge: { show: true, text: 'Hot', color: 'red', pulse: true },
          tooltip: {
            title: 'Registrar Nueva Venta',
            description: 'Crea una venta con cliente, actualiza bancos y stock',
            shortcut: 'Ctrl+N'
          }
        },
        {
          id: 'new-purchase',
          icon: '📦',
          label: 'Nueva OC',
          color: 'blue',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          shortcut: 'Ctrl+O',
          onClick: 'openModalOrdenCompra',
          animation: 'pulse-glow-blue',
          tooltip: {
            title: 'Nueva Orden de Compra',
            description: 'Registra OC, crea distribuidor, actualiza almacén',
            shortcut: 'Ctrl+O'
          }
        },
        {
          id: 'expense',
          icon: '💸',
          label: 'Gasto',
          color: 'red',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          shortcut: 'Ctrl+G',
          onClick: 'openModalGasto',
          dropdown: {
            enabled: true,
            position: 'bottom-center',
            items: [
              {
                icon: '🏦',
                label: 'Gasto desde Bóveda Monte',
                banco: 'bovedaMonte',
                color: 'purple'
              },
              {
                icon: '💵',
                label: 'Gasto desde Bóveda USA',
                banco: 'bovedaUSA',
                color: 'blue'
              },
              {
                icon: '�',
                label: 'Gasto desde Utilidades',
                banco: 'utilidades',
                color: 'green'
              },
              {
                icon: '🚚',
                label: 'Gasto desde Fletes',
                banco: 'fletes',
                color: 'yellow'
              },
              {
                icon: '🏛️',
                label: 'Gasto desde Azteca',
                banco: 'azteca',
                color: 'indigo'
              },
              {
                icon: '🏦',
                label: 'Gasto desde Leftie',
                banco: 'leftie',
                color: 'teal'
              },
              {
                icon: '📈',
                label: 'Gasto desde Profit',
                banco: 'profit',
                color: 'emerald'
              }
            ],
            animation: 'scale-in-dropdown',
            design: {
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              padding: '8px',
              minWidth: '280px'
            }
          }
        },
        {
          id: 'transfer',
          icon: '🔄',
          label: 'Transferencia',
          color: 'purple',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          shortcut: 'Ctrl+T',
          onClick: 'openModalTransferencia',
          dropdown: {
            enabled: true,
            type: 'transfer-matrix',
            design: 'bank-grid-selector',
            features: {
              quickTransfer: true,
              recentTransfers: true,
              favoriteRoutes: true,
              amountPresets: [500, 1000, 5000, 10000]
            }
          }
        },
        {
          id: 'payment',
          icon: '💳',
          label: 'Pago',
          color: 'teal',
          gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          shortcut: 'Ctrl+P',
          dropdown: {
            enabled: true,
            items: [
              {
                icon: '📦',
                label: 'Pagar a Distribuidor',
                type: 'distribuidor',
                description: 'Liquida deuda de Orden de Compra'
              },
              {
                icon: '👤',
                label: 'Cobrar a Cliente',
                type: 'cliente',
                description: 'Registra pago de venta pendiente'
              }
            ]
          }
        },
        {
          id: 'ai-assistant',
          icon: '🤖',
          label: 'IA',
          color: 'indigo',
          gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          shortcut: 'Ctrl+Space',
          onClick: 'toggleAIWidget',
          animation: 'pulse-glow-ai-rainbow',
          badge: { show: true, text: '✨', animated: true },
          tooltip: {
            title: 'Asistente IA',
            description: 'Pregunta, analiza, predice y automatiza',
            shortcut: 'Ctrl+Space'
          }
        }
      ],

      design: {
        gap: '8px',
        buttonSize: '40px',
        iconSize: '20px',
        hoverScale: 1.05,
        activeScale: 0.95,
        borderRadius: '10px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: {
          default: '0 2px 8px rgba(0,0,0,0.1)',
          hover: '0 8px 24px rgba(0,0,0,0.15), 0 0 20px currentColor',
          active: '0 1px 4px rgba(0,0,0,0.2)'
        }
      },

      animations: {
        enter: 'scale-in-bounce',
        exit: 'scale-out-fade',
        hover: 'lift-glow',
        active: 'press-ripple'
      }
    },

    searchBar: {
      width: 'clamp(300px, 40vw, 600px)',
      placeholder: '🔍 Buscar en todo el sistema... (Ctrl+K)',

      design: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        padding: '12px 48px 12px 16px',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.9)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        hover: {
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 16px rgba(102,126,234,0.2)'
        },

        focus: {
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(102,126,234,0.5)',
          boxShadow: '0 8px 32px rgba(102,126,234,0.3), 0 0 0 4px rgba(102,126,234,0.1)',
          transform: 'translateY(-2px)'
        }
      },      states: {
        default: {
          width: '400px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        },
        focused: {
          width: '500px',
          boxShadow: '0 8px 24px rgba(102,126,234,0.25)',
          border: '1px solid rgba(102,126,234,0.5)',
          transform: 'translateY(-2px)'
        },
        hasResults: {
          borderRadius: '12px 12px 0 0'
        }
      },

      resultsDropdown: {
        position: 'absolute-below',
        maxHeight: '500px',
        width: 'match-searchbar',
        background: 'rgba(26, 32, 44, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',

        categories: [
          {
            id: 'quick-actions',
            label: '⚡ Acciones Rápidas',
            icon: '⚡',
            items: 'dynamic-based-on-panel'
          },
          {
            id: 'recent',
            label: '🕐 Recientes',
            icon: '🕐',
            maxItems: 5
          },
          {
            id: 'ventas',
            label: '💰 Ventas',
            icon: '💰',
            searchIn: ['id', 'cliente', 'producto']
          },
          {
            id: 'ordenes',
            label: '📦 Órdenes',
            icon: '📦',
            searchIn: ['id', 'distribuidor']
          },
          {
            id: 'clientes',
            label: '👥 Clientes',
            icon: '👥',
            searchIn: ['nombre', 'telefono', 'email']
          },
          {
            id: 'distribuidores',
            label: '🚚 Distribuidores',
            icon: '🚚',
            searchIn: ['nombre', 'origen']
          },
          {
            id: 'productos',
            label: '📦 Almacén',
            icon: '📦',
            searchIn: ['nombre', 'sku']
          },
          {
            id: 'bancos',
            label: '🏦 Bancos',
            icon: '🏦',
            items: 'all-banks'
          }
        ],

        itemDesign: {
          height: '48px',
          padding: '8px 16px',
          hover: {
            background: 'rgba(102,126,234,0.15)',
            transform: 'translateX(4px)',
            transition: 'all 0.2s'
          },
          selected: {
            background: 'rgba(102,126,234,0.25)',
            border: '1px solid rgba(102,126,234,0.4)'
          }
        },

        keyboard: {
          navigate: '↑↓',
          select: 'Enter',
          close: 'Esc',
          quickActions: 'Ctrl+1-9'
        }
      }
    },

    // ===================================================================
    // BOTONES DE ACCIONES RÁPIDAS (Flotan junto al search)
    // ===================================================================
    quickActionButtons: {
      layout: 'horizontal-pill-group',
      gap: '8px',
      marginLeft: '16px',

      buttons: [
        {
          id: 'nueva-venta',
          icon: '💰',
          label: 'Nueva Venta',
          shortcut: 'Ctrl+Shift+V',
          color: 'gradient-green',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          modal: 'FormVenta',
          animation: 'pulse-glow-green',
          importance: 'primary',
          visible: 'always'
        },
        {
          id: 'nueva-orden',
          icon: '📦',
          label: 'Nueva OC',
          shortcut: 'Ctrl+Shift+O',
          color: 'gradient-blue',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          modal: 'FormOrdenCompra',
          animation: 'pulse-glow-blue',
          importance: 'primary',
          visible: 'always'
        },
        {
          id: 'nuevo-gasto',
          icon: '💸',
          label: 'Gasto',
          shortcut: 'Ctrl+Shift+G',
          color: 'gradient-red',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          modal: 'FormGasto',
          subMenu: {
            trigger: 'click',
            items: [
              {
                icon: '🏦',
                label: 'Seleccionar Banco',
                type: 'bank-selector',
                banks: [
                  { id: 'boveda-monte', name: 'Bóveda Monte', icon: '⛰️', color: '#8b5cf6' },
                  { id: 'boveda-usa', name: 'Bóveda USA', icon: '🗽', color: '#3b82f6' },
                  { id: 'utilidades', name: 'Utilidades', icon: '💎', color: '#10b981' },
                  { id: 'fletes', name: 'Fletes', icon: '🚚', color: '#f59e0b' },
                  { id: 'azteca', name: 'Azteca', icon: '🏛️', color: '#ec4899' },
                  { id: 'leftie', name: 'Leftie', icon: '🏦', color: '#6366f1' },
                  { id: 'profit', name: 'Profit', icon: '💰', color: '#14b8a6' }
                ]
              }
            ]
          },
          importance: 'secondary',
          visible: 'desktop'
        },
        {
          id: 'transferencia',
          icon: '🔄',
          label: 'Transferencia',
          shortcut: 'Ctrl+Shift+T',
          color: 'gradient-purple',
          gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
          modal: 'FormTransferencia',
          subMenu: {
            trigger: 'hover',
            design: {
              background: 'rgba(26, 32, 44, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
            },
            items: [
              {
                type: 'dual-bank-selector',
                layout: 'from-to',
                fromLabel: 'Desde',
                toLabel: 'Hacia',
                arrow: '→',
                animation: 'slide-between'
              }
            ]
          },
          importance: 'secondary',
          visible: 'desktop'
        },
        {
          id: 'mas-acciones',
          icon: '➕',
          label: 'Más',
          color: 'gradient-gray',
          dropdownMenu: {
            width: '280px',
            maxHeight: '500px',
            position: 'bottom-right',

            sections: [
              {
                id: 'operaciones',
                label: '⚡ Operaciones',
                items: [
                  { icon: '💳', label: 'Pagar Distribuidor', action: 'openPaymentDistributor', shortcut: 'Ctrl+Shift+P' },
                  { icon: '💰', label: 'Cobrar Cliente', action: 'openPaymentClient', shortcut: 'Ctrl+Shift+C' },
                  { icon: '📥', label: 'Ingreso Manual', action: 'openManualIncome' },
                  { icon: '📊', label: 'Corte de Caja', action: 'openCashCut' }
                ]
              },
              {
                id: 'registros',
                label: '📝 Registros',
                items: [
                  { icon: '👤', label: 'Nuevo Cliente', action: 'openNewClient' },
                  { icon: '🚚', label: 'Nuevo Distribuidor', action: 'openNewDistributor' },
                  { icon: '📦', label: 'Nuevo Producto', action: 'openNewProduct' }
                ]
              },
              {
                id: 'reportes',
                label: '📊 Reportes',
                items: [
                  { icon: '📈', label: 'Reporte Ventas', action: 'generateSalesReport' },
                  { icon: '💰', label: 'Reporte Financiero', action: 'generateFinancialReport' },
                  { icon: '📦', label: 'Reporte Inventario', action: 'generateInventoryReport' },
                  { icon: '📧', label: 'Enviar Reportes', action: 'emailReports' }
                ]
              },
              {
                id: 'importar-exportar',
                label: '📤 Datos',
                items: [
                  { icon: '📥', label: 'Importar Datos', action: 'importData' },
                  { icon: '📤', label: 'Exportar Excel', action: 'exportExcel' },
                  { icon: '📄', label: 'Exportar PDF', action: 'exportPDF' }
                ]
              }
            ],

            design: {
              sectionDivider: true,
              itemHeight: '42px',
              itemPadding: '10px 16px',
              itemHover: {
                background: 'rgba(102,126,234,0.15)',
                transform: 'translateX(4px)'
              }
            }
          },
          importance: 'tertiary',
          visible: 'always'
        }
      ],

      buttonDesign: {
        height: '42px',
        padding: '0 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',

        states: {
          default: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transform: 'scale(1)'
          },
          hover: {
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            transform: 'scale(1.05) translateY(-2px)',
            filter: 'brightness(1.1)'
          },
          active: {
            transform: 'scale(0.98)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }
        },

        rippleEffect: {
          enabled: true,
          color: 'rgba(255,255,255,0.4)',
          duration: 600
        },

        glowEffect: {
          enabled: true,
          color: 'currentColor',
          blur: '20px',
          spread: '10px',
          opacity: 0.3
        }
      },

      responsiveCollapse: {
        breakpoint: '1024px',
        behavior: 'show-icons-only',
        tooltip: 'show-on-hover'
      }
    }
  };

  // ===================================================================
  // SECCIÓN DERECHA: NOTIFICACIONES + PERFIL + AJUSTES
  // ===================================================================
  rightSection: {
    gap: '12px',

    // ─────────────────────────────────────────────────────────────────
    // BOTÓN ASISTENTE IA
    // ─────────────────────────────────────────────────────────────────
    aiAssistant: {
      type: 'floating-ai-trigger',
      icon: '🤖',
      label: 'IA Assistant',
      badge: {
        show: true,
        type: 'pulse-glow',
        color: 'gradient-rainbow',
        animation: 'pulse-rainbow-infinite'
      },

      design: {
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
        animation: 'float-gentle',
        position: 'relative'
      },

      states: {
        idle: {
          icon: '🤖',
          animation: 'breathe-slow',
          tooltip: 'Pregúntame algo (Ctrl+I)'
        },
        listening: {
          icon: '🎤',
          animation: 'pulse-fast',
          tooltip: 'Escuchando...'
        },
        thinking: {
          icon: '🧠',
          animation: 'spin-dots',
          tooltip: 'Procesando...'
        },
        responding: {
          icon: '💬',
          animation: 'typing-indicator',
          tooltip: 'Respondiendo...'
        }
      },

      actions: {
        click: 'toggleAIPanel',
        doubleClick: 'voiceInput',
        rightClick: 'showAIMenu',
        ctrlClick: 'quickAIAction'
      },

      quickMenu: {
        items: [
          { icon: '📊', label: 'Analizar Dashboard', action: 'analyzeCurrentPanel' },
          { icon: '💡', label: 'Sugerencias', action: 'getRecommendations' },
          { icon: '🔮', label: 'Predicciones', action: 'showPredictions' },
          { icon: '⚠️', label: 'Alertas', action: 'showAlerts' },
          { icon: '🎯', label: 'Optimización', action: 'suggestOptimizations' }
        ]
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // NOTIFICACIONES
    // ─────────────────────────────────────────────────────────────────
    notifications: {
      icon: '🔔',
      badge: {
        show: true,
        count: 'dynamic',
        maxDisplay: 99,
        position: 'top-right',
        animation: 'bounce-in-scale'
      },

      design: {
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        hover: {
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          transform: 'scale(1.05)'
        }
      },

      dropdown: {
        width: '420px',
        maxHeight: '600px',
        position: 'bottom-right',
        offset: '8px',

        header: {
          title: '🔔 Notificaciones',
          actions: [
            { icon: '✅', label: 'Marcar todas leídas', action: 'markAllRead' },
            { icon: '⚙️', label: 'Configurar', action: 'openSettings' }
          ]
        },

        tabs: [
          { id: 'all', label: 'Todas', icon: '📋', count: 'dynamic' },
          { id: 'alerts', label: 'Alertas', icon: '⚠️', count: 'dynamic' },
          { id: 'ai', label: 'IA', icon: '🤖', count: 'dynamic' },
          { id: 'system', label: 'Sistema', icon: '⚙️', count: 'dynamic' }
        ],

        notificationTypes: {
          alert: {
            icon: '⚠️',
            color: 'warning',
            priority: 'high',
            examples: [
              'Stock bajo en producto X',
              'Capital de Bóveda Monte bajo',
              'Deuda alta de Cliente Y'
            ]
          },
          success: {
            icon: '✅',
            color: 'success',
            priority: 'medium',
            examples: [
              'Venta registrada exitosamente',
              'Pago de cliente recibido',
              'Transferencia completada'
            ]
          },
          info: {
            icon: 'ℹ️',
            color: 'info',
            priority: 'low',
            examples: [
              'Nuevo reporte disponible',
              'Actualización del sistema',
              'Recordatorio de corte'
            ]
          },
          ai: {
            icon: '🤖',
            color: 'ai-purple',
            priority: 'medium',
            examples: [
              'IA detectó patrón inusual en ventas',
              'Recomendación: Reponer stock producto Z',
              'Predicción: Aumento de demanda esta semana'
            ]
          }
        },

        itemDesign: {
          height: 'auto',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          layout: {
            icon: 'left-32px',
            content: 'center-flex-1',
            time: 'right-gray-small',
            action: 'bottom-buttons'
          },
          unread: {
            background: 'rgba(102,126,234,0.08)',
            border: '1px solid rgba(102,126,234,0.2)'
          },
          hover: {
            background: 'rgba(255,255,255,0.05)'
          }
        },

        features: {
          realtime: true,
          sound: true,
          desktop: true,
          filters: true,
          search: true,
          groupByDate: true,
          actions: ['view', 'dismiss', 'snooze', 'pin']
        }
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // PERFIL DE USUARIO
    // ─────────────────────────────────────────────────────────────────
    userProfile: {
      avatar: {
        size: '42px',
        borderRadius: '12px',
        border: '2px solid rgba(102,126,234,0.4)',
        gradient: 'conic-gradient',
        animation: 'rotate-border-slow',
        image: 'user-photo-url',
        fallback: 'initials',
        status: {
          show: true,
          position: 'bottom-right',
          size: '12px',
          states: {
            online: '#10b981',
            away: '#f59e0b',
            busy: '#ef4444',
            offline: '#6b7280'
          }
        }
      },

      dropdown: {
        width: '280px',
        position: 'bottom-right',

        header: {
          avatar: 'large-64px',
          name: 'Usuario Name',
          role: 'Administrador',
          email: 'user@email.com',
          design: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
            textAlign: 'center'
          }
        },

        sections: [
          {
            id: 'account',
            items: [
              { icon: '👤', label: 'Mi Perfil', action: 'viewProfile' },
              { icon: '⚙️', label: 'Configuración', action: 'openSettings' },
              { icon: '🎨', label: 'Apariencia', action: 'openThemeSettings' }
            ]
          },
          {
            id: 'preferences',
            items: [
              {
                icon: '🌙',
                label: 'Modo Oscuro',
                type: 'toggle',
                value: 'dynamic',
                action: 'toggleDarkMode'
              },
              {
                icon: '🔔',
                label: 'Notificaciones',
                type: 'toggle',
                value: 'dynamic',
                action: 'toggleNotifications'
              },
              {
                icon: '🎵',
                label: 'Sonidos',
                type: 'toggle',
                value: 'dynamic',
                action: 'toggleSounds'
              }
            ]
          },
          {
            id: 'help',
            items: [
              { icon: '❓', label: 'Ayuda', action: 'openHelp' },
              { icon: '📖', label: 'Documentación', action: 'openDocs' },
              { icon: '🐛', label: 'Reportar Bug', action: 'reportBug' },
              { icon: '⌨️', label: 'Atajos de Teclado', action: 'showShortcuts' }
            ]
          },
          {
            id: 'session',
            items: [
              {
                icon: '🚪',
                label: 'Cerrar Sesión',
                action: 'logout',
                danger: true,
                confirm: true
              }
            ]
          }
        ]
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // BOTÓN TEMA (Dark/Light Mode)
    // ─────────────────────────────────────────────────────────────────
    themeToggle: {
      type: 'animated-icon-switch',
      icons: {
        light: '☀️',
        dark: '🌙',
        auto: '🌓'
      },

      design: {
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.08)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      },

      animation: {
        switch: 'rotate-fade-360',
        duration: 500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },

      modes: ['light', 'dark', 'auto'],
      default: 'dark',
      shortcut: 'Ctrl+Shift+L'
    }
  };

  // ===================================================================
  // ANIMACIONES DEL HEADER
  // ===================================================================
  animations: {
    onScroll: {
      scrollThreshold: 50,
      default: {
        height: '72px',
        background: 'rgba(26, 32, 44, 0.8)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      },
      scrolled: {
        height: '64px',
        background: 'rgba(26, 32, 44, 0.95)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.2)'
      },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    onRoute: {
      type: 'page-transition-sync',
      breadcrumb: 'slide-update',
      title: 'fade-slide',
      duration: 400
    },

    interactions: {
      buttonHover: 'scale-glow-lift',
      iconHover: 'rotate-bounce',
      dropdownOpen: 'scale-fade-down',
      modalOpen: 'scale-blur-backdrop'
    }
  };
}
```

---

### 📱 **SIDEBAR ULTRA MODERNO - NAVEGACIÓN COLAPSABLE**

```typescript
interface SidebarUltraModerno {
  layout: {
    width: {
      collapsed: '72px',     // Solo iconos
      expanded: '280px',      // Con nombres
      mobile: 'full-screen'   // Overlay completo
    },
    height: 'calc(100vh - 72px)',
    position: 'fixed-left',
    zIndex: 900,
    top: '72px',

    background: {
      type: 'gradient-glass-blur',
      gradient: 'linear-gradient(180deg, rgba(26,32,44,0.98) 0%, rgba(30,36,50,0.98) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderRight: '1px solid rgba(255,255,255,0.1)'
    },

    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // ===================================================================
  // ESTADO Y COMPORTAMIENTO
  // ===================================================================
  behavior: {
    defaultState: 'collapsed',

    triggers: {
      hover: {
        enabled: true,
        delay: 200,        // ms antes de expandir
        expandOn: 'mouseenter',
        collapseOn: 'mouseleave',
        collapseDelay: 300
      },

      click: {
        enabled: true,
        toggleButton: {
          position: 'top-left-inside',
          icon: {
            collapsed: '☰',
            expanded: '✕'
          },
          animation: 'rotate-180'
        }
      },

      keyboard: {
        enabled: true,
        shortcut: 'Ctrl+B',
        toggleState: 'expanded-collapsed'
      },

      responsive: {
        mobile: {
          breakpoint: '768px',
          behavior: 'overlay-full',
          backdrop: true,
          closeOnNavigate: true
        },
        tablet: {
          breakpoint: '1024px',
          defaultState: 'collapsed'
        }
      }
    },

    persistence: {
      saveState: true,
      storage: 'localStorage',
      key: 'sidebar-state'
    }
  };

  // ===================================================================
  // SECCIÓN SUPERIOR: PANELES PRINCIPALES
  // ===================================================================
  mainNavigation: {
    title: {
      text: 'NAVEGACIÓN',
      visible: 'expanded-only',
      fontSize: '11px',
      fontWeight: 600,
      color: 'rgba(255,255,255,0.5)',
      padding: '20px 20px 12px 20px',
      letterSpacing: '1px'
    },

    items: [
      {
        id: 'dashboard-ia',
        icon: '🤖',
        label: 'Dashboard IA',
        path: '/',
        badge: {
          show: true,
          type: 'dot-pulse',
          color: 'gradient-rainbow'
        },
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        shortcut: 'Ctrl+1',
        features: {
          aiWidget: true,
          realtime: true,
          analytics: true
        }
      },
      {
        id: 'ordenes-compra',
        icon: '📦',
        label: 'Órdenes Compra',
        path: '/ordenes-compra',
        badge: {
          show: true,
          count: 'dynamic',
          type: 'number',
          condition: 'pendientes > 0'
        },
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        shortcut: 'Ctrl+2',
        subItems: [
          { icon: '📋', label: 'Todas', path: '/ordenes-compra/todas' },
          { icon: '⏳', label: 'Pendientes', path: '/ordenes-compra/pendientes', badge: true },
          { icon: '💰', label: 'Parciales', path: '/ordenes-compra/parciales' },
          { icon: '✅', label: 'Pagadas', path: '/ordenes-compra/pagadas' }
        ]
      },
      {
        id: 'ventas',
        icon: '💰',
        label: 'Ventas',
        path: '/ventas',
        badge: {
          show: true,
          type: 'revenue-today',
          format: 'currency-short'
        },
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        shortcut: 'Ctrl+3',
        subItems: [
          { icon: '📋', label: 'Todas', path: '/ventas/todas' },
          { icon: '⏳', label: 'Por Cobrar', path: '/ventas/pendientes', badge: true },
          { icon: '💳', label: 'Parciales', path: '/ventas/parciales' },
          { icon: '✅', label: 'Pagadas', path: '/ventas/completas' }
        ]
      },
      {
        id: 'distribuidores',
        icon: '🚚',
        label: 'Distribuidores',
        path: '/distribuidores',
        badge: {
          show: true,
          type: 'debt-warning',
          condition: 'totalDebt > threshold'
        },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        shortcut: 'Ctrl+4'
      },
      {
        id: 'clientes',
        icon: '👥',
        label: 'Clientes',
        path: '/clientes',
        badge: {
          show: true,
          count: 'activeClients'
        },
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        shortcut: 'Ctrl+5'
      },
      {
        id: 'almacen',
        icon: '📦',
        label: 'Almacén',
        path: '/almacen',
        badge: {
          show: true,
          type: 'alert',
          condition: 'lowStock > 0',
          color: 'warning'
        },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        shortcut: 'Ctrl+6',
        subItems: [
          { icon: '📊', label: 'Stock Actual', path: '/almacen/stock' },
          { icon: '📥', label: 'Entradas', path: '/almacen/entradas' },
          { icon: '📤', label: 'Salidas', path: '/almacen/salidas' },
          { icon: '📋', label: 'Cortes', path: '/almacen/cortes' }
        ]
      }
    ]
  };

  // ===================================================================
  // SECCIÓN BANCOS: COLAPSABLE CON 7 BANCOS
  // ===================================================================
  bankSection: {
    header: {
      title: '🏦 BANCOS',
      visible: 'expanded-only',
      collapsible: true,
      defaultState: 'expanded',
      icon: {
        collapsed: '▶',
        expanded: '▼'
      },
      stats: {
        show: true,
        totalCapital: 'sum-all-banks',
        format: 'currency-short',
        animation: 'count-up',
        position: 'right'
      }
    },

    banks: [
      {
        id: 'boveda-monte',
        icon: '⛰️',
        emoji: '⛰️',
        label: 'Bóveda Monte',
        path: '/bancos/boveda-monte',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        shortcut: 'Alt+1',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        },
        miniChart: {
          show: true,
          type: 'sparkline-7days',
          height: '24px',
          visible: 'expanded-only'
        }
      },
      {
        id: 'boveda-usa',
        icon: '🗽',
        emoji: '🗽',
        label: 'Bóveda USA',
        path: '/bancos/boveda-usa',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        shortcut: 'Alt+2',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        }
      },
      {
        id: 'utilidades',
        icon: '💎',
        emoji: '💎',
        label: 'Utilidades',
        path: '/bancos/utilidades',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        shortcut: 'Alt+3',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        },
        highlight: {
          enabled: true,
          condition: 'highest-capital',
          effect: 'glow-pulse-green'
        }
      },
      {
        id: 'fletes',
        icon: '🚚',
        emoji: '🚚',
        label: 'Fletes',
        path: '/bancos/fletes',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        shortcut: 'Alt+4',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        }
      },
      {
        id: 'azteca',
        icon: '🏛️',
        emoji: '🏛️',
        label: 'Azteca',
        path: '/bancos/azteca',
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        shortcut: 'Alt+5',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        }
      },
      {
        id: 'leftie',
        icon: '🏦',
        emoji: '🏦',
        label: 'Leftie',
        path: '/bancos/leftie',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        shortcut: 'Alt+6',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        }
      },
      {
        id: 'profit',
        icon: '💰',
        emoji: '💰',
        label: 'Profit',
        path: '/bancos/profit',
        color: '#14b8a6',
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        shortcut: 'Alt+7',
        badge: {
          show: true,
          type: 'capital-amount',
          format: 'currency-compact',
          realtime: true
        }
      }
    ],

    quickActions: {
      visible: 'expanded-only',
      position: 'below-banks',
      buttons: [
        {
          icon: '🔄',
          label: 'Transferir',
          action: 'openTransferModal',
          size: 'small',
          fullWidth: true
        },
        {
          icon: '📊',
          label: 'Comparar',
          action: 'openBankComparison',
          size: 'small',
          fullWidth: true
        }
      ]
    }
  };

  // ===================================================================
  // SECCIÓN INFERIOR: REPORTES + CONFIGURACIÓN
  // ===================================================================
  bottomNavigation: {
    divider: true,

    items: [
      {
        id: 'reportes',
        icon: '📊',
        label: 'Reportes',
        path: '/reportes',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        shortcut: 'Ctrl+R'
      },
      {
        id: 'configuracion',
        icon: '⚙️',
        label: 'Configuración',
        path: '/configuracion',
        gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        shortcut: 'Ctrl+,'
      }
    ]
  };

  // ===================================================================
  // DISEÑO DE ITEMS DEL SIDEBAR
  // ===================================================================
  itemDesign: {
    height: '48px',
    padding: {
      collapsed: '12px',
      expanded: '12px 16px'
    },
    margin: '4px 8px',
    borderRadius: '12px',

    states: {
      default: {
        background: 'transparent',
        color: 'rgba(255,255,255,0.7)',
        transform: 'translateX(0)'
      },

      hover: {
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.95)',
        transform: 'translateX(4px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      },

      active: {
        background: 'item-gradient',
        color: '#ffffff',
        transform: 'translateX(4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.2)',

        indicator: {
          show: true,
          position: 'left',
          width: '4px',
          height: '100%',
          background: '#ffffff',
          borderRadius: '0 4px 4px 0',
          animation: 'slide-in-left'
        }
      }
    },

    icon: {
      size: {
        collapsed: '24px',
        expanded: '22px'
      },
      position: {
        collapsed: 'center',
        expanded: 'left'
      },
      animation: {
        hover: 'scale-rotate-360',
        active: 'bounce-in'
      }
    },

    label: {
      visible: 'expanded-only',
      fontSize: '14px',
      fontWeight: 500,
      marginLeft: '12px',
      animation: {
        enter: 'fade-in-right',
        exit: 'fade-out-left',
        duration: 200
      }
    },

    badge: {
      visible: 'always',
      position: {
        collapsed: 'top-right-absolute',
        expanded: 'right'
      },
      design: {
        minWidth: '20px',
        height: '20px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 6px',
        animation: 'scale-in-bounce'
      }
    },

    subItems: {
      visible: 'expanded-only',
      indentLeft: '48px',
      maxHeight: 'auto',
      animation: {
        expand: 'slide-fade-down',
        collapse: 'slide-fade-up',
        duration: 300
      },
      design: {
        height: '40px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.6)'
      }
    }
  };

  // ===================================================================
  // ANIMACIONES DEL SIDEBAR
  // ===================================================================
  animations: {
    expand: {
      width: 'collapsed → expanded',
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',

      elements: {
        icons: {
          animation: 'slide-right',
          delay: 0
        },
        labels: {
          animation: 'fade-in-right',
          delay: 100
        },
        badges: {
          animation: 'scale-reposition',
          delay: 150
        },
        charts: {
          animation: 'fade-in-scale',
          delay: 200
        }
      }
    },

    collapse: {
      width: 'expanded → collapsed',
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',

      elements: {
        labels: {
          animation: 'fade-out-left',
          delay: 0
        },
        charts: {
          animation: 'fade-out-scale',
          delay: 0
        },
        badges: {
          animation: 'scale-reposition',
          delay: 50
        },
        icons: {
          animation: 'slide-center',
          delay: 100
        }
      }
    },

    itemInteractions: {
      hover: {
        transform: 'translateX(4px)',
        background: 'fade-in-bg',
        duration: 200
      },
      click: {
        scale: 'scale(0.98)',
        duration: 100
      },
      active: {
        slideIndicator: 'slide-in-left',
        glow: 'fade-in-glow',
        duration: 300
      }
    },

    scrollBehavior: {
      shadow: {
        top: {
          show: 'when-scrolled',
          gradient: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
          height: '20px'
        },
        bottom: {
          show: 'when-has-more',
          gradient: 'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
          height: '20px'
        }
      }
    }
  };

  // ===================================================================
  // CARACTERÍSTICAS AVANZADAS
  // ===================================================================
  advancedFeatures: {
    // Drag & Drop para reordenar items
    dragAndDrop: {
      enabled: true,
      handle: 'long-press-or-drag-icon',
      saveOrder: true,
      storage: 'localStorage'
    },

    // Favoritos
    favorites: {
      enabled: true,
      maxFavorites: 5,
      section: 'top-of-sidebar',
      action: 'right-click-add-favorite'
    },

    // Búsqueda rápida en sidebar
    quickSearch: {
      enabled: true,
      shortcut: 'Ctrl+K',
      placeholder: 'Buscar panel...',
      fuzzySearch: true,
      visible: 'expanded-only'
    },

    // Tooltips
    tooltips: {
      enabled: true,
      visible: 'collapsed-only',
      position: 'right',
      delay: 500,
      showShortcut: true,
      design: {
        background: 'rgba(26, 32, 44, 0.98)',
        backdropFilter: 'blur(20px)',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }
    },

    // Contextual Menu (right-click)
    contextMenu: {
      enabled: true,
      items: [
        { icon: '⭐', label: 'Añadir a Favoritos', action: 'addFavorite' },
        { icon: '🔗', label: 'Copiar Enlace', action: 'copyLink' },
        { icon: '📌', label: 'Fijar', action: 'pin' },
        { icon: '🎨', label: 'Personalizar', action: 'customize' }
      ]
    },

    // Temas personalizados
    themes: {
      presets: [
        {
          id: 'default-dark',
          name: 'Dark Mode',
          background: 'rgba(26, 32, 44, 0.98)',
          active: 'gradient',
          hover: 'rgba(255,255,255,0.08)'
        },
        {
          id: 'light',
          name: 'Light Mode',
          background: 'rgba(255, 255, 255, 0.98)',
          active: 'gradient',
          hover: 'rgba(0,0,0,0.05)'
        },
        {
          id: 'midnight',
          name: 'Midnight Blue',
          background: 'rgba(15, 23, 42, 0.98)',
          active: 'gradient-blue',
          hover: 'rgba(59,130,246,0.1)'
        }
      ]
    }
  };

  // ===================================================================
  // RESPONSIVE BEHAVIOR
  // ===================================================================
  responsive: {
    mobile: {
      breakpoint: 768,
      behavior: {
        type: 'overlay-fullscreen',
        background: 'rgba(26, 32, 44, 0.98)',
        backdropBlur: '20px',
        backdrop: {
          show: true,
          color: 'rgba(0, 0, 0, 0.6)',
          onClick: 'close-sidebar'
        },
        animation: {
          enter: 'slide-in-left',
          exit: 'slide-out-left',
          duration: 300
        },
        hamburgerMenu: {
          position: 'header-left',
          icon: '☰',
          size: '24px'
        }
      }
    },

    tablet: {
      breakpoint: 1024,
      defaultState: 'collapsed',
      behavior: 'hover-expand'
    },

    desktop: {
      breakpoint: 1280,
      defaultState: 'user-preference',
      behavior: 'hover-or-click'
    }
  };
}
```

---

### 🎭 **SISTEMA DE ANIMACIONES GLOBAL**

```typescript
interface AnimationSystem {
  // Transiciones de página
  pageTransitions: {
    fadeSlide: 'fade-in-up + slide-in',
    scaleBlur: 'scale-in + blur-reduce',
    slideHorizontal: 'slide-left-right',
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Interacciones de botones
  buttons: {
    hover: {
      scale: 1.05,
      translateY: -2,
      boxShadow: 'enhanced',
      filter: 'brightness(1.1)',
      duration: 200
    },
    active: {
      scale: 0.98,
      duration: 100
    },
    ripple: {
      enabled: true,
      color: 'rgba(255,255,255,0.4)',
      duration: 600
    }
  };

  // Loading states
  loading: {
    skeleton: 'shimmer-gradient-pulse',
    spinner: 'rotate-dots-pulse',
    progressBar: 'slide-with-glow'
  };

  // Micro-interacciones
  microInteractions: {
    iconHover: 'rotate-360 + scale-1.1',
    badgePulse: 'pulse-glow-infinite',
    notificationPop: 'bounce-in-scale',
    tooltipShow: 'fade-scale-down'
  };
}
```

---

### ⚡ **ATAJOS DE TECLADO COMPLETOS**

```typescript
interface KeyboardShortcuts {
  navigation: {
    'Ctrl+1': 'Dashboard IA',
    'Ctrl+2': 'Órdenes Compra',
    'Ctrl+3': 'Ventas',
    'Ctrl+4': 'Distribuidores',
    'Ctrl+5': 'Clientes',
    'Ctrl+6': 'Almacén',
    'Alt+1-7': 'Bancos 1-7',
    'Ctrl+R': 'Reportes',
    'Ctrl+,': 'Configuración'
  };

  actions: {
    'Ctrl+K': 'Búsqueda Global',
    'Ctrl+I': 'Asistente IA',
    'Ctrl+Shift+V': 'Nueva Venta',
    'Ctrl+Shift+O': 'Nueva Orden Compra',
    'Ctrl+Shift+G': 'Registrar Gasto',
    'Ctrl+Shift+T': 'Transferencia',
    'Ctrl+Shift+P': 'Pagar Distribuidor',
    'Ctrl+Shift+C': 'Cobrar Cliente'
  };

  ui: {
    'Ctrl+B': 'Toggle Sidebar',
    'Ctrl+Shift+L': 'Toggle Tema',
    'Esc': 'Cerrar Modal/Dropdown',
    'Tab': 'Siguiente Campo',
    'Shift+Tab': 'Campo Anterior'
  };
}
```

---

## ⚙️ **2. CONFIGURACIÓN MCP TOOLS & SETTINGS COMPLETA**

> **🎯 Objetivo:** Configuración completa de herramientas MCP (Model Context Protocol), VS Code settings, y toolset JSON para máxima optimización en desarrollo e implementación.

---

### 📦 **MCP SERVERS CONFIGURATION**

```json
{
  "mcpServers": {
    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES FIREBASE (Esenciales para FlowDistributor)
    // ═══════════════════════════════════════════════════════════════
    "firebase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-firebase"],
      "env": {
        "FIREBASE_PROJECT_ID": "flowdistributor",
        "FIREBASE_PRIVATE_KEY": "${FIREBASE_PRIVATE_KEY}",
        "FIREBASE_CLIENT_EMAIL": "${FIREBASE_CLIENT_EMAIL}"
      },
      "capabilities": [
        "firestore-read",
        "firestore-write",
        "firestore-query",
        "realtime-subscriptions",
        "batch-operations",
        "transactions"
      ],
      "description": "Firestore database operations, real-time updates, transactions"
    },

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES DE IA (OpenAI, Gemini, Claude)
    // ═══════════════════════════════════════════════════════════════
    "openai": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-openai"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-4-turbo-preview"
      },
      "capabilities": [
        "chat-completion",
        "embeddings",
        "function-calling",
        "vision",
        "code-generation"
      ],
      "description": "OpenAI GPT-4 for AI assistant features, predictions, insights"
    },

    "gemini": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-ai"],
      "env": {
        "GOOGLE_AI_API_KEY": "${GOOGLE_AI_API_KEY}",
        "GOOGLE_MODEL": "gemini-pro"
      },
      "capabilities": [
        "multimodal-understanding",
        "long-context",
        "code-execution",
        "data-analysis"
      ],
      "description": "Google Gemini Pro for advanced AI analysis and predictions"
    },

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES DE DATOS Y FILESYSTEM
    // ═══════════════════════════════════════════════════════════════
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": [
          "C:\\Users\\xpovo\\Documents\\premium-ecosystem\\src\\apps\\FlowDistributor"
        ]
      },
      "capabilities": [
        "read-file",
        "write-file",
        "list-directory",
        "search-files",
        "watch-changes"
      ],
      "description": "File system operations for the project"
    },

    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite"],
      "env": {
        "DATABASE_PATH": "./data/flowdistributor.db"
      },
      "capabilities": [
        "sql-query",
        "schema-inspection",
        "migrations",
        "backups"
      ],
      "description": "SQLite database for local caching and offline support"
    },

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES DE ANALYTICS Y REPORTING
    // ═══════════════════════════════════════════════════════════════
    "analytics": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-analytics"],
      "env": {
        "GA_TRACKING_ID": "${GA_TRACKING_ID}",
        "GA_MEASUREMENT_ID": "${GA_MEASUREMENT_ID}"
      },
      "capabilities": [
        "event-tracking",
        "user-analytics",
        "conversion-tracking",
        "real-time-data"
      ],
      "description": "Google Analytics for user behavior and metrics"
    },

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES DE GITHUB (Control de versiones)
    // ═══════════════════════════════════════════════════════════════
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_REPO": "premium-ecosystem"
      },
      "capabilities": [
        "repo-access",
        "issue-management",
        "pr-management",
        "code-search",
        "commit-history"
      ],
      "description": "GitHub integration for version control and collaboration"
    },

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES DE MEMORIA Y CONTEXTO
    // ═══════════════════════════════════════════════════════════════
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_STORAGE": "./data/memory.json"
      },
      "capabilities": [
        "store-context",
        "retrieve-context",
        "semantic-search",
        "temporal-queries"
      ],
      "description": "Persistent memory for AI context and user preferences"
    },

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES WEB Y API
    // ═══════════════════════════════════════════════════════════════
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "capabilities": [
        "http-requests",
        "api-calls",
        "web-scraping",
        "data-fetching"
      ],
      "description": "HTTP client for external API integrations"
    },

    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "capabilities": [
        "web-automation",
        "screenshot",
        "pdf-generation",
        "scraping"
      ],
      "description": "Browser automation for reports and data extraction"
    }
  }
}
```

---

### ⚙️ **VS CODE SETTINGS OPTIMIZATION (settings.json)**

```json
{
  // ═══════════════════════════════════════════════════════════════
  // EDITOR - Máxima Productividad
  // ═══════════════════════════════════════════════════════════════
  "editor.fontSize": 14,
  "editor.fontFamily": "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.lineHeight": 24,
  "editor.letterSpacing": 0.5,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.formatOnType": false,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true,
    "source.sortImports": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": true,
  "editor.wordWrap": "on",
  "editor.lineNumbers": "on",
  "editor.renderWhitespace": "selection",
  "editor.cursorBlinking": "smooth",
  "editor.cursorSmoothCaretAnimation": "on",
  "editor.smoothScrolling": true,
  "editor.minimap.enabled": true,
  "editor.minimap.maxColumn": 120,
  "editor.minimap.renderCharacters": false,
  "editor.minimap.showSlider": "always",
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.guides.indentation": true,
  "editor.linkedEditing": true,
  "editor.suggest.preview": true,
  "editor.suggest.shareSuggestSelections": true,
  "editor.suggestSelection": "first",
  "editor.quickSuggestions": {
    "strings": true,
    "comments": true,
    "other": true
  },
  "editor.inlineSuggest.enabled": true,
  "editor.acceptSuggestionOnEnter": "on",
  "editor.snippetSuggestions": "top",

  // ═══════════════════════════════════════════════════════════════
  // AI ASSISTANTS - GitHub Copilot, Amazon Q, Gemini, etc.
  // ═══════════════════════════════════════════════════════════════
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true,
    "typescript": true,
    "javascript": true,
    "typescriptreact": true,
    "javascriptreact": true,
    "json": true,
    "jsonc": true
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.editor.enableCodeActions": true,
  "amazonq.enableCodeSuggestions": true,
  "amazonq.shareContentWithAWS": true,
  "continue.telemetryEnabled": true,
  "continue.enableTabAutocomplete": true,

  // ═══════════════════════════════════════════════════════════════
  // TYPESCRIPT - Strict Mode y Optimizaciones
  // ═══════════════════════════════════════════════════════════════
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.paths": true,
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.preferences.quoteStyle": "single",
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.parameterTypes.enabled": true,
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.propertyDeclarationTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,
  "typescript.inlayHints.enumMemberValues.enabled": true,
  "javascript.updateImportsOnFileMove.enabled": "always",
  "javascript.suggest.autoImports": true,

  // ═══════════════════════════════════════════════════════════════
  // REACT & JSX
  // ═══════════════════════════════════════════════════════════════
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "emmet.triggerExpansionOnTab": true,
  "emmet.showSuggestionsAsSnippets": true,

  // ═══════════════════════════════════════════════════════════════
  // PRETTIER - Formateo Consistente
  // ═══════════════════════════════════════════════════════════════
  "prettier.enable": true,
  "prettier.singleQuote": true,
  "prettier.semi": true,
  "prettier.trailingComma": "es5",
  "prettier.printWidth": 100,
  "prettier.tabWidth": 2,
  "prettier.arrowParens": "always",
  "prettier.endOfLine": "auto",

  // ═══════════════════════════════════════════════════════════════
  // ESLINT - Linting en Tiempo Real
  // ═══════════════════════════════════════════════════════════════
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": true,
  "eslint.lintTask.enable": true,
  "eslint.run": "onType",
  "eslint.codeActionsOnSave.mode": "all",

  // ═══════════════════════════════════════════════════════════════
  // TAILWIND CSS - IntelliSense y Validación
  // ═══════════════════════════════════════════════════════════════
  "tailwindCSS.emmetCompletions": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "tailwindCSS.validate": true,
  "tailwindCSS.classAttributes": [
    "class",
    "className",
    "ngClass",
    ".*ClassName"
  ],

  // ═══════════════════════════════════════════════════════════════
  // FIREBASE - Integración y Debugging
  // ═══════════════════════════════════════════════════════════════
  "firebase.hosting.enabled": true,
  "firebase.functions.enabled": true,
  "firebase.firestore.enabled": true,

  // ═══════════════════════════════════════════════════════════════
  // FILES - Exclusiones y Auto-save
  // ═══════════════════════════════════════════════════════════════
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.eol": "\\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/.vite": true
  },

  // ═══════════════════════════════════════════════════════════════
  // SEARCH - Optimización de Búsqueda
  // ═══════════════════════════════════════════════════════════════
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/.vite": true,
    "**/coverage": true,
    "**/.git": true
  },
  "search.useIgnoreFiles": true,
  "search.smartCase": true,

  // ═══════════════════════════════════════════════════════════════
  // TERMINAL - PowerShell Optimizado
  // ═══════════════════════════════════════════════════════════════
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.fontFamily": "'Cascadia Code PL', 'Fira Code', Consolas",
  "terminal.integrated.cursorBlinking": true,
  "terminal.integrated.cursorStyle": "line",
  "terminal.integrated.smoothScrolling": true,
  "terminal.integrated.defaultProfile.windows": "PowerShell",

  // ═══════════════════════════════════════════════════════════════
  // WORKBENCH - Tema y Apariencia
  // ═══════════════════════════════════════════════════════════════
  "workbench.colorTheme": "One Dark Pro Darker",
  "workbench.iconTheme": "material-icon-theme",
  "workbench.productIconTheme": "fluent-icons",
  "workbench.startupEditor": "welcomePage",
  "workbench.editor.highlightModifiedTabs": true,
  "workbench.editor.labelFormat": "short",
  "workbench.tree.indent": 16,
  "workbench.tree.renderIndentGuides": "always",

  // ═══════════════════════════════════════════════════════════════
  // GIT - Integración de Control de Versiones
  // ═══════════════════════════════════════════════════════════════
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  "git.suggestSmartCommit": true,

  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE - Optimizaciones
  // ═══════════════════════════════════════════════════════════════
  "extensions.experimental.affinity": {
    "vscodevim.vim": 1
  }
}
```

---

### 🛠️ **TOOLSET JSON CONFIGURATION**

```json
{
  "tools": {
    // ═══════════════════════════════════════════════════════════════
    // DEVELOPMENT TOOLS
    // ═══════════════════════════════════════════════════════════════
    "react-devtools": {
      "enabled": true,
      "version": "latest",
      "features": ["component-tree", "profiler", "hooks-inspector"]
    },

    "firebase-cli": {
      "enabled": true,
      "version": "latest",
      "commands": ["deploy", "emulators:start", "firestore:indexes", "functions:deploy"]
    },

    "vite": {
      "enabled": true,
      "version": "5.3.4",
      "features": ["hmr", "code-splitting", "tree-shaking", "minification"],
      "plugins": [
        "@vitejs/plugin-react",
        "vite-plugin-compression",
        "vite-plugin-pwa"
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // TESTING TOOLS
    // ═══════════════════════════════════════════════════════════════
    "jest": {
      "enabled": true,
      "version": "latest",
      "config": "./jest.config.js",
      "coverage": true,
      "watch": true
    },

    "testing-library": {
      "enabled": true,
      "libraries": ["@testing-library/react", "@testing-library/jest-dom", "@testing-library/user-event"]
    },

    // ═══════════════════════════════════════════════════════════════
    // CODE QUALITY TOOLS
    // ═══════════════════════════════════════════════════════════════
    "eslint": {
      "enabled": true,
      "version": "latest",
      "plugins": [
        "eslint-plugin-react",
        "eslint-plugin-react-hooks",
        "@typescript-eslint/eslint-plugin",
        "eslint-plugin-jsx-a11y",
        "eslint-plugin-prettier"
      ]
    },

    "prettier": {
      "enabled": true,
      "version": "latest",
      "config": "./.prettierrc.js"
    },

    "typescript": {
      "enabled": true,
      "version": "5.2.2",
      "strict": true,
      "config": "./tsconfig.json"
    },

    // ═══════════════════════════════════════════════════════════════
    // BUILD & OPTIMIZATION TOOLS
    // ═══════════════════════════════════════════════════════════════
    "terser": {
      "enabled": true,
      "options": {
        "compress": true,
        "mangle": true,
        "format": {
          "comments": false
        }
      }
    },

    "postcss": {
      "enabled": true,
      "plugins": ["tailwindcss", "autoprefixer", "cssnano"]
    },

    // ═══════════════════════════════════════════════════════════════
    // DEPLOYMENT TOOLS
    // ═══════════════════════════════════════════════════════════════
    "firebase-hosting": {
      "enabled": true,
      "site": "flowdistributor",
      "public": "dist",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // MONITORING & ANALYTICS TOOLS
    // ═══════════════════════════════════════════════════════════════
    "sentry": {
      "enabled": true,
      "dsn": "${SENTRY_DSN}",
      "environment": "production",
      "tracesSampleRate": 1.0
    },

    "google-analytics": {
      "enabled": true,
      "tracking-id": "${GA_TRACKING_ID}",
      "features": ["pageview-tracking", "event-tracking", "user-timing"]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SCRIPTS AUTOMATIZADOS
  // ═══════════════════════════════════════════════════════════════
  "scripts": {
    "dev": "vite --host --port 5173",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "firebase:emulators": "firebase emulators:start",
    "firebase:deploy": "npm run build && firebase deploy",
    "analyze": "vite-bundle-visualizer"
  }
}
```

---

### 🚀 **EXTENSION RECOMMENDATIONS (extensions.json)**

```json
{
  "recommendations": [
    // ═══════════════════════════════════════════════════════════════
    // AI ASSISTANTS (Máxima Prioridad)
    // ═══════════════════════════════════════════════════════════════
    "github.copilot",
    "github.copilot-chat",
    "amazonwebservices.amazon-q-vscode",
    "google.gemini-code-assist",
    "continue.continue",
    "sourcegraph.cody-ai",
    "anthropic.claude-code",
    "tabnine.tabnine-vscode",

    // ═══════════════════════════════════════════════════════════════
    // REACT & NEXT.JS
    // ═══════════════════════════════════════════════════════════════
    "dsznajder.es7-react-js-snippets",
    "burkeholland.simple-react-snippets",
    "rodrigovallades.es7-react-js-snippets",

    // ═══════════════════════════════════════════════════════════════
    // TAILWIND CSS
    // ═══════════════════════════════════════════════════════════════
    "bradlc.vscode-tailwindcss",
    "austenc.tailwind-docs",

    // ═══════════════════════════════════════════════════════════════
    // FIREBASE
    // ═══════════════════════════════════════════════════════════════
    "toba.vsfire",
    "firebase.firebase-vscode",

    // ═══════════════════════════════════════════════════════════════
    // TYPESCRIPT & JAVASCRIPT
    // ═══════════════════════════════════════════════════════════════
    "usernamehw.errorlens",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "yoavbls.pretty-ts-errors",

    // ═══════════════════════════════════════════════════════════════
    // UI & ICONS
    // ═══════════════════════════════════════════════════════════════
    "pkief.material-icon-theme",
    "miguelsolorio.fluent-icons",
    "zhuangtongfa.material-theme",

    // ═══════════════════════════════════════════════════════════════
    // PRODUCTIVITY
    // ═══════════════════════════════════════════════════════════════
    "formulahendry.auto-rename-tag",
    "formulahendry.auto-close-tag",
    "steoates.autoimport",
    "christian-kohler.path-intellisense",
    "naumovs.color-highlight",
    "wix.vscode-import-cost",

    // ═══════════════════════════════════════════════════════════════
    // GIT
    // ═══════════════════════════════════════════════════════════════
    "eamodio.gitlens",
    "mhutchie.git-graph",
    "donjayamanne.githistory",

    // ═══════════════════════════════════════════════════════════════
    // TESTING
    // ═══════════════════════════════════════════════════════════════
    "orta.vscode-jest",
    "firsttris.vscode-jest-runner"
  ]
}
```

---

## ⚙️ **3. CONFIGURACIÓN COMPLETA DEL ENTORNO**

### ✅ **Archivos de Configuración Creados:**

```
✅ .vscode/settings.json       - Configuración VS Code optimizada
✅ .vscode/extensions.json     - 50+ extensiones recomendadas
✅ .vscode/launch.json         - Debug configurations
✅ .vscode/tasks.json          - Tasks automatizadas
✅ .eslintrc.js                - Linting rules
✅ .prettierrc.js              - Code formatting
✅ tsconfig.json               - TypeScript strict mode + path aliases
✅ vite.config.ts              - Vite optimizado + code splitting
✅ tailwind.config.js          - Tailwind con colores custom + animaciones
✅ package.json                - Todas las dependencias necesarias
```

### 🎯 **Tecnologías Stack:**

```typescript
interface TechStack {
  frontend: {
    framework: 'React 18.3.1',
    language: 'TypeScript 5.2+',
    bundler: 'Vite 5.3+',
    routing: 'React Router DOM 6.26',
  },

  styling: {
    framework: 'Tailwind CSS 3.4+',
    animations: 'Framer Motion 11.3',
    icons: 'Lucide React',
    utils: ['clsx', 'tailwind-merge'],
  },

  backend: {
    database: 'Firebase Firestore',
    auth: 'Firebase Auth',
    hosting: 'Firebase Hosting',
    functions: 'Firebase Cloud Functions',
  },

  dataVisualization: {
    charts: 'Recharts 2.12',
    customCharts: 'D3.js (si necesario)',
  },

  stateManagement: {
    local: 'React Hooks',
    global: 'Zustand 4.5',
    server: 'Firestore Real-time',
  },

  forms: {
    validation: 'Zod',
    handling: 'React Hook Form',
  },

  notifications: {
    library: 'React Hot Toast',
    customToasts: true,
  },

  ai: {
    backend: 'OpenAI API / Gemini API',
    vector: 'Pinecone (opcional)',
    features: ['Chat', 'Predictions', 'Insights', 'Actions'],
  },

  devTools: {
    aiAgents: ['GitHub Copilot', 'Amazon Q', 'Gemini Code Assist', 'Continue'],
    linting: ['ESLint', 'Prettier'],
    testing: ['Jest', 'React Testing Library'],
    e2e: 'Playwright (opcional)',
  },
}
```

---

## 🏗️ **3. ARQUITECTURA DEL SISTEMA**

### 📁 **Estructura de Carpetas:**

```
FlowDistributor/
├── 📁 public/
│   ├── favicon.ico
│   └── assets/
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 ui/                    # Componentes base reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Chart.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Accordion.tsx
│   │   │   └── ... (30+ componentes UI)
│   │   │
│   │   ├── 📁 forms/                 # Formularios complejos
│   │   │   ├── FormOrdenCompra.tsx
│   │   │   ├── FormVenta.tsx
│   │   │   ├── FormPagoDistribuidor.tsx
│   │   │   ├── FormPagoCliente.tsx
│   │   │   ├── FormTransferencia.tsx
│   │   │   ├── FormGasto.tsx
│   │   │   └── FormIngreso.tsx
│   │   │
│   │   ├── 📁 panels/                # 14 Paneles principales
│   │   │   ├── DashboardIA.tsx
│   │   │   ├── PanelOrdenesCompra.tsx
│   │   │   ├── PanelVentas.tsx
│   │   │   ├── PanelDistribuidores.tsx
│   │   │   ├── PanelClientes.tsx
│   │   │   ├── PanelBovedaMonte.tsx
│   │   │   ├── PanelBovedaUSA.tsx
│   │   │   ├── PanelUtilidades.tsx
│   │   │   ├── PanelFletes.tsx
│   │   │   ├── PanelAzteca.tsx
│   │   │   ├── PanelLeftie.tsx
│   │   │   ├── PanelProfit.tsx
│   │   │   ├── PanelAlmacen.tsx
│   │   │   └── PanelReportes.tsx
│   │   │
│   │   ├── 📁 tables/                # Tablas especializadas
│   │   │   ├── TablaIngresos.tsx
│   │   │   ├── TablaGastos.tsx
│   │   │   ├── TablaTransferencias.tsx
│   │   │   ├── TablaCortes.tsx
│   │   │   ├── TablaEntradas.tsx
│   │   │   ├── TablaStockActual.tsx
│   │   │   ├── TablaSalidas.tsx
│   │   │   └── TablaInventario.tsx
│   │   │
│   │   ├── 📁 charts/                # Gráficas avanzadas
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   ├── AreaChart.tsx
│   │   │   ├── RadarChart.tsx
│   │   │   ├── HeatMap.tsx
│   │   │   ├── TreeMap.tsx
│   │   │   └── CustomChart.tsx
│   │   │
│   │   ├── 📁 ai/                    # Componentes IA
│   │   │   ├── FloatingAIWidget.tsx
│   │   │   ├── AIChat.tsx
│   │   │   ├── AIInsights.tsx
│   │   │   ├── AIPredictions.tsx
│   │   │   ├── AIRecommendations.tsx
│   │   │   └── VoiceInput.tsx
│   │   │
│   │   ├── 📁 layout/                # Layouts
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── PanelLayout.tsx
│   │   │
│   │   └── 📁 animations/            # Componentes animados
│   │       ├── FadeIn.tsx
│   │       ├── SlideIn.tsx
│   │       ├── ScaleIn.tsx
│   │       ├── StaggerChildren.tsx
│   │       └── AnimatedCounter.tsx
│   │
│   ├── 📁 services/
│   │   ├── firebase.config.ts        ✅ CREADO
│   │   ├── firestore.service.ts      ✅ CREADO
│   │   ├── migration.service.ts      ✅ CREADO
│   │   ├── ai.service.ts
│   │   ├── analytics.service.ts
│   │   └── export.service.ts
│   │
│   ├── 📁 hooks/
│   │   ├── useFirestore.ts           ✅ CREADO
│   │   ├── useAuth.ts
│   │   ├── useAI.ts
│   │   ├── useForm.ts
│   │   ├── useTable.ts
│   │   ├── useChart.ts
│   │   ├── useAnimation.ts
│   │   ├── useVoice.ts
│   │   └── useExport.ts
│   │
│   ├── 📁 utils/
│   │   ├── formulas.ts               ✅ CREADO
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   └── cn.ts                     # clsx + twMerge
│   │
│   ├── 📁 types/
│   │   ├── index.ts
│   │   ├── firestore.types.ts
│   │   ├── forms.types.ts
│   │   ├── charts.types.ts
│   │   └── ai.types.ts
│   │
│   ├── 📁 store/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── aiStore.ts
│   │
│   ├── 📁 styles/
│   │   ├── globals.css
│   │   ├── animations.css
│   │   └── variables.scss
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
│
├── 📁 .vscode/                       ✅ CONFIGURADO
├── 📁 firebase/
├── .eslintrc.js                      ✅ CREADO
├── .prettierrc.js                    ✅ CREADO
├── tsconfig.json                     ✅ CREADO
├── vite.config.ts                    ✅ CREADO
├── tailwind.config.js                ✅ CREADO
├── package.json                      ✅ CREADO
├── LOGICA_CORRECTA_SISTEMA.md        ✅ CREADO
└── README.md
```

---

## 🎯 **4. LOS 14 PANELES ULTRA PREMIUM**

### **PANEL 1: 🏠 DASHBOARD IA**

[Documentado completo arriba con 8 componentes principales]

### **PANEL 2: 📦 ÓRDENES DE COMPRA**

```typescript
interface PanelOrdenesCompra {
  header: {
    title: '📦 Órdenes de Compra',
    actions: [
      { icon: '➕', label: 'Nueva OC', primary: true },
      { icon: '📤', label: 'Exportar' },
      { icon: '🔍', label: 'Buscar' },
      { icon: '⚙️', label: 'Filtros' }
    ],
    stats: {
      total: number,
      pendientes: number,
      parciales: number,
      pagadas: number
    }
  };

  filters: {
    search: 'Por ID, Distribuidor, Origen',
    dateRange: DateRangePicker,
    estado: ['Todas', 'Pendientes', 'Parciales', 'Pagadas'],
    distribuidor: Select<Distribuidor>,
    montoMin: number,
    montoMax: number,
    ordenarPor: ['Fecha ↓', 'Fecha ↑', 'Monto ↓', 'Monto ↑', 'Deuda ↓']
  };

  table: {
    columns: [
      { key: 'id', label: 'ID Orden', width: '100px', sortable: true },
      { key: 'fecha', label: 'Fecha', width: '100px', sortable: true, format: 'DD/MM/YYYY' },
      { key: 'distribuidor', label: 'Distribuidor', width: '150px', sortable: true },
      { key: 'origen', label: 'Origen', width: '120px' },
      { key: 'cantidad', label: 'Cantidad', width: '80px', align: 'center' },
      { key: 'costoDistribuidor', label: 'Costo Dist.', width: '100px', format: 'currency' },
      { key: 'costoTransporte', label: 'Transporte', width: '100px', format: 'currency' },
      { key: 'costoPorUnidad', label: 'Costo/Unidad', width: '100px', format: 'currency' },
      { key: 'costoTotal', label: 'Total', width: '120px', format: 'currency', bold: true },
      { key: 'pagoDistribuidor', label: 'Pagado', width: '120px', format: 'currency' },
      { key: 'deuda', label: 'Deuda', width: '120px', format: 'currency', highlight: true },
      { key: 'estado', label: 'Estado', width: '100px', component: 'Badge' },
      { key: 'acciones', label: 'Acciones', width: '120px', sticky: 'right' }
    ],

    rowActions: [
      { icon: '👁️', tooltip: 'Ver Detalles', onClick: 'openDetails' },
      { icon: '💰', tooltip: 'Pagar', onClick: 'openPaymentModal', condition: 'deuda > 0' },
      { icon: '✏️', tooltip: 'Editar', onClick: 'openEditModal' },
      { icon: '🗑️', tooltip: 'Eliminar', onClick: 'deleteWithConfirm', danger: true }
    ],

    features: {
      pagination: { itemsPerPage: [10, 25, 50, 100], default: 25 },
      bulkActions: ['Exportar Seleccionadas', 'Marcar Pagadas'],
      expandableRows: true,
      stickyHeader: true,
      virtualScroll: true,
      columnResize: true,
      columnReorder: true,
      saveLayout: true
    },

    expandedRowContent: {
      tabs: [
        {
          id: 'detalles',
          label: 'Detalles Completos',
          content: 'DetalleOrdenCompra'
        },
        {
          id: 'distribuidor',
          label: 'Perfil Distribuidor',
          content: 'PerfilDistribuidor'
        },
        {
          id: 'pagos',
          label: 'Historial Pagos',
          content: 'HistorialPagos'
        },
        {
          id: 'stock',
          label: 'Stock Actual',
          content: 'StockProducto'
        }
      ]
    }
  };

  animations: {
    tableLoad: 'fade-in-up-stagger',
    rowHover: 'scale-glow',
    badgePulse: 'pulse-glow',
    statsCountUp: 'count-up-animate'
  };

  aiFeatures: {
    smartFilters: true,
    predictNextOrder: true,
    suggestPayments: true,
    anomalyDetection: true
  };
}
```

### **PANEL 3: 💰 VENTAS**

```typescript
interface PanelVentas {
  header: {
    title: '💰 Ventas',
    actions: [
      { icon: '➕', label: 'Nueva Venta', primary: true },
      { icon: '📤', label: 'Exportar' },
      { icon: '🔍', label: 'Buscar' },
      { icon: '⚙️', label: 'Filtros' }
    ],
    stats: {
      totalVentas: { value: number, change: '+23%', period: 'vs mes anterior' },
      ventasHoy: { value: number, target: number, progress: 75 },
      pendienteCobro: { value: number, urgente: number },
      ticketPromedio: { value: number, change: '+15%' }
    }
  };

  filters: {
    search: 'Por ID, Cliente, Producto',
    dateRange: DateRangePicker,
    estadoPago: ['Todas', 'Completo', 'Parcial', 'Pendiente'],
    cliente: Select<Cliente>,
    producto: Select<Producto>,
    montoMin: number,
    montoMax: number,
    ordenarPor: ['Fecha ↓', 'Fecha ↑', 'Monto ↓', 'Monto ↑', 'Deuda ↓']
  };

  table: {
    columns: [
      { key: 'id', label: 'ID Venta', width: '100px', sortable: true },
      { key: 'fecha', label: 'Fecha', width: '100px', sortable: true },
      { key: 'cliente', label: 'Cliente', width: '150px', sortable: true },
      { key: 'producto', label: 'Producto', width: '150px' },
      { key: 'cantidad', label: 'Cant.', width: '60px', align: 'center' },
      { key: 'precioVentaUnidad', label: 'Precio/U', width: '100px', format: 'currency' },
      { key: 'precioFlete', label: 'Flete', width: '80px', format: 'currency' },
      { key: 'precioTotalVenta', label: 'Total', width: '120px', format: 'currency', bold: true },
      {
        key: 'distribucionBancos',
        label: 'Distribución',
        width: '200px',
        component: 'MiniBarChart',
        tooltip: 'Bóveda Monte / Fletes / Utilidades'
      },
      { key: 'montoPagado', label: 'Pagado', width: '100px', format: 'currency' },
      { key: 'montoRestante', label: 'Restante', width: '100px', format: 'currency', highlight: true },
      { key: 'estadoPago', label: 'Estado', width: '100px', component: 'Badge' },
      { key: 'acciones', label: 'Acciones', width: '120px', sticky: 'right' }
    ],

    rowActions: [
      { icon: '👁️', tooltip: 'Ver Detalles', onClick: 'openDetails' },
      { icon: '💰', tooltip: 'Cobrar', onClick: 'openPaymentModal', condition: 'estadoPago !== "completo"' },
      { icon: '📄', tooltip: 'Factura', onClick: 'generateInvoice' },
      { icon: '✏️', tooltip: 'Editar', onClick: 'openEditModal' },
      { icon: '🗑️', tooltip: 'Anular', onClick: 'annulWithConfirm', danger: true }
    ],

    expandedRowContent: {
      tabs: [
        {
          id: 'detalles',
          label: 'Detalles Venta',
          content: 'DetalleVenta',
          includes: ['Cálculos', 'Distribución Bancos', 'Fórmulas']
        },
        {
          id: 'cliente',
          label: 'Perfil Cliente',
          content: 'PerfilCliente'
        },
        {
          id: 'pagos',
          label: 'Pagos Realizados',
          content: 'HistorialPagos'
        },
        {
          id: 'impacto',
          label: 'Impacto en Bancos',
          content: 'ImpactoBancos',
          chart: 'SankeyDiagram'
        }
      ]
    }
  };

  aiFeatures: {
    predictSales: true,
    suggestPricing: true,
    identifyChurnRisk: true,
    recommendProducts: true
  };
}
```

### **PANEL 4-10: 🏦 LOS 7 BANCOS** (Estructura idéntica para cada uno)

```typescript
interface PanelBanco {
  header: {
    bancoInfo: {
      nombre: string,
      icon: string,
      tipo: 'operativo' | 'inversion' | 'externo',
      descripcion: string
    },
    capitalCard: {
      capitalActual: {
        value: number,
        format: 'currency-large',
        animation: 'count-up',
        color: 'gradient-primary',
        size: '3xl',
        realtime: true
      },
      comparaciones: {
        vsAyer: { value: '+5.4%', type: 'positive' },
        vsSemana: { value: '+12.3%', type: 'positive' },
        vsMes: { value: '+23.1%', type: 'positive' }
      },
      chart: 'mini-sparkline-7days'
    },
    quickStats: [
      {
        label: '💰 Histórico Ingresos',
        value: number,
        tooltip: 'Suma acumulada fija de todos los ingresos',
        icon: '📥'
      },
      {
        label: '💸 Histórico Gastos',
        value: number,
        tooltip: 'Suma acumulada fija de todos los gastos',
        icon: '📤'
      },
      {
        label: '🔄 Transferencias',
        value: number,
        tooltip: 'Total de transferencias (entrada + salida)',
        icon: '🔄'
      },
      {
        label: '📊 Balance',
        value: number,
        formula: 'Ingresos - Gastos',
        icon: '💎'
      }
    ],
    actions: [
      { icon: '💸', label: 'Registrar Gasto', color: 'red', modal: 'FormGasto' },
      { icon: '🔄', label: 'Transferir', color: 'purple', modal: 'FormTransferencia' },
      { icon: '💰', label: 'Ingreso', color: 'green', modal: 'FormIngreso', condition: 'banco.tipo === "externo"' },
      { icon: '📊', label: 'Corte', color: 'blue', onClick: 'generarCorte' },
      { icon: '📤', label: 'Exportar', color: 'gray' }
    ]
  };

  // ============================================================
  // TABLA 1: INGRESOS 📥
  // ============================================================
  tablaIngresos: {
    title: '📥 Ingresos',
    subtitle: 'Historial de ingresos recibidos',

    columns: [
      { key: 'fecha', label: 'Fecha', width: '100px', sortable: true, format: 'DD/MM/YYYY HH:mm' },
      {
        key: 'tipoIngreso',
        label: 'Tipo',
        width: '120px',
        component: 'Badge',
        options: {
          'venta': { color: 'green', icon: '💰' },
          'transferencia': { color: 'blue', icon: '🔄' },
          'ingreso_manual': { color: 'purple', icon: '➕' },
          'pago_cliente': { color: 'teal', icon: '💳' }
        }
      },
      { key: 'monto', label: 'Monto', width: '120px', format: 'currency', bold: true, color: 'green' },
      { key: 'origen', label: 'Origen', width: '150px', tooltip: true },
      { key: 'concepto', label: 'Concepto', width: '200px' },
      { key: 'descripcion', label: 'Descripción', width: '250px', truncate: true },
      { key: 'referencia', label: 'Ref.', width: '100px', link: true },
      { key: 'usuario', label: 'Usuario', width: '100px' },
      { key: 'acciones', label: '', width: '80px', sticky: 'right' }
    ],

    filters: {
      dateRange: true,
      tipoIngreso: ['Todos', 'Ventas', 'Transferencias', 'Ingresos Manuales'],
      montoMin: number,
      montoMax: number,
      search: 'Buscar en concepto, origen...'
    },

    totales: {
      position: 'bottom-sticky',
      mostrar: {
        totalIngresos: { label: 'Total Ingresos', format: 'currency', bold: true },
        promedioIngreso: { label: 'Promedio', format: 'currency' },
        mayorIngreso: { label: 'Mayor', format: 'currency' },
        menorIngreso: { label: 'Menor', format: 'currency' },
        cantidadRegistros: { label: 'Registros', format: 'number' }
      }
    },

    charts: {
      position: 'above-table',
      types: [
        {
          type: 'line-chart',
          title: 'Evolución de Ingresos',
          data: 'ingresos-por-dia',
          timeRange: ['7d', '30d', '3m', '1y']
        },
        {
          type: 'pie-chart',
          title: 'Ingresos por Tipo',
          data: 'distribucion-por-tipo'
        }
      ]
    },

    features: {
      export: ['Excel', 'CSV', 'PDF'],
      print: true,
      emailReport: true,
      scheduleReport: true
    }
  };

  // ============================================================
  // TABLA 2: GASTOS 📤
  // ============================================================
  tablaGastos: {
    title: '📤 Gastos',
    subtitle: 'Historial de gastos realizados',

    columns: [
      { key: 'fecha', label: 'Fecha', width: '100px', sortable: true },
      {
        key: 'tipoGasto',
        label: 'Tipo',
        width: '140px',
        component: 'Badge',
        options: {
          'pago_distribuidor': { color: 'red', icon: '💳' },
          'transferencia': { color: 'blue', icon: '🔄' },
          'gasto_operativo': { color: 'orange', icon: '💸' },
          'compra': { color: 'purple', icon: '🛒' },
          'servicio': { color: 'yellow', icon: '🔧' }
        }
      },
      { key: 'monto', label: 'Monto', width: '120px', format: 'currency', bold: true, color: 'red' },
      { key: 'destino', label: 'Destino', width: '150px' },
      { key: 'concepto', label: 'Concepto', width: '200px' },
      { key: 'descripcion', label: 'Descripción', width: '250px', truncate: true },
      { key: 'referencia', label: 'Ref.', width: '100px', link: true },
      { key: 'usuario', label: 'Usuario', width: '100px' },
      {
        key: 'aprobacion',
        label: 'Estado',
        width: '100px',
        component: 'Badge',
        options: {
          'aprobado': { color: 'green', icon: '✅' },
          'pendiente': { color: 'yellow', icon: '⏳' },
          'rechazado': { color: 'red', icon: '❌' }
        }
      },
      { key: 'acciones', label: '', width: '80px', sticky: 'right' }
    ],

    totales: {
      totalGastos: 'sum(monto)',
      promedioGasto: 'avg(monto)',
      mayorGasto: 'max(monto)',
      menorGasto: 'min(monto)',
      cantidadRegistros: 'count(*)'
    },

    alertas: {
      gastoExcesivo: {
        condition: 'monto > (promedioGasto * 2)',
        badge: '⚠️ Alto',
        color: 'warning'
      },
      bajoCapital: {
        condition: 'capitalActual < (historicoIngresos * 0.1)',
        alert: 'Capital bajo! Considera restringir gastos',
        type: 'warning'
      }
    },

    charts: {
      types: [
        {
          type: 'bar-chart',
          title: 'Gastos por Tipo',
          data: 'gastos-por-categoria'
        },
        {
          type: 'line-chart',
          title: 'Evolución Gastos',
          data: 'gastos-por-mes',
          compareWith: 'ingresos'
        }
      ]
    }
  };

  // ============================================================
  // TABLA 3: TRANSFERENCIAS 🔄
  // ============================================================
  tablaTransferencias: {
    title: '🔄 Transferencias',
    subtitle: 'Movimientos entre bancos',

    columns: [
      { key: 'fecha', label: 'Fecha', width: '110px', sortable: true },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '100px',
        component: 'Badge',
        options: {
          'entrada': { color: 'green', icon: '📥', label: 'Entrada' },
          'salida': { color: 'red', icon: '📤', label: 'Salida' }
        }
      },
      {
        key: 'monto',
        label: 'Monto',
        width: '120px',
        format: 'currency',
        bold: true,
        colorByType: {
          'entrada': 'green',
          'salida': 'red'
        }
      },
      { key: 'bancoOrigen', label: 'Desde', width: '130px', icon: true },
      { key: 'bancoDestino', label: 'Hacia', width: '130px', icon: true },
      { key: 'concepto', label: 'Concepto', width: '200px' },
      { key: 'descripcion', label: 'Descripción', width: '200px', truncate: true },
      { key: 'usuario', label: 'Usuario', width: '100px' },
      {
        key: 'estado',
        label: 'Estado',
        width: '110px',
        component: 'Badge',
        options: {
          'completada': { color: 'green', icon: '✅' },
          'pendiente': { color: 'yellow', icon: '⏳' },
          'fallida': { color: 'red', icon: '❌' },
          'revertida': { color: 'gray', icon: '↩️' }
        }
      },
      { key: 'acciones', label: '', width: '80px', sticky: 'right' }
    ],

    filters: {
      tipo: ['Todas', 'Entradas', 'Salidas'],
      dateRange: true,
      bancoOrigen: 'Select de todos los bancos',
      bancoDestino: 'Select de todos los bancos',
      estado: ['Todas', 'Completadas', 'Pendientes', 'Fallidas']
    },

    totales: {
      totalEntradas: { value: number, color: 'green', icon: '📥' },
      totalSalidas: { value: number, color: 'red', icon: '📤' },
      balance: {
        value: 'totalEntradas - totalSalidas',
        color: 'dynamic',
        formula: true
      },
      cantidadTransferencias: number
    },

    visualization: {
      sankey: {
        title: 'Flujo de Dinero entre Bancos',
        nodes: 'todos los bancos',
        links: 'transferencias',
        interactive: true,
        filters: {
          timeRange: ['7d', '30d', '3m', '1y'],
          minAmount: number
        }
      },

      network: {
        title: 'Red de Transferencias',
        type: 'force-directed-graph',
        nodeSize: 'capital del banco',
        linkWidth: 'monto transferencia',
        interactive: true
      }
    }
  };

  // ============================================================
  // TABLA 4: CORTES 📋
  // ============================================================
  tablaCortes: {
    title: '📋 Cortes de Caja',
    subtitle: 'Análisis periódico de capital',

    columns: [
      { key: 'fechaCorte', label: 'Fecha Corte', width: '110px', sortable: true, bold: true },
      { key: 'periodo', label: 'Período', width: '120px', component: 'PeriodBadge' },
      { key: 'capitalInicial', label: 'Capital Inicial', width: '130px', format: 'currency' },
      { key: 'totalIngresosPeriodo', label: 'Ingresos', width: '120px', format: 'currency', color: 'green' },
      { key: 'totalGastosPeriodo', label: 'Gastos', width: '120px', format: 'currency', color: 'red' },
      { key: 'capitalFinal', label: 'Capital Final', width: '130px', format: 'currency', bold: true },
      {
        key: 'diferencia',
        label: 'Diferencia',
        width: '120px',
        format: 'currency',
        colorByValue: {
          positive: 'green',
          negative: 'red',
          zero: 'gray'
        },
        bold: true
      },
      {
        key: 'variacionPorcentaje',
        label: 'Variación %',
        width: '100px',
        format: 'percentage',
        colorByValue: {
          positive: 'green',
          negative: 'red'
        }
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '100px',
        component: 'Badge',
        options: {
          'positivo': { color: 'green', icon: '📈', label: 'Positivo' },
          'negativo': { color: 'red', icon: '📉', label: 'Negativo' },
          'neutro': { color: 'gray', icon: '➖', label: 'Neutro' }
        }
      },
      { key: 'acciones', label: '', width: '100px' }
    ],

    periodos: {
      types: ['diario', 'semanal', 'quincenal', 'mensual', 'trimestral', 'anual'],
      default: 'mensual',
      autoGenerate: true
    },

    analisis: {
      tendencia: {
        calculate: 'regression-analysis',
        types: ['creciente', 'decreciente', 'estable'],
        visual: 'trend-arrow',
        prediction: true
      },

      metricas: {
        promedioVariacion: { formula: 'avg(diferencia)', format: 'currency' },
        mejorPeriodo: { select: 'max(diferencia)', highlight: true },
        peorPeriodo: { select: 'min(diferencia)', highlight: true },
        estabilidad: { calculate: 'stddev(diferencia)', format: 'percentage' }
      }
    },

    graficas: {
      lineaCapital: {
        type: 'line-chart',
        title: 'Evolución del Capital',
        data: 'capitalFinal por período',
        features: {
          trendLine: true,
          forecast: true,
          annotations: ['peaks', 'troughs', 'milestones']
        }
      },

      barrasIngresos: {
        type: 'bar-chart',
        title: 'Ingresos por Período',
        data: 'totalIngresosPeriodo',
        color: 'green'
      },

      barrasGastos: {
        type: 'bar-chart',
        title: 'Gastos por Período',
        data: 'totalGastosPeriodo',
        color: 'red'
      },

      comparativa: {
        type: 'dual-axis-chart',
        title: 'Ingresos vs Gastos',
        data: {
          ingresos: { color: 'green', type: 'bar' },
          gastos: { color: 'red', type: 'bar' },
          diferencia: { color: 'blue', type: 'line' }
        }
      },

      heatmap: {
        type: 'calendar-heatmap',
        title: 'Mapa de Calor - Variación Diaria',
        data: 'diferencia por día',
        colorScale: ['red', 'yellow', 'green']
      }
    },

    actions: [
      { icon: '➕', label: 'Nuevo Corte', onClick: 'generarCorte' },
      { icon: '📊', label: 'Análisis Completo', onClick: 'openAnalysis' },
      { icon: '📤', label: 'Exportar Reporte', formats: ['PDF', 'Excel'] },
      { icon: '📧', label: 'Enviar por Email' }
    ]
  };

  aiFeatures: {
    cashFlowPrediction: {
      enabled: true,
      horizon: '30-90 days',
      accuracy: '85-92%',
      alerts: ['low-capital', 'unusual-spending', 'opportunity']
    },

    optimization: {
      suggestTransfers: true,
      identifyWaste: true,
      recommendBudget: true,
      alertAnomalies: true
    },

    insights: {
      patterns: true,
      trends: true,
      comparisons: true,
      recommendations: true
    }
  };
}
```

---

## 📦 **PANEL 13: ALMACÉN**

```typescript
interface PanelAlmacen {
  header: {
    title: '📦 Almacén',
    stats: [
      {
        label: 'Valor Total Inventario',
        value: number,
        formula: 'sum(stockActual × valorUnitario)',
        icon: '💰'
      },
      {
        label: 'Productos Activos',
        value: number,
        icon: '📦'
      },
      {
        label: 'Stock Bajo',
        value: number,
        color: 'warning',
        icon: '⚠️'
      },
      {
        label: 'Stock Agotado',
        value: number,
        color: 'danger',
        icon: '🔴'
      }
    ],
    actions: [
      { icon: '📊', label: 'Corte Inventario', primary: true },
      { icon: '📤', label: 'Exportar' },
      { icon: '🔍', label: 'Buscar' }
    ]
  };

  // TABLA 1: ENTRADAS
  tablaEntradas: {
    title: '📥 Entradas de Productos',
    // Similar structure to Ingresos but for inventory
    columns: [
      'ID Entrada',
      'Fecha',
      'Producto',
      'Cantidad',
      'Origen/Distribuidor',
      'Orden de Compra (Ref)',
      'Costo Unitario',
      'Costo Total',
      'Responsable',
      'Estado',
      'Acciones'
    ],
    totales: {
      totalEntradas: number,
      valorTotalEntradas: number,
      promedioEntrada: number
    }
  };

  // TABLA 2: STOCK ACTUAL
  tablaStockActual: {
    title: '📊 Stock Actual',
    columns: [
      'Producto',
      'Stock Actual (Dinámico)',
      'Stock Mínimo',
      'Stock Máximo',
      'Total Entradas (Histórico)',
      'Total Salidas (Histórico)',
      'Valor Unitario',
      'Valor Total Stock',
      'Estado',
      'Rotación',
      'Acciones'
    ],
    calculos: {
      stockActual: 'totalEntradas - totalSalidas',
      valorTotalStock: 'stockActual × valorUnitario',
      rotacion: 'totalSalidas / stockPromedio'
    },
    alertas: {
      stockBajo: 'stockActual < stockMinimo',
      stockAgotado: 'stockActual === 0',
      stockExcedido: 'stockActual > stockMaximo',
      bajaRotacion: 'rotacion < umbralMinimo'
    }
  };

  // TABLA 3: SALIDAS
  tablaSalidas: {
    title: '📤 Salidas de Productos',
    columns: [
      'ID Salida',
      'Fecha',
      'Producto',
      'Cantidad',
      'Destino/Cliente',
      'Venta (Ref)',
      'Precio Venta Unitario',
      'Total Venta',
      'Responsable',
      'Estado',
      'Acciones'
    ]
  };

  // TABLA 4: CORTES DE INVENTARIO
  tablaCortes: {
    title: '📋 Cortes de Inventario',
    columns: [
      'Fecha Corte',
      'Producto',
      'Stock Inicial',
      'Entradas Período',
      'Salidas Período',
      'Stock Final',
      'Stock Teórico',
      'Diferencia',
      'Valor Inventario',
      'Rotación',
      'Estado'
    ]
  };
}
```

---

## 📊 **PANEL 14: REPORTES Y ANÁLISIS**

```typescript
interface PanelReportes {
  layout: {
    sidebar: {
      categories: [
        {
          label: '📊 Reportes Financieros',
          reports: [
            'Estado de Resultados',
            'Flujo de Efectivo',
            'Balance General',
            'Análisis de Rentabilidad',
            'Punto de Equilibrio'
          ]
        },
        {
          label: '📦 Reportes Operacionales',
          reports: [
            'Movimientos Inventario',
            'Análisis ABC',
            'Rotación de Productos',
            'Mermas y Pérdidas'
          ]
        },
        {
          label: '👥 Reportes Comerciales',
          reports: [
            'Ventas por Cliente',
            'Ventas por Producto',
            'Análisis de Precios',
            'Cuentas por Cobrar'
          ]
        },
        {
          label: '📦 Reportes de Compras',
          reports: [
            'Compras por Distribuidor',
            'Análisis de Costos',
            'Cuentas por Pagar',
            'Evaluación Proveedores'
          ]
        },
        {
          label: '🤖 Reportes IA',
          reports: [
            'Pronósticos',
            'Patrones Detectados',
            'Recomendaciones',
            'Anomalías'
          ]
        }
      ]
    },

    mainArea: {
      reportBuilder: {
        title: 'Constructor de Reportes',
        steps: [
          {
            step: 1,
            label: 'Seleccionar Tipo',
            options: ['Predefinido', 'Personalizado']
          },
          {
            step: 2,
            label: 'Período',
            options: ['Hoy', 'Ayer', 'Últimos 7 días', '30 días', 'Mes actual', 'Personalizado']
          },
          {
            step: 3,
            label: 'Métricas',
            multiselect: true,
            categories: ['Financieras', 'Operacionales', 'Comerciales']
          },
          {
            step: 4,
            label: 'Visualización',
            options: ['Tabla', 'Gráfica', 'Combinado', 'Dashboard']
          },
          {
            step: 5,
            label: 'Formato',
            options: ['PDF', 'Excel', 'PowerPoint', 'Web']
          }
        ]
      },

      reportViewer: {
        toolbar: [
          'Zoom',
          'Imprimir',
          'Descargar',
          'Compartir',
          'Programar',
          'Favoritos'
        ],

        features: {
          drillDown: true,
          filters: true,
          export: true,
          schedule: true,
          compare: true
        }
      }
    }
  };
}
```

---

## 🚀 **5. ROADMAP DE IMPLEMENTACIÓN (30 DÍAS)**

### **SEMANA 1: FUNDAMENTOS** (7 días)

```
DÍA 1-2: Setup y Configuración
- ✅ Configuración VS Code completa
- ✅ Instalación de dependencias
- ✅ Configuración Firebase
- ✅ Estructura de carpetas
- ✅ Sistema de path aliases
- ✅ ESLint + Prettier setup

DÍA 3-4: Componentes UI Base
- 30+ componentes reutilizables
- Sistema de diseño (colores, tipografía, espaciado)
- Animaciones base con Framer Motion
- Storybook para componentes

DÍA 5-7: Servicios Core
- ✅ Firebase service completo
- ✅ Firestore service con lógica de negocio
- ✅ Hooks personalizados
- ✅ Utilidades y fórmulas
- Migración de datos JSON → Firestore
```

### **SEMANA 2: PANELES PRINCIPALES** (7 días)

```
DÍA 8-9: Dashboard IA
- Componentes del dashboard
- KPIs en tiempo real
- Gráficas interactivas
- Widget flotante IA (v1)

DÍA 10-11: Órdenes Compra + Distribuidores
- Panel Órdenes Compra completo
- Panel Distribuidores completo
- Formularios de creación
- Sistema de pagos

DÍA 12-13: Ventas + Clientes
- Panel Ventas completo
- Panel Clientes completo
- Formularios de venta
- Sistema de cobros

DÍA 14: Almacén
- 4 tablas de almacén
- Sistema de stock dinámico
- Alertas de stock
```

### **SEMANA 3: BANCOS** (7 días)

```
DÍA 15-21: Los 7 Bancos
- 1 banco por día
- 4 tablas por banco (28 tablas total)
- Gráficas de análisis
- Sistema de transferencias
- Sistema de cortes
```

### **SEMANA 4: IA Y PULIDO** (7 días)

```
DÍA 22-23: Panel Reportes
- Constructor de reportes
- 20+ reportes predefinidos
- Sistema de exportación

DÍA 24-25: Sistema IA Completo
- Widget flotante completo
- Panel IA fullscreen
- Voice input
- Predicciones
- Insights
- Recomendaciones

DÍA 26-27: Animaciones Premium
- Todas las animaciones de referencias
- Transiciones suaves
- Micro-interacciones
- Loading states

DÍA 28-29: Testing
- Tests unitarios
- Tests de integración
- Tests E2E
- Performance testing

DÍA 30: Deployment
- Build optimizado
- Firebase Hosting
- CI/CD setup
- Documentación final
```

---

## ✅ **5. COMANDOS RÁPIDOS PARA INICIAR**

```powershell
# 1. Instalar dependencias
npm install

# 2. Instalar extensiones VS Code recomendadas
# (VS Code te preguntará automáticamente)

# 3. Ejecutar migración de datos
npm run migrate

# 4. Iniciar emuladores Firebase
npm run firebase:emulators

# 5. Iniciar dev server
npm run dev

# 6. En paralelo (nueva terminal)
npm run firebase:emulators

# 7. Abrir en navegador
# http://localhost:5173
```

---

**🎯 PRÓXIMOS PASOS INMEDIATOS:**

1. **Ejecutar:** `npm install` para instalar todas las dependencias
2. **Crear:** Componentes UI base (Botón, Card, Badge, Input, etc.)
3. **Implementar:** Dashboard IA (Panel 1)
4. **Migrar:** Datos de JSON a Firestore
5. **Continuar:** Con los 13 paneles restantes

**¿EMPEZAMOS CON LOS COMPONENTES UI BASE Y EL DASHBOARD IA?** 🚀
