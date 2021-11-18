`GALO` (Generative Artworks Lies On-chain), `galo` or `galokeun` also means `mix-it` in sundanese. A `cli` app to generate thousands of uniquely artworks and metadata from image layers, also provide a convenient way to upload to blockchain (IPFS or Arweave), and works nicely with metaplex flow

# Features

- Easily manage multiple projects
- Configure project with a single `json` file
- Faster image processing (use `sharp` package)
- Freely build your own metadata format
- Upload to IPFS via [nft.storage](https://nft.storage) or Arweave
- Works nicely with metaplex flow
- Multiple extension of traits
- Configurable artworks output format
- Configurable artworks and metadata directory
- Easily share the generation data
- Generate a preview collage
- Generate rarity data in `json` and `csv` file

# Usage

Install with `npm`

```
npm i -g galo-cli
```

or `yarn`

```
yarn global add galo-cli
```

Type `galo` or `galokeun` to open the welcome screen

```
──────────────────────────────────────────────────────────────────────
─██████████████────██████████████────██████────────────██████████████─
─██░░░░░░░░░░██────██░░░░░░░░░░██────██░░██────────────██░░░░░░░░░░██─
─██░░██████████────██░░██████░░██────██░░██────────────██░░██████░░██─
─██░░██────────────██░░██──██░░██────██░░██────────────██░░██──██░░██─
─██░░██────────────██░░██████░░██────██░░██────────────██░░██──██░░██─
─██░░██──██████────██░░░░░░░░░░██────██░░██────────────██░░██──██░░██─
─██░░██──██░░██────██░░██████░░██────██░░██────────────██░░██──██░░██─
─██░░██──██░░██────██░░██──██░░██────██░░██────────────██░░██──██░░██─
─██░░██████░░██────██░░██──██░░██────██░░██████████────██░░██████░░██─
─██░░░░░░░░░░██────██░░██──██░░██────██░░░░░░░░░░██────██░░░░░░░░░░██─
─██████████████────██████──██████────██████████████────██████████████─
──────────────────────────────────────────────────────────────────────
Generative Artworks Lies Onchain by davigmacode

Usage: galo [options] [command]

Options:
  -V, --version               output the version number
  -h, --help                  display help for command

Commands:
  init|i [options] [dir]      initialize a new generative artworks collection
  config|c [options] [dir]    display or update the configuration data
  build|b [options] [dir]     build the generations of artworks, metadata, rarity, and collage
  traits|t [options] [dir]    populate collection traits without building the generations
  artworks|a [options] [dir]  create collection artworks without rebuilding the generations
  metadata|m [options] [dir]  create collection metadata without rebuilding the generations
  preview|p [options] [dir]   create collection preview without rebuilding the generations
  rarity|r [options] [dir]    create collection rarity without rebuilding the generations
  upload|u [options] [dir]    upload the artworks and metadata to decentralized storage
  export|e [options] [dir]    export to metaplex compatible data
  destroy|d [options] [dir]   destroy the generated files and directories
  help [command]              display help for command
```
