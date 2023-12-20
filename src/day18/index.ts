import run from "aocrunner";
import fs from "fs";

type Direction = "U" | "D" | "L" | "R";
type Coordinate = { x: number; y: number };

const transformByDirection: Record<
  Direction,
  (coordinate: Coordinate, magnitude?: number) => Coordinate
> = {
  U: ({ x, y }, m = 1) => ({ x, y: y - m }),
  D: ({ x, y }, m = 1) => ({ x, y: y + m }),
  L: ({ x, y }, m = 1) => ({ x: x - m, y }),
  R: ({ x, y }, m = 1) => ({ x: x + m, y }),
};

const parseInput = (rawInput: string) =>
  rawInput.split("\n").map((row) => {
    const [, direction, count] = row.match(
      /([UDLR])\s(\d+)/
    ) as RegExpMatchArray;
    return {
      direction: direction as Direction,
      count: parseInt(count),
    };
  });

const digitToDirection: Record<string, Direction> = {
  0: "R",
  1: "D",
  2: "L",
  3: "U",
};
const parseRealInput = (rawInput: string) =>
  rawInput.split("\n").map((row) => {
    const [, count, direction] = row.match(
      /\(\#(.{5})(.{1})\)/
    ) as RegExpMatchArray;
    return {
      direction: digitToDirection[direction],
      count: Number(`0x${count}`),
    };
  });

const area = (p: Coordinate, q: Coordinate, r: Coordinate) => {
  return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
};
const isConvex = ([a, b, c]: Triangle) => {
  return area(a, b, c) <= 0;
};
const pointInTriangle = ([a, b, c]: Triangle, point: Coordinate) => {
  return (
    (c.x - point.x) * (a.y - point.y) >= (a.x - point.x) * (c.y - point.y) &&
    (a.x - point.x) * (b.y - point.y) >= (b.x - point.x) * (a.y - point.y) &&
    (b.x - point.x) * (c.y - point.y) >= (c.x - point.x) * (b.y - point.y)
  );
};
const getLeftmost = (coordinates: Coordinate[]) => {
  return coordinates.reduce<[Coordinate, number]>(
    ([leftmost, leftmostIndex], coordinate, index) =>
      coordinate.x < leftmost.x ||
      (coordinate.x === leftmost.x && coordinate.y < leftmost.y)
        ? [coordinate, index]
        : [leftmost, leftmostIndex],
    [coordinates[0], 0]
  );
};

const findEar = (polygon: Coordinate[]): [Triangle, number] => {
  for (let midIndex = 0; midIndex < polygon.length; midIndex++) {
    const prevIndex = midIndex <= 0 ? polygon.length - 1 : midIndex - 1;
    const nextIndex = midIndex >= polygon.length - 1 ? 0 : midIndex + 1;

    const prevVertex = polygon[prevIndex];
    const midVertex = polygon[midIndex];
    const nextVertex = polygon[nextIndex];

    const indexes = [prevIndex, midIndex, nextIndex];
    const triangle: Triangle = [prevVertex, midVertex, nextVertex];

    if (!isConvex(triangle)) {
      continue;
    }
    if (
      polygon.some(
        (point, index) =>
          !indexes.includes(index) && pointInTriangle(triangle, point)
      )
    ) {
      continue;
    }
    return [triangle, midIndex];
  }
  throw new Error("malformed");
};

type Triangle = [Coordinate, Coordinate, Coordinate];
const triangulate = (polygon: Coordinate[]) => {
  const triangles: Triangle[] = [];
  while (polygon.length > 3) {
    const [triangle, midIndex] = findEar(polygon);
    triangles.push(triangle);
    polygon.splice(midIndex, 1);
  }
  triangles.push(polygon as Triangle);
  return triangles;
};

const areaOfTriangle = ([a, b, c]: Triangle) => {
  return (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) * 0.5;
};

const expandPolygon = (input: Coordinate[]) => {
  const [, leftmostIndex] = getLeftmost(input);
  const transforms: Coordinate[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];

  const expanded = [...input];
  let transformIndex = 0;
  let index = leftmostIndex + 1;
  let prevConvex = true;
  do {
    const prevVertex =
      expanded[(index + expanded.length - 1) % expanded.length];
    const midVertex = expanded[index % expanded.length];
    const nextVertext = expanded[(index + 1) % expanded.length];

    const nextConvex = isConvex([prevVertex, midVertex, nextVertext]);

    if (prevConvex === nextConvex) {
      transformIndex =
        (transformIndex + transforms.length + (nextConvex ? 1 : -1)) %
        transforms.length;
    }
    expanded[index % expanded.length] = {
      x: midVertex.x + transforms[transformIndex].x,
      y: midVertex.y + transforms[transformIndex].y,
    };

    prevConvex = nextConvex;
    index = (index + 1) % expanded.length;
  } while (index !== leftmostIndex);

  return expanded;
};

const part1 = (rawInput: string) => {
  const instructions = parseInput(rawInput);
  return digLagoon(instructions);
};

const part2 = (rawInput: string) => {
  const instructions = parseRealInput(rawInput);
  return digLagoon(instructions);
};

const digLagoon = (instructions: ReturnType<typeof parseInput>) => {
  const polygon = instructions.reduce<Coordinate[]>(
    (points, instruction, index) => {
      if (index === instructions.length - 1) {
        return points;
      }
      const previous = points[points.length - 1];
      const next = transformByDirection[instruction.direction](
        previous,
        instruction.count
      );

      points.push(next);
      return points;
    },
    [{ x: 0, y: 0 }]
  );
  const expanded = expandPolygon(polygon);
  const triangles = triangulate(expanded);
  const area = triangles.reduce(
    (sum, triangle) => sum + areaOfTriangle(triangle),
    0
  );
  return area.toString();
};

const input = `
  R 6 (#70c710)
  D 5 (#0dc571)
  L 2 (#5713f0)
  D 2 (#d2c081)
  R 2 (#59c680)
  D 2 (#411b91)
  L 5 (#8ceee2)
  U 2 (#caa173)
  L 1 (#1b58a2)
  U 2 (#caa171)
  R 2 (#7807d2)
  U 3 (#a77fa3)
  L 2 (#015232)
  U 2 (#7a21e3)`;
run({
  part1: {
    tests: [
      {
        input,
        expected: "62",
      },
      {
        input: `
        R 6 (#70c710)
        D 5 (#0dc571)
        L 6 (#5713f0)
        U 5 (#d2c081)`,
        expected: "42",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "952408144115",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
