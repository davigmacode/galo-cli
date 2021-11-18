import { findDirs, pathJoin } from "../helpers/file";
import { isNil, isEmpty, isFinite } from "../helpers/utils";

export const questionsInit = (basePath: string) => ([
  {
    type: 'input',
    name: 'traits.path',
    message: 'Traits Path:',
    default: '/traits',
  },
  {
    type: 'input',
    name: 'traits.delimiter',
    message: 'Traits Filename Delimiter between Rarity and Label:',
    default: '__'
  },
  {
    type: 'input',
    name: 'traits.exts',
    message: 'Traits File Extensions (comma separated):',
    default: '.png,.jpg',
    filter: (input: string) => input.split(",").map(item => item.trim()),
    validate: (input: string) =>
      !isNil(input) &&
      !isEmpty(input) ||
      'Required'
  },
  {
    type: 'input',
    name: 'artworks.path',
    message: 'Artworks Path:',
    default: '/assets',
  },
  {
    type: 'input',
    name: 'artworks.ext',
    message: 'Artworks Extension:',
    default: '.png',
  },
  {
    type: 'number',
    name: 'artworks.width',
    message: 'Artworks Width:',
    default: 800,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'number',
    name: 'artworks.height',
    message: 'Artworks Height:',
    default: 800,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'number',
    name: 'generations.startAt',
    message: 'Generation Start At:',
    default: 0,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'input',
    name: 'generations.thread[0].order',
    message: 'Generation Order (comma separated):',
    default: (answer: any) => findDirs(pathJoin(basePath, answer.traits.path)).join(','),
    validate: (input: string) => !isNil(input) && !isEmpty(input),
    filter: (input: string) => input.split(",").map(item => item.trim())
  },
  {
    type: 'input',
    name: 'generations.thread[0].dna',
    message: 'Generation DNA (comma separated):',
    default: (answer: any) => answer.generations.thread[0].order.join(','),
    filter: (input: string) => input.split(",").map(item => item.trim())
  },
  {
    type: 'number',
    name: 'generations.thread[0].size',
    message: 'Generation Size:',
    default: 100,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'input',
    name: 'metadata.path',
    message: 'Metadata Path:',
    default: '/assets',
  },
  {
    type: 'number',
    name: 'metadata.shuffle',
    message: 'Metadata Shuffle:',
    default: 0,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  }
]);

export default questionsInit;