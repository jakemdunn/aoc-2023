import run from "aocrunner";

type MapValues = {
  min: number;
  max: number;
  offset: number;
};
type Maps = Record<
  string,
  {
    target: string;
    values: MapValues[];
  }
>;
type Range = [number, number];
const parseMap = (maps: Maps, section: string): Maps => {
  const lines = section.split("\n");
  const conversion = lines.shift()?.match(/^(.+?)-to-(.+?)\smap:$/);
  if (!conversion) {
    throw new Error("Bad Input");
  }
  return {
    ...maps,
    [conversion[1]]: {
      target: conversion[2],
      values: lines
        .reduce<MapValues[]>((values, line) => {
          const [destination, source, range] = line
            .split(" ")
            .map((index) => parseInt(index));
          return [
            ...values,
            {
              min: source,
              max: source + range,
              offset: destination - source,
            },
          ];
        }, [])
        .sort((a, b) => a.min - b.min),
    },
  };
};

const parseInput = (
  rawInput: string,
  parseSeeds: (seedInput: string) => Range[]
) => {
  const sections = rawInput.split("\n\n");
  const seeds = parseSeeds(sections.shift() ?? "");
  return {
    seeds,
    conversions: sections.reduce<Maps>(parseMap, {}),
  };
};

const splitRangesByConversions = (
  sources: Range[],
  conversions: MapValues[]
): Range[] => {
  return sources.reduce<Range[]>((splits, source) => {
    const sourceSplits: Range[] = [];
    let lowerBound = source[0];
    const upperBound = source[0] + source[1];
    for (let index = 0; index < conversions.length; index++) {
      const { min, max, offset } = conversions[index];
      if (max > lowerBound && min < upperBound) {
        if (min > lowerBound) {
          sourceSplits.push([lowerBound, min - lowerBound]);
        }
        const conversionLower = Math.max(min, lowerBound);
        const conversionUpper = Math.min(max, upperBound);
        lowerBound = conversionUpper;
        sourceSplits.push([
          conversionLower + offset,
          conversionUpper - conversionLower,
        ]);
      }
    }
    if (lowerBound < upperBound) {
      sourceSplits.push([lowerBound, upperBound - lowerBound]);
    }
    return [...splits, ...sourceSplits];
  }, []);
};

const convertToRanges = (
  maps: Maps,
  source: string,
  ranges: Range[],
  target: string
): Range[] => {
  const convertedRanges = splitRangesByConversions(ranges, maps[source].values);
  return maps[source].target === target
    ? convertedRanges
    : convertToRanges(maps, maps[source].target, convertedRanges, target);
};

const getLowestLocation = (input: ReturnType<typeof parseInput>) => {
  const ranges = convertToRanges(
    input.conversions,
    "seed",
    input.seeds,
    "location"
  );
  const lowest = ranges.reduce(
    (lowest, range) => Math.min(lowest, range[0]),
    Number.MAX_SAFE_INTEGER
  );

  return lowest.toString();
};
const part1 = (rawInput: string) => {
  const parseSeeds = (seeds: string): Range[] =>
    [...(seeds.matchAll(/\d+/g) ?? [])].map((seed) => [parseInt(seed[0]), 1]);
  const input = parseInput(rawInput, parseSeeds);
  return getLowestLocation(input);
};

const part2 = (rawInput: string) => {
  const parseSeeds = (seeds: string): Range[] =>
    [...(seeds.matchAll(/(\d+)\s(\d+)/g) ?? [])].map<Range>((seed) => [
      parseInt(seed[1]),
      parseInt(seed[2]),
    ]);
  const input = parseInput(rawInput, parseSeeds);
  return getLowestLocation(input);
};

const input = `
  seeds: 79 14 55 13

  seed-to-soil map:
  50 98 2
  52 50 48

  soil-to-fertilizer map:
  0 15 37
  37 52 2
  39 0 15

  fertilizer-to-water map:
  49 53 8
  0 11 42
  42 0 7
  57 7 4

  water-to-light map:
  88 18 7
  18 25 70

  light-to-temperature map:
  45 77 23
  81 45 19
  68 64 13

  temperature-to-humidity map:
  0 69 1
  1 0 69

  humidity-to-location map:
  60 56 37
  56 93 4`;

run({
  part1: {
    tests: [
      {
        input,
        expected: "35",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "46",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
