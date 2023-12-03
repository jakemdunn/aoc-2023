import run from "aocrunner";

const DIGIT_STRINGS = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};
type DIGIT_KEY = keyof typeof DIGIT_STRINGS;

const reverseString = (input?:string) => input?.split('').reverse().join('');
const firstNumericRegex = new RegExp(
  `(\\d|${Object.keys(DIGIT_STRINGS).join("|")})`
);
const lastNumericRegex = new RegExp(
  `(\\d|${reverseString(Object.keys(DIGIT_STRINGS).join("|"))})`
);

const parseInput = (rawInput: string) => {
  return rawInput.trim().split("\n");
};

const part1 = (rawInput: string) => {
  return parseInput(rawInput)
    .reduce((sum, row) => {
      const digits = [...row.matchAll(/\d/g)];
      const first = digits[0][0];
      const last = digits[digits.length - 1][0];
      return sum + parseFloat(first + last);
    }, 0)
    .toString();
};

const part2 = (rawInput: string) => {
  return parseInput(rawInput)
    .reduce((sum, row) => {
      const firstDigit = row.match(firstNumericRegex)?.[0];
      const lastDigit = reverseString(reverseString(row)?.match(lastNumericRegex)?.[0]);

      if (!firstDigit || !lastDigit) {
        throw new Error("Missing a match");
      }
      const first =  DIGIT_STRINGS[firstDigit as DIGIT_KEY] ?? firstDigit;
      const last = DIGIT_STRINGS[lastDigit as DIGIT_KEY] ?? lastDigit;
      return sum + parseFloat(first + last);
    }, 0)
    .toString();
};

run({
  part1: {
    tests: [
      {
        input: `
          1abc2
          pqr3stu8vwx
          a1b2c3d4e5f
          treb7uchet`,
        expected: "142",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: `
          two1nine
          eightwothree
          abcone2threexyz
          xtwone3four
          4nineeightseven2
          zoneight234
          7pqrstsixteen
        `,
        expected: "281",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
