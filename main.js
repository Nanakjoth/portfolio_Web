// Assumes THREE is loaded globally via <script> in index.html.
// If OrbitControls is needed, load via <script> in index.html.
// If EffectComposer is needed, load via <script> in index.html.
// If RenderPass is needed, load via <script> in index.html.
// If UnrealBloomPass is needed, load via <script> in index.html.
// If ShaderPass is needed, load via <script> in index.html.

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Dark blue instead of black

// Create massive 3D environment
const createMassiveEnvironment = () => {
    const group = new THREE.Group();
    
    // Create a giant digital sphere world
    const createDigitalWorld = () => {
        const worldGroup = new THREE.Group();
        
        // Outer sphere - digital universe
        const sphereGeometry = new THREE.SphereGeometry(100, 64, 64);
        const sphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                float hexDist(vec2 p) {
                    p = abs(p);
                    float c = dot(p, normalize(vec2(1.0, 1.73)));
                    c = max(c, p.x);
                    return c;
                }
                
                vec4 hexCoords(vec2 uv) {
                    vec2 r = vec2(1.0, 1.73);
                    vec2 h = r * 0.5;
                    vec2 a = mod(uv, r) - h;
                    vec2 b = mod(uv - h, r) - h;
                    
                    vec2 gv;
                    if (length(a) < length(b)) {
                        gv = a;
                    } else {
                        gv = b;
                    }
                    
                    float x = atan(gv.x, gv.y);
                    float y = 0.5 - hexDist(gv);
                    vec2 id = uv - gv;
                    return vec4(x, y, id.x, id.y);
                }
                
                void main() {
                    vec2 uv = vUv * 40.0;
                    
                    // Create grid pattern
                    vec4 hc = hexCoords(uv);
                    float c = smoothstep(0.0, 0.1, hc.y);
                    
                    // Add color
                    vec3 col = mix(
                        vec3(0.0, 0.1, 0.2),
                        vec3(0.0, 0.5, 1.0),
                        c
                    );
                    
                    // Add glow
                    float pulse = sin(time * 0.5 + hc.z * 0.5 + hc.w * 0.5) * 0.5 + 0.5;
                    col += vec3(0.0, 0.2, 0.5) * pulse * (1.0 - c) * 0.5;
                    
                    // Add atmosphere
                    float atmosphere = 1.0 - abs(vPosition.y) / 100.0;
                    col += vec3(0.0, 0.2, 0.4) * atmosphere * 0.5;
                    
                    gl_FragColor = vec4(col, 0.3);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        worldGroup.add(sphere);
        
        // Add floating islands
        const islandCount = 7;
        for (let i = 0; i < islandCount; i++) {
            const islandGroup = new THREE.Group();
            
            // Base platform
            const platformGeometry = new THREE.CylinderGeometry(
                3 + Math.random() * 5,
                5 + Math.random() * 7,
                1 + Math.random() * 2,
                6
            );
            const platformMaterial = new THREE.MeshPhongMaterial({
                color: 0x0088ff,
                emissive: 0x0044aa,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9,
                flatShading: true
            });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            islandGroup.add(platform);
            
            // Add structures on top
            const structureCount = 3 + Math.floor(Math.random() * 5);
            for (let j = 0; j < structureCount; j++) {
                const height = 2 + Math.random() * 6;
                const width = 0.5 + Math.random() * 1.5;
                
                const structureGeometry = new THREE.BoxGeometry(width, height, width);
                const structureMaterial = new THREE.MeshPhongMaterial({
                    color: 0x00aaff,
                    emissive: 0x0066cc,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                });
                
                const structure = new THREE.Mesh(structureGeometry, structureMaterial);
                
                // Position on the platform
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * (platformGeometry.parameters.radiusTop - width);
                
                structure.position.x = Math.cos(angle) * radius;
                structure.position.z = Math.sin(angle) * radius;
                structure.position.y = platformGeometry.parameters.height / 2 + height / 2;
                
                // Random rotation
                structure.rotation.y = Math.random() * Math.PI * 2;
                
                islandGroup.add(structure);
            }
            
            // Add connection beams between islands
            if (i > 0) {
                const prevIsland = worldGroup.children[i];
                if (prevIsland && prevIsland.position) {
                    const start = new THREE.Vector3();
                    const end = islandGroup.position.clone();
                    
                    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                    midPoint.y -= 5; // Curve downward
                    
                    // Create curved path
                    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
                    const points = curve.getPoints(20);
                    
                    const beamGeometry = new THREE.TubeGeometry(
                        new THREE.CatmullRomCurve3(points),
                        20,
                        0.2,
                        8,
                        false
                    );
                    
                    const beamMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.6
                    });
                    
                    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                    worldGroup.add(beam);
                }
            }
            
            // Position the island
            const distance = 30 + Math.random() * 40;
            const angle = (i / islandCount) * Math.PI * 2;
            const height = -20 + Math.random() * 40;
            
            islandGroup.position.x = Math.cos(angle) * distance;
            islandGroup.position.z = Math.sin(angle) * distance;
            islandGroup.position.y = height;
            
            // Random rotation
            islandGroup.rotation.y = Math.random() * Math.PI * 2;
            
            // Add animation data
            islandGroup.userData = {
                originalY: islandGroup.position.y,
                floatSpeed: 0.2 + Math.random() * 0.3,
                floatAmplitude: 1 + Math.random() * 2,
                rotationSpeed: 0.001 * (Math.random() > 0.5 ? 1 : -1)
            };
            
            worldGroup.add(islandGroup);
        }
        
        // Add central massive structure
        const centralStructure = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(10, 15, 5, 6);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x0066cc,
            emissive: 0x003366,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        centralStructure.add(base);
        
        // Central tower
        const towerGeometry = new THREE.CylinderGeometry(2, 5, 20, 6);
        const towerMaterial = new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            emissive: 0x0066cc,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.9
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = baseGeometry.parameters.height / 2 + towerGeometry.parameters.height / 2;
        centralStructure.add(tower);
        
        // Energy core
        const coreGeometry = new THREE.SphereGeometry(3, 32, 32);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = tower.position.y + 5;
        centralStructure.add(core);
        
        // Add rings around the core
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.TorusGeometry(5 + i * 2, 0.2, 16, 50);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7 - i * 0.15
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = core.position.y;
            ring.rotation.x = Math.PI / 2;
            
            // Add rotation data
            ring.userData = {
                rotationSpeed: 0.01 - i * 0.002,
                rotationAxis: new THREE.Vector3(
                    Math.random() * 0.2,
                    1,
                    Math.random() * 0.2
                ).normalize()
            };
            
            centralStructure.add(ring);
        }
        
        // Add energy beams from core to islands
        for (let i = 1; i < worldGroup.children.length; i++) {
            const child = worldGroup.children[i];
            if (child.type === 'Group' && child !== centralStructure) {
                const start = new THREE.Vector3(0, core.position.y, 0);
                const end = child.position.clone();
                
                const points = [start, end];
                const beamGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const beamMaterial = new THREE.LineBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.5
                });
                
                const beam = new THREE.Line(beamGeometry, beamMaterial);
                centralStructure.add(beam);
            }
        }
        
        centralStructure.position.y = 0;
        centralStructure.userData = {
            rotationSpeed: 0.001
        };
        
        worldGroup.add(centralStructure);
        
        return worldGroup;
    };
    
    const digitalWorld = createDigitalWorld();
    group.add(digitalWorld);
    
    return {
        group,
        digitalWorld
    };
};

