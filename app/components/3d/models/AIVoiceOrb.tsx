'use client';

/**
 * 🔮 AIVoiceOrb - Orbe de Asistente de Voz 3D
 * Basado en el modelo GLTF ai_voice_assistance_orb.gltf
 * 
 * Características:
 * - Esferas con material de transmisión (vidrio)
 * - Animaciones reactivas al estado
 * - Partículas orbitales
 * - Efectos de audio visualizer
 * - Interactividad completa
 */

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF, MeshTransmissionMaterial, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Tipos
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error';

interface AIVoiceOrbProps {
  state?: OrbState;
  audioLevel?: number; // 0-1 para visualización de audio
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  scale?: number;
  color?: string;
  pulseSpeed?: number;
  enableParticles?: boolean;
}

// Colores por estado
const STATE_COLORS: Record<OrbState, { primary: string; secondary: string; emissive: string }> = {
  idle: { primary: '#3b82f6', secondary: '#60a5fa', emissive: '#1d4ed8' },
  listening: { primary: '#22c55e', secondary: '#4ade80', emissive: '#16a34a' },
  thinking: { primary: '#a855f7', secondary: '#c084fc', emissive: '#7c3aed' },
  speaking: { primary: '#06b6d4', secondary: '#22d3ee', emissive: '#0891b2' },
  success: { primary: '#10b981', secondary: '#34d399', emissive: '#059669' },
  error: { primary: '#ef4444', secondary: '#f87171', emissive: '#dc2626' },
};

