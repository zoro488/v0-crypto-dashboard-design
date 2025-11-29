# 🎯 SNIPPETS OPTIMIZADOS - PREMIUM ECOSYSTEM

## React + TypeScript Snippets

### Componente Funcional con TypeScript
```typescript
// Trigger: rfc
import React from 'react';

interface ${1:ComponentName}Props {
  ${2:prop}: ${3:type};
}

export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${2:prop} }) => {
  return (
    <div className="${4:container}">
      ${0}
    </div>
  );
};
```

### Custom Hook
```typescript
// Trigger: uch
import { useState, useEffect } from 'react';

export const use${1:HookName} = (${2:params}) => {
  const [${3:state}, set${3:State}] = useState${4:<type>}(${5:initialValue});

  useEffect(() => {
    ${0}
  }, []);

  return { ${3:state}, set${3:State} };
};
```

### Zustand Store
```typescript
// Trigger: zst
import { create } from 'zustand';

interface ${1:Store}State {
  ${2:property}: ${3:type};
  ${4:action}: (${5:params}) => void;
}

export const use${1:Store} = create<${1:Store}State>((set) => ({
  ${2:property}: ${6:initialValue},
  ${4:action}: (${5:params}) => set((state) => ({ ${0} })),
}));
```

### React Query Hook
```typescript
// Trigger: rq
import { useQuery } from '@tanstack/react-query';
import { ${1:service} } from '@/services/${2:serviceName}';

export const use${3:QueryName} = (${4:params}) => {
  return useQuery({
    queryKey: ['${5:key}', ${4:params}],
    queryFn: () => ${1:service}.${6:method}(${4:params}),
    staleTime: ${7:5 * 60 * 1000},
    ${0}
  });
};
```

### React Query Mutation
```typescript
// Trigger: rqm
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ${1:service} } from '@/services/${2:serviceName}';

export const use${3:MutationName} = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (${4:data}) => ${1:service}.${5:method}(${4:data}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${6:key}'] });
      ${0}
    },
  });
};
```

### Firebase Service
```typescript
// Trigger: fbs
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION = '${1:collectionName}';

export const ${2:serviceName} = {
  getAll: async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getById: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  create: async (data: ${3:Type}) => {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return { id: docRef.id, ...data };
  },

  update: async (id: string, data: Partial<${3:Type}>) => {
    await updateDoc(doc(db, COLLECTION, id), data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
```

### Zod Schema
```typescript
// Trigger: zod
import { z } from 'zod';

export const ${1:schemaName}Schema = z.object({
  ${2:field}: z.${3:string}().min(${4:1}, '${5:Error message}'),
  ${0}
});

export type ${1:SchemaName} = z.infer<typeof ${1:schemaName}Schema>;
```

### React Hook Form
```typescript
// Trigger: rhf
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ${1:schema}Schema, type ${1:Schema} } from '@/schemas/${2:schemaFile}';

export const ${3:ComponentName} = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<${1:Schema}>({
    resolver: zodResolver(${1:schema}Schema),
  });

  const onSubmit = async (data: ${1:Schema}) => {
    ${0}
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

### Framer Motion Component
```typescript
// Trigger: fm
import { motion } from 'framer-motion';

const ${1:variants} = {
  initial: { ${2:opacity}: 0, ${3:y}: 20 },
  animate: { ${2:opacity}: 1, ${3:y}: 0 },
  exit: { ${2:opacity}: 0, ${3:y}: -20 },
};

export const ${4:ComponentName} = () => {
  return (
    <motion.div
      variants={${1:variants}}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: ${5:0.3} }}
    >
      ${0}
    </motion.div>
  );
};
```

### Error Boundary
```typescript
// Trigger: erb
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ${1:ErrorBoundary} extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### Test Template (Vitest)
```typescript
// Trigger: test
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${1:ComponentName} } from './${1:ComponentName}';

describe('${1:ComponentName}', () => {
  beforeEach(() => {
    ${2:// Setup}
  });

  it('should render correctly', () => {
    render(<${1:ComponentName} />);
    ${0}
  });

  it('should handle ${3:action}', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## 🎯 CÓMO USAR

### Método 1: VS Code User Snippets
1. `Ctrl+Shift+P` → `Preferences: Configure User Snippets`
2. Seleccionar `typescriptreact.json`
3. Copiar snippets deseados
4. Guardar

### Método 2: Extension
Instalar: **ES7+ React/Redux/React-Native snippets**
- Ya incluye muchos snippets similares

### Método 3: Copiar y Pegar
- Usar este archivo como referencia
- Copiar templates según necesidad

---

## 📝 SNIPPETS ADICIONALES

### Console Log
```javascript
// Trigger: clg
console.log('${1:label}:', ${0});
```

### Try Catch
```typescript
// Trigger: tryc
try {
  ${1}
} catch (error) {
  console.error('${2:Error}:', error);
  ${0}
}
```

### Async Function
```typescript
// Trigger: asf
const ${1:functionName} = async (${2:params}) => {
  try {
    ${0}
  } catch (error) {
    console.error(error);
    throw error;
  }
};
```

---

**💡 TIP**: Personaliza los triggers según tu preferencia en User Snippets
