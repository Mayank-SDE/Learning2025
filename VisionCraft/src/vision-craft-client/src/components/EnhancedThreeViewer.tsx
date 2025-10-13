import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Grid,
  Box,
  Sphere,
  Cone,
  useGLTF,
  Line,
} from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

// Extra loaders for non-GLTF formats
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Available demo models
const DEMO_MODELS = [
  { id: 'industrial', name: 'Industrial Complex' },
  { id: 'architecture', name: 'Modern Architecture' },
  { id: 'mechanical', name: 'Mechanical Parts' },
  { id: 'organic', name: 'Organic Form' },
];

interface Measurement {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  distance: number;
}

interface Annotation {
  id: string;
  position: THREE.Vector3;
  text: string;
}

interface EnhancedThreeViewerProps {
  modelUrl?: string;
  modelType?: string;
  showGrid?: boolean;
  showShadows?: boolean;
  measurements?: Measurement[];
  annotations?: Annotation[];
  slicePosition?: number;
  sliceAxis?: 'x' | 'y' | 'z';
  showWireframe?: boolean;
  opacity?: number;
  roughness?: number;
  metalness?: number;
}

/** ---------- Demo models (unchanged) ---------- */
function IndustrialModel({ wireframe = false, opacity = 1, roughness = 0.3, metalness = 0.7 }: any) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });
  return (
    <group ref={group}>
      <Box args={[3, 2, 2]} position={[0, 1, 0]} castShadow>
        <meshStandardMaterial color="#4F8BFF" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </Box>
      <Box args={[0.8, 4, 0.8]} position={[2, 2, 1]} castShadow>
        <meshStandardMaterial color="#7C4DFF" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </Box>
      <mesh position={[-1.5, 1.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2, 32]} />
        <meshStandardMaterial color="#00C2A8" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </mesh>
      <Box args={[5, 0.2, 4]} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#64748B" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={0.8} metalness={0.2} />
      </Box>
    </group>
  );
}

function ArchitectureModel({ wireframe = false, opacity = 1, roughness = 0.3, metalness = 0.5 }: any) {
  const group = useRef<THREE.Group>(null);
  return (
    <group ref={group}>
      <Box args={[4, 3, 2]} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial color="#F1F5F9" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </Box>
      <Box args={[3.9, 2.8, 0.1]} position={[0, 1.5, 1.05]} castShadow>
        <meshStandardMaterial color="#4F8BFF" wireframe={wireframe} transparent opacity={opacity * 0.6} roughness={0.1} metalness={0.9} />
      </Box>
      <Box args={[1, 2, 0.5]} position={[0, 1, 1.3]} castShadow>
        <meshStandardMaterial color="#1E293B" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </Box>
    </group>
  );
}

function MechanicalModel({ wireframe = false, opacity = 1, roughness = 0.2, metalness = 0.9 }: any) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.3;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 1, 0]} castShadow>
        <torusGeometry args={[1, 0.3, 16, 32]} />
        <meshStandardMaterial color="#E11D48" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
        <meshStandardMaterial color="#DC2626" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </mesh>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <Box key={i} args={[0.2, 0.6, 0.3]} position={[Math.cos(angle) * 1.2, 1, Math.sin(angle) * 1.2]} rotation={[0, angle, 0]} castShadow>
            <meshStandardMaterial color="#991B1B" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
          </Box>
        );
      })}
    </group>
  );
}

function OrganicModel({ wireframe = false, opacity = 1, roughness = 0.4, metalness = 0.3 }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });
  return (
    <group>
      <mesh ref={meshRef} position={[0, 1, 0]} castShadow>
        <torusKnotGeometry args={[0.8, 0.3, 128, 32]} />
        <meshStandardMaterial color="#06B6D4" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
      </mesh>
      {[...Array(3)].map((_, i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <Sphere key={i} args={[0.15, 32, 32]} position={[Math.cos(angle) * 1.5, 1, Math.sin(angle) * 1.5]} castShadow>
            <meshStandardMaterial color="#0891B2" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} />
          </Sphere>
        );
      })}
    </group>
  );
}

function MeasurementLine({ measurement }: { measurement: Measurement }) {
  const points = [measurement.start, measurement.end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <group>
      <Line points={points} color="#F59E0B" lineWidth={2} />
      <Sphere args={[0.05, 16, 16]} position={measurement.start}>
        <meshBasicMaterial color="#F59E0B" />
      </Sphere>
      <Sphere args={[0.05, 16, 16]} position={measurement.end}>
        <meshBasicMaterial color="#F59E0B" />
      </Sphere>
    </group>
  );
}

function AnnotationPin({ annotation }: { annotation: Annotation }) {
  return (
    <group position={annotation.position}>
      <Cone args={[0.1, 0.3, 8]} rotation={[Math.PI, 0, 0]}>
        <meshBasicMaterial color="#EF4444" />
      </Cone>
      <Sphere args={[0.08, 16, 16]} position={[0, 0.2, 0]}>
        <meshBasicMaterial color="#EF4444" />
      </Sphere>
    </group>
  );
}

