import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";

export const BALL_RADIUS = 0.28;

const addCurvedTriangle = (
  positions: number[],
  a: Vector3,
  b: Vector3,
  c: Vector3,
  depth: number
): void => {
  if (depth === 0) {
    for (const point of [a, b, c]) {
      const vertex = point
        .clone()
        .normalize()
        .multiplyScalar(BALL_RADIUS + 0.002);
      positions.push(vertex.x, vertex.y, vertex.z);
    }
    return;
  }
  const ab = a.clone().add(b).normalize();
  const bc = b.clone().add(c).normalize();
  const ca = c.clone().add(a).normalize();
  addCurvedTriangle(positions, a, ab, ca, depth - 1);
  addCurvedTriangle(positions, ab, b, bc, depth - 1);
  addCurvedTriangle(positions, ca, bc, c, depth - 1);
  addCurvedTriangle(positions, ab, bc, ca, depth - 1);
};

// Truncating an icosahedron produces the familiar twelve pentagons and twenty hexagons.
// Project their edges onto a sphere so the panels stay rounded during the close fly-by.
export const createFootball = (): Group => {
  const ball = new Group();
  const surface = new Mesh(
    new SphereGeometry(BALL_RADIUS, 48, 32),
    new MeshStandardMaterial({ color: "#f5f2e8", roughness: 0.58 })
  );
  surface.castShadow = true;
  ball.add(surface);

  const source = new IcosahedronGeometry(1, 0);
  const sourcePositions = source.getAttribute("position");
  const corners: Vector3[] = [];
  const neighbors: Set<number>[] = [];
  const faces: number[][] = [];
  for (let index = 0; index < sourcePositions.count; index += 3) {
    const face: number[] = [];
    for (let offset = 0; offset < 3; offset += 1) {
      const vertex = new Vector3()
        .fromBufferAttribute(sourcePositions, index + offset)
        .normalize();
      let cornerIndex = corners.findIndex(
        (corner) => corner.distanceToSquared(vertex) < 0.0001
      );
      if (cornerIndex === -1) {
        cornerIndex = corners.length;
        corners.push(vertex);
        neighbors.push(new Set());
      }
      face.push(cornerIndex);
    }
    faces.push(face);
    for (const corner of face) {
      for (const other of face) {
        if (other !== corner) {
          neighbors[corner].add(other);
        }
      }
    }
  }
  source.dispose();

  const panels: number[] = [];
  for (const [index, center] of corners.entries()) {
    const reference =
      Math.abs(center.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
    const tangent = new Vector3().crossVectors(center, reference).normalize();
    const bitangent = new Vector3().crossVectors(center, tangent);
    const polygon = [...neighbors[index]].map((neighbor) =>
      center
        .clone()
        .lerp(corners[neighbor], 1 / 3)
        .normalize()
    );
    polygon.sort(
      (a, b) =>
        Math.atan2(a.dot(bitangent), a.dot(tangent)) -
        Math.atan2(b.dot(bitangent), b.dot(tangent))
    );
    for (const [edge, point] of polygon.entries()) {
      addCurvedTriangle(
        panels,
        center,
        point,
        polygon[(edge + 1) % polygon.length],
        2
      );
    }
  }
  const panelGeometry = new BufferGeometry();
  panelGeometry.setAttribute("position", new Float32BufferAttribute(panels, 3));
  panelGeometry.computeVertexNormals();
  ball.add(
    new Mesh(
      panelGeometry,
      new MeshStandardMaterial({ color: "#17251f", roughness: 0.72 })
    )
  );

  const seams: number[] = [];
  for (const face of faces) {
    const polygon: Vector3[] = [];
    for (const [index, corner] of face.entries()) {
      const next = face[(index + 1) % face.length];
      polygon.push(
        corners[corner]
          .clone()
          .lerp(corners[next], 1 / 3)
          .normalize(),
        corners[corner]
          .clone()
          .lerp(corners[next], 2 / 3)
          .normalize()
      );
    }
    for (const [index, start] of polygon.entries()) {
      const end = polygon[(index + 1) % polygon.length];
      for (let step = 0; step < 6; step += 1) {
        for (const amount of [step / 6, (step + 1) / 6]) {
          const point = start
            .clone()
            .lerp(end, amount)
            .normalize()
            .multiplyScalar(BALL_RADIUS + 0.003);
          seams.push(point.x, point.y, point.z);
        }
      }
    }
  }
  const seamGeometry = new BufferGeometry();
  seamGeometry.setAttribute("position", new Float32BufferAttribute(seams, 3));
  ball.add(
    new LineSegments(
      seamGeometry,
      new LineBasicMaterial({
        color: "#4a594e",
        opacity: 0.3,
        transparent: true,
      })
    )
  );
  return ball;
};
