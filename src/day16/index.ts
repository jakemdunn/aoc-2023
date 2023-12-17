import run from "aocrunner";

type Tile = "." | "\\" | "/" | "|" | "-";
type Tiles = ReturnType<typeof parseInput>;
type Orientation = "N" | "S" | "E" | "W";
type Pose = { x: number; y: number; orientation: Orientation };

const parseInput = (rawInput: string) =>
  rawInput.split("\n").map((row) => row.split("") as Tile[]);

const poseKey = ({ x, y, orientation: o }: Pose) => `${x},${y},${o}`;
const followBeam = (
  beam: Pose,
  tiles: Tiles,
  onValidTile: (tile: Pose) => void,
  existingBeams: Map<string, boolean>
) => {
  const key = poseKey(beam);
  if (existingBeams.has(key)) {
    return [];
  }
  const tile = tiles[beam.y]?.[beam.x];
  if (tile) {
    onValidTile(beam);
  }
  existingBeams.set(key, true);
  return (tile && transforms[tile](beam)) ?? [];
};
const followBeams = (
  beams: Pose[],
  tiles: Tiles,
  onValidTile: (tile: Pose) => void,
  existingBeams: Map<string, boolean>
) => {
  return beams.reduce<Pose[]>((validBeams, beam) => {
    return [
      ...validBeams,
      ...followBeam(beam, tiles, onValidTile, existingBeams),
    ];
  }, []);
};
const part1 = (rawInput: string) => {
  const tiles = parseInput(rawInput);
  const state = tiles.map((row) => row.map((tile) => false));
  const existingBeams = new Map<string, boolean>();
  let beams: Pose[] = [{ x: 0, y: 0, orientation: "E" }];
  while (beams.length > 0) {
    beams = followBeams(
      beams,
      tiles,
      (beam) => {
        state[beam.y][beam.x] = true;
      },
      existingBeams
    );
  }

  return state
    .reduce(
      (sum, row) => row.reduce((rowSum, lit) => rowSum + (lit ? 1 : 0), sum),
      0
    )
    .toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);

  return;
};

const transformByOrientation = (
  pose: Pose,
  ...transformations: Partial<{
    [key in Orientation]: () => Partial<Pose>[];
  }>[]
) => {
  return transformations.reduce<Pose[]>((validTransforms, transformation) => {
    const transform = transformation[pose.orientation];
    if (transform === undefined) {
      return validTransforms;
    }
    return [
      ...validTransforms,
      ...transform().map((updates) => ({
        ...pose,
        ...updates,
      })),
    ];
  }, []);
};

const transforms: {
  [key in Tile]: (pose: Pose) => Pose[];
} = {
  "|": (pose) =>
    transformByOrientation(pose, {
      N: () => [{ y: pose.y - 1 }],
      S: () => [{ y: pose.y + 1 }],
      E: () => [
        { y: pose.y - 1, orientation: "N" },
        { y: pose.y + 1, orientation: "S" },
      ],
      W: () => [
        { y: pose.y - 1, orientation: "N" },
        { y: pose.y + 1, orientation: "S" },
      ],
    }),
  "-": (pose) =>
    transformByOrientation(pose, {
      N: () => [
        { x: pose.x - 1, orientation: "W" },
        { x: pose.x + 1, orientation: "E" },
      ],
      S: () => [
        { x: pose.x - 1, orientation: "W" },
        { x: pose.x + 1, orientation: "E" },
      ],
      E: () => [{ x: pose.x + 1 }],
      W: () => [{ x: pose.x - 1 }],
    }),
  "/": (pose) =>
    transformByOrientation(pose, {
      N: () => [{ x: pose.x + 1, orientation: "E" }],
      S: () => [{ x: pose.x - 1, orientation: "W" }],
      E: () => [{ y: pose.y - 1, orientation: "N" }],
      W: () => [{ y: pose.y + 1, orientation: "S" }],
    }),
  "\\": (pose) =>
    transformByOrientation(pose, {
      N: () => [{ x: pose.x - 1, orientation: "W" }],
      S: () => [{ x: pose.x + 1, orientation: "E" }],
      E: () => [{ y: pose.y + 1, orientation: "S" }],
      W: () => [{ y: pose.y - 1, orientation: "N" }],
    }),
  ".": (pose) =>
    transformByOrientation(pose, {
      N: () => [{ y: pose.y - 1, orientation: "N" }],
      S: () => [{ y: pose.y + 1, orientation: "S" }],
      E: () => [{ x: pose.x + 1, orientation: "E" }],
      W: () => [{ x: pose.x - 1, orientation: "W" }],
    }),
};

const input = `
  .|...\\....
  |.-.\\.....
  .....|-...
  ........|.
  ..........
  .........\\
  ..../.\\\\..
  .-.-/..|..
  .|....-|.\\
  ..//.|....`;
run({
  part1: {
    tests: [
      {
        input,
        expected: "46",
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
