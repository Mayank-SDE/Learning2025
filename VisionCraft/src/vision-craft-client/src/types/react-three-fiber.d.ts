import * as THREE from 'three'
import { Object3DNode } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // lights
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>

      // meshes / materials / geometries you use in code
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      torusKnotGeometry: Object3DNode<THREE.TorusKnotGeometry, typeof THREE.TorusKnotGeometry>

      // allow <primitive object={...} />
      primitive: any
    }
  }
}

export {}
