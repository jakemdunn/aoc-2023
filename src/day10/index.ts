import run from "aocrunner";
import fs from "fs";
import GIFEncoder from "gifencoder";
import { createCanvas } from "canvas";

type Orientation = "N" | "S" | "E" | "W";
type Symbol = "|" | "-" | "L" | "J" | "7" | "F" | "." | "S" | "O";
type Pose = { x: number; y: number; orientation: Orientation };
type Coordinate = Pick<Pose, "x" | "y">;

type Transforms = {
  [key in Symbol]: (pose: Pose) => Pose | false;
};

const transformByOrientation = (
  pose: Pose,
  transformsByOrientation: Partial<{
    [key in Orientation]: () => Partial<Pose>;
  }>
) => {
  const transform = transformsByOrientation[pose.orientation];
  if (transform === undefined) {
    return false;
  }
  return {
    ...pose,
    ...transform(),
  };
};

const transforms: Transforms = {
  "|": (pose) =>
    transformByOrientation(pose, {
      N: () => ({ y: pose.y - 1 }),
      S: () => ({ y: pose.y + 1 }),
    }),
  "-": (pose) =>
    transformByOrientation(pose, {
      E: () => ({ x: pose.x + 1 }),
      W: () => ({ x: pose.x - 1 }),
    }),
  L: (pose) =>
    transformByOrientation(pose, {
      W: () => ({ y: pose.y - 1, orientation: "N" }),
      S: () => ({ x: pose.x + 1, orientation: "E" }),
    }),
  J: (pose) =>
    transformByOrientation(pose, {
      S: () => ({ x: pose.x - 1, orientation: "W" }),
      E: () => ({ y: pose.y - 1, orientation: "N" }),
    }),
  "7": (pose) =>
    transformByOrientation(pose, {
      N: () => ({ x: pose.x - 1, orientation: "W" }),
      E: () => ({ y: pose.y + 1, orientation: "S" }),
    }),
  F: (pose) =>
    transformByOrientation(pose, {
      N: () => ({ x: pose.x + 1, orientation: "E" }),
      W: () => ({ y: pose.y + 1, orientation: "S" }),
    }),
  S: () => false,
  ".": () => false,
  O: () => false,
};

const parseInput = (rawInput: string) => {
  let start: Coordinate = { x: 0, y: 0 };
  const grid = rawInput.split("\n").map((row, rowIndex) => {
    const columnIndex = row.indexOf("S");
    if (columnIndex !== -1) {
      start = { x: columnIndex, y: rowIndex };
    }
    return row.split("");
  });
  return { start, grid };
};

const areMatchingCoordinates = (a: Pose, b: Pose) => a.x === b.x && a.y === b.y;
const getPipeForGrid = (grid: string[][], { x, y }: Coordinate) =>
  grid[y]?.[x] as Symbol | undefined;

const findPath = (rawInput: string) => {
  const {
    start: { x, y },
    grid,
  } = parseInput(rawInput);

  const pathGrid = grid.map((row) => row.map(() => "."));
  const getPipe = (coordinate: Coordinate) => getPipeForGrid(grid, coordinate);
  const setPath = (coordinate: Coordinate, override?: string) =>
    (pathGrid[coordinate.y][coordinate.x] =
      override ?? grid[coordinate.y][coordinate.x]);

  const getPoseAfterPipe = (pose: Pose) => {
    const pipe = getPipe(pose);
    const nextPose = pipe && transforms[pipe](pose);
    if (nextPose) {
      setPath(pose);
    }
    return nextPose;
  };
  const startingPoses: Pose[] = [
    { x, y: y - 1, orientation: "N" },
    { x, y: y + 1, orientation: "S" },
    { x: x + 1, y, orientation: "E" },
    { x: x - 1, y, orientation: "W" },
  ];

  const startingPipes = startingPoses.map((pose) => getPoseAfterPipe(pose));

  if (startingPipes[0] && startingPipes[1]) {
    setPath({ x, y }, "|");
  } else if (startingPipes[2] && startingPipes[3]) {
    setPath({ x, y }, "-");
  } else if (startingPipes[0] && startingPipes[2]) {
    setPath({ x, y }, "L");
  } else if (startingPipes[0] && startingPipes[3]) {
    setPath({ x, y }, "J");
  } else if (startingPipes[1] && startingPipes[3]) {
    setPath({ x, y }, "7");
  } else if (startingPipes[1] && startingPipes[2]) {
    setPath({ x, y }, "F");
  }

  let steps = 2;
  let lastPipes = startingPipes.filter((pose) => pose) as Pose[];

  if (lastPipes.length !== 2) {
    throw new Error("Something is afoot at the Circle K");
  }

  for (let maxIterations = 999999; maxIterations > 0; maxIterations--) {
    const nextPipes = lastPipes.map((pose) => getPoseAfterPipe(pose)) as Pose[];
    if (areMatchingCoordinates(nextPipes[0], nextPipes[1])) {
      lastPipes = nextPipes;
      setPath(lastPipes[0]);
      steps++;
      break;
    }
    if (areMatchingCoordinates(nextPipes[0], lastPipes[1])) {
      lastPipes = nextPipes;
      setPath(lastPipes[0]);
      setPath(lastPipes[1]);
      break;
    }
    lastPipes = nextPipes;
    steps++;
  }

  return { steps, pathGrid, getPipe };
};

const outputGrid = (grid: string[][]) => {
  console.log("\n");
  console.log(grid.map((row) => row.join("")).join("\n"));
};

const part1 = (rawInput: string) => {
  const { steps } = findPath(rawInput);
  return steps.toString();
};

