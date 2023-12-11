import run from "aocrunner";

type GalaxyRecord = Record<number, number>;
interface Galaxies {
  rows: GalaxyRecord;
  columns: GalaxyRecord;
}
const parseInput = (rawInput: string) =>
  rawInput.split("\n").reduce<Galaxies>(
    (galaxies, row, rowIndex) => {
      const rowGalaxies = [...row.matchAll(/#/g)];
      rowGalaxies.forEach((match: RegExpMatchArray) => {
        const columnIndex = match.index as number;
        galaxies.rows[rowIndex] = (galaxies.rows[rowIndex] ?? 0) + 1;
        galaxies.columns[columnIndex] =
          (galaxies.columns[columnIndex] ?? 0) + 1;
      });
      return galaxies;
    },
    { rows: {}, columns: {} }
  );

const expandGalaxy = (
  records: GalaxyRecord,
  expansion = 2
): [number, number][] => {
  const expanded = Object.entries(records).reduce<GalaxyRecord>(
    (expanded, [key, galaxies], index) => {
      const currentIndex = parseInt(key);
      const difference = (currentIndex - index) * (expansion - 1);
      const newIndex = currentIndex + difference;
      expanded[newIndex] = galaxies;
      return expanded;
    },
    {}
  );
  return Object.entries(expanded).map(
    ([key, galaxies]) => [parseInt(key), galaxies] as [number, number]
  );
};

const getDistances = (values: [number, number][]): number => {
  let distance = 0;
  while (values.length > 1) {
    const [currentIndex, currentCount] = values.pop() as [number, number];
    values.forEach(([index, count]) => {
      distance += (currentIndex - index) * count * currentCount;
    });
  }
  return distance;
};

const part1 = (rawInput: string) => {
  const galaxies = parseInput(rawInput);
  const columnValues = expandGalaxy(galaxies.columns);
  const rowValues = expandGalaxy(galaxies.rows);

  return (getDistances(columnValues) + getDistances(rowValues)).toString();
};

const part2 = (specialInput: string) => {
  const [rawInput, multipliyer] = specialInput.split(",");
  const galaxies = parseInput(rawInput);
  const columnValues = expandGalaxy(
    galaxies.columns,
    parseInt(multipliyer ?? "1000000")
  );
  const rowValues = expandGalaxy(
    galaxies.rows,
    parseInt(multipliyer ?? "1000000")
  );

  return (getDistances(columnValues) + getDistances(rowValues)).toString();
};

run({
  part1: {
    tests: [
      {
        input: `
        ...#......
        .......#..
        #.........
        ..........
        ......#...
        .#........
        .........#
        ..........
        .......#..
        #...#.....`,
        expected: "374",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: `
        ...#......
        .......#..
        #.........
        ..........
        ......#...
        .#........
        .........#
        ..........
        .......#..
        #...#.....,10`,
        expected: "1030",
      },
      {
        input: `
        ...#......
        .......#..
        #.........
        ..........
        ......#...
        .#........
        .........#
        ..........
        .......#..
        #...#.....,100`,
        expected: "8410",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