// Add massive environment to scene
const environment = createMassiveEnvironment();
scene.add(environment.group);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  // strength
    0.4,  // radius
    0.85  // threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Custom shader for color correction
const colorCorrectionShader = {
    uniforms: {
        tDiffuse: { value: null },
        brightness: { value: 0.05 },
        contrast: { value: 1.2 },
        saturation: { value: 1.2 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Brightness
            color.rgb += brightness;
            
            // Contrast
            color.rgb = (color.rgb - 0.5) * contrast + 0.5;
            
            // Saturation
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(vec3(luminance), color.rgb, saturation);
            
            gl_FragColor = color;
        }
    `
};

const colorCorrectionPass = new ShaderPass(colorCorrectionShader);
composer.addPass(colorCorrectionPass);

// Create a simple background element
const createBackgroundElement = () => {
    // Create a large sphere for the background
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    
    // Create a gradient material
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // Create a gradient based on position
                vec3 color1 = vec3(0.0, 0.5, 1.0); // Blue
                vec3 color2 = vec3(0.8, 0.0, 1.0); // Purple
                
                // Animate the gradient
                float noise = sin(vUv.x * 10.0 + time) * sin(vUv.y * 10.0 + time) * 0.1;
                
                // Mix colors based on position and time
                float mixFactor = vUv.y + noise;
                vec3 color = mix(color1, color2, mixFactor);
                
                gl_FragColor = vec4(color, 0.5);
            }
        `,
        side: THREE.BackSide,
        transparent: true
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    return sphere;
};

// Add background element to scene
const backgroundElement = createBackgroundElement();
scene.add(backgroundElement);

// Create massive network core structure
const createNetworkCore = () => {
    const coreGroup = new THREE.Group();
    
    // Central Core
    const coreGeometry = new THREE.OctahedronGeometry(8, 3);
    const coreMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7,
        wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.x = Math.PI / 4;
    core.rotation.y = Math.PI / 4;
    coreGroup.add(core);
    
    // Energy Rings
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(12 + i * 3, 0.3, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3 - (i * 0.05)
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 2 - 4;
        coreGroup.add(ring);
    }
    
    // Radial Beams
    const beamCount = 12;
    for (let i = 0; i < beamCount; i++) {
        const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 40, 8);
        const beamMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.4
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.rotation.z = (i / beamCount) * Math.PI * 2;
        beam.position.y = -10;
        coreGroup.add(beam);
    }
    
    // Satellite Nodes
    const nodeCount = 8;
    for (let i = 0; i < nodeCount; i++) {
        const nodeGeometry = new THREE.IcosahedronGeometry(3, 1);
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        
        const angle = (i / nodeCount) * Math.PI * 2;
        const distance = 25;
        node.position.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        
        coreGroup.add(node);
    }
    
    coreGroup.position.set(0, 0, -30); // Move closer to camera
    coreGroup.userData = {
        rotationSpeed: 0.001
    };
    
    return coreGroup;
};

