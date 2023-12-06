import run from "aocrunner";

const parseInput = (rawInput: string, parseRow: (row: string) => string[]) => {
  const [times, distances] = rawInput.split("\n").map(parseRow);

  return times.map((time, index) => ({
    time: parseInt(time),
    distance: parseInt(distances[index]),
  }));
};

// x = hold
// y = distance
// t = total time
// y + 1 = (t - x)x
// Solve for X
// x = ((t-Math.sqrt(t^2-4(y+1)))/2),
// x = ((t+Math.sqrt(t^2-4(y+1)))/2)

const findPossibleWins = (input: ReturnType<typeof parseInput>) => {
  return input
    .reduce((sum, race) => {
      const minHold =
        0.5 *
        (race.time -
          Math.sqrt(Math.pow(race.time, 2) - 4 * (race.distance + 1)));
      const maxHold =
        0.5 *
        (race.time +
          Math.sqrt(Math.pow(race.time, 2) - 4 * (race.distance + 1)));
      return sum * (Math.floor(maxHold) - Math.ceil(minHold) + 1);
    }, 1)
    .toString();
};

const part1 = (rawInput: string) => {
  const input = parseInput(rawInput, (row) =>
    [...row.matchAll(/\d+/g)].map((match) => match[0])
  );
  return findPossibleWins(input);
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput, (row) => [row.replace(/\D/g, "")]);
  return findPossibleWins(input);
};

const input = `
  Time:      7  15   30
  Distance:  9  40  200`;

run({
  part1: {
    tests: [
      {
        input,
        expected: "288",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "71503",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
