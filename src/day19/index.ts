import run from "aocrunner";

const finalDestinations = ["A", "R"];
const startingKey = "in";
type Ratings = "x" | "m" | "a" | "s";
interface Part {
  target: string;
  history: string[];
  processing: boolean;
  ratings: Record<string, number>;
}
interface Instruction {
  property?: string;
  operator?: ">" | "<";
  value?: number;
  destination: string;
}
interface Workflow {
  label: string;
  instructions: Instruction[];
}
type Workflows = Record<string, Workflow>;
const parseInput = (rawInput: string) => {
  const [workflowsInput, partsInput] = rawInput.split("\n\n");
  const workflows = workflowsInput
    .split("\n")
    .reduce<Workflows>((combined, row) => {
      const [, label, instructionsInput] = row.match(
        /([^\{]+)\{(.*)\}/
      ) as RegExpMatchArray;
      const instructions = instructionsInput.split(",").map((instruction) => {
        const instructionMatch = instruction.match(/^(.+)([><])(.+):(.+)/);
        if (instructionMatch) {
          return {
            property: instructionMatch[1],
            operator: instructionMatch[2] as ">" | "<",
            value: parseInt(instructionMatch[3]),
            destination: instructionMatch[4],
          };
        }
        return {
          destination: instruction,
        };
      });

      return {
        ...combined,
        [label]: {
          label,
          instructions,
        },
      };
    }, {});

  const parts = partsInput.split("\n").map<Part>((row) => {
    const ratings = row
      .replace(/[\{\}]/g, "")
      .split(",")
      .reduce<Part["ratings"]>((part, prop) => {
        const [key, value] = prop.split("=");
        return {
          ...part,
          [key]: parseInt(value),
        };
      }, {});
    return {
      target: startingKey,
      history: [],
      processing: true,
      ratings,
    };
  });

  return {
    workflows,
    parts,
  };
};

const processWorkflow = (workflow: Workflow, part: Part) => {
  if (!part.processing) {
    return;
  }
  part.history.push(part.target);
  for (let index = 0; index < workflow.instructions.length; index++) {
    const instruction = workflow.instructions[index];
    if (!instruction.property || !instruction.operator || !instruction.value) {
      part.target = instruction.destination;
      break;
    }
    const matches =
      instruction.operator === ">"
        ? part.ratings[instruction.property] > instruction.value
        : part.ratings[instruction.property] < instruction.value;
    if (matches) {
      part.target = instruction.destination;
      break;
    }
  }
  if (finalDestinations.includes(part.target)) {
    part.processing = false;
  }
};

const part1 = (rawInput: string) => {
  const { parts, workflows } = parseInput(rawInput);

  while (parts.some(({ processing }) => processing)) {
    parts.forEach((part) => {
      if (part.processing && !workflows[part.target]) {
        throw new Error("Strange things are afoot at the Circle K");
      }
      processWorkflow(workflows[part.target], part);
    });
  }

  return parts
    .reduce((sum, part) => {
      if (part.target === "A") {
        return Object.values(part.ratings).reduce((ratingsSum, rating) => {
          return ratingsSum + rating;
        }, sum);
      }
      return sum;
    }, 0)
    .toString();
};

type PathConstraint = Instruction & {
  negative?: boolean;
};
interface PossiblePath {
  parent: string;
  current: string;
  instructionIndex: number;
  finalWorkflow: string;
  constraints: PathConstraint[];
  validRanges: Record<Ratings, [number, number]>;
}
type MergedPath = Omit<PossiblePath, "validRanges"> & {
  validRanges: Record<Ratings, [number, number][]>;
};

type WorkflowsByTarget = Record<
  string,
  { workflow: Workflow; instructionIndex: number }[]
>;
const updateRanges = (
  ranges: PossiblePath["validRanges"],
  instruction: Instruction,
  negative = false
) => {
  if (!instruction.operator || !instruction.property || !instruction.value) {
    return ranges;
  }
  const validRanges: PossiblePath["validRanges"] = {
    x: [...ranges.x],
    m: [...ranges.m],
    a: [...ranges.a],
    s: [...ranges.s],
  };
  const rating = instruction.property as Ratings;
  const offset = negative ? 0 : 1;
  if (
    (!negative && instruction.operator === "<") ||
    (negative && instruction.operator == ">")
  ) {
    validRanges[rating][1] = Math.min(
      instruction.value - offset,
      validRanges[rating][1]
    );
  } else {
    validRanges[rating][0] = Math.max(
      instruction.value + offset,
      validRanges[rating][0]
    );
  }
  return validRanges;
};
const getWorkflowPossibitiesForPath = (
  path: PossiblePath,
  workflows: Workflows,
  workflowsByTarget: WorkflowsByTarget
): PossiblePath[] => {
  const currentWorkflow = workflows[path.parent];
  const updatedPaths: PossiblePath[] = [];
  const newConstraints: PathConstraint[] = [];
  let validRanges = path.validRanges;
  for (let index = 0; index < currentWorkflow.instructions.length; index++) {
    const instruction = currentWorkflow.instructions[index];
    if (index === path.instructionIndex) {
      newConstraints.push(instruction as PathConstraint);
      if (currentWorkflow.label === startingKey) {
        updatedPaths.push({
          ...path,
          constraints: [...newConstraints, ...path.constraints],
          current: currentWorkflow.label,
          validRanges: updateRanges(validRanges, instruction),
          parent: "",
        });
        break;
      }
      workflowsByTarget[path.parent].forEach((parentWorkflow) => {
        updatedPaths.push({
          ...path,
          instructionIndex: parentWorkflow.instructionIndex,
          constraints: [...newConstraints, ...path.constraints],
          current: currentWorkflow.label,
          validRanges: updateRanges(validRanges, instruction),
          parent: parentWorkflow.workflow.label,
        });
      });
      break;
    }

    if (instruction.value) {
      validRanges = updateRanges(validRanges, instruction, true);
      newConstraints.push({
        ...instruction,
        negative: true,
      });
    }
  }
  return updatedPaths;
};

const mergeRanges = (
  a: [number, number],
  b: [number, number]
): [number, number][] => {
  if (a[1] < b[1]) {
    return [a, b];
  }
  return [[Math.min(a[0], b[0]), Math.max(a[1], b[1])]];
};

const part2 = (rawInput: string) => {
  const { workflows } = parseInput(rawInput);
  const workflowsByTarget = Object.values(workflows).reduce<WorkflowsByTarget>(
    (byTarget, workflow) => {
      workflow.instructions.forEach((instruction, instructionIndex) => {
        byTarget[instruction.destination] = [
          ...(byTarget[instruction.destination] ?? []),
          { workflow, instructionIndex },
        ];
      });
      return byTarget;
    },
    {}
  );
  let paths = workflowsByTarget["A"].map<PossiblePath>(
    ({ workflow, instructionIndex }) => ({
      finalWorkflow: workflow.label,
      parent: workflow.label,
      instructionIndex,
      current: "A",
      validRanges: {
        x: [1, 4000],
        m: [1, 4000],
        a: [1, 4000],
        s: [1, 4000],
      },
      constraints: [],
    })
  );
  // while(paths.some(({current}) => current !== startingKey)) {
  for (
    let loops = 0;
    loops < 100 && paths.some(({ current }) => current !== startingKey);
    loops++
  ) {
    paths = paths.reduce<PossiblePath[]>(
      (updatedPaths, path) => [
        ...updatedPaths,
        ...(path.current === startingKey
          ? [path]
          : getWorkflowPossibitiesForPath(path, workflows, workflowsByTarget)),
      ],
      []
    );
  }
  const combinedPaths = paths.reduce<MergedPath[]>((merged, path) => {
    // if (!Object.values(path.validRanges).some(([a, b]) => a >= b)) {
    //   return merged;
    // }
    const existing = merged.find(
      ({ finalWorkflow }) => finalWorkflow === path.finalWorkflow
    );
    if (existing) {
      existing.validRanges = {
        x: mergeRanges(existing.validRanges.x[0], path.validRanges.x),
        m: mergeRanges(existing.validRanges.m[0], path.validRanges.m),
        a: mergeRanges(existing.validRanges.a[0], path.validRanges.a),
        s: mergeRanges(existing.validRanges.s[0], path.validRanges.s),
      };
      return merged;
    }
    return [
      ...merged,
      {
        ...path,
        validRanges: {
          x: [path.validRanges.x],
          m: [path.validRanges.m],
          a: [path.validRanges.a],
          s: [path.validRanges.s],
        },
      },
    ];
  }, []);
  combinedPaths.forEach((path) => {
    console.log(path.finalWorkflow, path.validRanges);
    // console.log(path.constraints);
  });
  // workflowsByTarget["A"].forEach((workflow) => {
  //   console.log(workflow);
  // });
  return combinedPaths
    .reduce((sum, path) => {
      const ranges = Object.values(path.validRanges);
      let pathPossibilities = 1;
      for (let index = 0; index < ranges.length; index++) {
        const rangeSum = ranges[index].reduce((subRangeSum, subRange) => {
          const range = subRange[1] - subRange[0];
          return subRangeSum + range;
        }, 0);
        pathPossibilities *= rangeSum;
      }
      return sum + pathPossibilities;
    }, 0)
    .toString();
};

const input = `
  px{a<2006:qkq,m>2090:A,rfg}
  pv{a>1716:R,A}
  lnx{m>1548:A,A}
  rfg{s<537:gd,x>2440:R,A}
  qs{s>3448:A,lnx}
  qkq{x<1416:A,crn}
  crn{x>2662:A,R}
  in{s<1351:px,qqz}
  qqz{s>2770:qs,m<1801:hdj,R}
  gd{a>3333:R,R}
  hdj{m>838:A,pv}

  {x=787,m=2655,a=1222,s=2876}
  {x=1679,m=44,a=2067,s=496}
  {x=2036,m=264,a=79,s=2244}
  {x=2461,m=1339,a=466,s=291}
  {x=2127,m=1623,a=2188,s=1013}`;

run({
  part1: {
    tests: [
      {
        input,
        expected: "19114",
      },
    ],
    solution: part1,
  },
  part2: {
    tests: [
      {
        input,
        expected: "167409079868000",
      },
    ],
    solution: part2,
  },
  trimTestInputs: true,
  onlyTests: true,
});
