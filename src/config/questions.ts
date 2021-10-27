import { isNil, isEmpty } from "../helpers/utils";

export default {
  storage: {
    ipfs: [
      {
        type: 'input',
        name: 'cache',
        message: 'IPFS Cache:',
        default: '/storage/ipfs.json',
        validate: (input) => !isNil(input) && !isEmpty(input)
      },
      {
        type: 'input',
        name: 'token',
        message: 'IPFS Token:',
        validate: (input) => !isNil(input) && !isEmpty(input)
      },
    ],
    arweave: [
      {
        type: 'input',
        name: 'cache',
        message: 'Arweave Cache:',
        default: '/storage/arweave.json',
        validate: (input) => !isNil(input) && !isEmpty(input)
      },
      {
        type: 'input',
        name: 'token',
        message: 'Arweave Token:',
        validate: (input) => !isNil(input) && !isEmpty(input)
      },
    ]
  }
}