// Add network core to scene
const networkCore = createNetworkCore();
scene.add(networkCore);

// Particle System
const createParticleSystem = () => {
    const particleCount = 5000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const colorOptions = [
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0x00ff88)  // Neon Green
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Position
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        
        // Color
        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // Size
        sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pointTexture: { value: new THREE.TextureLoader().load('https://assets.codepen.io/3685267/spark1.png') }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                vec3 pos = position;
                
                // Add some animation
                pos.y += sin(time * 0.2 + position.x * 0.05) * 0.5;
                pos.x += cos(time * 0.2 + position.z * 0.05) * 0.5;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            
            void main() {
                gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
    });
    
    return new THREE.Points(particles, particleMaterial);
};

// Holographic Grid
const createHolographicGrid = () => {
    const size = 100;
    const divisions = 50;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x00ffff, 0x00ffff);
    gridHelper.position.y = -20;
    
    // Make grid lines glow
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    
    return gridHelper;
};

// Energy Waves
const createEnergyWaves = () => {
    const group = new THREE.Group();
    const waveCount = 3;
    
    for (let i = 0; i < waveCount; i++) {
        const geometry = new THREE.TorusGeometry(10 + i * 5, 0.2, 16, 100);
        const material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(0x00ffff),
            transparent: true,
            opacity: 0.5 - (i * 0.1)
        });
        const wave = new THREE.Mesh(geometry, material);
        wave.rotation.x = Math.PI / 2;
        wave.userData = { speed: 0.01 - (i * 0.002) };
        group.add(wave);
    }
    
    return group;
};

// Floating Holograms
const createFloatingHolograms = () => {
    const group = new THREE.Group();
    const count = 5;
    const shapes = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1),
        new THREE.OctahedronGeometry(1)
    ];
    
    for (let i = 0; i < count; i++) {
        const geometry = shapes[Math.floor(Math.random() * shapes.length)];
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        
        const hologram = new THREE.Mesh(geometry, material);
        hologram.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 20 + 10,
            (Math.random() - 0.5) * 40
        );
        hologram.scale.set(
            Math.random() * 2 + 1,
            Math.random() * 2 + 1,
            Math.random() * 2 + 1
        );
        hologram.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            floatSpeed: Math.random() * 0.01 + 0.005
        };
        
        group.add(hologram);
    }
    
    return group;
};

