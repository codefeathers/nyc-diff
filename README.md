# nyc-diff

Make sure every addition and modification is covered with nyc-diff by reporting coverage for changed lines from a unified diff format.

## Installation

```
npm i -g @codefeathers/nyc-diff
```

## Usage

`nyc-diff` reads from stdin. This allows for piping of any diff output into the tool. An example of usage with git-diff is shown below

```
git diff -w <commit>...<commit> | <env vars> nyc-diff
```

### Output

A JSON file named **nyc-diff-\<unix timestamp\>** will be generated when the diff is calculated succesfully in the format shown below. The name of the file can be modified as well by modifying the `NYCDIFF_RESULT_PATH` env variable which is discussed below.

```
[
	[<path from git diff>, <array of line numbers>],
	... and more
]
```

## Environment Variables

* `NYCDIFF_NYC_OUTPUT_LOCATION` (required): This is the location in the local file system where code was instrumented by `nyc`. In most common situations this would be the root of your repository. Otherwise, wherever the `.nyc_output` folder of your `nyc` run is located.

* `NYCDIFF_RESULT_PATH` (optional): Path at which the resultant JSON will be written to. This defaults to the directory provided in the `NYCDIFF_NYC_OUTPUT_LOCATION`.

## Limitations

1. Currently only supports checking coverage of individual statements and not the coverage of their branches.
2. Can only be used with pipe and does not support cli args.
3. This tool is built around `nyc` v14.1.1. This tool's functionality is subject to `nyc`'s output format. This might be changed in future versions of nyc, to ensure complete compatibility remain on the same major version.

## Motivation

Working towards 100% coverage can be a troublesome task, especially at SaaS and product businesses where development on a code base never stops. `nyc-diff` was created to support development teams so as to ensure that any code that has been added or modified has unit-tests written for it.

## Credits

Idea was all [@KlentyBoogi](https://github.com/KlentyBoogi).