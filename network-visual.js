// Network Visualization
// Create a visualization similar to the shared image with pink, blue, and purple nodes

// Import Three.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Clear any existing canvas
document.querySelectorAll('canvas.network-bg').forEach(canvas => canvas.remove());

// Create scene, camera and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // Light gray background like the image

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 40;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.classList.add('network-bg');
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1';
document.body.appendChild(renderer.domElement);

// Create post-processing for glow effect
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom effect for glow
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8, // Strength
    0.3, // Radius
    0.1  // Threshold
);
composer.addPass(bloomPass);

// Create circular network visualization
function createCircularNetwork() {
    const group = new THREE.Group();
    
    // Define color palette based on the image
    const colors = [
        new THREE.Color(0xff5b99), // Pink
        new THREE.Color(0x5b4fff), // Blue/Purple
        new THREE.Color(0x5bc2ff), // Light Blue
        new THREE.Color(0xff9d5b), // Orange (less frequent)
        new THREE.Color(0xc45bff)  // Purple
    ];
    
    // Create nodes and connections
    const nodes = [];
    const nodePositions = [];
    
    // Create 3 curved sections similar to the image
    createCurvedSection(group, colors, 0, 1, 1);    // Top left curved section
    createCurvedSection(group, colors, 1, 0.8, -1); // Bottom right curved section
    createCurvedSection(group, colors, 2, 0.5, 1);  // Small right section
    
    return group;
}

// Create a curved section of connected nodes
function createCurvedSection(parentGroup, colors, sectionType, scale, direction) {
    const group = new THREE.Group();
    
    // Number of nodes depends on section type
    const nodeCount = sectionType === 0 ? 140 : 
                      sectionType === 1 ? 120 : 80;
    
    // Create nodes
    const nodes = [];
    const nodePositions = [];
    
    // Create a curved arrangement
    for (let i = 0; i < nodeCount; i++) {
        // Create a curve pattern - different for each section
        let x, y, z;
        const t = i / nodeCount;
        
        if (sectionType === 0) {
            // Top left curved section
            const angle = (t * 2 + 0.25) * Math.PI * direction;
            const radius = 15 * scale + (Math.random() * 5);
            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius;
            z = (Math.random() - 0.5) * 5;
        } else if (sectionType === 1) {
            // Bottom right curved section
            const angle = (t * 2 + 1.75) * Math.PI * direction;
            const radius = 15 * scale + (Math.random() * 5);
            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius;
            z = (Math.random() - 0.5) * 5;
        } else {
            // Small right section
            const angle = (t * 0.5 + 0.5) * Math.PI * direction;
            const radius = 10 * scale + (Math.random() * 3);
            x = Math.cos(angle) * radius + 10;
            y = Math.sin(angle) * radius;
            z = (Math.random() - 0.5) * 3;
        }
        
        // Create node geometry
        const size = 0.1 + Math.random() * 0.15;
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        
        // Pick color randomly with weighted distribution
        const colorIndex = Math.random() < 0.7 ? 
                          Math.floor(Math.random() * 3) : // More likely pink, blue, light blue
                          3 + Math.floor(Math.random() * 2); // Less likely orange, purple
        
        const color = colors[colorIndex];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        const node = new THREE.Mesh(geometry, material);
        node.position.set(x, y, z);
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(size * 2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        node.add(glow);
        
        nodes.push(node);
        nodePositions.push(new THREE.Vector3(x, y, z));
        group.add(node);
    }
    
    // Create connections between nearby nodes
    const maxDistance = 4; // Maximum distance for connection
    
    for (let i = 0; i < nodeCount; i++) {
        // Only create connections to a few nearby nodes to avoid clutter
        const connectionsPerNode = 2 + Math.floor(Math.random() * 2);
        const connectedNodes = [];
        
        for (let j = 0; j < nodeCount; j++) {
            if (i !== j && connectedNodes.length < connectionsPerNode) {
                const distance = nodePositions[i].distanceTo(nodePositions[j]);
                
                if (distance < maxDistance) {
                    const points = [
                        nodePositions[i],
                        nodePositions[j]
                    ];
                    
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                    
                    // Line color matches the nodes but more transparent
                    const nodeColor = nodes[i].material.color;
                    const lineColor = nodeColor.clone();
                    
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: lineColor,
                        transparent: true,
                        opacity: 0.3
                    });
                    
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    group.add(line);
                    
                    connectedNodes.push(j);
                }
            }
        }
    }
    
    // Position and scale based on section type
    if (sectionType === 0) {
        group.position.set(-5, 5, -10);
    } else if (sectionType === 1) {
        group.position.set(5, -5, -10);
    } else {
        group.position.set(10, 0, -5);
    }
    
    group.scale.set(scale, scale, scale);
    
    // Add animation data
    group.userData = {
        rotationSpeed: 0.0005 * direction,
        floatSpeed: 0.001,
        floatAmplitude: 0.2
    };
    
    parentGroup.add(group);
}

// Add network to scene
const network = createCircularNetwork();
scene.add(network);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Clock for animations
const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    
    // Animate network sections
    network.children.forEach(section => {
        if (section.userData) {
            // Gentle rotation
            section.rotation.z += section.userData.rotationSpeed;
            
            // Subtle floating motion
            section.position.y += Math.sin(time * section.userData.floatSpeed) * 0.01 * section.userData.floatAmplitude;
        }
    });
    
    composer.render();
}

// Start animation
animate();

// Import ThreeJS addons
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