// Data Stream
const createDataStream = () => {
    const group = new THREE.Group();
    const streamCount = 10;
    
    for (let i = 0; i < streamCount; i++) {
        const points = [];
        const segments = 20;
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-30, 0, (Math.random() - 0.5) * 30),
            new THREE.Vector3(-10, 10, (Math.random() - 0.5) * 20),
            new THREE.Vector3(10, -10, (Math.random() - 0.5) * 20),
            new THREE.Vector3(30, 0, (Math.random() - 0.5) * 30)
        );
        
        const curvePoints = curve.getPoints(segments);
        const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6
        });
        
        const line = new THREE.Line(geometry, material);
        
        // Add data packets
        const packetCount = 5;
        for (let j = 0; j < packetCount; j++) {
            const packetGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const packetMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            });
            
            const packet = new THREE.Mesh(packetGeometry, packetMaterial);
            packet.userData = {
                progress: Math.random(),
                speed: 0.005 + Math.random() * 0.01
            };
            
            group.add(packet);
            line.userData = { curve, packets: [] };
            line.userData.packets.push(packet);
        }
        
        group.add(line);
    }
    
    return group;
};

// Create static 3D elements representing skills
const createStaticSkillElements = () => {
    const group = new THREE.Group();
    
    // Network Node Hologram
    const createNetworkNode = () => {
        const nodeGroup = new THREE.Group();
        
        // Central sphere
        const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        nodeGroup.add(sphere);
        
        // Connection lines
        const connectionCount = 8;
        for (let i = 0; i < connectionCount; i++) {
            const length = 3 + Math.random() * 2;
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            const start = new THREE.Vector3(0, 0, 0);
            const end = direction.clone().multiplyScalar(length);
            
            const points = [start, end];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            nodeGroup.add(line);
            
            // Add small node at the end of each connection
            const smallSphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const smallSphereMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5
            });
            const smallSphere = new THREE.Mesh(smallSphereGeometry, smallSphereMaterial);
            smallSphere.position.copy(end);
            nodeGroup.add(smallSphere);
        }
        
        nodeGroup.position.set(-20, 5, -10);
        nodeGroup.userData = {
            rotationSpeed: 0.005,
            pulseSpeed: 0.01
        };
        
        return nodeGroup;
    };
    
    // Data Visualization Hologram
    const createDataVisualization = () => {
        const visGroup = new THREE.Group();
        
        // Create bar chart
        const barCount = 7;
        const barWidth = 0.5;
        const barGap = 0.3;
        const totalWidth = barCount * (barWidth + barGap);
        
        for (let i = 0; i < barCount; i++) {
            const height = 1 + Math.random() * 4;
            const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
            const material = new THREE.MeshPhongMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            
            const bar = new THREE.Mesh(geometry, material);
            bar.position.x = (i * (barWidth + barGap)) - (totalWidth / 2);
            bar.position.y = height / 2;
            bar.userData = {
                originalHeight: height,
                animationOffset: Math.random() * Math.PI * 2
            };
            
            visGroup.add(bar);
        }
        
        // Add scatter plot points
        const pointCount = 20;
        const pointGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        
        for (let i = 0; i < pointCount; i++) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.5
            });
            
            const point = new THREE.Mesh(pointGeometry, material);
            point.position.set(
                (Math.random() - 0.5) * 6,
                3 + (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 6
            );
            
            visGroup.add(point);
        }
        
        // Add circular axis
        const axisGeometry = new THREE.TorusGeometry(3, 0.05, 16, 50);
        const axisMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5
        });
        const axis = new THREE.Mesh(axisGeometry, axisMaterial);
        axis.rotation.x = Math.PI / 2;
        axis.position.y = 3;
        visGroup.add(axis);
        
        visGroup.position.set(20, 5, -10);
        visGroup.userData = {
            rotationSpeed: 0.005
        };
        
        return visGroup;
    };
    
    // Create Cloud Infrastructure Hologram
    const createCloudInfrastructure = () => {
        const cloudGroup = new THREE.Group();
        
        // Main cloud platform
        const platformGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 32);
        const platformMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.5
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        cloudGroup.add(platform);
        
        // Add server racks
        const rackCount = 5;
        const rackGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
        const rackMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < rackCount; i++) {
            const rack = new THREE.Mesh(rackGeometry, rackMaterial);
            const angle = (i / rackCount) * Math.PI * 2;
            const radius = 2;
            
            rack.position.x = Math.cos(angle) * radius;
            rack.position.z = Math.sin(angle) * radius;
            rack.position.y = 1;
            rack.rotation.y = -angle;
            
            cloudGroup.add(rack);
            
            // Add connection lines to the center
            const points = [
                new THREE.Vector3(rack.position.x, 0.5, rack.position.z),
                new THREE.Vector3(0, 0.5, 0)
            ];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            cloudGroup.add(line);
        }
        
        // Add floating data symbols
        const symbolCount = 10;
        const symbols = [
            new THREE.OctahedronGeometry(0.3),
            new THREE.TetrahedronGeometry(0.3),
            new THREE.IcosahedronGeometry(0.3, 0)
        ];
        
        for (let i = 0; i < symbolCount; i++) {
            const geometry = symbols[Math.floor(Math.random() * symbols.length)];
            const material = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.7,
                wireframe: true
            });
            
            const symbol = new THREE.Mesh(geometry, material);
            const angle = Math.random() * Math.PI * 2;
            const radius = 3 + Math.random();
            
            symbol.position.x = Math.cos(angle) * radius;
            symbol.position.z = Math.sin(angle) * radius;
            symbol.position.y = 2 + Math.random() * 2;
            
            symbol.userData = {
                floatSpeed: 0.005 + Math.random() * 0.01,
                floatOffset: Math.random() * Math.PI * 2,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                }
            };
            
            cloudGroup.add(symbol);
        }
        
        cloudGroup.position.set(0, 15, -20);
        cloudGroup.userData = {
            rotationSpeed: 0.002
        };
        
        return cloudGroup;
    };
    
    const networkNode = createNetworkNode();
    const dataVisualization = createDataVisualization();
    const cloudInfrastructure = createCloudInfrastructure();
    
    group.add(networkNode);
    group.add(dataVisualization);
    group.add(cloudInfrastructure);
    
    return {
        group,
        networkNode,
        dataVisualization,
        cloudInfrastructure
    };
};

