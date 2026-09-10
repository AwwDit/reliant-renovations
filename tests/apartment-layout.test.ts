import test from "node:test";
import assert from "node:assert/strict";
import {
  apartmentRooms,
  apartmentInspections,
  apartmentRoute,
  clearWalkLine,
  canStandAt,
  roomAt,
  APARTMENT_EYE_HEIGHT,
} from "../lib/apartment-layout";

test("every room and service inspection has a reachable collision-free route", () => {
  const poses = [...apartmentRooms, ...apartmentInspections];
  for (const a of poses)
    for (const b of poses) {
      assert.equal(a.position[1], APARTMENT_EYE_HEIGHT);
      assert.equal(canStandAt(a.position[0], a.position[2]), true, a.title);
      const from: [number, number] = [a.position[0], a.position[2]],
        to: [number, number] = [b.position[0], b.position[2]];
      const path = apartmentRoute(from, to);
      assert.ok(path.length, `${a.title} → ${b.title}`);
      let previous = from;
      for (const point of path) {
        assert.ok(
          clearWalkLine(previous, point),
          `${a.title} → ${b.title}: safe segment`,
        );
        previous = point;
      }
      assert.deepEqual(path.at(-1), to);
    }
});
test("walls, furniture and perimeter exclude a person's walking radius", () => {
  for (const point of [
    [-6, 0],
    [6, 0],
    [0, 5.5],
    [-1.1, 2],
    [1.1, 2],
    [-3.9, -1.7],
    [3.5, -1.7],
    [-4.4, 2.8],
    [5.4, 4.2],
    [-0.82, 4.8],
  ])
    assert.equal(
      canStandAt(...(point as [number, number])),
      false,
      String(point),
    );
  for (const point of [
    [-1.1, 3.4],
    [1.1, 3.4],
    [0, -2],
    [0, 0.5],
    [0, 2.2],
  ])
    assert.equal(
      canStandAt(...(point as [number, number])),
      true,
      String(point),
    );
  assert.deepEqual(apartmentRoute([0, 4.65], [-6, 0]), []);
});
test("room detection matches the overview poses", () => {
  for (const room of apartmentRooms)
    assert.equal(roomAt(room.position[0], room.position[2]), room.id);
});
