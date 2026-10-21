import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const particleTexture = textureLoader.load('/textures/particles/2.png')

/**
 * Particles
 */
// Geometry (custom BufferGeometry: each vertex becomes a particle)
const particlesGeometry = new THREE.BufferGeometry()
const count = 20000

const positions = new Float32Array(count * 3) // Multiply by 3 because each position is composed of 3 values (x, y, z)
const colors = new Float32Array(count * 3)    // Multiply by 3 because each color is composed of 3 values (r, g, b)

for(let i = 0; i < count * 3; i++) // Multiply by 3 for same reason
{
    positions[i] = (Math.random() - 0.5) * 10 // Random value between -5 and +5
    colors[i] = Math.random()                 // Random value between 0 and 1
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)) // Each vertex is composed of 3 values
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))       // Be careful with singulars and plurals

// Material
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true
})

// particlesMaterial.color = new THREE.Color('#ff88cc')   // Single color for all particles (vertex colors are used instead)
// particlesMaterial.map = particleTexture                // Front particles hide the back ones, so we use alphaMap instead
particlesMaterial.transparent = true
particlesMaterial.alphaMap = particleTexture

// Fixing the draw-order problem (several techniques, there is no perfect solution)
// particlesMaterial.alphaTest = 0.001   // Technique 1: don't render pixels whose alpha is 0 (still some glitches)
// particlesMaterial.depthTest = false   // Technique 2: disable depth testing (can create bugs with other objects in the scene)
particlesMaterial.depthWrite = false     // Technique 3: don't write particles in the depth buffer (best fit for this scene)

particlesMaterial.blending = THREE.AdditiveBlending // Add the pixel color to the color already drawn (saturation effect)
particlesMaterial.vertexColors = true               // Activate the 'color' attribute (different color for each particle)

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update particles
    // Method 1: using the points as an object (rotate the whole thing)
    // particles.rotation.y = elapsedTime * 0.2

    // Method 2: changing the attributes (each vertex moves on its own, like floating on waves)
    for(let i = 0; i < count; i++)
    {
        let i3 = i * 3

        const x = particlesGeometry.attributes.position.array[i3]
        particlesGeometry.attributes.position.array[i3 + 1] = Math.sin(elapsedTime + x)
    }
    particlesGeometry.attributes.position.needsUpdate = true // Tell Three.js the geometry changed

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