// Create floating 3D elements
const createFloatingElements = () => {
    const group = new THREE.Group();
    
    // Create floating geometric shapes
    const createFloatingShapes = () => {
        const shapesGroup = new THREE.Group();
        
        // Different geometric shapes
        const geometries = [
            new THREE.IcosahedronGeometry(1, 0),  // Low poly sphere
            new THREE.TetrahedronGeometry(1),     // Pyramid
            new THREE.OctahedronGeometry(1),      // Diamond
            new THREE.TorusGeometry(1, 0.3, 16, 32), // Donut
            new THREE.BoxGeometry(1, 1, 1)        // Cube
        ];
        
        // Create 20 random shapes
        for (let i = 0; i < 20; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            
            // Create glowing material
            const color = new THREE.Color();
            color.setHSL(Math.random(), 0.8, 0.6); // Random hue, high saturation
            
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.7,
                shininess: 100
            });
            
            const shape = new THREE.Mesh(geometry, material);
            
            // Random position within a sphere
            const radius = 20 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            shape.position.x = radius * Math.sin(phi) * Math.cos(theta);
            shape.position.y = radius * Math.sin(phi) * Math.sin(theta);
            shape.position.z = radius * Math.cos(phi);
            
            // Random rotation
            shape.rotation.x = Math.random() * Math.PI * 2;
            shape.rotation.y = Math.random() * Math.PI * 2;
            shape.rotation.z = Math.random() * Math.PI * 2;
            
            // Random scale
            const scale = 0.5 + Math.random() * 2;
            shape.scale.set(scale, scale, scale);
            
            // Animation data
            shape.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
                },
                floatSpeed: 0.001 + Math.random() * 0.003,
                floatDistance: 0.5 + Math.random() * 1.5,
                originalPosition: shape.position.clone(),
                timeOffset: Math.random() * Math.PI * 2
            };
            
            shapesGroup.add(shape);
        }
        
        return shapesGroup;
    };
    
    // Create floating network connections
    const createNetworkConnections = () => {
        const connectionsGroup = new THREE.Group();
        const nodeCount = 15;
        const nodes = [];
        
        // Create nodes
        for (let i = 0; i < nodeCount; i++) {
            const geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.7
            });
            
            const node = new THREE.Mesh(geometry, material);
            
            // Random position
            const radius = 20 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            node.position.x = radius * Math.sin(phi) * Math.cos(theta);
            node.position.y = radius * Math.sin(phi) * Math.sin(theta);
            node.position.z = radius * Math.cos(phi);
            
            // Animation data
            node.userData = {
                floatSpeed: 0.001 + Math.random() * 0.002,
                floatDistance: 0.3 + Math.random() * 1,
                originalPosition: node.position.clone(),
                timeOffset: Math.random() * Math.PI * 2
            };
            
            nodes.push(node);
            connectionsGroup.add(node);
        }
        
        // Create connections between nodes
        for (let i = 0; i < nodeCount; i++) {
            // Connect to 2-3 other nodes
            const connectionCount = 2 + Math.floor(Math.random() * 2);
            
            for (let j = 0; j < connectionCount; j++) {
                // Find a random node to connect to
                const targetIndex = Math.floor(Math.random() * nodeCount);
                if (targetIndex !== i) {
                    const start = nodes[i].position;
                    const end = nodes[targetIndex].position;
                    
                    // Create line geometry
                    const points = [start, end];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    
                    // Create glowing line material
                    const material = new THREE.LineBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.3
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    line.userData = {
                        startNode: i,
                        endNode: targetIndex
                    };
                    
                    connectionsGroup.add(line);
                }
            }
        }
        
        return connectionsGroup;
    };
    
    // Create data flow particles
    const createDataFlowParticles = () => {
        const particlesGroup = new THREE.Group();
        
        // Create a particle system for data flow
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within a sphere
            const radius = 15 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random color (blue to purple gradient)
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.1, 0.8, 0.6);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(particles, material);
        particleSystem.userData = {
            rotationSpeed: 0.0005
        };
        
        particlesGroup.add(particleSystem);
        return particlesGroup;
    };
    
    const shapes = createFloatingShapes();
    const connections = createNetworkConnections();
    const dataFlow = createDataFlowParticles();
    
    group.add(shapes);
    group.add(connections);
    group.add(dataFlow);
    
    return {
        group,
        shapes,
        connections,
        dataFlow
    };
};

