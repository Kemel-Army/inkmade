<script setup lang="ts">
// WebGL-фон (§5 вау, Tier 3): «текучий» фирменный бордо-градиент с домен-варп
// fbm-шумом и лёгкой реакцией на курсор. Самый «дорогой» приём — но строго
// контейнеризован и с деградацией:
//   • reduced-motion / тач / нет WebGL → ничего не рисуем, виден CSS-фон родителя.
//   • Сырой WebGL1 (GLSL ES 1.00) — без зависимостей, максимальная совместимость.
//   • dpr ограничен, один полноэкранный треугольник — дёшево для GPU.
// Обычный (не .client) компонент: SSR рендерит пустой div, canvas создаётся
// императивно в onMounted (только клиент) — надёжнее, чем template-ref в .client.
const host = ref<HTMLElement | null>(null)
let cleanup: (() => void) | null = null

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * 2.2;
  float t = u_time * 0.05;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  float n = fbm(p + q * 1.5 + u_mouse * 0.2);

  vec3 dark  = vec3(0.369, 0.094, 0.125); // #5e1820 burgundy-dark
  vec3 base  = vec3(0.478, 0.122, 0.157); // #7a1f28 burgundy
  vec3 light = vec3(0.604, 0.208, 0.251); // #9a3540 burgundy-light

  vec3 col = mix(dark, base, smoothstep(0.2, 0.6, n));
  col = mix(col, light, smoothstep(0.6, 0.9, n) * 0.6);
  // притемняем левую часть (там заголовок и CTA) — сохраняем контраст текста
  col = mix(col, dark, smoothstep(0.55, 0.0, uv.x) * 0.45);
  // мягкая виньетка
  float vig = smoothstep(1.2, 0.2, length(uv - 0.5));
  col *= 0.85 + 0.15 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!window.matchMedia('(pointer: fine)').matches) return // тяжёлый эффект — только десктоп
  const root = host.value
  if (!root) return

  const cvs = document.createElement('canvas')
  cvs.style.display = 'block'
  cvs.style.width = '100%'
  cvs.style.height = '100%'
  root.appendChild(cvs)

  const gl = cvs.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
  if (!gl) { cvs.remove(); return } // нет WebGL → остаётся CSS-фон родителя

  function compile(type: number, src: string) {
    const sh = gl!.createShader(type)!
    gl!.shaderSource(sh, src)
    gl!.compileShader(sh)
    if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) { gl!.deleteShader(sh); return null }
    return sh
  }

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) { cvs.remove(); return }

  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cvs.remove(); return }
  gl.useProgram(prog)

  // полноэкранный треугольник
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const uTime = gl.getUniformLocation(prog, 'u_time')
  const uRes = gl.getUniformLocation(prog, 'u_res')
  const uMouse = gl.getUniformLocation(prog, 'u_mouse')

  const dpr = Math.min(1.5, window.devicePixelRatio || 1)
  function resize() {
    const w = Math.max(1, Math.floor(cvs.clientWidth * dpr))
    const h = Math.max(1, Math.floor(cvs.clientHeight * dpr))
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w
      cvs.height = h
      gl!.viewport(0, 0, w, h)
    }
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(cvs)

  const mouse = { x: 0, y: 0 }
  const onMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('mousemove', onMove, { passive: true })

  const start = performance.now()
  let raf = 0
  const render = () => {
    resize()
    gl!.uniform1f(uTime, (performance.now() - start) / 1000)
    gl!.uniform2f(uRes, cvs.width, cvs.height)
    gl!.uniform2f(uMouse, mouse.x, mouse.y)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    raf = requestAnimationFrame(render)
  }
  raf = requestAnimationFrame(render)

  const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf) }
  cvs.addEventListener('webglcontextlost', onLost)

  cleanup = () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    window.removeEventListener('mousemove', onMove)
    cvs.removeEventListener('webglcontextlost', onLost)
    gl!.getExtension('WEBGL_lose_context')?.loseContext()
    cvs.remove()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="host" class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" />
</template>
