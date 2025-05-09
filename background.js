// Create the background shader
const createBackgroundShader = () => {
  const vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform float time;

    // Simplex 3D Noise
    // by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;

      // Permutations
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      // Gradients
      float n_ = 1.0/7.0; // N=7
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // Create a colorful background with 3D-like effect
      vec2 uv = vUv * 2.0 - 1.0;
      
      // Create 3D effect with simplex noise
      float n1 = snoise(vec3(uv * 3.0, time * 0.1)) * 0.5 + 0.5;
      float n2 = snoise(vec3(uv * 2.0, time * 0.2 + 100.0)) * 0.5 + 0.5;
      float n3 = snoise(vec3(uv * 1.0, time * 0.3 + 300.0)) * 0.5 + 0.5;
      
      // Create depth layers
      vec3 color1 = mix(vec3(0.0, 0.3, 0.6), vec3(0.0, 0.6, 1.0), n1); // Blue
      vec3 color2 = mix(vec3(0.8, 0.2, 0.0), vec3(1.0, 0.5, 0.0), n2); // Orange
      vec3 color3 = mix(vec3(0.0, 0.7, 0.7), vec3(0.0, 1.0, 1.0), n3); // Cyan
      
      // Mix colors based on distance from center for a radial effect
      float dist = length(uv);
      vec3 finalColor = mix(color1, color2, clamp(dist * 0.5 + n3 * 0.5, 0.0, 1.0));
      finalColor = mix(finalColor, color3, n1 * n2 * 0.5);
      
      // Add highlights
      float highlight = pow(n1 * n2 * n3, 5.0) * 2.0;
      finalColor += vec3(highlight);
      
      // Add subtle grid effect
      vec2 grid = abs(fract(uv * 10.0 - 0.5) - 0.5);
      float gridEffect = smoothstep(0.05, 0.1, min(grid.x, grid.y)) * 0.1;
      finalColor *= (1.0 - gridEffect);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return { vertexShader, fragmentShader };
};

// Initialize and setup the background
function initBackground() {
  console.log("Initializing background shader");
  
  // Create a scene for the background
  const bgScene = new THREE.Scene();
  
  // Create a camera that fills the screen
  const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  
  // Create a full-screen quad
  const bgGeometry = new THREE.PlaneGeometry(2, 2);
  
  // Get shader code
  const shaderCode = createBackgroundShader();
  
  // Create shader material
  const bgMaterial = new THREE.ShaderMaterial({
    vertexShader: shaderCode.vertexShader,
    fragmentShader: shaderCode.fragmentShader,
    uniforms: {
      time: { value: 0.0 }
    }
  });
  
  // Create mesh and add to scene
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgScene.add(bgMesh);
  
  // Create a separate renderer for the background
  const bgRenderer = new THREE.WebGLRenderer({ alpha: true });
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  bgRenderer.domElement.style.position = 'fixed';
  bgRenderer.domElement.style.top = '0';
  bgRenderer.domElement.style.left = '0';
  bgRenderer.domElement.style.width = '100%';
  bgRenderer.domElement.style.height = '100%';
  bgRenderer.domElement.style.zIndex = '-1';
  
  // Add to document
  document.body.appendChild(bgRenderer.domElement);
  
  // Handle resize
  window.addEventListener('resize', () => {
    bgRenderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Animation function
  function animateBackground() {
    requestAnimationFrame(animateBackground);
    
    // Update uniforms
    bgMaterial.uniforms.time.value = performance.now() * 0.001;
    
    // Render
    bgRenderer.render(bgScene, bgCamera);
  }
  
  // Start animation
  animateBackground();
  
  console.log("Background shader initialized");
}

// Initialize the background when the DOM is loaded
document.addEventListener('DOMContentLoaded', initBackground);