// Esfera interior con material de transmisión
function InnerSphere({ 
  state, 
  audioLevel = 0,
  scale = 1 
}: { 
  state: OrbState; 
  audioLevel: number;
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const colors = STATE_COLORS[state];
  
  useFrame((frameState, delta) => {
    if (!meshRef.current) return;
    
    const time = frameState.clock.getElapsedTime();
    
    // Escala basada en audio y estado
    const baseScale = scale * 0.6;
    const audioScale = 1 + audioLevel * 0.3;
    const pulseScale = state === 'thinking' 
      ? 1 + Math.sin(time * 4) * 0.1 
      : state === 'speaking'
        ? 1 + Math.sin(time * 8) * 0.05 * (1 + audioLevel)
        : 1 + Math.sin(time * 2) * 0.02;
    
    meshRef.current.scale.setScalar(baseScale * audioScale * pulseScale);
    
    // Rotación suave
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={256}
        transmission={0.95}
        roughness={0.05}
        thickness={0.5}
        ior={1.5}
        chromaticAberration={0.06}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor={colors.primary}
        color={colors.secondary}
        emissive={colors.emissive}
        emissiveIntensity={state === 'speaking' ? 0.5 + audioLevel * 0.5 : 0.2}
      />
    </mesh>
  );
}

// Esfera exterior (capa de cristal)
function OuterSphere({ 
  state, 
  scale = 1,
  isHovered = false 
}: { 
  state: OrbState; 
  scale: number;
  isHovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const colors = STATE_COLORS[state];
  
  useFrame((frameState) => {
    if (!meshRef.current) return;
    
    const time = frameState.clock.getElapsedTime();
    const targetScale = scale * (isHovered ? 1.05 : 1);
    
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
    
    meshRef.current.rotation.y -= 0.002;
    meshRef.current.rotation.z = Math.sin(time * 0.3) * 0.05;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <MeshTransmissionMaterial
        backside={false}
        samples={8}
        resolution={128}
        transmission={0.9}
        roughness={0.1}
        thickness={0.2}
        ior={1.2}
        chromaticAberration={0.02}
        clearcoat={1}
        attenuationDistance={1}
        attenuationColor={colors.primary}
        color="white"
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

// Anillos orbitales
function OrbitalRings({ 
  state, 
  audioLevel = 0 
}: { 
  state: OrbState; 
  audioLevel: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = STATE_COLORS[state];
  
  useFrame((frameState) => {
    if (!groupRef.current) return;
    
    const time = frameState.clock.getElapsedTime();
    const speed = state === 'thinking' ? 3 : state === 'speaking' ? 2 : 1;
    
    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.x = time * speed * 0.3 * (i % 2 === 0 ? 1 : -1);
      ring.rotation.y = time * speed * 0.2 * (i % 2 === 0 ? -1 : 1);
      
      // Escala reactiva al audio
      const ringScale = 1 + audioLevel * 0.1 * (i + 1);
      ring.scale.setScalar(ringScale);
    });
  });

  return (
    <group ref={groupRef}>
      {[1.4, 1.6, 1.8].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[radius, 0.01, 16, 100]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.emissive}
            emissiveIntensity={0.5 + audioLevel * 0.5}
            transparent
            opacity={0.4 + audioLevel * 0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// Partículas flotantes
function OrbParticles({ 
  state, 
  count = 50 
}: { 
  state: OrbState; 
  count?: number;
}) {
  const colors = STATE_COLORS[state];
  
  return (
    <Sparkles
      count={count}
      scale={3}
      size={2}
      speed={state === 'thinking' ? 2 : state === 'speaking' ? 1.5 : 0.5}
      color={colors.primary}
      opacity={0.6}
    />
  );
}

// Ondas de audio (visualizer)
function AudioWaves({ 
  audioLevel = 0, 
  state 
}: { 
  audioLevel: number; 
  state: OrbState;
}) {
  const wavesRef = useRef<THREE.Group>(null);
  const colors = STATE_COLORS[state];
  
  useFrame((frameState) => {
    if (!wavesRef.current || state !== 'speaking') return;
    
    const time = frameState.clock.getElapsedTime();
    
    wavesRef.current.children.forEach((wave, i) => {
      if (wave instanceof THREE.Mesh) {
        const scale = 1.3 + i * 0.2 + Math.sin(time * 4 + i) * audioLevel * 0.3;
        wave.scale.setScalar(scale);
        
        if (wave.material instanceof THREE.MeshBasicMaterial) {
          wave.material.opacity = Math.max(0, 0.3 - i * 0.1) * audioLevel;
        }
      }
    });
  });

  if (state !== 'speaking' && state !== 'listening') return null;

  return (
    <group ref={wavesRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3 + i * 0.2, 1.35 + i * 0.2, 64]} />
          <meshBasicMaterial
            color={colors.primary}
            transparent
            opacity={0.3 - i * 0.07}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Componente principal del Orbe
export function AIVoiceOrb({
  state = 'idle',
  audioLevel = 0,
  onClick,
  onHover,
  scale = 1,
  pulseSpeed = 1,
  enableParticles = true,
}: AIVoiceOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const handlePointerOver = () => {
    setIsHovered(true);
    onHover?.(true);
  };
  
  const handlePointerOut = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  return (
    <Float
      speed={pulseSpeed * 2}
      rotationIntensity={0.2}
      floatIntensity={0.3}
    >
      <group 
        ref={groupRef}
        onClick={onClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={scale}
      >
        {/* Luz puntual central */}
        <pointLight
          color={STATE_COLORS[state].primary}
          intensity={2 + audioLevel * 3}
          distance={5}
        />
        
        {/* Esfera interior */}
        <InnerSphere state={state} audioLevel={audioLevel} scale={1} />
        
        {/* Esfera exterior */}
        <OuterSphere state={state} scale={1} isHovered={isHovered} />
        
        {/* Anillos orbitales */}
        <OrbitalRings state={state} audioLevel={audioLevel} />
        
        {/* Ondas de audio */}
        <AudioWaves audioLevel={audioLevel} state={state} />
        
        {/* Partículas */}
        {enableParticles && <OrbParticles state={state} />}
      </group>
    </Float>
  );
}

// Hook para cargar el modelo GLTF original (si se prefiere)
export function useAIVoiceOrbModel() {
  const gltf = useGLTF('/models/ai_voice_assistance_orb.gltf');
  return gltf;
}

// Precargar el modelo
useGLTF.preload('/models/ai_voice_assistance_orb.gltf');

export default AIVoiceOrb;
