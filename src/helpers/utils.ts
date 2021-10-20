import debug from "debug";
import faker from "faker";

const log = debug("utils");

export const shuffle = (array: any[], round: number = 1) : any[] => {
  log(`shuffle #${round}`);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return round > 1 ? shuffle(array, round-1) : array;
}

export const parseString = (
  template: string,
  variables: object,
  pattern: string = "\{([^\{]+)\}"
) => template.replace(new RegExp(pattern, "g"), (_unused, varName) => variables[varName]);

export const randomName = faker.name.findName;