function SlicePlane({ axis, position }: { axis: 'x' | 'y' | 'z'; position: number }) {
  const planePosition: [number, number, number] =
    axis === 'x' ? [position, 0, 0] : axis === 'y' ? [0, position, 0] : [0, 0, position];
  const rotation: [number, number, number] =
    axis === 'x' ? [0, Math.PI / 2, 0] : axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0];

  return (
    <mesh position={planePosition} rotation={rotation}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial color="#4F8BFF" transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** ---------- NEW: Load models by URL (glb/gltf/obj/ply/stl) ---------- */
function UrlModel({
  url,
  wireframe,
  opacity,
  roughness,
  metalness,
}: {
  url: string;
  wireframe: boolean;
  opacity: number;
  roughness: number;
  metalness: number;
}) {
  const ext = useMemo(
    () => url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '',
    [url]
  );

  const applyMaterial = (obj: THREE.Object3D) => {
    obj.traverse((child: any) => {
      if (child.isMesh) {
        if (child.material && child.material.isMaterial) {
          child.material.wireframe = wireframe;
          child.material.transparent = opacity < 1;
          child.material.opacity = opacity;
          if ('roughness' in child.material) child.material.roughness = roughness;
          if ('metalness' in child.material) child.material.metalness = metalness;
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: '#9aa3af',
            wireframe,
            transparent: opacity < 1,
            opacity,
            roughness,
            metalness,
          });
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  if (ext === 'glb' || ext === 'gltf') {
    const gltf = useGLTF(url, true);
    useEffect(() => {
      applyMaterial(gltf.scene);
    }, [gltf, wireframe, opacity, roughness, metalness]);
    return <primitive object={gltf.scene} />;
  }

  if (ext === 'obj') {
    const obj = useLoader(OBJLoader, url);
    useEffect(() => {
      applyMaterial(obj);
    }, [obj, wireframe, opacity, roughness, metalness]);
    return <primitive object={obj} />;
  }

  if (ext === 'ply') {
    const geom = useLoader(PLYLoader, url) as THREE.BufferGeometry;
    const mat = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: '#9aa3af',
          wireframe,
          transparent: opacity < 1,
          opacity,
          roughness,
          metalness,
        }),
      [wireframe, opacity, roughness, metalness]
    );
    return <mesh geometry={geom} material={mat} castShadow receiveShadow />;
  }

  if (ext === 'stl') {
    const geom = useLoader(STLLoader, url) as THREE.BufferGeometry;
    const mat = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: '#9aa3af',
          wireframe,
          transparent: opacity < 1,
          opacity,
          roughness,
          metalness,
        }),
      [wireframe, opacity, roughness, metalness]
    );
    return <mesh geometry={geom} material={mat} castShadow receiveShadow />;
  }

  // Unknown extension — render nothing, UI stays up
  return null;
}

export function EnhancedThreeViewer({
  modelUrl,
  modelType = 'industrial',
  showGrid = false,
  showShadows = true,
  measurements = [],
  annotations = [],
  slicePosition,
  sliceAxis = 'y',
  showWireframe = false,
  opacity = 1,
  roughness = 0.3,
  metalness = 0.7,
}: EnhancedThreeViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [modelType, modelUrl]);

  const getDemoModel = () => {
    const props = { wireframe: showWireframe, opacity, roughness, metalness };
    switch (modelType) {
      case 'architecture':
        return <ArchitectureModel {...props} />;
      case 'mechanical':
        return <MechanicalModel {...props} />;
      case 'organic':
        return <OrganicModel {...props} />;
      default:
        return <IndustrialModel {...props} />;
    }
  };

  return (
    <div className="relative w-full h-full bg-background">
      <Canvas shadows={showShadows} dpr={[1, 2]} className="cursor-grab active:cursor-grabbing">
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow={showShadows}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#7C4DFF" />
          <pointLight position={[10, -10, -5]} intensity={0.5} color="#00C2A8" />

          {/* Environment */}
          <Environment preset="city" />

          {/* Model: prefer URL, else demo */}
          {modelUrl ? (
            <UrlModel
              url={modelUrl}
              wireframe={showWireframe}
              opacity={opacity}
              roughness={roughness}
              metalness={metalness}
            />
          ) : (
            getDemoModel()
          )}

          {/* Grid */}
          {showGrid && (
            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#6B7280"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#4F8BFF"
              fadeDistance={25}
              fadeStrength={1}
              position={[0, 0, 0]}
            />
          )}

          {/* Contact shadows */}
          {showShadows && (
            <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          )}

          {/* Measurements & Annotations */}
          {measurements.map((measurement) => (
            <MeasurementLine key={measurement.id} measurement={measurement} />
          ))}
          {annotations.map((annotation) => (
            <AnnotationPin key={annotation.id} annotation={annotation} />
          ))}

          {/* Slice Plane */}
          {slicePosition !== undefined && (
            <SlicePlane axis={sliceAxis} position={slicePosition} />
          )}

          {/* Camera */}
          <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />

          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading model...</p>
          </div>
        </div>
      )}

      {/* Coordinate System Indicator */}
      <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-2 shadow-elevation-1">
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500" />X
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-green-500" />Y
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-500" />Z
          </span>
        </div>
      </div>

      {/* Model Info */}
      <div className="absolute top-4 left-4 glass-panel rounded-lg px-3 py-2 shadow-elevation-1">
        <p className="text-xs text-muted-foreground">
          {modelUrl
            ? 'Model: from URL'
            : `Model: ${DEMO_MODELS.find((m) => m.id === modelType)?.name || 'Unknown'}`}
        </p>
      </div>
    </div>
  );
}
