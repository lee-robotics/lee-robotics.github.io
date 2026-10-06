'use strict';

// Pure force law, SI units. Contact is unilateral and never adhesive.
function primitiveForce(kind, p, v, k, b) {
  if (kind === 'plane') return [0, p[1] < 0 ? Math.max(0, -k * p[1] - b * v[1]) : 0, 0];
  return p.map((x, i) => kind === 'rail' && i === 0 ? 0 : -k * x - b * v[i]);
}

(() => {
  const $ = id => document.getElementById(id);
  const axes = ['x', 'y', 'z'];
  const stiffness = 40; // N/m
  const damping = 3; // N·s/m
  let kind = 'spring', position = [0.8, 0.7, 0.4], velocity = [0, 0, 0];
  let lastMove = 0, theta = 0.75, phi = 1.05, drag = null;
  let scene, camera, renderer, probe, forceArrow, constraint, handles, connector;
  let orientation;
  const orientationNS = 'http://www.w3.org/2000/svg';
  function updateOrientation() {
    // Project world directions through the camera rotation, without translation.
    const rotation = new THREE.Quaternion();
    camera.getWorldQuaternion(rotation).invert();
    const projected = axes.map((axis, i) => {
      const direction = new THREE.Vector3(); direction.setComponent(i, 1);
      direction.applyQuaternion(rotation);
      return { axis, direction };
    }).sort((a, b) => a.direction.z - b.direction.z);
    orientation.replaceChildren();
    for (const { axis, direction } of projected) {
      const i = axes.indexOf(axis);
      const color = `#${colors[i].toString(16).padStart(6, '0')}`;
      const line = document.createElementNS(orientationNS, 'line');
      line.setAttribute('x1', '48'); line.setAttribute('y1', '48');
      line.setAttribute('x2', String(48 + direction.x * 27));
      line.setAttribute('y2', String(48 - direction.y * 27));
      line.setAttribute('stroke', color); line.setAttribute('stroke-width', '2.5');
      const text = document.createElementNS(orientationNS, 'text');
      text.setAttribute('x', String(48 + direction.x * 37));
      text.setAttribute('y', String(48 - direction.y * 37));
      text.style.fill = color; text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.textContent = axis.toUpperCase();
      orientation.append(line, text);
    }
  }
  const host = $('primitive-viewer');
  const colors = [0xc65050, 0x37865c, 0x477fbc];
  const labels = {};
  function placeLabel(label, point, dx, dy) {
    const projected = point.clone().project(camera);
    label.hidden = projected.z < -1 || projected.z > 1;
    if (label.hidden) return;
    const x = (projected.x + 1) * host.clientWidth / 2 + dx;
    const y = (1 - projected.y) * host.clientHeight / 2 + dy;
    label.style.left = `${Math.max(6, Math.min(host.clientWidth - label.offsetWidth - 6, x))}px`;
    label.style.top = `${Math.max(6, Math.min(host.clientHeight - label.offsetHeight - 6, y))}px`;
  }
  function updateLabels(f, magnitude) {
    placeLabel(labels.ee, probe.position, 12, -34);
    const forcePoint = probe.position.clone();
    if (magnitude > 0.01) forcePoint.addScaledVector(new THREE.Vector3(...f).normalize(), Math.min(2, magnitude / 50) * 0.65);
    labels.force.textContent = `Force F = ${magnitude.toFixed(1)} N`;
    placeLabel(labels.force, forcePoint, 12, 14);
    labels.constraint.textContent = kind[0].toUpperCase() + kind.slice(1);
    const constraintPoint = kind === 'rail' ? new THREE.Vector3(-1.5, 0, 0)
      : kind === 'plane' ? new THREE.Vector3(-1.3, 0, 1.3) : new THREE.Vector3();
    placeLabel(labels.constraint, constraintPoint, -55, -30);
    // Separate labels when their projected anchors coincide.
    const placed = [];
    for (const label of [labels.ee, labels.force, labels.constraint]) {
      if (label.hidden) continue;
      for (let attempt = 0; attempt < 6; attempt++) {
        const rect = label.getBoundingClientRect();
        const overlap = placed.find(other => rect.left < other.right + 4 && rect.right + 4 > other.left && rect.top < other.bottom + 4 && rect.bottom + 4 > other.top);
        if (!overlap) break;
        const top = parseFloat(label.style.top);
        label.style.top = `${top + label.offsetHeight + 6 < host.clientHeight - label.offsetHeight ? top + label.offsetHeight + 6 : top - label.offsetHeight - 6}px`;
      }
      placed.push(label.getBoundingClientRect());
    }
  }
  function resetVelocity() { velocity = [0, 0, 0]; lastMove = 0; }
  function move(next) {
    const now = performance.now();
    const dt = Math.max(1 / 60, Math.min(0.1, (now - lastMove) / 1000));
    velocity = next.map((x, i) => (x - position[i]) / dt);
    position = next; lastMove = now;
    update();
  }
  function update() {
    const f = primitiveForce(kind, position, velocity, stiffness, damping);
    const magnitude = Math.hypot(...f);
    axes.forEach((axis, i) => {
      $('probe-' + axis).value = position[i];
      $('value-' + axis).textContent = position[i].toFixed(2);
    });
    if (!renderer) return;
    probe.position.fromArray(position);
    handles.position.copy(probe.position);
    forceArrow.position.copy(probe.position);
    forceArrow.visible = magnitude > 0.01;
    if (forceArrow.visible) {
      forceArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...f).normalize());
      const length = Math.min(2, magnitude / 50);
      const headLength = Math.min(0.26, length * 0.35);
      const shaftLength = length - headLength;
      const radius = Math.min(0.045, length * 0.12);
      const [shaft, head] = forceArrow.children;
      shaft.scale.set(radius, shaftLength, radius);
      shaft.position.y = shaftLength / 2;
      head.scale.set(radius * 2.5, headLength, radius * 2.5);
      head.position.y = shaftLength + headLength / 2;
    }
    constraint.children.forEach(child => { child.visible = child.name === kind; });
    const target = kind === 'spring' ? [0, 0, 0] : kind === 'rail' ? [position[0], 0, 0] : [position[0], 0, position[2]];
    connector.visible = kind !== 'plane' || position[1] < 0;
    const attribute = connector.geometry.attributes.position;
    attribute.setXYZ(0, ...position); attribute.setXYZ(1, ...target); attribute.needsUpdate = true;
    connector.geometry.computeBoundingSphere();
    renderer.render(scene, camera);
    updateLabels(f, magnitude);
    updateOrientation();
  }
  function view() {
    camera.position.set(6 * Math.sin(phi) * Math.sin(theta), 6 * Math.cos(phi), 6 * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    update();
  }
  document.querySelectorAll('input[name="primitive"]').forEach(radio => radio.addEventListener('change', () => {
    kind = radio.value; resetVelocity();
    update();
  }));
  axes.forEach((axis, i) => {
    $('probe-' + axis).addEventListener('input', event => {
      const next = [...position]; next[i] = +event.target.value; move(next);
    });
    $('probe-' + axis).addEventListener('change', () => { resetVelocity(); update(); });
  });
  $('reset-probe').addEventListener('click', () => {
    position = [0.8, 0.7, 0.4]; resetVelocity(); theta = 0.75; phi = 1.05;
    if (renderer) view(); else update();
  });
  // Stop damping when pointer/keyboard motion stops, even if a handle remains held.
  setInterval(() => { if (lastMove && performance.now() - lastMove > 100) { resetVelocity(); update(); } }, 50);
  try {
    scene = new THREE.Scene(); scene.background = new THREE.Color(0xf5f7f5);
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    for (const name of ['ee', 'force', 'constraint']) {
      const label = document.createElement('span');
      label.className = `object-label object-label-${name}`;
      label.textContent = name === 'ee' ? 'End effector' : '';
      host.appendChild(label);
      labels[name] = label;
    }
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a776a, 2.5));
    orientation = document.createElementNS(orientationNS, 'svg');
    orientation.classList.add('orientation-widget');
    orientation.setAttribute('viewBox', '0 0 96 96');
    orientation.setAttribute('role', 'img');
    orientation.setAttribute('aria-label', 'World orientation: X, Y, Z');
    host.appendChild(orientation);
    probe = new THREE.Object3D(); scene.add(probe);
    constraint = new THREE.Group(); scene.add(constraint);
    const anchor = new THREE.Mesh(new THREE.SphereGeometry(0.075), new THREE.MeshStandardMaterial({ color: 0x555555 })); anchor.name = 'spring'; constraint.add(anchor);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), new THREE.MeshBasicMaterial({ color: 0x7dba95, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })); plane.rotation.x = -Math.PI / 2; plane.name = 'plane'; constraint.add(plane);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 16), new THREE.MeshStandardMaterial({ color: 0x305d4d })); rail.rotation.z = Math.PI / 2; rail.name = 'rail'; constraint.add(rail);
    connector = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x8ca994 })); scene.add(connector);
    forceArrow = new THREE.Group();
    const forceMaterial = new THREE.MeshStandardMaterial({ color: 0xe78322, roughness: 0.55 });
    forceArrow.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 24), forceMaterial));
    forceArrow.add(new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24), forceMaterial));
    scene.add(forceArrow);
    handles = new THREE.Group(); scene.add(handles);
    axes.forEach((axis, i) => {
      const direction = new THREE.Vector3(); direction.setComponent(i, 1);
      const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(), 0.65, colors[i], 0.10, 0.055); handles.add(arrow);
      // Invisible, generously sized pick volumes keep the slim frame easy to drag.
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.65, 12), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(direction.clone().multiplyScalar(0.325));
      hit.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      hit.userData.axis = i; handles.add(hit);
    });
    const ray = new THREE.Raycaster();
    function pointer(event) {
      const rect = host.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    }
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', event => {
      if (drag || event.button !== 0) return;
      pointer(event);
      const hit = ray.intersectObjects(handles.children, true).find(h => h.object.userData.axis !== undefined);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: hit?.object.userData.axis };
      if (hit) {
        const axis = new THREE.Vector3(); axis.setComponent(drag.axis, 1);
        const facing = camera.position.clone().sub(probe.position);
        const normal = facing.addScaledVector(axis, -facing.dot(axis)).normalize();
        drag.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, probe.position);
        drag.start = ray.ray.intersectPlane(drag.plane, new THREE.Vector3()); drag.position = [...position];
      }
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.axis !== undefined && drag.start) {
        pointer(event);
        const point = ray.ray.intersectPlane(drag.plane, new THREE.Vector3());
        if (point) {
          const next = [...position];
          next[drag.axis] = Math.max(-1.5, Math.min(1.5, drag.position[drag.axis] + point.getComponent(drag.axis) - drag.start.getComponent(drag.axis)));
          move(next);
        }
      } else {
        theta -= (event.clientX - drag.x) * 0.008;
        phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi + (event.clientY - drag.y) * 0.008)); view();
      }
      drag.x = event.clientX; drag.y = event.clientY;
    });
    function end(event) { if (drag?.id === event.pointerId) { drag = null; resetVelocity(); update(); } }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => canvas.addEventListener(event, end));
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); $('primitive-error').hidden = false; $('primitive-error').textContent = '3D rendering interrupted. Reload to restore the view; position and force controls remain available.'; });
    new ResizeObserver(() => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); view();
    }).observe(host);
    view();
  } catch (error) {
    renderer = null;
    host.textContent = '3D view unavailable. Use the position sliders to explore the force values.';
    console.warn('Primitive viewer unavailable:', error);
  }
  update();
})();
