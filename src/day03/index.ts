import run from "aocrunner";

interface SchematicMatch {
  start: number;
  end: number;
  value: string;
}
interface SchematicRow {
  parts: SchematicMatch[];
  symbols: SchematicMatch[];
  length: number;
}

const parseMatch = (match: RegExpMatchArray): SchematicMatch => ({
  start: match.index ?? 0,
  end: (match.index ?? 0) + match[0].length,
  value: match[0],
});
const parseInput = (rawInput: string): SchematicRow[] => {
  return rawInput.split("\n").map((row) => ({
    parts: [...row.matchAll(/\d+/g)].map(parseMatch),
    symbols: [...row.matchAll(/[^\d\.]/g)].map(parseMatch),
    length: row.length,
  }));
};

const part1 = (rawInput: string) => {
  const input = parseInput(rawInput);

  return input
    .reduce((sum, row, index, rows) => {
      const targets: (SchematicRow | undefined)[] = [
        rows[index - 1],
        row,
        rows[index + 1],
      ];
      row.symbols.forEach((symbol) => {
        const range: [number, number] = [symbol.start - 1, symbol.end + 1];
        targets.forEach((target) => {
          let index = 0;
          [...(target?.parts || [])].forEach((part) => {
            if (part.start < range[1] && part.end > range[0]) {
              sum += parseInt(part.value);
              target?.parts.splice(index, 1);
              return;
            }
            index++;
          });
        });
      });
      return sum;
    }, 0)
    .toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);

  return input
    .reduce((sum, row, index, rows) => {
      const targets: (SchematicRow | undefined)[] = [
        rows[index - 1],
        row,
        rows[index + 1],
      ];
      row.symbols.forEach((symbol) => {
        if (symbol.value !== "*") {
          return;
        }
        const range: [number, number] = [symbol.start - 1, symbol.end + 1];
        const gearRatios: number[] = [];
        targets.forEach((target) => {
          [...(target?.parts || [])].forEach((part) => {
            if (part.start < range[1] && part.end > range[0]) {
              gearRatios.push(parseInt(part.value));
            }
          });
        });
        if (gearRatios.length === 2) {
          sum += gearRatios.reduce((ratios, ratio) => ratios * ratio);
        }
      });
      return sum;
    }, 0)
    .toString();
};

const schematic = `
  467..114..
  ...*......
  ..35..633.
  ......#...
  617*......
  .....+.58.
  ..592.....
  ......755.
  ...$.*....
  .664.598..`;
run({
  part1: {
    tests: [
      {
        input: schematic,
        expected: "4361",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: schematic,
        expected: "467835",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
