#! /usr/bin/node

const fs = require("fs");

const { exitWithFailure, exitWithSuccess } = require("./lib/common");

const diffLineNumbers = require("./tools/diff-line-numbers");
const parseDiff = require("./tools/parse-diff");
const compareDiff = require("./tools/compare-diff");

const NYC_OUTPUT_LOCATION = process.env.NYC_OUTPUT_LOCATION;

const DIFF_LOCATION = __dirname + "/branch.diff";

diffLineNumbers(process.stdin, fs.createWriteStream(DIFF_LOCATION), () => {
	parseDiff(DIFF_LOCATION)
		.then(compareDiff)
		.then(exitWithSuccess())
		.catch(exitWithFailure("An error occured!"));
});