import React from 'react';

interface BuildingSceneProps {
  position: [number, number, number];
}

const buildingConfig = {
  width: 8,
  depth: 6,
  floorHeight: 3,
  numFloors: 12,
  roof: {
    width: 7,
    depth: 5,
    height: 1.5
  },
  windows: {
    width: 1.2,
    height: 1.8,
    spacing: 2
  }
};

const BuildingScene: React.FC<BuildingSceneProps> = React.memo(({ position }) => {
  return (
    <group position={position}>
      {/* Base and floors */}
      {Array.from({ length: buildingConfig.numFloors }).map((_, i) => (
        <group key={`floor-${i}`}>
          {/* Main floor structure */}
          <mesh position={[0, buildingConfig.floorHeight * (i + 0.5), 0]}>
            <boxGeometry args={[buildingConfig.width, buildingConfig.floorHeight, buildingConfig.depth]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          
          {/* Windows on front face */}
          {Array.from({ length: 3 }).map((_, w) => (
            <mesh
              key={`window-front-${w}`}
              position={[
                (w - 1) * buildingConfig.windows.spacing,
                buildingConfig.floorHeight * (i + 0.5),
                buildingConfig.depth / 2 + 0.01
              ]}
            >
              <planeGeometry args={[buildingConfig.windows.width, buildingConfig.windows.height]} />
              <meshStandardMaterial color="#87CEEB" />
            </mesh>
          ))}
          
          {/* Windows on back face */}
          {Array.from({ length: 3 }).map((_, w) => (
            <mesh
              key={`window-back-${w}`}
              position={[
                (w - 1) * buildingConfig.windows.spacing,
                buildingConfig.floorHeight * (i + 0.5),
                -buildingConfig.depth / 2 - 0.01
              ]}
              rotation={[0, Math.PI, 0]}
            >
              <planeGeometry args={[buildingConfig.windows.width, buildingConfig.windows.height]} />
              <meshStandardMaterial color="#87CEEB" />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Roof */}
      <mesh position={[0, buildingConfig.floorHeight * buildingConfig.numFloors + buildingConfig.roof.height / 2, 0]}>
        <boxGeometry args={[buildingConfig.roof.width, buildingConfig.roof.height, buildingConfig.roof.depth]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
    </group>
  );
});

export default BuildingScene;
