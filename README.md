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

## Import

In anytype, select `file -> import` then `Any-Block` and select the output folder to bulk import.

## Notes

* Does not import Google Keep tags
* Does not import Google Keep images
* Does not import Google Keep note colors
* Imports all archived notes as regular pages
* Imports everything as a page
* Modifies the created and modified dates to match the Google Keep note
* If the Keep note does not have a title, it uses the created date as the title
* Automatically parses any hyperlinks or annotations
