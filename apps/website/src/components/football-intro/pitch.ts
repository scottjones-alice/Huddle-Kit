import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
} from "three";
import type { Scene } from "three";

export const addPitch = (scene: Scene): void => {
  const ground = new Mesh(
    new PlaneGeometry(60, 80),
    new MeshStandardMaterial({ color: "#1e4935", roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -18;
  ground.receiveShadow = true;
  scene.add(ground);

  const stripeMaterial = new MeshStandardMaterial({
    color: "#234f38",
    roughness: 1,
  });
  const stripeGeometry = new PlaneGeometry(30, 2.5);
  for (let index = 0; index < 9; index += 1) {
    const stripe = new Mesh(stripeGeometry, stripeMaterial);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.001, 7 - index * 5);
    stripe.receiveShadow = true;
    scene.add(stripe);
  }

  const paint = new MeshStandardMaterial({
    color: "#c7d8b2",
    depthWrite: false,
    opacity: 0.55,
    roughness: 1,
    transparent: true,
  });
  const line = (width: number, depth: number, x: number, z: number) => {
    const mesh = new Mesh(new PlaneGeometry(width, depth), paint);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.006, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  };
  line(0.045, 35, -5, -9);
  line(0.045, 35, 5, -9);
  line(10, 0.045, 0, -3);
  line(10, 0.045, 0, -17);
  line(6, 0.045, 0, -12);
  line(0.045, 5, -3, -14.5);
  line(0.045, 5, 3, -14.5);
  const centerCircle = new Mesh(new RingGeometry(1.96, 2, 80), paint);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(0, 0.007, -3);
  scene.add(centerCircle);

  // A single line mesh gives the distant fence detail without hundreds of objects.
  const fence: number[] = [];
  for (let x = -18; x <= 18; x += 0.6) {
    fence.push(x, 0, -20, x, 3, -20);
  }
  for (let y = 0.4; y < 3; y += 0.4) {
    fence.push(-18, y, -20, 18, y, -20);
  }
  const fenceGeometry = new BufferGeometry();
  fenceGeometry.setAttribute("position", new Float32BufferAttribute(fence, 3));
  scene.add(
    new LineSegments(
      fenceGeometry,
      new LineBasicMaterial({
        color: "#5a796c",
        opacity: 0.22,
        transparent: true,
      })
    )
  );

  const metal = new MeshStandardMaterial({
    color: "#3b5149",
    metalness: 0.35,
    roughness: 0.6,
  });
  const lampMaterial = new MeshBasicMaterial({ color: "#f1ffdb" });
  const haloMaterial = new MeshBasicMaterial({
    color: "#dcefc1",
    depthWrite: false,
    opacity: 0.035,
    side: DoubleSide,
    transparent: true,
  });
  for (const side of [-1, 1]) {
    const lamp = new Group();
    lamp.position.set(side * 6.5, 0, -9);
    const pole = new Mesh(new CylinderGeometry(0.045, 0.08, 5.2, 8), metal);
    pole.position.y = 2.6;
    lamp.add(pole);
    const housing = new Mesh(new BoxGeometry(1.35, 0.5, 0.2), metal);
    housing.position.y = 5.1;
    lamp.add(housing);
    const bulbGeometry = new CircleGeometry(0.13, 16);
    for (const x of [-0.45, 0, 0.45]) {
      for (const y of [5, 5.2]) {
        const bulb = new Mesh(bulbGeometry, lampMaterial);
        bulb.position.set(x, y, 0.12);
        lamp.add(bulb);
      }
    }
    // Layered transparent discs suggest glow without a full-screen bloom pass.
    for (let ring = 1; ring <= 5; ring += 1) {
      const halo = new Mesh(new CircleGeometry(ring * 0.4, 32), haloMaterial);
      halo.position.set(0, 5.1, 0.13 + ring * 0.001);
      lamp.add(halo);
    }
    scene.add(lamp);
  }

  const goal = new Group();
  const post = new CylinderGeometry(0.055, 0.055, 2.5, 8);
  const goalMaterial = new MeshStandardMaterial({
    color: "#cad3ba",
    roughness: 0.8,
  });
  for (const side of [-1, 1]) {
    const upright = new Mesh(post, goalMaterial);
    upright.position.set(side * 2.25, 1.25, -17);
    goal.add(upright);
  }
  const crossbar = new Mesh(
    new CylinderGeometry(0.055, 0.055, 4.5, 8),
    goalMaterial
  );
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0, 2.5, -17);
  goal.add(crossbar);
  scene.add(goal);

  scene.add(new HemisphereLight("#dce8ed", "#274b2b", 2.2));
  const key = new DirectionalLight("#fff2d6", 3.2);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 22;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0003;
  scene.add(key);
  const rim = new DirectionalLight("#d4f1ad", 3);
  rim.position.set(4, 5, -5);
  scene.add(rim);
};
