/**
 * useFirestore Hook - Operaciones CRUD optimizadas para Firebase Firestore
 * Con soporte para tiempo real, caché y batch operations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  runTransaction,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  QueryDocumentSnapshot,
  Timestamp,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase/config';

// Tipos
export interface BaseDocument {
  id: string;
}

export interface FirestoreState<T> {
  data: T | T[] | null;
  loading: boolean;
  error: string | null;
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export interface QueryOptions {
  filters?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: unknown;
  }>;
  orderByField?: string;
  orderDirection?: OrderByDirection;
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot;
}

export interface UseFirestoreResult<T> {
  // Estado
  state: FirestoreState<T>;
  
  // CRUD Operations
  getAll: (options?: QueryOptions) => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  create: (data: Partial<T>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  
  // Batch Operations
  batchCreate: (items: Partial<T>[]) => Promise<string[]>;
  batchUpdate: (updates: Array<{ id: string; data: Partial<T> }>) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  
  // Real-time
  subscribe: (options?: QueryOptions) => () => void;
  subscribeToDoc: (id: string) => () => void;
  
  // Pagination
  loadMore: () => Promise<void>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook principal para operaciones Firestore
 */
export function useFirestore<T extends BaseDocument>(
  collectionName: string
): UseFirestoreResult<T> {
  const [state, setState] = useState<FirestoreState<T>>({
    data: null,
    loading: false,
    error: null,
    lastDoc: null,
    hasMore: true,
  });

  const currentOptionsRef = useRef<QueryOptions | undefined>(undefined);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Referencia a la colección
  const collectionRef = collection(db, collectionName);

  // Construir query con opciones
  const buildQuery = useCallback((options?: QueryOptions) => {
    const constraints: QueryConstraint[] = [];

    if (options?.filters) {
      options.filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
    }

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    if (options?.startAfterDoc) {
      constraints.push(startAfter(options.startAfterDoc));
    }

    return query(collectionRef, ...constraints);
  }, [collectionRef]);

  // Obtener todos los documentos
  const getAll = useCallback(async (options?: QueryOptions): Promise<T[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    currentOptionsRef.current = options;

    try {
      const q = buildQuery(options);
      const snapshot = await getDocs(q);
      
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as T));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMoreDocs = snapshot.docs.length === (options?.limitCount || 50);

      setState(prev => ({
        ...prev,
        data: documents,
        loading: false,
        lastDoc: lastVisible,
        hasMore: hasMoreDocs,
      }));

      return documents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener datos';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return [];
    }
  }, [buildQuery]);

  // Obtener documento por ID
  const getById = useCallback(async (id: string): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const document = { id: docSnap.id, ...docSnap.data() } as unknown as T;
        setState(prev => ({ ...prev, data: document, loading: false }));
        return document;
      }

      setState(prev => ({ ...prev, data: null, loading: false }));
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener documento';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [collectionName]);

  // Crear documento
  const create = useCallback(async (data: Partial<T>): Promise<string> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const docData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collectionRef, docData);
      setState(prev => ({ ...prev, loading: false }));
      return docRef.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear documento';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [collectionRef]);

  // Actualizar documento
  const update = useCallback(async (id: string, data: Partial<T>): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar documento';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [collectionName]);

  // Eliminar documento
  const remove = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar documento';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [collectionName]);

  // Batch Create
  const batchCreate = useCallback(async (items: Partial<T>[]): Promise<string[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const batch = writeBatch(db);
      const ids: string[] = [];
      const now = Timestamp.now();

      items.forEach(item => {
        const docRef = doc(collectionRef);
        ids.push(docRef.id);
        batch.set(docRef, {
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
      setState(prev => ({ ...prev, loading: false }));
      return ids;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en batch create';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [collectionRef]);

  // Batch Update
  const batchUpdate = useCallback(async (
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, collectionName, id);
        batch.update(docRef, { ...data, updatedAt: now });
      });

      await batch.commit();
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en batch update';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [collectionName]);

  // Batch Delete
  const batchDelete = useCallback(async (ids: string[]): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const batch = writeBatch(db);

      ids.forEach(id => {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      });

      await batch.commit();
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en batch delete';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [collectionName]);

  // Suscripción en tiempo real a colección
  const subscribe = useCallback((options?: QueryOptions) => {
    // Limpiar suscripción anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    currentOptionsRef.current = options;
    setState(prev => ({ ...prev, loading: true, error: null }));

    const q = buildQuery(options);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as unknown as T));

        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

        setState(prev => ({
          ...prev,
          data: documents,
          loading: false,
          lastDoc: lastVisible,
          hasMore: snapshot.docs.length === (options?.limitCount || 50),
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [buildQuery]);

  // Suscripción en tiempo real a documento específico
  const subscribeToDoc = useCallback((id: string) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const docRef = doc(db, collectionName, id);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const document = { id: docSnap.id, ...docSnap.data() } as unknown as T;
          setState(prev => ({ ...prev, data: document, loading: false }));
        } else {
          setState(prev => ({ ...prev, data: null, loading: false }));
        }
      },
      (error) => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [collectionName]);

  // Cargar más (paginación)
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading || !state.lastDoc) return;

    const options = {
      ...currentOptionsRef.current,
      startAfterDoc: state.lastDoc,
    };

    setState(prev => ({ ...prev, loading: true }));

    try {
      const q = buildQuery(options);
      const snapshot = await getDocs(q);

      const newDocuments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as T));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMoreDocs = snapshot.docs.length === (options.limitCount || 50);

      setState(prev => ({
        ...prev,
        data: Array.isArray(prev.data) 
          ? [...prev.data, ...newDocuments] 
          : newDocuments,
        loading: false,
        lastDoc: lastVisible,
        hasMore: hasMoreDocs,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar más';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [state.hasMore, state.loading, state.lastDoc, buildQuery]);

  // Refrescar datos
  const refresh = useCallback(async () => {
    await getAll(currentOptionsRef.current);
  }, [getAll]);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    state,
    getAll,
    getById,
    create,
    update,
    remove,
    batchCreate,
    batchUpdate,
    batchDelete,
    subscribe,
    subscribeToDoc,
    loadMore,
    refresh,
    clearError,
  };
}

/**
 * Hook específico para colecciones comunes
 */
export function useVentas() {
  return useFirestore<{
    id: string;
    fecha: string;
    clienteId: string;
    cliente: string;
    producto: string;
    cantidad: number;
    precioVentaUnidad: number;
    precioTotalVenta: number;
    montoPagado: number;
    montoRestante: number;
    estadoPago: 'completo' | 'parcial' | 'pendiente';
  }>('ventas');
}

export function useOrdenesCompra() {
  return useFirestore<{
    id: string;
    fecha: string;
    distribuidorId: string;
    distribuidor: string;
    producto: string;
    cantidad: number;
    costoTotal: number;
    pagoInicial: number;
    deuda: number;
    estado: 'pendiente' | 'parcial' | 'pagada';
  }>('ordenesCompra');
}

export function useClientes() {
  return useFirestore<{
    id: string;
    nombre: string;
    telefono: string;
    email: string;
    deudaTotal: number;
    estado: string;
  }>('clientes');
}

export function useDistribuidores() {
  return useFirestore<{
    id: string;
    nombre: string;
    empresa: string;
    telefono: string;
    email: string;
    deudaTotal: number;
  }>('distribuidores');
}

export function useBancos() {
  return useFirestore<{
    id: string;
    nombre: string;
    saldo: number;
    tipo: string;
  }>('bancos');
}

export function useProductos() {
  return useFirestore<{
    id: string;
    nombre: string;
    stockActual: number;
    stockMinimo: number;
    valorUnitario: number;
    categoria: string;
  }>('productos');
}

export default useFirestore;
