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
    const [, direction, count, color] = row.match(
      /([UDLR])\s(\d+)\s\((.+)\)/i
    ) as RegExpMatchArray;
    return {
      direction: direction as Direction,
      count: parseInt(count),
      color,
    };
  });

let testOutput = 0;
const part1 = (rawInput: string) => {
  // 7370: Low
  // 18932: Low
  const instructions = parseInput(rawInput);
  const lagoon: Record<string, Record<string, boolean>> = {};
  const steps = instructions.reduce<Direction[]>(
    (combined, { count, direction }) => {
      return [...combined, ...Array(count).fill(direction)];
    },
    []
  );

  const excavate = ({ x, y }: Coordinate) =>
    (lagoon[y] = { ...lagoon[y], [x]: true });

  let current: Coordinate = { x: 0, y: 0 };
  let min: Coordinate = { x: 0, y: 0 };
  let max: Coordinate = { x: 0, y: 0 };
  excavate(current);
  steps.forEach((step) => {
    current = transformByDirection[step](current);
    min = { x: Math.min(min.x, current.x), y: Math.min(min.y, current.y) };
    max = { x: Math.max(max.x, current.x), y: Math.max(max.y, current.y) };
    excavate(current);
  });

  const clearInterior = (coordinate: Coordinate) => {
    if (lagoon[coordinate.y][coordinate.x]) {
      return false;
    }
    excavate(coordinate);
    return true;
  };

  let excavations = new Set<Coordinate>([
    { x: parseInt(Object.keys(lagoon[min.y])[0]) + 1, y: min.y + 1 },
  ]);
  while (excavations.size > 0) {
    [...excavations.values()].forEach((coordinate) => {
      excavations.delete(coordinate);
      const cleared = clearInterior(coordinate);
      if (cleared) {
        (["U", "D", "L", "R"] as Direction[]).forEach((direction) =>
          excavations.add(transformByDirection[direction](coordinate))
        );
      }
    });
  }

  const output = [...Array(max.y - min.y + 1)]
    .map((_, offsetY) => {
      return [...Array(max.x - min.x + 1)]
        .map((_, offsetX) => {
          return lagoon[offsetY + min.y]?.[offsetX + min.x] ? "X" : ".";
        })
        .join("");
    })
    .join("\n");

  fs.writeFileSync(`./src/day18/test-${testOutput++}`, output);

  const dug = Object.values(lagoon).reduce((sum, row) => {
    return sum + Object.keys(row).length;
  }, 0);

  return dug.toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);

  return;
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
    ],
    solution: part1,
  },
  part2: {
    tests: [
      // {
      //   input: ``,
      //   expected: "",
      // },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
