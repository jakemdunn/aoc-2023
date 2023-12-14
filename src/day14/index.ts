import run from "aocrunner";

type Entity = "O" | "#";
interface Platform {
  rows: Record<string, Record<string, Entity>>;
  columns: Record<string, Record<string, Entity>>;
  width: number;
  height: number;
  blankHash: string;
}
const parseInput = (rawInput: string) => {
  const rows = rawInput.split("\n");
  const dimensions = {
    width: rows[0].length,
    height: rows.length,
    blankHash: rows.join("").replace(/[^.]/g, "."),
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

type Sets = keyof Pick<Platform, "columns" | "rows">;
const setCharacter = (input: string, swap: string, index: number) =>
  input.substring(0, index) + swap + input.substring(index + swap.length);
const updateHash = (
  hash: string,
  entity: string,
  setKey: Sets,
  setIndex: string,
  alternateIndex: string,
  width: number
) => {
  const hashOffset =
    setKey === "columns"
      ? parseInt(alternateIndex) + parseInt(setIndex) * width
      : parseInt(setIndex) + parseInt(alternateIndex) * width;
  return setCharacter(hash, entity, hashOffset);
};
const shiftSet = (
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

  return Object.entries(platform[setKey]).reduce(
    (fullHash, [alternateIndex, set]) => {
      const reduction: (
        previousValue: [string, number],
        currentValue: [string, Entity]
      ) => [string, number] = ([setHash, nextOpenSlot], [setIndex, entity]) => {
        if (entity === "#") {
          return [
            updateHash(
              setHash,
              entity,
              setKey,
              setIndex,
              alternateIndex,
              platform.width
            ),
            parseInt(setIndex) + shift,
          ];
        }
        delete set[setIndex];
        set[nextOpenSlot] = entity;

        delete platform[alternateKey][setIndex][alternateIndex];
        platform[alternateKey][nextOpenSlot][alternateIndex] = entity;

        return [
          updateHash(
            setHash,
            entity,
            setKey,
            nextOpenSlot.toString(),
            alternateIndex,
            platform.width
          ),
          nextOpenSlot + shift,
        ];
      };
      return direction === "up"
        ? Object.entries(set).reduce<[string, number]>(reduction, [
            fullHash,
            start,
          ])[0]
        : Object.entries(set).reduceRight<[string, number]>(reduction, [
            fullHash,
            start,
          ])[0];
    },
    platform.blankHash
  );
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
  // answer: 111979
  const platform = parseInput(rawInput);
  shiftSet(platform, "up", "columns");
  const platformWeight = getNorthLoadedWeight(platform);
  return platformWeight.toString();
};

const part2 = (inputWithIterations: string) => {
  const [rawInput, iterations] = inputWithIterations.split(",");
  const platform = parseInput(rawInput);
  const actions = [
    () => shiftSet(platform, "up"),
    () => shiftSet(platform, "up", "rows"),
    () => shiftSet(platform, "down"),
    () => shiftSet(platform, "down", "rows"),
  ];

  const actionsToRun = (iterations ? parseInt(iterations) : 1000000000) * 4;
  const results = new Map<string, number>();
  for (let index = 0; index < actionsToRun; index++) {
    const hash = actions[index % 4]();

    const key = `${index % 4}-${hash}`;
    if (results.has(key)) {
      const loop = index - (results.get(key) as number);
      while (index < actionsToRun) {
        index += loop;
      }
      index -= loop;
      // console.log(
      //   `duplicate key found. Applying loop of [${loop}] from [${results.get(
      //     key
      //   )}-${beforeLoop}] towards [${actionsToRun}], arrived at [${index}]`
      // );
      continue;
    }
    results.set(key, index);
  }

  return iterations
    ? debugPlatform(platform)
    : getNorthLoadedWeight(platform).toString();
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
