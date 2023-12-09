import run from "aocrunner";

const parseInput = (rawInput: string) =>
  rawInput
    .split("\n")
    .map((row) => row.split(" ").map((value) => parseInt(value)));

const findDifferences = (input: number[]): [number[], boolean] => {
  const result = input.reduce<[number[], boolean]>(
    (result, value, index) => {
      const nextValue = input[index + 1];
      if (nextValue === undefined) {
        return result;
      }
      const difference = nextValue - value;

      return [[...result[0], difference], difference === 0 ? result[1] : false];
    },
    [[], true]
  );

  if (result[0].length === 1 && !result[1]) {
    result[0].push(result[0][0]);
  }
  return result;
};
const findFirstDifferenceUntilZil = (input: number[]): number[] => {
  const [differences, zeroed] = findDifferences(input);
  return [
    input[0],
    ...(zeroed ? [differences[0]] : findFirstDifferenceUntilZil(differences)),
  ];
};
const findLastDifferenceUntilZil = (input: number[]): number[] => {
  const [differences, zeroed] = findDifferences(input);
  return [
    input[input.length - 1],
    ...(zeroed
      ? [differences[differences.length - 1]]
      : findLastDifferenceUntilZil(differences)),
  ];
};
const part1 = (rawInput: string) => {
  const input = parseInput(rawInput);

  return input
    .reduce((sum, row) => {
      const differences = findLastDifferenceUntilZil(row);
      const rowExtrapolation = differences.reduce(
        (rowSum, value) => rowSum + value
      );
      return sum + rowExtrapolation;
    }, 0)
    .toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);

  return input
    .reduce((sum, row) => {
      const differences = findFirstDifferenceUntilZil(row);
      const rowExtrapolation = differences.reduceRight(
        (rowSum, value) => value - rowSum
      );
      return sum + rowExtrapolation;
    }, 0)
    .toString();
};

const input = `
0 3 6 9 12 15
1 3 6 10 15 21
10 13 16 21 30 45`;

run({
  part1: {
    tests: [
      {
        input,
        expected: "114",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "2",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
