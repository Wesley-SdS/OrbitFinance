"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo, useState, useCallback } from "react"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

interface ParticlesProps {
  mousePosition: { x: number; y: number }
}

function Particles({ mousePosition }: ParticlesProps) {
  const ref = useRef<THREE.Points>(null!)
  const { viewport } = useThree()
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(2000 * 3)
    
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    
    return positions
  }, [])

  const particlesSpeed = useMemo(() => {
    const speeds = new Float32Array(2000)
    
    for (let i = 0; i < 2000; i++) {
      speeds[i] = Math.random() * 0.04 + 0.002
    }
    
    return speeds
  }, [])

  useFrame((state) => {
    if (!ref.current) return

    const time = state.clock.getElapsedTime()
    const positions = ref.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < 2000; i++) {
      const i3 = i * 3
      
      const mouseInfluence = 0.0005
      const mouseX = (mousePosition.x / window.innerWidth) * 2 - 1
      const mouseY = -(mousePosition.y / window.innerHeight) * 2 + 1
      
      const mouseWorldX = mouseX * viewport.width / 2
      const mouseWorldY = mouseY * viewport.height / 2
      
      const dx = mouseWorldX - positions[i3]
      const dy = mouseWorldY - positions[i3 + 1]
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 3) {
        positions[i3] += dx * mouseInfluence
        positions[i3 + 1] += dy * mouseInfluence
      }

      positions[i3] += Math.sin(time * particlesSpeed[i] + i) * 0.002
      positions[i3 + 1] += Math.cos(time * particlesSpeed[i] + i) * 0.002
      positions[i3 + 2] += Math.sin(time * particlesSpeed[i] * 0.5 + i) * 0.002

      if (positions[i3] > 5) positions[i3] = -5
      if (positions[i3] < -5) positions[i3] = 5
      if (positions[i3 + 1] > 5) positions[i3 + 1] = -5
      if (positions[i3 + 1] < -5) positions[i3 + 1] = 5
    }

    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={ref} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6e0079"
        size={0.025}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

function ConnectionLines({ mousePosition }: ParticlesProps) {
  const ref = useRef<THREE.LineSegments>(null!)

  const connections = useMemo(() => {
    const positions = []
    const count = 50

    for (let i = 0; i < count; i++) {
      const x1 = (Math.random() - 0.5) * 8
      const y1 = (Math.random() - 0.5) * 8
      const z1 = (Math.random() - 0.5) * 2

      const x2 = x1 + (Math.random() - 0.5) * 2
      const y2 = y1 + (Math.random() - 0.5) * 2
      const z2 = z1 + (Math.random() - 0.5) * 0.5

      positions.push(x1, y1, z1, x2, y2, z2)
    }

    return new Float32Array(positions)
  }, [])

  useFrame((state) => {
    if (!ref.current) return

    const time = state.clock.getElapsedTime()
    const positions = ref.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < positions.length; i += 6) {
      positions[i] += Math.sin(time * 0.8 + i) * 0.002
      positions[i + 1] += Math.cos(time * 0.5 + i) * 0.002
      positions[i + 3] += Math.sin(time * 0.7 + i + 3) * 0.002
      positions[i + 4] += Math.cos(time * 0.9 + i + 3) * 0.002
    }

    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={connections.length / 3}
          array={connections}
          itemSize={3}
          args={[connections, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color="#9300a1" 
        transparent 
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

export function AuthInteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    setMousePosition({
      x: event.clientX,
      y: event.clientY
    })
  }, [])

  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        
        <Particles mousePosition={mousePosition} />
        <ConnectionLines mousePosition={mousePosition} />
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary-700/20 via-primary-800/15 to-primary-700/20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-600/10 to-primary-700/15" />
    </div>
  )
}