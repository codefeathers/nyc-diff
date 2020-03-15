#! /usr/bin/env node

const fs = require("fs");

const { exitWithFailure, exitWithSuccess } = require("./lib/common");

const diffLineNumbers = require("./tools/diff-line-numbers");
const parseDiff = require("./tools/parse-diff");
const compareDiff = require("./tools/compare-diff");

const NYC_OUTPUT_LOCATION = process.env.NYCDIFF_NYC_OUTPUT_LOCATION;

if (!NYC_OUTPUT_LOCATION) {
	exitWithFailure("Please provide the location where nyc is being run using the `NYC_OUTPUT_LOCATION` environment variable.\n Or, check usage on https://github.com/codefeathers/nyc-diff.")()
}

const RESULT_PATH = process.env.NYCDIFF_RESULT_PATH
	? process.env.NYCDIFF_RESULT_PATH.endsWith("json")
		? process.env.NYCDIFF_RESULT_PATH
		: process.env.NYCDIFF_RESULT_PATH + `/nyc-diff-${Date.now()}.json`
	: NYC_OUTPUT_LOCATION + `/nyc-diff-${Date.now()}.json`;

const DIFF_LOCATION = __dirname + "/branch.diff";

diffLineNumbers(process.stdin, fs.createWriteStream(DIFF_LOCATION))
	.then(parseDiff.bind(undefined, DIFF_LOCATION))
	.then(compareDiff.bind(undefined, NYC_OUTPUT_LOCATION))
	.then(result => {
		if (result && result.length) {
			fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 4));
			exitWithSuccess(`diff has been written to ${RESULT_PATH}`, 1)();
		} else {
			exitWithSuccess("No diff was calculated.")();
		}
	})
	.catch(exitWithFailure("An unexpected error occured!"));