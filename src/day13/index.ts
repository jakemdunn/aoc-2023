import run from "aocrunner";
import { memoize } from "../utils/index.js";

const parseInput = (rawInput: string) =>
  rawInput.split("\n\n").map((pattern) => {
    const patternRows = pattern.split("\n");
    const rows = Array(patternRows.length).fill(BigInt(0));
    const rowsReversed = Array(patternRows.length).fill(BigInt(0));
    const columns = Array(patternRows[0].length).fill(BigInt(0));
    const columnsReversed = Array(patternRows[0].length).fill(BigInt(0));

    patternRows.forEach((row, rowIndex) =>
      row.split("").forEach((terrain, columnIndex) => {
        if (terrain === "#") {
          rows[rowIndex] |=
            BigInt(1) << BigInt(columns.length - 1 - columnIndex);
          columns[columnIndex] |=
            BigInt(1) << BigInt(rows.length - 1 - rowIndex);
          rowsReversed[rowIndex] |= BigInt(1) << BigInt(columnIndex);
          columnsReversed[columnIndex] |= BigInt(1) << BigInt(rowIndex);
        }
      })
    );

    return { rows, columns, rowsReversed, columnsReversed, pattern };
  });

const binaryOnes = memoize(
  (length: number) => BigInt(2) ** BigInt(length) - BigInt(1)
);
const getMask = memoize((maskLength: number, binaryLength: number): bigint => {
  return binaryOnes(maskLength) << BigInt(binaryLength - maskLength);
});

type SearchFunction = (comparison: bigint) => number;
const findFold = (
  matrix: bigint[],
  reversed: bigint[],
  length: number,
  searchFunction: SearchFunction,
  errorTolerance = 0
): number => {
  for (let offset = -length + 2; offset < length - 1; offset += 2) {
    const slice: [number, number] = [
      Math.max(offset, 0),
      Math.min(offset + length, length),
    ];
    const mask = getMask((slice[1] - slice[0]) * 0.5, length - slice[0]);
    const mirrored = matrix.reduce((sum, group, index) => {
      return (
        sum +
        searchFunction((group ^ (reversed[index] >> BigInt(offset))) & mask)
      );
    }, 0);
    if (mirrored === errorTolerance) {
      return (length - offset) / 2 + offset;
    }
  }

  return -1;
};

const sumOfAllFolds = (
  patterns: ReturnType<typeof parseInput>,
  searchFunction: SearchFunction,
  faultTolerance = 0
) => {
  return patterns.reduce(
    (sum, { rows, rowsReversed, columns, columnsReversed, pattern }) => {
      const rowFold = findFold(
        rows,
        rowsReversed,
        columns.length,
        searchFunction,
        faultTolerance
      );
      if (rowFold !== -1) {
        return sum + rowFold;
      }
      const columnFold =
        rowFold === -1
          ? findFold(
              columns,
              columnsReversed,
              rows.length,
              searchFunction,
              faultTolerance
            )
          : -1;
      if (columnFold === -1) {
        throw new Error(`no folds found for ${pattern}`);
      }
      return sum + columnFold * 100;
    },
    0
  );
};
const part1 = (rawInput: string) => {
  const patterns = parseInput(rawInput);

  return sumOfAllFolds(patterns, (c) => Number(c)).toString();
};

const part2 = (rawInput: string) => {
  const patterns = parseInput(rawInput);

  const numberOfSmudges = (input: bigint) =>
    Number(input).toString(2).match(/1/g)?.length ?? 0;

  return sumOfAllFolds(patterns, numberOfSmudges, 1).toString();
};

const input = `
  #.##..##.
  ..#.##.#.
  ##......#
  ##......#
  ..#.##.#.
  ..##..##.
  #.#.##.#.

  #...##..#
  #....#..#
  ..##..###
  #####.##.
  #####.##.
  ..##..###
  #....#..#`;
run({
  part1: {
    tests: [
      {
        input,
        expected: "405",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "400",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
