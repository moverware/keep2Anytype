# Contributing

Bug reports, fixes and new features are welcome. For anything bigger than a small fix, open an issue first so we can agree on the approach before you write the code.

## Development setup

```sh
nvm use        # or any Node.js 22+
npm install
npm run check  # typecheck, lint, format check and tests
```

`npm run check` is what CI runs on every pull request, so run it before you push. `npm run format` fixes formatting.

The code is small:

- `src/keep/` reads and validates the Google Takeout Keep JSON files.
- `src/anyBlock/` builds the Any-Block JSON that Anytype imports.
- `src/main.ts` connects the two, and `src/cli.ts` parses the flags.

Tests use [Vitest](https://vitest.dev) and sit next to the code they test (`*.test.ts`). Shared test notes live in `src/testdata/notes.ts`. Please add a test with any change in behaviour.

## Testing against Anytype

Unit tests check the JSON this tool writes, but only Anytype can tell you whether it imports correctly. For changes to the output format, convert a few notes and import them into an empty Anytype space, and mention the Anytype version you tested with in the pull request.

Don't commit your own Keep export. If a bug needs a sample note, make a small one by hand with any personal content removed.

## Pull requests

- Keep each pull request to one change.
- Pull requests are squash-merged, so the pull request title becomes the commit message on `master`. Write it as a short summary of the change, such as "Convert Keep labels to Anytype tags".
- CI must pass before merging.
