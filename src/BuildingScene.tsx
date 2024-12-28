import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface WindowConfig {
  width: number;
  height: number;
  spacing: number;
  countPerWall: {
    front: number;
    side: number;
  };
}

interface FloorConfig {
  windows: WindowConfig;
  divider: {
    enabled: boolean;
    height: number;
    overhang: number;
  };
  decorativeLines: boolean;
}

interface RoofConfig {
  width: number;
  depth: number;
  height: number;
  trim: {
    height: number;
    overhang: number;
  };
  tower: {
    base: {
      width: number;
      depth: number;
      height: number;
    };
    main: {
      width: number;
      depth: number;
      height: number;
    };
    top: {
      width: number;
      depth: number;
      height: number;
    };
    spire: {
      width: number;
      depth: number;
      height: number;
    };
  };
  parapet: {
    height: number;
    thickness: number;
    topTrim: {
      height: number;
      overhang: number;
    };
  };
}

interface BaseConfig {
  width: number;
  depth: number;
  height: number;
  decorativeLines: {
    enabled: boolean;
    height: number;
    overhang: number;
  };
  columns: {
    enabled: boolean;
    count: number;
    width: number;
    depth: number;
  };
}

interface BuildingConfig {
  width: number;
  depth: number;
  floorHeight: number;
  numFloors: number;
  floors: FloorConfig[];
  base: BaseConfig;
  roof: RoofConfig;
}

const buildingConfig: BuildingConfig = {
  width: 25,
  depth: 18,
  floorHeight: 3.2,  // Adjusted for more realistic floor height
  numFloors: 12,
  floors: Array(12).fill({
    windows: {
      width: 1.8,    // Slightly narrower windows
      height: 2.2,   // Taller windows for better proportion
      spacing: 3.8,  // Adjusted spacing
      countPerWall: {
        front: 5,    // Increased window count
        side: 3
      }
    },
    divider: {
      enabled: true,
      height: 0.25,  // Slightly thicker divider
      overhang: 0.3  // More pronounced overhang
    },
    decorativeLines: true
  }),
  base: {
    width: 28,      // Slightly reduced base width
    depth: 21,      // Slightly reduced base depth
    height: 2.2,    // Increased base height
    decorativeLines: {
      enabled: true,
      height: 0.18,  // Thicker decorative lines
      overhang: 0.2
    },
    columns: {
      enabled: true,
      count: 4,
      width: 0.9,    // Slightly wider columns
      depth: 0.9
    }
  },
  roof: {
    width: 21.25,  // width * 0.85
    depth: 15.3,   // depth * 0.85
    height: 2.5,
    trim: {
      height: 0.3,
      overhang: 0.25
    },
    tower: {
      base: {
        width: 8,
        depth: 8,
        height: 1
      },
      main: {
        width: 6,
        depth: 6,
        height: 4
      },
      top: {
        width: 7,
        depth: 7,
        height: 1.5
      },
      spire: {
        width: 2,
        depth: 2,
        height: 2
      }
    },
    parapet: {
      height: 1.2,
      thickness: 0.15,
      topTrim: {
        height: 0.3,
        overhang: 0.15
      }
    }
  }
};

const roofWidth = buildingConfig.width * 0.85;
const roofDepth = buildingConfig.depth * 0.85;

// Configuration already defined above

const BuildingScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup with optimized viewing angle
    const camera = new THREE.PerspectiveCamera(
      45,                                    // Narrower FOV for more natural perspective
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(-40, 50, 65);       // Adjusted position for better building overview
    camera.lookAt(0, 25, 0);                // Looking at building center, slightly higher

    // Enhanced renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true                           // Enable transparency
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Sharper rendering
    mountRef.current.appendChild(renderer.domElement);

    // Refined controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;          // Smooth camera movement
    controls.minDistance = 35;              // Keep camera from getting too close
    controls.maxDistance = 120;             // Allow slightly more zoom out
    controls.maxPolarAngle = Math.PI / 2;   // Prevent camera from going below ground
    controls.minPolarAngle = Math.PI / 6;   // Prevent top-down view
    controls.target.set(0, 25, 0);          // Orbit around building center
    controls.update();

    // Enhanced lighting setup for better line visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main directional light from front-top-left
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(-35, 55, 35);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Secondary light from back-top-right for rim lighting
    const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.4);
    secondaryLight.position.set(35, 55, -35);
    scene.add(secondaryLight);

    // Fill light from front-bottom for detail visibility
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(0, 15, 40);
    scene.add(fillLight);

    // Building creation
    const { width, depth, floorHeight, numFloors } = buildingConfig;

    // Create enhanced base structure
    const { base } = buildingConfig;
    
    // Main base platform (bottom layer)
    const baseGeometry = new THREE.BoxGeometry(base.width, base.height, base.depth);
    const baseEdges = new THREE.EdgesGeometry(baseGeometry);
    const baseLine = new THREE.LineSegments(
      baseEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    baseLine.position.y = -base.height / 2;
    scene.add(baseLine);

    // Middle layer (slightly smaller)
    const middleLayerGeometry = new THREE.BoxGeometry(
      base.width - 1,
      base.height * 0.3,
      base.depth - 1
    );
    const middleLayerEdges = new THREE.EdgesGeometry(middleLayerGeometry);
    const middleLayerLine = new THREE.LineSegments(
      middleLayerEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    middleLayerLine.position.y = 0;
    scene.add(middleLayerLine);

    // Top decorative trim
    const topTrimGeometry = new THREE.BoxGeometry(
      base.width - 2,
      base.height * 0.2,
      base.depth - 2
    );
    const topTrimEdges = new THREE.EdgesGeometry(topTrimGeometry);
    const topTrimLine = new THREE.LineSegments(
      topTrimEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    topTrimLine.position.y = base.height * 0.25;
    scene.add(topTrimLine);

    // Enhanced columns with decorative elements
    if (base.columns.enabled) {
      const { count, width, depth } = base.columns;
      
      // Column base geometry (wider than column)
      const columnBaseGeometry = new THREE.BoxGeometry(
        width * 1.2,
        base.height * 0.2,
        depth * 1.2
      );
      const columnBaseEdges = new THREE.EdgesGeometry(columnBaseGeometry);
      
      // Column top geometry (decorative capital)
      const columnTopGeometry = new THREE.BoxGeometry(
        width * 1.3,
        base.height * 0.3,
        depth * 1.3
      );
      const columnTopEdges = new THREE.EdgesGeometry(columnTopGeometry);
      
      // Main column geometry
      const columnGeometry = new THREE.BoxGeometry(
        width,
        base.height * 0.8,
        depth
      );
      const columnEdges = new THREE.EdgesGeometry(columnGeometry);
      
      // Create columns on all sides
      for (let side = 0; side < 4; side++) {
        const isXAxis = side % 2 === 0;
        const isPositive = side < 2;
        const count = isXAxis ? base.columns.count : Math.floor(base.columns.count * 0.75);
        const totalLength = isXAxis ? base.width : base.depth;
        const spacing = (totalLength - width) / (count - 1);
        
        for (let i = 0; i < count; i++) {
          const pos = -totalLength/2 + i * spacing;
          
          // Column base
          const columnBase = new THREE.LineSegments(
            columnBaseEdges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          
          // Main column
          const column = new THREE.LineSegments(
            columnEdges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          
          // Column top
          const columnTop = new THREE.LineSegments(
            columnTopEdges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          
          // Position the column parts
          const xPos = isXAxis ? pos : (isPositive ? base.width/2 : -base.width/2);
          const zPos = isXAxis ? (isPositive ? base.depth/2 : -base.depth/2) : pos;
          
          columnBase.position.set(xPos, -base.height * 0.4, zPos);
          column.position.set(xPos, -base.height * 0.1, zPos);
          columnTop.position.set(xPos, base.height * 0.2, zPos);
          
          scene.add(columnBase);
          scene.add(column);
          scene.add(columnTop);
        }
      }
    }

    // Decorative corner elements
    const cornerSize = base.columns.width * 1.5;
    const cornerGeometry = new THREE.BoxGeometry(cornerSize, base.height * 0.9, cornerSize);
    const cornerEdges = new THREE.EdgesGeometry(cornerGeometry);
    
    // Add corners
    for (let i = 0; i < 4; i++) {
      const corner = new THREE.LineSegments(
        cornerEdges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      const xSign = i % 2 === 0 ? 1 : -1;
      const zSign = i < 2 ? 1 : -1;
      corner.position.set(
        xSign * (base.width/2 - cornerSize/2),
        -base.height * 0.05,
        zSign * (base.depth/2 - cornerSize/2)
      );
      scene.add(corner);
    }


    // Create floors and windows
    for (let i = 0; i < buildingConfig.numFloors; i++) {
      const floorConfig = buildingConfig.floors[i];
      const { windows, divider } = floorConfig;

      // Create floor body
      const geometry = new THREE.BoxGeometry(buildingConfig.width, buildingConfig.floorHeight, buildingConfig.depth);
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      line.position.y = i * buildingConfig.floorHeight;
      scene.add(line);

      // Front and back windows with frames
      for (let j = 0; j < windows.countPerWall.front; j++) {
        // Window frame (outer)
        const frameGeometry = new THREE.BoxGeometry(windows.width + 0.2, windows.height + 0.2, 0.1);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);
        const frameLine = new THREE.LineSegments(
          frameEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        
        // Window panes (inner divisions)
        const paneGeometry = new THREE.BoxGeometry(windows.width, windows.height, 0.05);
        const paneEdges = new THREE.EdgesGeometry(paneGeometry);
        const paneLine = new THREE.LineSegments(
          paneEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        // Vertical divider
        const verticalDividerGeometry = new THREE.BoxGeometry(0.05, windows.height, 0.05);
        const verticalDividerEdges = new THREE.EdgesGeometry(verticalDividerGeometry);
        const verticalDividerLine = new THREE.LineSegments(
          verticalDividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        // Horizontal divider
        const horizontalDividerGeometry = new THREE.BoxGeometry(windows.width, 0.05, 0.05);
        const horizontalDividerEdges = new THREE.EdgesGeometry(horizontalDividerGeometry);
        const horizontalDividerLine = new THREE.LineSegments(
          horizontalDividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        // Position all window components
        const windowX = -buildingConfig.width/2 + windows.spacing + j * (windows.width + windows.spacing);
        const windowY = i * buildingConfig.floorHeight + windows.height/2;
        const windowZ = buildingConfig.depth/2;

        frameLine.position.set(windowX, windowY, windowZ);
        paneLine.position.set(windowX, windowY, windowZ);
        verticalDividerLine.position.set(windowX, windowY, windowZ);
        horizontalDividerLine.position.set(windowX, windowY, windowZ);

        scene.add(frameLine);
        scene.add(paneLine);
        scene.add(verticalDividerLine);
        scene.add(horizontalDividerLine);

        // Create back window (mirrored)
        const backFrameLine = frameLine.clone();
        const backPaneLine = paneLine.clone();
        const backVerticalDividerLine = verticalDividerLine.clone();
        const backHorizontalDividerLine = horizontalDividerLine.clone();

        backFrameLine.position.z = -buildingConfig.depth/2;
        backPaneLine.position.z = -buildingConfig.depth/2;
        backVerticalDividerLine.position.z = -buildingConfig.depth/2;
        backHorizontalDividerLine.position.z = -buildingConfig.depth/2;

        scene.add(backFrameLine);
        scene.add(backPaneLine);
        scene.add(backVerticalDividerLine);
        scene.add(backHorizontalDividerLine);
      }

      // Side windows with frames
      for (let j = 0; j < windows.countPerWall.side; j++) {
        // Window frame (outer)
        const frameGeometry = new THREE.BoxGeometry(0.1, windows.height + 0.2, windows.width + 0.2);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);
        const frameLine = new THREE.LineSegments(
          frameEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        
        // Window panes (inner divisions)
        const paneGeometry = new THREE.BoxGeometry(0.05, windows.height, windows.width);
        const paneEdges = new THREE.EdgesGeometry(paneGeometry);
        const paneLine = new THREE.LineSegments(
          paneEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        // Vertical divider
        const verticalDividerGeometry = new THREE.BoxGeometry(0.05, windows.height, 0.05);
        const verticalDividerEdges = new THREE.EdgesGeometry(verticalDividerGeometry);
        const verticalDividerLine = new THREE.LineSegments(
          verticalDividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        // Horizontal divider
        const horizontalDividerGeometry = new THREE.BoxGeometry(0.05, 0.05, windows.width);
        const horizontalDividerEdges = new THREE.EdgesGeometry(horizontalDividerGeometry);
        const horizontalDividerLine = new THREE.LineSegments(
          horizontalDividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        // Position all window components
        const windowX = -buildingConfig.width/2;
        const windowY = i * buildingConfig.floorHeight + windows.height/2;
        const windowZ = -buildingConfig.depth/2 + windows.spacing + j * (windows.width + windows.spacing);

        frameLine.position.set(windowX, windowY, windowZ);
        paneLine.position.set(windowX, windowY, windowZ);
        verticalDividerLine.position.set(windowX, windowY, windowZ);
        horizontalDividerLine.position.set(windowX, windowY, windowZ);

        scene.add(frameLine);
        scene.add(paneLine);
        scene.add(verticalDividerLine);
        scene.add(horizontalDividerLine);

        // Create right window (mirrored)
        const rightFrameLine = frameLine.clone();
        const rightPaneLine = paneLine.clone();
        const rightVerticalDividerLine = verticalDividerLine.clone();
        const rightHorizontalDividerLine = horizontalDividerLine.clone();

        rightFrameLine.position.x = buildingConfig.width/2;
        rightPaneLine.position.x = buildingConfig.width/2;
        rightVerticalDividerLine.position.x = buildingConfig.width/2;
        rightHorizontalDividerLine.position.x = buildingConfig.width/2;

        scene.add(rightFrameLine);
        scene.add(rightPaneLine);
        scene.add(rightVerticalDividerLine);
        scene.add(rightHorizontalDividerLine);
      }

      // Floor divider with decorative elements
      if (i < buildingConfig.numFloors - 1 && divider.enabled) {
        // Main divider
        const dividerGeometry = new THREE.BoxGeometry(
          buildingConfig.width + divider.overhang * 2,
          divider.height,
          buildingConfig.depth + divider.overhang * 2
        );
        const dividerEdges = new THREE.EdgesGeometry(dividerGeometry);
        const dividerLine = new THREE.LineSegments(
          dividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        dividerLine.position.y = (i + 1) * buildingConfig.floorHeight;
        scene.add(dividerLine);

        // Upper decorative line
        const upperDividerGeometry = new THREE.BoxGeometry(
          buildingConfig.width + (divider.overhang * 1.5),
          divider.height * 0.5,
          buildingConfig.depth + (divider.overhang * 1.5)
        );
        const upperDividerEdges = new THREE.EdgesGeometry(upperDividerGeometry);
        const upperDividerLine = new THREE.LineSegments(
          upperDividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        upperDividerLine.position.y = (i + 1) * buildingConfig.floorHeight + divider.height * 1.5;
        scene.add(upperDividerLine);

        // Lower decorative line
        const lowerDividerGeometry = new THREE.BoxGeometry(
          buildingConfig.width + (divider.overhang * 1.5),
          divider.height * 0.5,
          buildingConfig.depth + (divider.overhang * 1.5)
        );
        const lowerDividerEdges = new THREE.EdgesGeometry(lowerDividerGeometry);
        const lowerDividerLine = new THREE.LineSegments(
          lowerDividerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        lowerDividerLine.position.y = (i + 1) * buildingConfig.floorHeight - divider.height * 1.5;
        scene.add(lowerDividerLine);

        // Vertical accent lines
        const accentCount = 8;
        const accentSpacing = (buildingConfig.width + divider.overhang) / (accentCount - 1);
        for (let j = 0; j < accentCount; j++) {
          const accentGeometry = new THREE.BoxGeometry(
            divider.height * 0.5,
            divider.height * 4,
            divider.height * 0.5
          );
          const accentEdges = new THREE.EdgesGeometry(accentGeometry);
          const accentLine = new THREE.LineSegments(
            accentEdges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          accentLine.position.set(
            -buildingConfig.width/2 - divider.overhang + j * accentSpacing,
            (i + 1) * buildingConfig.floorHeight,
            buildingConfig.depth/2 + divider.overhang
          );
          scene.add(accentLine);

          // Back accent
          const backAccentLine = accentLine.clone();
          backAccentLine.position.z = -buildingConfig.depth/2 - divider.overhang;
          scene.add(backAccentLine);
        }

        // Side accent lines
        const sideAccentCount = 6;
        const sideAccentSpacing = (buildingConfig.depth + divider.overhang) / (sideAccentCount - 1);
        for (let j = 0; j < sideAccentCount; j++) {
          const sideAccentGeometry = new THREE.BoxGeometry(
            divider.height * 0.5,
            divider.height * 4,
            divider.height * 0.5
          );
          const sideAccentEdges = new THREE.EdgesGeometry(sideAccentGeometry);
          const leftAccentLine = new THREE.LineSegments(
            sideAccentEdges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          leftAccentLine.position.set(
            -buildingConfig.width/2 - divider.overhang,
            (i + 1) * buildingConfig.floorHeight,
            -buildingConfig.depth/2 - divider.overhang + j * sideAccentSpacing
          );
          scene.add(leftAccentLine);

          // Right accent
          const rightAccentLine = leftAccentLine.clone();
          rightAccentLine.position.x = buildingConfig.width/2 + divider.overhang;
          scene.add(rightAccentLine);
        }
      }
    }

    // Create roof
    const { roof } = buildingConfig;
    const roofBaseY = buildingConfig.numFloors * buildingConfig.floorHeight;
    
    // Main roof platform
    const roofGeometry = new THREE.BoxGeometry(roof.width, roof.height, roof.depth);
    const roofEdges = new THREE.EdgesGeometry(roofGeometry);
    const roofLine = new THREE.LineSegments(
      roofEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    roofLine.position.y = roofBaseY + roof.height / 2;
    scene.add(roofLine);

    // Roof trim
    const roofTrimGeometry = new THREE.BoxGeometry(
      roof.width + roof.trim.overhang * 2,
      roof.trim.height,
      roof.depth + roof.trim.overhang * 2
    );
    const roofTrimEdges = new THREE.EdgesGeometry(roofTrimGeometry);
    const roofTrimLine = new THREE.LineSegments(
      roofTrimEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    roofTrimLine.position.y = roofBaseY + roof.height + roof.trim.height / 2;
    scene.add(roofTrimLine);

    // Tower base
    const towerBaseGeometry = new THREE.BoxGeometry(
      roof.tower.base.width,
      roof.tower.base.height,
      roof.tower.base.depth
    );
    const towerBaseEdges = new THREE.EdgesGeometry(towerBaseGeometry);
    const towerBaseLine = new THREE.LineSegments(
      towerBaseEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    towerBaseLine.position.y = roofBaseY + roof.height + roof.tower.base.height / 2;
    scene.add(towerBaseLine);

    // Tower main body
    const towerGeometry = new THREE.BoxGeometry(
      roof.tower.main.width,
      roof.tower.main.height,
      roof.tower.main.depth
    );
    const towerEdges = new THREE.EdgesGeometry(towerGeometry);
    const towerLine = new THREE.LineSegments(
      towerEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    towerLine.position.y = roofBaseY + roof.height + roof.tower.base.height + roof.tower.main.height / 2;
    scene.add(towerLine);

    // Tower top
    const towerTopGeometry = new THREE.BoxGeometry(
      roof.tower.top.width,
      roof.tower.top.height,
      roof.tower.top.depth
    );
    const towerTopEdges = new THREE.EdgesGeometry(towerTopGeometry);
    const towerTopLine = new THREE.LineSegments(
      towerTopEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    towerTopLine.position.y = roofBaseY + roof.height + roof.tower.base.height + 
                             roof.tower.main.height + roof.tower.top.height / 2;
    scene.add(towerTopLine);

    // Tower spire
    const spireGeometry = new THREE.BoxGeometry(
      roof.tower.spire.width,
      roof.tower.spire.height,
      roof.tower.spire.depth
    );
    const spireEdges = new THREE.EdgesGeometry(spireGeometry);
    const spireLine = new THREE.LineSegments(
      spireEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    spireLine.position.y = roofBaseY + roof.height + roof.tower.base.height + 
                          roof.tower.main.height + roof.tower.top.height + roof.tower.spire.height / 2;
    scene.add(spireLine);

    // Roof parapets (railings)
    const { parapet } = roof;
    
    // Front and back parapets
    const frontParapetGeometry = new THREE.BoxGeometry(
      roof.width,
      parapet.height,
      parapet.thickness
    );
    const frontParapetEdges = new THREE.EdgesGeometry(frontParapetGeometry);
    const frontParapetLine = new THREE.LineSegments(
      frontParapetEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    frontParapetLine.position.y = roofBaseY + roof.height + parapet.height / 2;
    frontParapetLine.position.z = roof.depth / 2;
    scene.add(frontParapetLine);


    // Front parapet top trim
    const frontParapetTopGeometry = new THREE.BoxGeometry(
      roof.width + parapet.topTrim.overhang * 2,
      parapet.topTrim.height,
      parapet.thickness + parapet.topTrim.overhang * 2
    );
    const frontParapetTopEdges = new THREE.EdgesGeometry(frontParapetTopGeometry);
    const frontParapetTopLine = new THREE.LineSegments(
      frontParapetTopEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    frontParapetTopLine.position.y = roofBaseY + roof.height + parapet.height + parapet.topTrim.height / 2;
    frontParapetTopLine.position.z = roof.depth / 2;
    scene.add(frontParapetTopLine);

    // Back parapet (mirrored from front)
    const backParapetLine = frontParapetLine.clone();
    backParapetLine.position.z = -roof.depth / 2;
    scene.add(backParapetLine);

    const backParapetTopLine = frontParapetTopLine.clone();
    backParapetTopLine.position.z = -roof.depth / 2;
    scene.add(backParapetTopLine);

    // Side parapets
    const sideParapetGeometry = new THREE.BoxGeometry(
      parapet.thickness,
      parapet.height,
      roof.depth
    );
    const sideParapetEdges = new THREE.EdgesGeometry(sideParapetGeometry);
    const leftParapetLine = new THREE.LineSegments(
      sideParapetEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    leftParapetLine.position.y = roofBaseY + roof.height + parapet.height / 2;
    leftParapetLine.position.x = roof.width / 2;
    scene.add(leftParapetLine);

    // Side parapet top trim
    const sideParapetTopGeometry = new THREE.BoxGeometry(
      parapet.thickness + parapet.topTrim.overhang * 2,
      parapet.topTrim.height,
      roof.depth + parapet.topTrim.overhang * 2
    );
    const sideParapetTopEdges = new THREE.EdgesGeometry(sideParapetTopGeometry);
    const leftParapetTopLine = new THREE.LineSegments(
      sideParapetTopEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    leftParapetTopLine.position.y = roofBaseY + roof.height + parapet.height + parapet.topTrim.height / 2;
    leftParapetTopLine.position.x = roof.width / 2;
    scene.add(leftParapetTopLine);

    // Right parapet (mirrored from left)
    const rightParapetLine = leftParapetLine.clone();
    rightParapetLine.position.x = -roof.width / 2;
    scene.add(rightParapetLine);

    const rightParapetTopLine = leftParapetTopLine.clone();
    rightParapetTopLine.position.x = -roof.width / 2;
    scene.add(rightParapetTopLine);
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default BuildingScene;
