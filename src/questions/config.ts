import { extname } from "path";
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
    name: 'traits.config',
    message: 'Traits Config Name:',
    default: 'traits.json',
    validate: (input: string) => extname(input) == '.json' || 'Must be json file'
  },
  {
    type: 'number',
    name: 'traits.width',
    message: 'Traits Width:',
    default: 600,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'number',
    name: 'traits.height',
    message: 'Traits Height:',
    default: 600,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
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
    default: '/artworks',
  },
  {
    type: 'input',
    name: 'artworks.ext',
    message: 'Artworks Extension:',
    default: '.png',
  },
  {
    type: 'confirm',
    name: 'artworks.minify',
    message: 'Artworks Minify',
    default: false,
  },
  {
    type: 'number',
    name: 'artworks.width',
    message: 'Artworks Width:',
    default: 600,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'number',
    name: 'artworks.height',
    message: 'Artworks Height:',
    default: 600,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'input',
    name: 'generations[0].order',
    message: 'Generation Order (comma separated):',
    default: (answer: any) => findDirs(pathJoin(basePath, answer.traits.path)).join(','),
    validate: (input: string) => !isNil(input) && !isEmpty(input),
    filter: (input: string) => input.split(",").map(item => item.trim())
  },
  {
    type: 'number',
    name: 'generations[0].size',
    message: 'Generation Size:',
    default: 100,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'input',
    name: 'metadata.path',
    message: 'Metadata Path:',
    default: '/metadata',
  },
  {
    type: 'input',
    name: 'metadata.config',
    message: 'Metadata Config Name:',
    default: 'metadata.json',
    validate: (input: string) => extname(input) == '.json' || 'Must be json file'
  },
  {
    type: 'number',
    name: 'metadata.shuffle',
    message: 'Metadata Shuffle:',
    default: 0,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'input',
    name: 'collage.name',
    message: 'Collage Name:',
    default: 'preview.png',
  },
  {
    type: 'number',
    name: 'collage.editions',
    message: 'Collage Editions:',
    default: 50,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'number',
    name: 'collage.thumbWidth',
    message: 'Collage Width:',
    default: 50,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'number',
    name: 'collage.thumbPerRow',
    message: 'Collage Thumb Per Row:',
    default: 10,
    validate: (input: number) => isFinite(input) || 'Must be a finite number'
  },
  {
    type: 'input',
    name: 'storage.ipfs.cache',
    message: 'Storage IPFS Cache:',
    default: '/storage/ipfs.json',
    validate: (input: string) => !isNil(input) && !isEmpty(input)
  },
  {
    type: 'input',
    name: 'storage.ipfs.token',
    message: 'Storage IPFS Token:',
  },
  {
    type: 'input',
    name: 'storage.gdrive.cache',
    message: 'Storage Google Drive Cache:',
    default: '/storage/gdrive.json',
    validate: (input: string) => !isNil(input) && !isEmpty(input)
  },
  {
    type: 'input',
    name: 'storage.gdrive.credentials',
    message: 'Storage Google Drive Credentials:',
    default: '/storage/gdrive-credentials.json',
    validate: (input: string) => !isNil(input) && !isEmpty(input)
  },
  {
    type: 'input',
    name: 'storage.gdrive.token',
    message: 'Storage Google Drive Token:',
    default: '/storage/gdrive-token.json',
    validate: (input: string) => !isNil(input) && !isEmpty(input)
  },
]);

export default questionsInit;