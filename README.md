# CLI tool for converting Google Keep exports to any-block objects for Anytype

## Setup

Run: `yarn` to install dependencies.

Optional: create a tag in anytype and set `TAG_ID` in `.env` to the tag id.
This will tag all converted notes with the given tag.
You can find the tag id by exporting an anytype object with the tag as `Any-Block` type and looking at the `tags` field in the exported json.

Export your Google Keep data from [Google Takeout](https://takeout.google.com/settings/takeout) and unzip it.

## Usage

Run:
`yarn cli -p <path-to-keep-folder>/Takeout/Keep/ -o <output-folder>`

## CLI Options

* `-p` or `--path` - Path to the Google Keep folder
* `-o` or `--output` - Path to the output folder (will be created if it doesn't exist and must be different from the input folder)
* `-a` or `--archive` - Whether to include archived notes. Defaults to `false`.
* `-m` or `--mode` - Mode for conversion. Can be `pages` or `mixed`. Defaults to `mixed`. `mixed` mode will convert Keep notes with titles to Anytype `page` and Keep notes without titles to Anytype `note`. `pages` mode will convert all Keep notes to Anytype `page`, and will use the created date as the title if the Keep note does not have a title.

## Import

In anytype, select `file -> import` then `Any-Block` and select the output folder to bulk import.

## Notes

* Does not import Google Keep tags
* Does not import Google Keep images
* Does not import Google Keep note colors
* Modifies the created and modified dates to match the Google Keep note
* If the Keep note does not have a title, it uses the created date as the title
* Automatically parses any hyperlinks or annotations
