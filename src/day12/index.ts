import run from "aocrunner";

const parseInput = (rawInput: string, iterations = 1) =>
  rawInput.split("\n").map((row) => {
    const [patternSingle, groupsSingle] = row.split(" ");
    const pattern = Array(iterations).fill(patternSingle).join("?");
    const groups = Array(iterations).fill(groupsSingle).join(",");
    const patternEnd = BigInt(1) << BigInt(pattern.length - 1);
    const { operational, damaged } = pattern.split("").reduce(
      ({ operational, damaged }, character, index, input) => ({
        operational:
          character === "."
            ? operational | (patternEnd >> BigInt(index))
            : operational,
        damaged:
          character === "#" ? damaged | (patternEnd >> BigInt(index)) : damaged,
      }),
      { operational: BigInt(0), damaged: BigInt(0) }
    );
    return {
      pattern,
      operational,
      damaged,
      groups: groups.split(",").map((int) => parseInt(int)),
    };
  });

const binaryOnes = (length: number) => BigInt(2) ** BigInt(length) - BigInt(1);
const masks: Record<string, bigint> = {};
const getMask = (maskLength: number, rowLength: number): bigint => {
  const key = `${maskLength}-${rowLength}`;
  if (!masks[key]) {
    masks[key] = binaryOnes(maskLength) << BigInt(rowLength - maskLength);
  }
  return masks[key];
};
const getCountOfAllValidOptions = (input: ReturnType<typeof parseInput>) => {
  return input
    .reduce((validOptionsSum, { operational, damaged, groups, pattern }) => {
      const [offsets, sum] = groups.reduce<[number[], number]>(
        ([groupOffsets, position], group, index) => [
          [...groupOffsets, group + position],
          group + position + (index < groups.length - 1 ? 1 : 0),
        ],
        [[], 0]
      );
      const fullBuffer = pattern.length - sum;
      let groupBinary = groups.reduce((springs, group, index) => {
        return (
          springs |
          (binaryOnes(group) << BigInt(pattern.length - offsets[index]))
        );
      }, BigInt(0));
      const isValidOption = (option: bigint, mask = ~BigInt(0)) => {
        const inverse = ~option;
        const valid =
          ((inverse | operational) & mask) === (inverse & mask) &&
          ((option | damaged) & mask) === (option & mask);
        return valid;
      };
      const memoization = new Map<string, number>();
      const countValidOptions = (
        option: bigint,
        maskSize: number,
        buffer: number,
        groupIndex: number
      ) => {
        let validOptions = 0;
        const mask = getMask(maskSize, pattern.length);
        const memoizationKey = `${
          option & ~mask
        }-${maskSize}-${buffer}-${groupIndex}`;
        if (memoization.has(memoizationKey)) {
          return memoization.get(memoizationKey) as number;
        }
        for (let offset = 0; offset <= buffer; offset++) {
          const offsetMaskSize = maskSize + groups[groupIndex] + offset + 1;
          const offsetOption =
            ((option & ~mask) >> BigInt(offset)) | (option & mask);
          const offsetMask = getMask(offsetMaskSize, pattern.length);
          if (groupIndex === groups.length - 1) {
            const valid = isValidOption(offsetOption);
            validOptions += valid ? 1 : 0;
          } else {
            const valid = isValidOption(offsetOption, offsetMask);
            if (!valid) {
              continue;
            }
          }
          const bufferAfterGroup = buffer - offset;
          if (bufferAfterGroup >= 0 && groupIndex < groups.length - 1) {
            validOptions += countValidOptions(
              offsetOption,
              maskSize + groups[groupIndex] + offset + 1,
              bufferAfterGroup,
              groupIndex + 1
            );
          }
        }
        memoization.set(memoizationKey, validOptions);
        return validOptions;
      };
      const validPatternOptions = countValidOptions(
        groupBinary,
        0,
        fullBuffer,
        0
      );
      return validOptionsSum + validPatternOptions;
    }, 0)
    .toString();
};
const part1 = (rawInput: string) => {
  const input = parseInput(rawInput);
  return getCountOfAllValidOptions(input);
};

const part2 = (rawInput: string) => {
  const input = parseInput(rawInput, 5);
  return getCountOfAllValidOptions(input);
};

const lineInput = `?###???????? 3,2,1`;
const fullInput = `
  ???.### 1,1,3
  .??..??...?##. 1,1,3
  ?#?#?#?#?#?#?#? 1,3,1,6
  ????.#...#... 4,1,1
  ????.######..#####. 1,6,5
  ?###???????? 3,2,1`;
run({
  part1: {
    tests: [
      {
        input: lineInput,
        expected: "10",
      },
      {
        input: fullInput,
        expected: "21",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input: lineInput,
        expected: "506250",
      },
      {
        input: fullInput,
        expected: "525152",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
