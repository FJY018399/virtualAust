import MapSystem from './components/MapSystem';
import './App.css';

const sampleBuildings = [
  { x: 10, z: 10, width: 1, depth: 1 },
  { x: 20, z: 20, width: 1, depth: 1 },
  { x: 30, z: 30, width: 1, depth: 1 },
];

function App() {
  const handleCollision = (collidingBuildings: any[]) => {
    console.warn('Building collision detected:', collidingBuildings);
  };

  return (
    <div className="App">
      <MapSystem 
        buildings={sampleBuildings}
        onCollisionDetected={handleCollision}
      />
    </div>
  );
}

export default App;
