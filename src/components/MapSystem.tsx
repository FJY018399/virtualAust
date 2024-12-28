import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import BuildingScene from './BuildingScene';

const GRID_SIZE = 64;

interface BuildingData {
  x: number;
  z: number;
  width?: number;
  depth?: number;
}

interface MapSystemProps {
  buildings: BuildingData[];
  onCollisionDetected?: (collidingBuildings: BuildingData[]) => void;
}

const checkBuildingCollision = (building: BuildingData, otherBuildings: BuildingData[]): boolean => {
  const buildingWidth = building.width || 1;
  const buildingDepth = building.depth || 1;
  
  return otherBuildings.some(other => {
    const otherWidth = other.width || 1;
    const otherDepth = other.depth || 1;
    
    // Check if buildings overlap in both x and z axes
    const xOverlap = Math.abs(building.x - other.x) < (buildingWidth + otherWidth) / 2;
    const zOverlap = Math.abs(building.z - other.z) < (buildingDepth + otherDepth) / 2;
    
    return xOverlap && zOverlap;
  });
};

export const MapSystem: React.FC<MapSystemProps> = ({ buildings, onCollisionDetected }) => {
  // Check for collisions
  const collidingBuildings = buildings.filter((building, index) => 
    checkBuildingCollision(building, buildings.slice(0, index).concat(buildings.slice(index + 1)))
  );
  
  if (collidingBuildings.length > 0 && onCollisionDetected) {
    onCollisionDetected(collidingBuildings);
  }
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [32, 50, 32], fov: 75 }}>
        <OrbitControls
          enableRotate={true}
          enablePan={true}
          minPolarAngle={0}  // Looking straight down
          maxPolarAngle={Math.PI / 2}  // Horizontal view
          rotateSpeed={0.5}
          panSpeed={0.5}
          target={[0, 0, 0]}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <Grid
          args={[GRID_SIZE, GRID_SIZE]}
          position={[0, 0, 0]}
          cellSize={1}
          cellThickness={1}
          cellColor="#666666"
          sectionSize={8}
          sectionThickness={2}
          sectionColor="#888888"
          fadeDistance={100}
          fadeStrength={0.5}
          followCamera={false}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[-40, 60, 40]} intensity={1.0} />
        <directionalLight position={[40, 60, -40]} intensity={0.5} />
        <directionalLight position={[0, 20, 45]} intensity={0.4} />
        
        {buildings.map((building, index) => (
          <BuildingScene
            key={index}
            position={[
              building.x - GRID_SIZE/2,
              0,
              building.z - GRID_SIZE/2
            ]}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default MapSystem;
