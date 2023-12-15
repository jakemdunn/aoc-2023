import run from "aocrunner";

const parseInput = (rawInput: string) => rawInput.split(",");
const getHash = (input: string) =>
  input.split("").reduce((currentValue, character) => {
    const ascii = currentValue + character.charCodeAt(0);
    return (ascii * 17) % 256;
  }, 0);

const part1 = (rawInput: string) => {
  const input = parseInput(rawInput);
  return input.reduce((sum, sequence) => sum + getHash(sequence), 0).toString();
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput);
  const boxes: Record<number, Map<string, number>> = {};
  input.forEach((stepInput) => {
    const [, label, instruction, focalLength] = stepInput.match(
      /^(.+?)([\-\=])(.*)$/
    ) as RegExpMatchArray;
    const boxIndex = getHash(label);
    const focalValue = instruction === "=" ? parseInt(focalLength) : undefined;

    if (!focalValue) {
      boxes[boxIndex]?.delete(label);
    } else {
      if (!boxes[boxIndex]) {
        boxes[boxIndex] = new Map();
      }
      boxes[boxIndex].set(label, focalValue);
    }
  });

  return Object.entries(boxes)
    .reduce((focusPower, [boxNumber, box]) => {
      return [...box.entries()].reduce((boxPower, [, focalValue], index) => {
        return boxPower + (parseInt(boxNumber) + 1) * (index + 1) * focalValue;
      }, focusPower);
    }, 0)
    .toString();
};

const input = `rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7`;
run({
  part1: {
    tests: [
      {
        input: `HASH`,
        expected: "52",
      },
      {
        input,
        expected: "1320",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "145",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
