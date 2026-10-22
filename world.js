// The space behind the page. One real-time scene, one camera, and a timeline
// read from scroll: every section owns a stretch of it, and the camera, the
// mark, the rings and the ring of app icons all interpolate between the poses
// written below. Page content never lives in here; it is all real markup.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.getElementById("world");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = matchMedia("(max-width: 760px)").matches;
const ACCENT = new THREE.Color("#c6ff3d");
const GLOW = ACCENT.clone().multiplyScalar(1.45);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: "high-performance" });
} catch (e) {
  renderer = null;
}
if (!renderer || !renderer.getContext()) {
  document.documentElement.classList.add("no-webgl");
  canvas.remove();
} else {
  start();
}

function start() {
  document.documentElement.classList.add("has-webgl");
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const bg = new THREE.Color("#05060c");
  scene.background = bg;
  scene.fog = new THREE.FogExp2(bg, 0.028);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(small ? 62 : 45, 1, 0.1, 400);

  // ---------------------------------------------------------------- the mark
  // The brand F, extruded and chromed, with its outline drawn in signal light
  // so the bloom has an edge to catch.
  const f = new THREE.Shape();
  [[0, 0], [0, 5], [3.4, 5], [3.4, 3.95], [1.25, 3.95], [1.25, 3.05], [2.9, 3.05], [2.9, 2.0], [1.25, 2.0], [1.25, 0]]
    .forEach(([x, y], i) => (i ? f.lineTo(x, y) : f.moveTo(x, y)));
  const fGeo = new THREE.ExtrudeGeometry(f, { depth: 0.9, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 });
  fGeo.center();
  fGeo.scale(0.42, 0.42, 0.42);
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xeef2ff, metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.8 });
  const mark = new THREE.Group();
  mark.add(new THREE.Mesh(fGeo, chrome));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(fGeo, 30),
    new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.9, toneMapped: false })
  );
  mark.add(edges);
  scene.add(mark);

  // A light that orbits the mark so the chrome keeps changing as it turns.
  const key = new THREE.PointLight(ACCENT, 30, 18, 1.6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x6070a0, 0.25));
  const rim = new THREE.DirectionalLight(0xbfd0ff, 2.2);
  rim.position.set(-4, 5, 6);
  scene.add(rim);

  // ------------------------------------------------------------ gyro rings
  const rings = [];
  [[2.15, 0.018, new THREE.Color(1.6, 1.6, 1.7), 0.55], [2.6, 0.012, GLOW, 1], [3.1, 0.01, new THREE.Color(0.9, 1.05, 2.2), 0.7]].forEach(([r, t, c, o], i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, t, 8, 220),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, toneMapped: false })
    );
    m.userData.spin = [0.21 + i * 0.13, 0.17 - i * 0.07, 0.11 * (i + 1)];
    rings.push(m);
    scene.add(m);
  });
  // A dotted tick ring, the HUD's dial.
  const tickGeo = new THREE.BufferGeometry();
  const ticks = [];
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2, r = i % 15 === 0 ? 3.75 : 3.6;
    ticks.push(Math.cos(a) * 3.55, Math.sin(a) * 3.55, 0, Math.cos(a) * r, Math.sin(a) * r, 0);
  }
  tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(ticks, 3));
  const dial = new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({ color: 0x9ba7cb, transparent: true, opacity: 0.35 }));
  scene.add(dial);

  // ------------------------------------------------------------ polar grid
  const grid = new THREE.PolarGridHelper(26, 24, 14, 96, 0x2a3566, 0x1a2040);
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  grid.position.y = -3.4;
  scene.add(grid);

  // ------------------------------------------------------------------ stars
  // Dots at rest, streaks under speed. Both share one buffer of positions that
  // stream toward the camera and wrap.
  const STARS = small ? 1100 : 2600;
  const sPos = new Float32Array(STARS * 3);
  const lPos = new Float32Array(STARS * 6);
  const lCol = new Float32Array(STARS * 6);
  const DEPTH = 140;
  for (let i = 0; i < STARS; i++) {
    const a = Math.random() * Math.PI * 2, r = 4 + Math.pow(Math.random(), 0.6) * 46;
    sPos[i * 3] = Math.cos(a) * r;
    sPos[i * 3 + 1] = Math.sin(a) * r * 0.75;
    sPos[i * 3 + 2] = -Math.random() * DEPTH + 20;
    const c = i % 11 === 0 ? ACCENT : new THREE.Color().setHSL(0.62, 0.4, 0.75 + Math.random() * 0.2);
    lCol.set([c.r, c.g, c.b, c.r * 0.1, c.g * 0.1, c.b * 0.1], i * 6);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: small ? 0.09 : 0.07, color: 0xcfd8ff, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false
  }));
  scene.add(stars);
  const streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
  streakGeo.setAttribute("color", new THREE.BufferAttribute(lCol, 3));
  const streakMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  scene.add(streaks);

  // ------------------------------------------------------------- app icons
  // Each app is a rounded tile with a thin signal frame. In the opening they
  // orbit the mark; in the Galaxy they stand on one huge ring the wheel turns.
  const APPS = (window.FT_APPS || []).filter((a) => a.icon);
  const tiles = [];
  const loader = new THREE.TextureLoader();
  const roundMask = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.beginPath();
    g.roundRect(0, 0, 128, 128, 30);
    g.fill();
    return new THREE.CanvasTexture(c);
  })();
  const frameTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    g.strokeStyle = "#fff";
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(6, 6, 148, 148, 38);
    g.stroke();
    return new THREE.CanvasTexture(c);
  })();
  APPS.forEach((app, i) => {
    const tex = loader.load(app.icon);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const group = new THREE.Group();
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, alphaMap: roundMask, transparent: true, toneMapped: false, color: 0xb8bccc })
    );
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 1.25),
      new THREE.MeshBasicMaterial({ map: frameTex, color: GLOW, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })
    );
    frame.position.z = -0.01;
    group.add(frame, face);
    group.userData = { face, frame, i, seed: Math.random() * 10 };
    tiles.push(group);
    scene.add(group);
  });
  const N = Math.max(tiles.length, 1);

  // ----------------------------------------------------------- post / bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), small ? 0.75 : 0.9, 0.55, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // One measured size for the drawing buffer, the camera and the reticle
  // projection, so a mobile address bar can never stretch one against another.
  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    const w = W, h = H;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measure();
  }

  // --------------------------------------------------------------- timeline
  // s runs 0..7: one unit per section. Anchors are re-measured on resize and
  // after fonts settle, since the engine sizes pinned acts on mount.
  const sections = ["acilis", ".manifesto", "galaksi", "app-store", "google-play", "destek", "kapanis"]
    .map((id) => (id[0] === "." ? document.querySelector(id) : document.getElementById(id)));
  let anchors = [];
  let galaxy = { top: 0, travel: 1 };
  function measure() {
    anchors = sections.map((el) => (el ? el.getBoundingClientRect().top + scrollY : 0));
    anchors.push(Math.max(document.documentElement.scrollHeight - innerHeight, anchors[anchors.length - 1] + 1));
    const g = sections[2];
    if (g) galaxy = { top: anchors[2], travel: Math.max(g.offsetHeight - innerHeight, 1) };
  }
  function timeline(y) {
    for (let i = 0; i < sections.length; i++) {
      if (y < anchors[i + 1]) return i + Math.max(0, Math.min(1, (y - anchors[i]) / Math.max(anchors[i + 1] - anchors[i], 1)));
    }
    return sections.length;
  }
  addEventListener("resize", resize);
  document.fonts && document.fonts.ready.then(measure);
  addEventListener("load", measure);
  setTimeout(measure, 1200);

  // Poses, one per section boundary. Values between two poses are eased.
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wide = innerWidth / innerHeight > 1.1;
  const P = [
    /* 0 açılış   */ { cam: V(wide ? -4.3 : 0, 0.5, small ? 10.5 : 9.5), look: V(wide ? -4.3 : 0, small ? -2.6 : 0.1, 0), mark: small ? 1.2 : 1.35, ring: 0, orbit: 0, warp: 0, bg: "#05060c" },
    /* 1 manifesto*/ { cam: V(0, 0.2, 4.2), look: V(0, 0, -6), mark: 1.1, ring: 0.6, orbit: 0, warp: 1, bg: "#060814" },
    /* 2 galaksi  */ { cam: V(0, 0.9, small ? 17 : 13), look: V(0, small ? -2.4 : 0.2, 0), my: -3.4, mark: 0.45, ring: 1, orbit: 1, warp: 0.15, bg: "#05060f" },
    /* 3 app store*/ { cam: V(0, 1.4, 14), look: V(0, 0.5, 0), my: 0, mark: 0.7, ring: 1, orbit: 2, warp: 0.1, bg: "#050816" },
    /* 4 g. play  */ { cam: V(4, 3.6, 12), look: V(0, 0, 0), mark: 0.75, ring: 0.4, orbit: 2, warp: 0.05, bg: "#060a0c" },
    /* 5 destek   */ { cam: V(-3, 5.5, 13), look: V(0, -1, 0), mark: 0.6, ring: 0.2, orbit: 2, warp: 0, bg: "#05060c" },
    /* 6 kapanış  */ { cam: V(0, 0.4, 8.6), look: V(0, 0.3, 0), my: 2.3, mark: 0.5, ring: 0, orbit: 2, warp: 0, bg: "#04050b" },
    /* 7 son      */ { cam: V(0, 0.3, 7.6), look: V(0, 0.3, 0), my: 2.3, mark: 0.5, ring: 0, orbit: 2, warp: 0, bg: "#04050b" },
  ].map((p) => ({ my: 0, ...p, bg: new THREE.Color(p.bg) }));
  const ease = (t) => t * t * (3 - 2 * t);
  // Each section holds its own pose and only hands over near its end, so the
  // Galaxy ring stays a ring for the whole of its pinned travel.
  const HANDOFF = [0, 0.35, 0.86, 0.55, 0.45, 0.45, 0, 0];

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduce) addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let s = 0, sTarget = 0, lastY = scrollY, speed = 0, ringRot = 0, ringTarget = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const clock = new THREE.Clock();
  let time = 0;
  let locked = -1;
  const reticleStyle = document.documentElement.style;

  function step() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) time += dt;

    const y = scrollY;
    sTarget = timeline(y);
    s += (sTarget - s) * (reduce ? 1 : 0.085);
    const v = Math.abs(y - lastY) / Math.max(innerHeight, 1);
    lastY = y;
    speed += (Math.min(v * 14, 1.6) - speed) * 0.08;

    // Galaxy ring: its own progress, independent of the section timeline, so
    // the lock lands exactly where the panel says it does.
    const gp = Math.max(0, Math.min(1, (y - galaxy.top) / galaxy.travel));
    const raw = gp * (N - 1), base = Math.floor(raw), frac = raw - base;
    const hold = Math.min(1, Math.max(0, (frac - 0.3) / 0.4));
    ringTarget = Math.min(N - 1, base + hold * hold * (3 - 2 * hold));
    ringRot += (ringTarget - ringRot) * (reduce ? 1 : 0.1);

    const i = Math.min(Math.floor(s), P.length - 2), h = HANDOFF[i];
    const t = ease(Math.max(0, Math.min(1, (s - i - h) / (1 - h)))), a = P[i], b = P[i + 1];
    const lerp = (k) => a[k] + (b[k] - a[k]) * t;

    camPos.lerpVectors(a.cam, b.cam, t);
    camLook.lerpVectors(a.look, b.look, t);
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.set(camPos.x + pointer.x * 0.55, camPos.y - pointer.y * 0.35, camPos.z);
    camera.lookAt(camLook);
    scene.background.lerpColors(a.bg, b.bg, t);
    scene.fog.color.copy(scene.background);

    // Mark: spins, and on the Android side turns its back to the camera.
    const sc = lerp("mark");
    mark.scale.setScalar(sc);
    const flip = Math.max(0, Math.min(1, s - 3.4)) * Math.PI;
    mark.rotation.y = Math.sin(time * 0.4) * 0.45 + pointer.x * 0.3 + flip + (s > 1 && s < 2 ? (s - 1) * Math.PI * 2 : 0);
    mark.rotation.x = Math.sin(time * 0.3) * 0.08 - pointer.y * 0.12;
    mark.position.y = lerp("my") + Math.sin(time * 0.8) * 0.08;
    const nearMark = Math.max(0.15, Math.min(1, (camera.position.distanceTo(mark.position) - 3.5) / 4));
    edges.material.opacity = 0.9 * nearMark;
    key.intensity = 30 * nearMark;
    key.position.set(Math.cos(time * 0.7) * 4, 2.2, Math.sin(time * 0.7) * 4 + 2);

    // Rings: gyrating in the open, flung wide in the manifesto, and locked
    // flat around the mark at the close.
    const spread = lerp("ring");
    const align = Math.max(0, Math.min(1, (s - 5.6) / 0.9));
    rings.forEach((r, k) => {
      const sp = r.userData.spin;
      r.rotation.set(
        (time * sp[0] + k) * (1 - align),
        (time * sp[1] + k * 2) * (1 - align),
        time * sp[2]
      );
      r.scale.setScalar(1 + spread * (1.6 + k * 0.9));
      r.material.opacity = (k === 1 ? 0.85 : 0.45) * (1 - spread * 0.55);
    });
    dial.rotation.z = -time * 0.05 - ringRot * 0.4;
    dial.scale.setScalar(1 + spread * 1.2);
    dial.material.opacity = 0.35 * (1 - Math.min(1, lerp("orbit")));

    // Stars: stream toward the camera, faster with warp and scroll speed.
    const warp = Math.min(lerp("warp") + speed * 0.9, 2);
    const vz = (reduce ? 0 : 0.6 + warp * 26) * dt;
    const len = 0.02 + warp * 2.4;
    const cz = camera.position.z;
    for (let k = 0; k < STARS; k++) {
      let z = sPos[k * 3 + 2] + vz;
      if (z > cz + 4) z -= DEPTH;
      if (z < cz - DEPTH + 4) z += DEPTH;
      sPos[k * 3 + 2] = z;
      lPos[k * 6] = sPos[k * 3]; lPos[k * 6 + 1] = sPos[k * 3 + 1]; lPos[k * 6 + 2] = z;
      lPos[k * 6 + 3] = sPos[k * 3]; lPos[k * 6 + 4] = sPos[k * 3 + 1]; lPos[k * 6 + 5] = z - len;
    }
    starGeo.attributes.position.needsUpdate = true;
    streakGeo.attributes.position.needsUpdate = true;
    streakMat.opacity = Math.min(1, warp * 0.9);
    stars.material.opacity = 0.9 - Math.min(0.6, warp * 0.4);

    // Tiles. Three layouts blended by "orbit": 0 orbiting the mark, 1 the
    // galaxy ring, 2 a tight halo around the mark at the close.
    const orbit = lerp("orbit");
    const R = Math.max(6.5, N * 0.62);
    let best = -1, bestZ = -Infinity;
    tiles.forEach((tile, k) => {
      const u = tile.userData;
      // 0: inclined orbit
      const a0 = (k / N) * Math.PI * 2 + time * 0.12;
      const r0 = 3.9 + (k % 3) * 0.55;
      const p0 = tmp.set(Math.cos(a0) * r0, Math.sin(a0 * 1) * 0.9 + Math.sin(time + u.seed) * 0.15, Math.sin(a0) * r0 * 0.6);
      // 1: galaxy ring, front item at angle 0 facing the camera
      const a1 = ((k - ringRot) / N) * Math.PI * 2;
      const p1 = tmp2.set(Math.sin(a1) * R, 0.35 + Math.sin(time * 0.6 + u.seed) * 0.06, Math.cos(a1) * R - R + 6.2);
      let x, yy, z, sz;
      if (orbit <= 1) {
        x = p0.x + (p1.x - p0.x) * orbit; yy = p0.y + (p1.y - p0.y) * orbit; z = p0.z + (p1.z - p0.z) * orbit;
        sz = 0.62 + (1.15 - 0.62) * orbit;
      } else {
        const h = orbit - 1;
        const a2 = (k / N) * Math.PI * 2 + time * 0.08;
        const r2 = 3.3;
        x = p1.x + (Math.cos(a2) * r2 - p1.x) * h;
        yy = p1.y + (Math.sin(a2) * r2 * 0.92 + 0.3 - p1.y) * h;
        z = p1.z + (-0.6 - p1.z) * h;
        sz = 1.15 + (0.55 - 1.15) * h;
      }
      tile.position.set(x, yy, z);
      const near = Math.max(0, Math.min(1, (tile.position.distanceTo(camera.position) - 2.2) / 2.8));
      u.face.material.opacity = near;
      tile.quaternion.copy(camera.quaternion);

      // Focus: in the galaxy the tile nearest the front is the locked one.
      const front = orbit > 0.6 && orbit < 1.4 ? Math.max(0, 1 - Math.abs(k - ringRot) * 1.6) : 0;
      tile.scale.setScalar(sz * (1 + front * 0.75));
      u.frame.material.opacity = front * near;
      u.face.material.color.setScalar(Math.min(0.86, 0.62 + front * 0.24 + (orbit > 1.4 ? 0.14 : 0)));
      if (front > 0.5 && z > bestZ) { bestZ = z; best = k; }
    });
    // Pin the HTML reticle to where the front of the ring actually projects.
    if (orbit > 0.3 && orbit < 1.7) {
      tmp.set(0, 0.35, 6.2).project(camera);
      reticleStyle.setProperty("--rx", ((tmp.x + 1) / 2 * W).toFixed(1) + "px");
      reticleStyle.setProperty("--ry", ((1 - tmp.y) / 2 * H).toFixed(1) + "px");
    }
    if (best !== locked) {
      locked = best;
      dispatchEvent(new CustomEvent("ft:lock", { detail: { index: best, app: APPS[best] } }));
    }

    grid.rotation.y = time * 0.02;
    composer.render();
  }

  resize();
  // Pause entirely when the tab is hidden; rAF does that for free.
  renderer.setAnimationLoop(step);
  document.addEventListener("visibilitychange", () => {
    renderer.setAnimationLoop(document.hidden ? null : step);
    clock.getDelta();
  });
}
