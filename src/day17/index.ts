import run from "aocrunner";

type Coordinate = { x: number; y: number };
type Pose = Coordinate & { recent: Orientation[] };
type Edge = {
  cost: number;
  target: Pose;
  path: Orientation[];
  visited: Coordinate[];
};
type Orientation = "N" | "S" | "E" | "W";
const orientationOpposites: Record<Orientation, Orientation> = {
  N: "S",
  S: "N",
  E: "W",
  W: "E",
};

const parseInput = (rawInput: string) =>
  rawInput
    .split("\n")
    .map((row) => row.split("").map((cost) => parseInt(cost)));

const poseKey = ({ x, y, recent }: Pose) => `${x}|${y}|${recent.join(".")}`;
const coordinateKey = ({ x, y }: Coordinate) => `${x}|${y}`;

const transformByOrientation: Record<
  Orientation,
  (coordinate: Coordinate) => Coordinate
> = {
  N: ({ x, y }) => ({ x, y: y - 1 }),
  S: ({ x, y }) => ({ x, y: y + 1 }),
  W: ({ x, y }) => ({ x: x - 1, y }),
  E: ({ x, y }) => ({ x: x + 1, y }),
};

const debugEdge = (costs: number[][], edge: Edge) => {
  console.log(
    costs
      .map((row, costY) =>
        row
          .map((cost, costX) =>
            edge.visited.some(({ x, y }) => x === costX && y === costY)
              ? "#"
              : cost
          )
          .join("")
      )
      .join("\n")
  );
  console.log(`cost [${edge.cost}] end key [${poseKey(edge.target)}]`);
};

const getRecentMatchingOrientations = (
  orientations: Orientation[],
  maxPathLength = 3
) => {
  const recent: Orientation[] = [];
  const last = orientations[orientations.length - 1];
  for (let index = 0; index < maxPathLength; index++) {
    const orientation = orientations[orientations.length - 1 - index];
    if (!orientation || !last || orientation !== last) {
      break;
    }
    recent.unshift(orientation);
  }
  return recent;
};

const findLowestCost = (
  costs: ReturnType<typeof parseInput>,
  minPathLenth = 1,
  maxPathLength = 3
) => {
  const source: Pose = { x: 0, y: 0, recent: [] };
  const finalDestination: Coordinate = {
    x: costs[0].length - 1,
    y: costs.length - 1,
  };
  let current: Edge = { target: source, cost: 0, path: [], visited: [source] };
  const unvisited = new Map<string, Edge>();
  const visited = new Map<string, Edge>([[poseKey(current.target), current]]);
  const unvisitedByCoordinate = new Map<string, Set<Edge>>();
  const options = new Set<Edge>();

  do {
    const forbiddenOrientation: Orientation | false =
      current.target.recent.length === maxPathLength &&
      current.target.recent[0];

    (["E", "S", "W", "N"] as Orientation[]).forEach((orientation) => {
      if (orientation === forbiddenOrientation) {
        return;
      }
      if (
        orientation ===
        orientationOpposites[current.path[current.path.length - 1]]
      ) {
        return;
      }
      const movement =
        !current.target.recent[0] || orientation !== current.target.recent[0]
          ? minPathLenth
          : 1;

      let destination: Coordinate = current.target;
      let navigatedCoordinates: Coordinate[] = [];
      let cost = 0;
      for (let index = 0; index < movement; index++) {
        destination = transformByOrientation[orientation](destination);
        navigatedCoordinates.push(destination);
        cost += costs[destination.y]?.[destination.x];
      }

      const destinationPath = [
        ...current.path,
        ...Array(movement).fill(orientation),
      ];

      const destinationPose: Pose = {
        ...destination,
        recent: getRecentMatchingOrientations(destinationPath, maxPathLength),
      };
      const destinationKey = poseKey(destinationPose);

      if (visited.has(destinationKey)) {
        return;
      }
      if (!cost) {
        return;
      }

      const newEdge: Edge = {
        cost: current.cost + cost,
        target: destinationPose,
        path: destinationPath,
        visited: [...current.visited, ...navigatedCoordinates],
      };

      const destinationCoordinateKey = coordinateKey(destinationPose);
      const existingEdges = [
        ...(unvisitedByCoordinate.get(destinationCoordinateKey) ?? []),
      ];
      if (
        existingEdges.some(
          (edge) =>
            edge.target.recent[0] === orientation &&
            edge.target.recent.length <= newEdge.target.recent.length &&
            edge.cost <= newEdge.cost
        )
      ) {
        return;
      }
      unvisited.set(destinationKey, newEdge);
      unvisitedByCoordinate.set(
        destinationCoordinateKey,
        new Set([...existingEdges, newEdge])
      );
    });

    current = [...unvisited.values()].reduce((lowest, edge) =>
      edge.cost <= lowest.cost ? edge : lowest
    );
    const currentKey = poseKey(current.target);
    const currentCoordinateKey = coordinateKey(current.target);
    unvisited.delete(currentKey);
    unvisitedByCoordinate.get(currentCoordinateKey)?.delete(current);
    visited.set(currentKey, current);
    if (
      current.target.x === finalDestination.x &&
      current.target.y === finalDestination.y
    ) {
      options.add(current);
    }
  } while (options.size === 0);

  const cheapest = [...options.values()].reduce((lowest, edge) =>
    edge.cost < lowest.cost ? edge : lowest
  );

  return cheapest?.cost;
};

const part1 = (rawInput: string) => {
  const costs = parseInput(rawInput);
  return findLowestCost(costs).toString();
};

const part2 = (rawInput: string) => {
  const costs = parseInput(rawInput);
  return findLowestCost(costs, 4, 10).toString();
};

const input = `
  2413432311323
  3215453535623
  3255245654254
  3446585845452
  4546657867536
  1438598798454
  4457876987766
  3637877979653
  4654967986887
  4564679986453
  1224686865563
  2546548887735
  4322674655533`;

run({
  part1: {
    tests: [
      {
        input,
        expected: "102",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "94",
      },
      {
        input: `
          111111111111
          999999999991
          999999999991
          999999999991
          999999999991`,
        expected: "71",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