let fileIterator = 0;
const part2 = (rawInput: string) => {
  const { pathGrid } = findPath(rawInput);

  const possiblePaths = pathGrid.reduce<string[][]>((rows, row) => {
    const possibleRow = row.reduce(
      (output, c) => {
        output.push(c);
        output.push(["F", "L", "-"].includes(c) ? "-" : "`");
        return output;
      },
      ["`"]
    );
    rows.push(possibleRow);
    rows.push(
      possibleRow.map((_, index) =>
        ["F", "7", "|"].includes(possibleRow[index]) ? "|" : "`"
      )
    );
    return rows;
  }, []);
  possiblePaths.unshift(possiblePaths[0].map(() => "`"));

  fileIterator += 1;
  if (fs.existsSync(`./src/day10/ouput-${fileIterator}.gif`)) {
    fs.rmSync(`./src/day10/ouput-${fileIterator}.gif`);
  }
  const size = {
    width: possiblePaths[0].length * 5,
    height: possiblePaths.length * 5,
  };

  const encoder = new GIFEncoder(size.width, size.height);
  encoder
    .createReadStream()
    .pipe(fs.createWriteStream(`./src/day10/ouput-${fileIterator}.gif`));

  encoder.start();
  encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
  encoder.setDelay(10); // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  // use node-canvas
  const canvas = createCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d");
  const addFrame = () =>
    encoder.addFrame(ctx as unknown as CanvasRenderingContext2D);

  // red rectangle
  ctx.fillStyle = "#454955";
  ctx.fillRect(0, 0, size.width, size.height);
  addFrame();

  const getPipe = (coordinate: Coordinate) =>
    getPipeForGrid(possiblePaths, coordinate);

  const markSpace = ({ x, y }: Coordinate, inner: boolean) => {
    possiblePaths[y][x] = "O";
    ctx.fillStyle = inner ? "#00FFC5" : "#0D0A0B";
    ctx.fillRect(x * 5, y * 5, 5, 5);
  };

  const getOpenAdjacentSpaces = ({ x, y }: Coordinate, inner = false) => {
    const current = getPipe({ x, y });
    if (current === "O") {
      return [];
    }
    markSpace({ x, y }, inner);
    const adjacent: Coordinate[] = [
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x + 1, y },
      { x: x - 1, y },
    ];
    return adjacent.reduce<Coordinate[]>((openSpaces, coordinate) => {
      const pipe = getPipe(coordinate);
      if (pipe && ["`", "."].includes(pipe)) {
        openSpaces.push(coordinate);
      }
      return openSpaces;
    }, []);
  };

  let checks: Coordinate[] = Array.from({
    length: possiblePaths.length,
  }).reduce<Coordinate[]>((border, _, y) => {
    const row =
      y === 0 || y === possiblePaths.length - 1
        ? Array.from({ length: possiblePaths[0].length }).map((_, x) => ({
            x,
            y,
          }))
        : [
            { x: 0, y },
            { x: possiblePaths[0].length - 1, y },
          ];
    return [...border, ...row];
  }, []);

  let innerChecks: Coordinate[] = [
    {
      x: Math.floor(possiblePaths[0].length * 0.5),
      y: Math.floor(possiblePaths.length * 0.5),
    },
  ];

  while (checks.length > 0 || innerChecks.length > 0) {
    checks = checks.reduce<Coordinate[]>(
      (openSpaces, coordinate) => [
        ...openSpaces,
        ...getOpenAdjacentSpaces(coordinate),
      ],
      []
    );
    innerChecks = innerChecks.reduce<Coordinate[]>(
      (openSpaces, coordinate) => [
        ...openSpaces,
        ...getOpenAdjacentSpaces(coordinate, true),
      ],
      []
    );
    addFrame();
  }

  encoder.finish();

  fs.writeFileSync(
    `./src/day10/ouput-${fileIterator}.txt`,
    possiblePaths.map((row) => row.join("")).join("\n")
  );

  return possiblePaths
    .reduce(
      (sum, rows) =>
        rows.reduce(
          (rowSum, character) => rowSum + (character === "." ? 1 : 0),
          sum
        ),
      0
    )
    .toString();
};

run({
  part1: {
    tests: [
      {
        input: `
        .....
        .S-7.
        .|.|.
        .L-J.
        .....`,
        expected: "4",
      },
      {
        input: `
        -L|F7
        7S-7|
        L|7||
        -L-J|
        L|-JF`,
        expected: "4",
      },
      {
        input: `
        ..F7.
        .FJ|.
        SJ.L7
        |F--J
        LJ...`,
        expected: "8",
      },
      {
        input: `
        7-F7-
        .FJ|7
        SJLL7
        |F--J
        LJ.LJ`,
        expected: "8",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      // {
      //   input: `
      //   ...........
      //   .S-------7.
      //   .|F-----7|.
      //   .||.....||.
      //   .||.....||.
      //   .|L-7.F-J|.
      //   .|..|.|..|.
      //   .L--J.L--J.
      //   ...........`,
      //   expected: "4",
      // },
      // {
      //   input: `
      //   ..........
      //   .S------7.
      //   .|F----7|.
      //   .||....||.
      //   .||....||.
      //   .|L-7F-J|.
      //   .|..||..|.
      //   .L--JL--J.
      //   ..........
      //   `,
      //   expected: "4",
      // },
      {
        input: `
        .F----7F7F7F7F-7....
        .|F--7||||||||FJ....
        .||.FJ||||||||L7....
        FJL7L7LJLJ||LJ.L-7..
        L--J.L7...LJS7F-7L7.
        ....F-J..F7FJ|L7L7L7
        ....L7.F7||L7|.L7L7|
        .....|FJLJ|FJ|F7|.LJ
        ....FJL-7.||.||||...
        ....L---J.LJ.LJLJ...
        `,
        expected: "8",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
