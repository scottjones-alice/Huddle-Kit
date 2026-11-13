import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from "three";
import type { BufferGeometry } from "three";

interface Leg {
  hip: Group;
  knee: Group;
  boot: Group;
}

export interface Footballer {
  root: Group;
  upperBody: Group;
  head: Group;
  leftArm: Group;
  rightArm: Group;
  leftLeg: Leg;
  rightLeg: Leg;
}

const addMesh = (
  parent: Group,
  geometry: BufferGeometry,
  material: MeshStandardMaterial,
  x: number,
  y: number,
  z: number
): Mesh => {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

export const createFootballer = (): Footballer => {
  const root = new Group();
  const upperBody = new Group();
  root.add(upperBody);
  const kit = new MeshStandardMaterial({ color: "#20372e", roughness: 0.68 });
  const shorts = new MeshStandardMaterial({
    color: "#12231e",
    roughness: 0.8,
  });
  const lime = new MeshStandardMaterial({ color: "#d4ff00", roughness: 0.52 });
  const skin = new MeshStandardMaterial({ color: "#bd8058", roughness: 0.76 });
  const hair = new MeshStandardMaterial({ color: "#261c19", roughness: 0.85 });
  const eye = new MeshStandardMaterial({ color: "#151e18", roughness: 0.4 });
  const sole = new MeshStandardMaterial({ color: "#dde5c9", roughness: 0.85 });

  const torso = addMesh(
    upperBody,
    new CapsuleGeometry(0.29, 0.35, 6, 16),
    kit,
    0,
    1.55,
    0
  );
  torso.scale.set(1.15, 1, 0.8);
  const collar = addMesh(
    upperBody,
    new TorusGeometry(0.135, 0.027, 6, 20),
    lime,
    0,
    1.98,
    0
  );
  collar.rotation.x = Math.PI / 2;
  addMesh(upperBody, new CapsuleGeometry(0.12, 0.08, 4, 12), skin, 0, 2.02, 0);

  // A small geometric H and shoulder piping make the plain kit feel like Huddlekit.
  const badgeStroke = new BoxGeometry(0.018, 0.075, 0.012);
  addMesh(upperBody, badgeStroke, lime, -0.115, 1.73, 0.23);
  addMesh(upperBody, badgeStroke, lime, -0.065, 1.73, 0.23);
  addMesh(
    upperBody,
    new BoxGeometry(0.05, 0.016, 0.012),
    lime,
    -0.09,
    1.73,
    0.235
  );
  for (const side of [-1, 1]) {
    const stripe = addMesh(
      upperBody,
      new CapsuleGeometry(0.018, 0.16, 3, 8),
      lime,
      side * 0.25,
      1.79,
      0.19
    );
    stripe.rotation.z = side * 0.35;
  }

  const head = new Group();
  head.position.set(0, 2.27, 0);
  upperBody.add(head);
  addMesh(head, new SphereGeometry(0.32, 24, 20), skin, 0, 0, 0).scale.set(
    0.96,
    1.06,
    0.95
  );
  addMesh(
    head,
    new SphereGeometry(0.326, 24, 12, 0, Math.PI * 2, 0, 1.5),
    hair,
    0,
    0.035,
    -0.015
  );
  const earGeometry = new SphereGeometry(0.065, 12, 8);
  const eyeGeometry = new SphereGeometry(0.022, 12, 8);
  for (const side of [-1, 1]) {
    addMesh(head, earGeometry, skin, side * 0.3, -0.025, 0);
    addMesh(head, eyeGeometry, eye, side * 0.105, 0.005, 0.283).scale.y = 1.2;
    const brow = addMesh(
      head,
      new CapsuleGeometry(0.012, 0.06, 3, 8),
      hair,
      side * 0.104,
      0.065,
      0.285
    );
    brow.rotation.z = Math.PI / 2 + side * 0.12;
  }
  addMesh(head, new SphereGeometry(0.043, 12, 8), skin, 0, -0.055, 0.302);
  const smile = addMesh(
    head,
    new TorusGeometry(0.055, 0.008, 4, 12, Math.PI * 0.7),
    hair,
    0,
    -0.1,
    0.284
  );
  smile.rotation.z = Math.PI * 1.15;

  const createArm = (side: number): Group => {
    const arm = new Group();
    arm.position.set(side * 0.37, 1.85, 0);
    arm.rotation.z = side * 0.14;
    upperBody.add(arm);
    addMesh(arm, new CapsuleGeometry(0.11, 0.18, 4, 12), kit, 0, -0.13, 0);
    addMesh(arm, new CapsuleGeometry(0.112, 0.008, 4, 12), lime, 0, -0.245, 0);
    const elbow = new Group();
    elbow.position.y = -0.33;
    elbow.rotation.x = -0.55;
    arm.add(elbow);
    addMesh(elbow, new CapsuleGeometry(0.085, 0.22, 4, 12), skin, 0, -0.14, 0);
    addMesh(elbow, new SphereGeometry(0.1, 12, 8), skin, 0, -0.32, 0);
    return arm;
  };

  const thighGeometry = new CapsuleGeometry(0.125, 0.25, 4, 12);
  const shinGeometry = new CapsuleGeometry(0.092, 0.28, 4, 12);
  const bootGeometry = new SphereGeometry(1, 20, 12);
  const createLeg = (side: number): Leg => {
    const hip = new Group();
    hip.position.set(side * 0.22, 1.18, 0);
    root.add(hip);
    addMesh(hip, thighGeometry, skin, 0, -0.25, 0);
    addMesh(hip, new CapsuleGeometry(0.165, 0.17, 4, 12), shorts, 0, -0.1, 0);
    const knee = new Group();
    knee.position.y = -0.5;
    hip.add(knee);
    addMesh(knee, shinGeometry, kit, 0, -0.25, 0);
    addMesh(knee, new CapsuleGeometry(0.095, 0.015, 4, 12), lime, 0, -0.09, 0);
    const boot = new Group();
    boot.position.y = -0.5;
    knee.add(boot);
    addMesh(boot, bootGeometry, shorts, 0, -0.045, 0.12).scale.set(
      0.14,
      0.13,
      0.26
    );
    addMesh(boot, bootGeometry, sole, 0, -0.13, 0.12).scale.set(
      0.14,
      0.035,
      0.25
    );
    addMesh(boot, bootGeometry, lime, side * 0.12, -0.035, 0.12).scale.set(
      0.015,
      0.035,
      0.12
    );
    return { boot, hip, knee };
  };

  return {
    head,
    leftArm: createArm(-1),
    leftLeg: createLeg(-1),
    rightArm: createArm(1),
    rightLeg: createLeg(1),
    root,
    upperBody,
  };
};

const blend = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount;
const smooth = (amount: number): number => amount * amount * (3 - 2 * amount);

const poseLeg = (leg: Leg, hip: number, knee: number): void => {
  leg.hip.rotation.x = hip;
  leg.knee.rotation.x = knee;
  leg.boot.rotation.x = -hip - knee;
};

export const poseFootballer = (player: Footballer, seconds: number): void => {
  const { root, upperBody, head, leftLeg, rightLeg, leftArm, rightArm } =
    player;
  const run = Math.min(seconds / 1.4, 1);
  root.position.set(blend(-0.85, -0.22, run), 0, blend(-2.2, 0.62, run));
  upperBody.rotation.set(0.08, 0, 0);
  head.rotation.x = 0.13;

  if (seconds < 1.4) {
    const stride = Math.sin(seconds * 13);
    const settle = smooth(Math.max(0, (seconds - 1.12) / 0.28));
    root.position.y = Math.abs(Math.sin(seconds * 13)) * 0.04 * (1 - settle);
    poseLeg(
      leftLeg,
      blend(stride * 0.62, 0, settle),
      blend(Math.max(0, -stride) * 1.1, 0, settle)
    );
    poseLeg(
      rightLeg,
      blend(-stride * 0.62, 0.8, settle),
      blend(Math.max(0, stride) * 1.1, 1.3, settle)
    );
    leftArm.rotation.x = blend(-stride * 0.55, -0.65, settle);
    rightArm.rotation.x = blend(stride * 0.55, 0.5, settle);
    upperBody.rotation.y = blend(stride * 0.05, -0.13, settle);
    return;
  }

  poseLeg(leftLeg, 0, 0);
  if (seconds < 1.8) {
    const strike = smooth((seconds - 1.4) / 0.4);
    poseLeg(rightLeg, blend(0.8, -0.535, strike), blend(1.3, 0.545, strike));
    upperBody.rotation.y = blend(-0.13, 0.17, strike);
    upperBody.rotation.x = blend(0.08, -0.06, strike);
    leftArm.rotation.x = blend(-0.65, 0.25, strike);
    rightArm.rotation.x = blend(0.5, -0.5, strike);
    return;
  }

  const followThrough = smooth(Math.min((seconds - 1.8) / 0.28, 1));
  const recover = smooth(Math.min(Math.max(0, (seconds - 2.16) / 0.65), 1));
  poseLeg(
    rightLeg,
    blend(blend(-0.535, -1.18, followThrough), -0.12, recover),
    blend(blend(0.545, 0.12, followThrough), 0.18, recover)
  );
  upperBody.rotation.y = blend(0.17, 0.28, followThrough) * (1 - recover);
  upperBody.rotation.x = -0.06 * (1 - recover);
  leftArm.rotation.x = 0.25 * (1 - recover);
  rightArm.rotation.x = -0.5 * (1 - recover);
  head.rotation.x = blend(0.13, -0.1, followThrough);
};