// Add floating elements to scene
const floatingElements = createFloatingElements();
scene.add(floatingElements.group);

// Add elements to scene
const particles = createParticleSystem();
scene.add(particles);

const grid = createHolographicGrid();
scene.add(grid);

const energyWaves = createEnergyWaves();
scene.add(energyWaves);

const holograms = createFloatingHolograms();
scene.add(holograms);

const dataStream = createDataStream();
scene.add(dataStream);

const staticElements = createStaticSkillElements();
scene.add(staticElements.group);

// Create a network animation background
const createNetworkBackground = () => {
    const group = new THREE.Group();
    
    // Create nodes
    const nodeCount = 100;
    const nodes = [];
    const nodePositions = [];
    const nodeColors = [];
    
    // Define color palette similar to the image
    const colors = [
        new THREE.Color(0xff5500), // Orange
        new THREE.Color(0x00ccff), // Cyan
        new THREE.Color(0xffffff)  // White
    ];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        // Create node geometry
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        
        // Random color from palette
        const colorIndex = Math.floor(Math.random() * colors.length);
        const color = colors[colorIndex];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const node = new THREE.Mesh(geometry, material);
        
        // Position within a flat plane but with some depth
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 30;
        
        node.position.set(x, y, z);
        
        // Store position for connections
        nodePositions.push(new THREE.Vector3(x, y, z));
        nodeColors.push(color);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        node.add(glow);
        
        nodes.push(node);
        group.add(node);
    }
    
    // Create connections between nodes
    const connections = [];
    const maxDistance = 20; // Maximum distance for connection
    
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const distance = nodePositions[i].distanceTo(nodePositions[j]);
            
            if (distance < maxDistance) {
                // Create line geometry
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    nodePositions[i],
                    nodePositions[j]
                ]);
                
                // Mix colors of connected nodes
                const color1 = nodeColors[i];
                const color2 = nodeColors[j];
                const mixedColor = new THREE.Color(
                    (color1.r + color2.r) / 2,
                    (color1.g + color2.g) / 2,
                    (color1.b + color2.b) / 2
                );
                
                // Line opacity based on distance
                const opacity = 1 - (distance / maxDistance);
                
                const material = new THREE.LineBasicMaterial({
                    color: mixedColor,
                    transparent: true,
                    opacity: opacity * 0.5
                });
                
                const line = new THREE.Line(geometry, material);
                connections.push({
                    line: line,
                    node1: i,
                    node2: j,
                    initialOpacity: opacity * 0.5
                });
                
                group.add(line);
            }
        }
    }
    
    // Position the entire network
    group.position.z = -40;
    
    // Animation data
    group.userData = {
        nodes: nodes,
        connections: connections,
        nodePositions: nodePositions,
        rotationSpeed: 0.0005
    };
    
    return group;
};

// Add network background to scene
const networkBackground = createNetworkBackground();
scene.add(networkBackground);

