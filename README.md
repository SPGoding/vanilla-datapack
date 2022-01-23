# Vanilla Data Pack

![Tick](https://github.com/SPGoding/vanilla-datapack/workflows/Tick/badge.svg)

A repository with automated scripts to generate the vanilla data pack from the Minecraft: Java Edition server jar.

<h2>

```diff
+!  Switch to the 'data' branch if you want to  !+
+!        see the actual data pack files.       !+
```

**Click [here][data-branch] to go to the `data` branch.**
</h2>

## Branches and Tags

All version identifiers used in this repository can be found from 
[version_manifest.json](https://launchermeta.mojang.com/mc/game/version_manifest.json).

Only the data for versions released after `1.16.2` (inclusive) can be found in this repository.

### Branches

- [`main`][main-branch]: Stores the scripts. This is the default branch of the repository.
- [`data`][data-branch]: Stores the auto-generated vanilla data pack.
- [`summary`][summary-branch]: Stores the auto-generated vanilla data pack content summaries.

### Tags

- `${version}-data`: Stores the corresponding vanilla data pack for the specific version.
- `${version}-summary`: Stores the corresponding summaries for the specific version.

## Repository Structure

Here's the file structure on the `main` branch.

- `generated`: Stores all generated files. This folder is excluded from git.
  - `data`: Stores the generated data pack files. Uses the same structure as the `data` folder in a data pack.
    The `data` git branch and all `${version}-data` git tags stores this folder directly with the `structures` folder
    removed.
    - `advancements`/`loot_tables`/...
  - `summary`: Stores summaries of the vanilla data pack. The `summary` git branch and all `${version}-summary` git
    tags stores this folder directly.
    - `flattened.json`: The [flattened summary](#flattened-summary) of vanilla data pack.
    - `flattened.min.json`: Minified [flattened summary](#flattened-summary) of vanilla data pack.
    - `tree.json`: The [tree summary](#tree-summary) of vanilla data pack.
    - `tree.min.json`: Minified [tree summary](#tree-summary) of vanilla data pack.
- `input`: Stores all input files for the scripts. This folder is excluded from git to avoid 
  [EULA](https://account.mojang.com/documents/minecraft_eula) violation.
  - `game.jar`: A *Minecraft: Java Edition* server jar file.
- `scripts`: All the scripts you're intrested in.
  - `download_inputs.ts`: Downloads the input files for the passed-in JSON parameter.
  - `generate.ts`: Generates the data pack and summaries from the input.
  - `get_latest_version.ts`: Prints a JSON with `version`, `download`, and `sha1` to the stdout.
  - `github_action_tick.ts`: Executes the things that the GitHub Action likes.
  - `utils.ts`: Some common functions used by other scripts.

## Summary Format

A summary file stores all the namespaced IDs that the vanilla data pack has. Both summaries use a dictionary
from [file type](https://github.com/SPGoding/datapack-language-server/wiki/Cache-Type#file-types) to their
own structure to store the information.

### Flattened Summary

Flattened summary is... flattened.

```json
{
  "advancement": [
    "minecraft:adventure/adventuring_time",
    "minecraft:adventure/arbalistic",
    ...
  ],
  "dimension": [...],
  ...
}
```

### Tree Summary

Tree summary stores children of a path segment in its `$children` property, and uses `$end` to indicate
if the namespaced ID can end at this segment.

For example, the ID `minecraft:foo` can be represented with

```json
{
  "minecraft": {
    "$children": {
      "foo": {
        "$end": true
      }
    }
  }
}
```

`minecraft:foo`, `minecraft:bar`, and `minecraft:bar/qux` can be represented with

```json
{
  "minecraft": {
    "$children": {
      "foo": {
        "$end": true
      },
      "bar": {
        "$end": true,
        "$children": {
          "qux": {
            "$end": true
          }
        }
      }
    }
  }
}
```

## Scripts

### Get Latest Version

Execution: `npm run get_latest_version`

Prints a JSON object containing `version`, `download`, and `sha1`.

### Download Inputs

Execution: `npm run download_inputs {"version": "<Version>", "download": "<URL of the game core jar>", "sha1": "SHA-1 of the game core jar"}`

Downloads and saves the input files (`game.jar` and `vanilla_worldgen.zip`) for the specific version.

### Generate

Execution: `npm run generate` or `npm run gen`

Generates the vanilla data pack and summary from the input files.

### GitHub Action Tick

Execution: `npm run github_action_tick`

Executes the things that the GitHub Action needs.

### Quick Start

The generated result for all vanilla game versions released after `1.16.2` (inclusive) are served on the GitHub repository's
[`data` branch][data-branch]. If for some reasons you want to generate files by yourself, please refer to the following steps:

1. Clone this repository to your local environment.
2. Copy your game core jar to `input/game.jar`. Only server files are acceptable due to use of the data generator.
3. Install [Node.js](https://nodejs.org) if you haven't.
4. Execute `npm i` and `npm run generate` in the root of this repository.
5. Enjoy the generated stuff in the `generated` folder!

## Disclaimer

The `data` git branch and all `${version}-data` git tags don't contain the generated `structures` category because the
only way to get them is from the game core file and I don't want to potentially violate the 
[EULA](https://account.mojang.com/documents/minecraft_eula) by redistributing those structure files. Another reason
is that they are all binary files and it means little to put them in the git system.

All other contents in the `data` git branch and `${version}-data` git tags are either accessible through the data
generator or from [slicedlime](https://github.com/slicedlime)'s [examples respository][examples],
and I assume it's okay to put them under public.

However, please [open an issue](https://github.com/SPGoding/vanilla-datapack/issues/new) if the assumption is ever
contradicted, and I will have the `data` git branch and all `${version}-data` git tags removed from this GitHub
repository as soon as possible.

## License

The [LICENSE](https://github.com/SPGoding/vanilla-datapack/blob/main/LICENSE) only applies to the `main` git
branch and the `summary` git branch.

[data-branch]: https://github.com/SPGoding/vanilla-datapack/tree/data
[examples]: https://github.com/slicedlime/examples
[main-branch]: https://github.com/SPGoding/vanilla-datapack
[summary-branch]: https://github.com/SPGoding/vanilla-datapack/tree/summary
