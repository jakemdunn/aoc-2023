import run from "aocrunner";

interface Cubes {
  red: number;
  green: number;
  blue: number;
}
type CubeKey = keyof Cubes;

const parseInput = (rawInput: string): [number, Cubes][] => {
  return rawInput.split("\n").map<[number, Cubes]>((game) => {
    const gameRegex = /Game\s(\d+):\s/;
    const gameNumber = parseInt(game.match(gameRegex)?.[1] ?? "0");
    return [
      gameNumber,
      game
        .replace(gameRegex, "")
        .split(";")
        .reduce<Cubes>(
          (cubes, round) => {
            const scores = [...round.matchAll(/(\d+)\s([^\d,\s]+)/g)];
            scores.forEach((score) => {
              const key = score[2] as CubeKey;
              cubes[key] = Math.max(cubes[key], parseInt(score[1]));
            });

            return cubes;
          },
          {
            red: 0,
            green: 0,
            blue: 0,
          }
        ),
    ];
  });
};

const part1 = (rawInput: string) => {
  const input = parseInput(rawInput);
  const maxCubes: Cubes = {
    red: 12,
    green: 13,
    blue: 14,
  };

  const colors = Object.keys(maxCubes) as CubeKey[];
  const possible = input.reduce((sum, [gameNumber, cubes]) => {
    return colors.some((color) => (cubes[color] ?? 0) > maxCubes[color])
      ? sum
      : sum + gameNumber;
  }, 0);

  return possible.toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);
  return input
    .reduce(
      (sum, [gameNumer, cubes]) =>
        sum + Object.values(cubes).reduce((power, value) => power * value),
      0
    )
    .toString();
};

run({
  part1: {
    tests: [
      {
        input: `
          Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
          Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
          Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
          Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
          Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green`,
        expected: "8",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: `
          Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
          Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
          Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
          Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
          Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green`,
        expected: "2286",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
