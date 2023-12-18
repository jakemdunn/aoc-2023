import run from "aocrunner";

type Tile = "." | "\\" | "/" | "|" | "-";
type Tiles = ReturnType<typeof parseInput>;
type Orientation = "N" | "S" | "E" | "W";
type Pose = { x: number; y: number; orientation: Orientation };

const parseInput = (rawInput: string) =>
  rawInput.split("\n").map((row) => row.split("") as Tile[]);

const poseKey = ({ x, y, orientation: o }: Pose) => `${x},${y},${o}`;
type LitState = Record<string, Record<string, boolean>>;
const mergeState = (a: LitState, b: LitState) => ({
  ...Object.entries(b).reduce(
    (merged, [y, row]) => ({
      ...merged,
      [y]: { ...(merged[y] ?? {}), ...row },
    }),
    a
  ),
});
type BeamCacheItem = { state: LitState; terminatingPoses?: Pose[] };
type BeamCache = Map<string, BeamCacheItem>;
const setCache = (
  cache: BeamCache,
  key: string,
  { state, terminatingPoses }: BeamCacheItem
) => {
  const existingCache = cache.get(key);
  const mergedCache: BeamCacheItem = {
    state: existingCache ? mergeState(existingCache.state, state) : state,
    terminatingPoses,
  };
  cache.set(key, mergedCache);
  return mergedCache;
};
const getStateForBeam = (
  beam: Pose,
  tiles: Tiles,
  cache: BeamCache = new Map(),
  existingBeams = new Map<string, true>()
): BeamCacheItem => {
  const startingKey = poseKey(beam);
  let currentBeams = [{ ...beam }];
  let state: LitState = {};
  let tile: Tile = ".";
  do {
    const singleBeam = currentBeams[0];
    const key = poseKey(singleBeam);
    const cachedItem = cache.get(key);
    if (cachedItem) {
      state = mergeState(state, cachedItem.state);
      if (cachedItem.terminatingPoses) {
        currentBeams = cachedItem.terminatingPoses;
      } else {
        return setCache(cache, startingKey, { state });
      }
    }
    if (existingBeams.has(key)) {
      return setCache(cache, startingKey, {
        state,
        terminatingPoses: [singleBeam],
      });
    }
    tile = tiles[singleBeam.y]?.[singleBeam.x];
    existingBeams.set(key, true);
    if (tile) {
      state[singleBeam.y] = {
        ...(state[singleBeam.y] ?? {}),
        [singleBeam.x]: true,
      };
    }
    currentBeams = (tile && transforms[tile](singleBeam)) ?? [];
  } while (currentBeams.length === 1 && tile === ".");

  if (currentBeams.length === 0) {
    return setCache(cache, startingKey, { state });
  }
  const combinedState = currentBeams
    .map((childBeam) => getStateForBeam(childBeam, tiles, cache, existingBeams))
    .reduce<BeamCacheItem>(
      (merged, childState) => {
        return {
          state: mergeState(merged.state, childState.state),
          terminatingPoses: [
            ...(merged.terminatingPoses ?? []),
            ...(childState.terminatingPoses ?? []),
          ],
        };
      },
      { state }
    );
  return setCache(cache, startingKey, combinedState);
};
const getLit = (state: LitState) =>
  Object.values(state).reduce(
    (sum, row) =>
      Object.values(row).reduce((rowSum, lit) => rowSum + (lit ? 1 : 0), sum),
    0
  );
const part1 = (rawInput: string) => {
  const tiles = parseInput(rawInput);
  const { state } = getStateForBeam({ x: 0, y: 0, orientation: "E" }, tiles);
  return getLit(state).toString();
};

const part2 = (rawInput: string) => {
  const tiles = parseInput(rawInput);
  const cache: BeamCache = new Map();

  const sources: Pose[] = [
    ...[...Array(tiles[0].length)].map(
      (_, x) => ({ x, y: 0, orientation: "S" } as Pose)
    ),
    ...[...Array(tiles[0].length)].map(
      (_, x) => ({ x, y: tiles.length - 1, orientation: "N" } as Pose)
    ),
    ...[...Array(tiles.length)].map(
      (_, y) => ({ x: 0, y, orientation: "E" } as Pose)
    ),
    ...[...Array(tiles.length)].map(
      (_, y) => ({ x: tiles[0].length - 1, y, orientation: "W" } as Pose)
    ),
  ];

  return sources
    .reduce((max, pose) => {
      const { state } = getStateForBeam(pose, tiles, cache);
      const lit = getLit(state);
      return Math.max(max, lit);
    }, 0)
    .toString();
};
const debugPath = (tiles: Tiles, state: LitState) => {
  console.log(
    tiles
      .map((row, y) => row.map((c, x) => (state?.[y]?.[x] ? "X" : c)).join(""))
      .join("\n")
  );
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
      {
        input,
        expected: "51",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