// Create large background sphere with grid pattern
const createGridSphere = () => {
    const geometry = new THREE.SphereGeometry(80, 64, 64);
    
    // Create shader material with grid pattern
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            float grid(vec2 uv, float size) {
                vec2 grid = fract(uv * size);
                return (step(0.98, grid.x) + step(0.98, grid.y)) * 0.5;
            }
            
            void main() {
                // Create base colors - blue/purple gradient
                vec3 baseColor = mix(
                    vec3(0.0, 0.1, 0.3),  // Dark blue
                    vec3(0.4, 0.0, 0.6),  // Purple
                    vUv.y
                );
                
                // Add grid effect
                float gridSmall = grid(vUv, 40.0);
                float gridMedium = grid(vUv, 10.0) * 0.5;
                float gridLarge = grid(vUv, 5.0) * 0.25;
                
                // Add glowing effect
                float glowY = sin(vUv.y * 20.0 + time) * 0.5 + 0.5;
                float glowX = sin(vUv.x * 20.0 + time * 0.7) * 0.5 + 0.5;
                float glow = glowX * glowY * 0.25;
                
                // Combine effects
                vec3 finalColor = baseColor + vec3(0.0, 0.3, 0.6) * (gridSmall + gridMedium + gridLarge);
                finalColor += vec3(0.0, 0.5, 1.0) * glow;
                
                gl_FragColor = vec4(finalColor, 0.9);
            }
        `,
        side: THREE.BackSide,
        transparent: true
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    return sphere;
};

// Add background grid sphere
const gridSphere = createGridSphere();
scene.add(gridSphere);

// Create glowing particles
const createGlowingParticles = () => {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color1 = new THREE.Color(0x00ffff); // Cyan
    const color2 = new THREE.Color(0xff00ff); // Magenta
    const color3 = new THREE.Color(0xffaa00); // Orange
    
    for (let i = 0; i < particleCount; i++) {
        // Random position within a sphere
        const radius = 5 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Random color between our three colors
        let particleColor;
        const colorChoice = Math.random();
        
        if (colorChoice < 0.33) {
            particleColor = color1;
        } else if (colorChoice < 0.66) {
            particleColor = color2;
        } else {
            particleColor = color3;
        }
        
        colors[i * 3] = particleColor.r;
        colors[i * 3 + 1] = particleColor.g;
        colors[i * 3 + 2] = particleColor.b;
        
        // Random size
        sizes[i] = 0.5 + Math.random() * 1.5;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png') }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // Add subtle animation to positions
                vec3 pos = position;
                pos.y += sin(time * 0.5 + position.x) * 0.5;
                pos.x += cos(time * 0.3 + position.z) * 0.5;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                // Size attenuation
                gl_PointSize = size * (300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            
            void main() {
                gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
    });
    
    const particles = new THREE.Points(geometry, material);
    return particles;
};

// Add glowing particles
const glowingParticles = createGlowingParticles();
scene.add(glowingParticles);

// Camera position
camera.position.z = 30;
camera.position.y = 10;
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    
    // Update shader uniforms
    if (environment.digitalWorld.children[0] && 
        environment.digitalWorld.children[0].material && 
        environment.digitalWorld.children[0].material.uniforms) {
        environment.digitalWorld.children[0].material.uniforms.time.value = time;
    }
    
    // Update background shader
    if (backgroundElement.material && backgroundElement.material.uniforms) {
        backgroundElement.material.uniforms.time.value = time;
    }
    
    // Update particle system
    if (particles.material.uniforms) {
        particles.material.uniforms.time.value = time;
    }
    
    // Update energy waves
    energyWaves.children.forEach(wave => {
        wave.scale.setScalar(1 + Math.sin(time * wave.userData.speed * 5) * 0.1);
    });
    
    // Update holograms
    holograms.children.forEach(hologram => {
        hologram.rotation.x += hologram.userData.rotationSpeed.x;
        hologram.rotation.y += hologram.userData.rotationSpeed.y;
        hologram.rotation.z += hologram.userData.rotationSpeed.z;
        
        hologram.position.y += Math.sin(time * hologram.userData.floatSpeed) * 0.05;
    });
    
    // Update data streams
    dataStream.children.forEach(child => {
        if (child instanceof THREE.Line && child.userData.curve) {
            child.userData.packets.forEach(packet => {
                packet.userData.progress += packet.userData.speed;
                if (packet.userData.progress > 1) {
                    packet.userData.progress = 0;
                }
                
                const point = child.userData.curve.getPointAt(packet.userData.progress);
                packet.position.copy(point);
            });
        }
    });
    
    // Rotate grid
    grid.rotation.y += 0.001;
    
    // Update static skill elements
    staticElements.networkNode.rotation.y += staticElements.networkNode.userData.rotationSpeed;
    staticElements.dataVisualization.rotation.y += staticElements.dataVisualization.userData.rotationSpeed;
    staticElements.cloudInfrastructure.rotation.y += staticElements.cloudInfrastructure.userData.rotationSpeed;
    
    // Update massive environment
    environment.digitalWorld.children.forEach(child => {
        if (child.userData) {
            if (child.userData.rotationSpeed) {
                child.rotation.y += child.userData.rotationSpeed;
            }
            if (child.userData.floatSpeed) {
                child.position.y = child.userData.originalY + Math.sin(time * child.userData.floatSpeed) * child.userData.floatAmplitude;
            }
            if (child.userData.rotationAxis) {
                child.rotation.x += child.userData.rotationSpeed * child.userData.rotationAxis.x;
                child.rotation.y += child.userData.rotationSpeed * child.userData.rotationAxis.y;
                child.rotation.z += child.userData.rotationSpeed * child.userData.rotationAxis.z;
            }
        }
    });
    
    // Update floating elements
    floatingElements.shapes.children.forEach(shape => {
        shape.rotation.x += shape.userData.rotationSpeed.x;
        shape.rotation.y += shape.userData.rotationSpeed.y;
        shape.rotation.z += shape.userData.rotationSpeed.z;
        
        const offset = Math.sin(time * shape.userData.floatSpeed + shape.userData.timeOffset) * shape.userData.floatDistance;
        shape.position.copy(shape.userData.originalPosition.clone().add(new THREE.Vector3(0, offset, 0)));
    });
    
    floatingElements.connections.children.forEach(node => {
        if (node.userData) {
            const offset = Math.sin(time * node.userData.floatSpeed + node.userData.timeOffset) * node.userData.floatDistance;
            node.position.copy(node.userData.originalPosition.clone().add(new THREE.Vector3(0, offset, 0)));
        }
    });
    
    floatingElements.dataFlow.children.forEach(particleSystem => {
        particleSystem.rotation.y += particleSystem.userData.rotationSpeed;
    });
    
    networkCore.rotation.y += networkCore.userData.rotationSpeed;
    networkCore.children.forEach(child => {
        if (child.userData?.rotationSpeed) {
            child.rotation.y += child.userData.rotationSpeed;
        }
    });
    
    // Animate network background
    if (networkBackground && networkBackground.userData) {
        // Rotate entire network slowly
        networkBackground.rotation.y += networkBackground.userData.rotationSpeed;
        
        // Animate nodes
        const nodes = networkBackground.userData.nodes;
        const nodePositions = networkBackground.userData.nodePositions;
        
        for (let i = 0; i < nodes.length; i++) {
            // Subtle floating movement
            nodes[i].position.y += Math.sin(time * 0.5 + i) * 0.01;
            
            // Pulse glow effect
            if (nodes[i].children[0]) {
                const scale = 1 + Math.sin(time * 2 + i) * 0.2;
                nodes[i].children[0].scale.set(scale, scale, scale);
            }
            
            // Update node position for connections
            nodePositions[i].copy(nodes[i].position);
        }
        
        // Animate connections
        const connections = networkBackground.userData.connections;
        for (let i = 0; i < connections.length; i++) {
            const conn = connections[i];
            
            // Update line positions
            const positions = conn.line.geometry.attributes.position.array;
            const node1Pos = nodePositions[conn.node1];
            const node2Pos = nodePositions[conn.node2];
            
            positions[0] = node1Pos.x;
            positions[1] = node1Pos.y;
            positions[2] = node1Pos.z;
            
            positions[3] = node2Pos.x;
            positions[4] = node2Pos.y;
            positions[5] = node2Pos.z;
            
            conn.line.geometry.attributes.position.needsUpdate = true;
            
            // Pulse opacity
            const opacityPulse = conn.initialOpacity * (0.7 + Math.sin(time * 1.5 + i) * 0.3);
            conn.line.material.opacity = opacityPulse;
        }
    }
    
    // Update grid sphere
    if (gridSphere.material.uniforms) {
        gridSphere.material.uniforms.time.value = time;
    }
    
    // Update particles
    if (glowingParticles.material.uniforms) {
        glowingParticles.material.uniforms.time.value = time;
    }
    
    controls.update();
    composer.render();
}

animate();
