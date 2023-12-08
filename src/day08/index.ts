import run from "aocrunner";

type Direction = "L" | "R";
type Directions = Record<Direction, string>;
const parseInput = (rawInput: string) => {
  const [directions, nodes] = rawInput.split("\n\n");
  return {
    directions: directions.split("") as Direction[],
    nodes: nodes
      .split("\n")
      .reduce<Record<string, Directions>>((nodes, node) => {
        const [, key, L, R] =
          node.match(/([^\s]+)\s=\s\(([^\s]+),\s([^\s]+)\)/) ?? [];
        return {
          ...nodes,
          [key]: { L, R },
        };
      }, {}),
  };
};

const part1 = (rawInput: string) => {
  const input = parseInput(rawInput);
  let currentNode = "AAA";
  let steps = 0;
  const destination = "ZZZ";

  for (; currentNode !== destination; steps++) {
    const direction = input.directions[steps % input.directions.length];
    currentNode = input.nodes[currentNode][direction];
  }

  return steps.toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);
  let currentNodes = Object.keys(input.nodes).filter(
    (name) => name.charAt(2) === "A"
  );

  type MatchLoop = Record<string, number>;
  const matchLoops = currentNodes.reduce<MatchLoop[]>((loops, node) => {
    let currentNode = node;
    let steps = 0;
    const matches: MatchLoop = {};

    for (; steps < 999999; steps++) {
      const index = steps % input.directions.length;
      const direction = input.directions[steps % input.directions.length];
      currentNode = input.nodes[currentNode][direction];
      if (currentNode.charAt(2) === "Z") {
        if (matches[index + currentNode]) {
          matches[index + currentNode + "loop"] = steps + 1;
          break;
        }
        matches[index + currentNode] = steps + 1;
      }
    }
    return [...loops, matches];
  }, []);

  const iterators = matchLoops.map((match) => {
    const entries = Object.entries(match);
    const loopingOffsets = entries.reduce<number[]>(
      (offsets, [, step], index, loopingInput) => {
        offsets.push(step - (loopingInput[index - 1]?.[1] ?? 0));
        return offsets;
      },
      []
    );
    return loopingOffsets[0];
  });

  const steps = iterators.map((value) => value);

  let found = false;
  while (found === false) {
    const max = Math.max(...steps);
    found = steps.reduce((matches, stepValue, index) => {
      while (stepValue < max) {
        stepValue += iterators[index];
      }
      steps[index] = stepValue;
      if (stepValue !== max) {
        return false;
      }
      return matches;
    }, true);
  }

  return steps[0].toString();
};

run({
  part1: {
    tests: [
      {
        input: `
          RL

          AAA = (BBB, CCC)
          BBB = (DDD, EEE)
          CCC = (ZZZ, GGG)
          DDD = (DDD, DDD)
          EEE = (EEE, EEE)
          GGG = (GGG, GGG)
          ZZZ = (ZZZ, ZZZ)`,
        expected: "2",
      },
      {
        input: `
          LLR

          AAA = (BBB, BBB)
          BBB = (AAA, ZZZ)
          ZZZ = (ZZZ, ZZZ)
        `,
        expected: "6",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: `
          LR

          11A = (11B, XXX)
          11B = (XXX, 11Z)
          11Z = (11B, XXX)
          22A = (22B, XXX)
          22B = (22C, 22C)
          22C = (22Z, 22Z)
          22Z = (22B, 22B)
          XXX = (XXX, XXX)`,
        expected: "6",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
