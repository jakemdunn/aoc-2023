import run from "aocrunner";
type CardKey =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "T"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3"
  | "2";
type CardValues = Record<CardKey, string>;
type HandType =
  | "fiveOfAKind"
  | "fourOfAKind"
  | "fullHouse"
  | "threeOfAKind"
  | "twoPair"
  | "onePair"
  | "highCard";
const HAND_OFFSETS: Record<HandType, number> = {
  fiveOfAKind: 0,
  fourOfAKind: 5,
  fullHouse: 10,
  threeOfAKind: 15,
  twoPair: 20,
  onePair: 25,
  highCard: 30,
};

const replaceCharAt = (input: string, index: number, replacement: string) => {
  return (
    input.substring(0, index) +
    replacement +
    input.substring(index + replacement.length)
  );
};
const parseInput = (
  rawInput: string,
  getSortedHand: typeof sortCards,
  cardValues: CardValues
) =>
  rawInput
    .split("\n")
    .map((row) => {
      const [hand, bid] = row.split(" ");
      const cards = hand.split("").reduce<Partial<Record<CardKey, number>>>(
        (counts, card) => ({
          ...counts,
          [card]: (counts[card as CardKey] ?? 0) + 1,
        }),
        {}
      );
      const sortedHand = getSortedHand(cards, cardValues);
      let type: HandType = "highCard";
      if (sortedHand[0][1] === 5) {
        type = "fiveOfAKind";
      } else if (sortedHand[0][1] === 4) {
        type = "fourOfAKind";
      } else if (sortedHand[0][1] === 3 && sortedHand[1][1] === 2) {
        type = "fullHouse";
      } else if (sortedHand[0][1] === 3) {
        type = "threeOfAKind";
      } else if (sortedHand[0][1] === 2 && sortedHand[1][1] === 2) {
        type = "twoPair";
      } else if (sortedHand[0][1] === 2 && sortedHand[1][1] === 1) {
        type = "onePair";
      }
      // Format (characters represent type): 5555544444FHHHH333332PPPP2222211111
      const power = hand.split("").reduce((value, card, index) => {
        return replaceCharAt(
          value,
          HAND_OFFSETS[type] + index,
          cardValues[card as CardKey]
        );
      }, "-----------------------------------");

      return {
        hand,
        bid: parseInt(bid),
        power,
      };
    })
    .sort(({ power: a }, { power: b }) => {
      if (b > a) {
        return -1;
      }
      if (b < a) {
        return 1;
      }
      return 0;
    })
    .reduce((sum, hand, index) => {
      return sum + hand.bid * (index + 1);
    }, 0)
    .toString();

const sortCards = (
  cards: Partial<Record<CardKey, number>>,
  cardValues: CardValues
): [string, number][] => {
  return Object.entries(cards).sort(([aKey, a], [bKey, b]) => {
    const countSort = b - a;
    if (countSort !== 0) {
      return countSort;
    }
    if (cardValues[bKey as CardKey] < cardValues[aKey as CardKey]) {
      return -1;
    }
    if (cardValues[bKey as CardKey] > cardValues[aKey as CardKey]) {
      return 1;
    }
    return 0;
  });
};

const part1 = (rawInput: string) => {
  const cardValues: CardValues = {
    A: "M",
    K: "L",
    Q: "K",
    J: "J",
    T: "I",
    "9": "H",
    "8": "G",
    "7": "F",
    "6": "E",
    "5": "D",
    "4": "C",
    "3": "B",
    "2": "A",
  };
  return parseInput(rawInput, sortCards, cardValues);
};

const part2 = (rawInput: string) => {
  const cardValues: CardValues = {
    A: "M",
    K: "L",
    Q: "K",
    J: "A",
    T: "J",
    "9": "I",
    "8": "H",
    "7": "G",
    "6": "F",
    "5": "E",
    "4": "D",
    "3": "C",
    "2": "B",
  };
  return parseInput(
    rawInput,
    (cards) => {
      const jacks = cards["J"] ?? 0;
      cards["J"] = 0;
      const sorted = sortCards(cards, cardValues);
      sorted[0][1] += jacks;
      return sorted;
    },
    cardValues
  );
};

const input = `
  32T3K 765
  T55J5 684
  KK677 28
  KTJJT 220
  QQQJA 483`;
run({
  part1: {
    tests: [
      {
        input,
        expected: "6440",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "5905",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: false,
});
