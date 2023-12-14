import run from "aocrunner";

type Entity = "O" | "#";
interface Platform {
  rows: Record<string, Record<string, Entity>>;
  columns: Record<string, Record<string, Entity>>;
  width: number;
  height: number;
}
const parseInput = (rawInput: string) => {
  const rows = rawInput.split("\n");
  const dimensions = {
    width: rows[0].length,
    height: rows.length,
  };
  return rows.reduce<Platform>(
    (platform, row, rowIndex) => {
      [...row.matchAll(/(\#|O)/g)].forEach((match) => {
        const columnIndex = match.index ?? 0;

        platform.rows[rowIndex][columnIndex] = match[0] as Entity;
        platform.columns[columnIndex][rowIndex] = match[0] as Entity;
      });
      return platform;
    },
    {
      ...dimensions,
      rows: [...Array(dimensions.height)].reduce((collection, _, index) => {
        collection[index] = {};
        return collection;
      }, {}),
      columns: [...Array(dimensions.width)].reduce((collection, _, index) => {
        collection[index] = {};
        return collection;
      }, {}),
    }
  );
};

type Sets = keyof Pick<Platform, "columns" | "rows">;
const shiftPlatform = (
  platform: Platform,
  direction: "up" | "down" = "up",
  setKey: Sets = "columns"
) => {
  const alternateKey: Sets = setKey === "columns" ? "rows" : "columns";
  const shift = direction === "up" ? 1 : -1;
  const start =
    direction === "up"
      ? 0
      : (setKey === "columns" ? platform.height : platform.width) - 1;

  Object.entries(platform[setKey]).forEach(([alternateIndex, set]) => {
    const reduction: (
      nextOpenSlot: number,
      currentValue: [string, Entity]
    ) => number = (nextOpenSlot, [setIndex, entity]) => {
      if (entity === "#") {
        return parseInt(setIndex) + shift;
      }
      delete set[setIndex];
      set[nextOpenSlot] = entity;

      delete platform[alternateKey][setIndex][alternateIndex];
      platform[alternateKey][nextOpenSlot][alternateIndex] = entity;

      return nextOpenSlot + shift;
    };
    if (direction === "up") {
      Object.entries(set).reduce<number>(reduction, start);
    } else {
      Object.entries(set).reduceRight<number>(reduction, start);
    }
  });
  return Object.entries(platform.rows)
    .map(
      ([rowIndex, row]) =>
        rowIndex +
        Object.entries(row)
          .map(([columnIndex, char]) => columnIndex + char)
          .join("")
    )
    .join("");
};

const getNorthLoadedWeight = (platform: Platform) =>
  Object.entries(platform.columns).reduce((weight, [x, column]) => {
    return (
      weight +
      Object.entries(column).reduce<number>((columnWeight, [y, entity]) => {
        if (entity === "#") {
          return columnWeight;
        }
        return columnWeight + (platform.height - parseInt(y));
      }, 0)
    );
  }, 0);

const part1 = (rawInput: string) => {
  const platform = parseInput(rawInput);
  shiftPlatform(platform, "up", "columns");
  const platformWeight = getNorthLoadedWeight(platform);
  return platformWeight.toString();
};

const part2 = (inputWithIterations: string) => {
  const [rawInput, iterations] = inputWithIterations.split(",");
  const platform = parseInput(rawInput);
  const actions = [
    () => shiftPlatform(platform, "up"),
    () => shiftPlatform(platform, "up", "rows"),
    () => shiftPlatform(platform, "down"),
    () => shiftPlatform(platform, "down", "rows"),
  ];

  const actionsToRun = (iterations ? parseInt(iterations) : 1000000000) * 4;
  const results = new Map<string, number>();
  for (let index = 0; index < actionsToRun; index++) {
    const hash = actions[index % 4]();

    const key = `${index % 4}-${hash}`;
    if (results.has(key)) {
      const loop = index - (results.get(key) as number);
      index = actionsToRun - ((actionsToRun - index) % loop);
      continue;
    }
    results.set(key, index);
  }

  return iterations
    ? debugPlatform(platform)
    : getNorthLoadedWeight(platform).toString();
};

const debugPlatform = (platform: Platform) => {
  return Object.values(platform.rows)
    .map((row, rowIndex) => {
      const rowOutput = Array(platform.width).fill(".");
      Object.entries(row).forEach(([columnIndex, entity]) => {
        rowOutput[parseInt(columnIndex)] = entity;
      });
      rowOutput.forEach((character, columnIndex) => {
        if (character === ".") {
          if (platform.columns[columnIndex][rowIndex]) {
            throw new Error(
              `Should not have found value at [${columnIndex},${rowIndex}]`
            );
          }
        } else {
          if (platform.columns[columnIndex][rowIndex] !== character) {
            throw new Error(
              `Found wrong value at [${columnIndex},${rowIndex}]`
            );
          }
        }
      });
      return rowOutput.join("");
    })
    .join("\n");
};

const input = `
  O....#....
  O.OO#....#
  .....##...
  OO.#O....O
  .O.....O#.
  O.#..O.#.#
  ..O..#O..O
  .......O..
  #....###..
  #OO..#....`;

run({
  part1: {
    tests: [
      {
        input,
        expected: "136",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: input + ",1",
        expected: `.....#....
....#...O#
...OO##...
.OO#......
.....OOO#.
.O#...O#.#
....O#....
......OOOO
#...O###..
#..OO#....`,
      },
      {
        input: input + ",2",
        expected: `.....#....
....#...O#
.....##...
..O#......
.....OOO#.
.O#...O#.#
....O#...O
.......OOO
#..OO###..
#.OOO#...O`,
      },
      {
        input: input + ",3",
        expected: `.....#....
....#...O#
.....##...
..O#......
.....OOO#.
.O#...O#.#
....O#...O
.......OOO
#...O###.O
#.OOO#...O`,
      },
      {
        input,
        expected: `64`,
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
