#! /usr/bin/node

const fs = require("fs");

const { exitWithFailure, exitWithSuccess } = require("./lib/common");

const diffLineNumbers = require("./tools/diff-line-numbers");
const parseDiff = require("./tools/parse-diff");
const compareDiff = require("./tools/compare-diff");

const WORKING_DIR = process.env.WORKING_DIR;

const DIFF_LOCATION = __dirname + "/branch.diff";

diffLineNumbers(process.stdin, fs.createWriteStream(), () => {
	parseDiff(DIFF_LOCATION)
		.then(compareDiff)
		.then(exitWithSuccess())
		.catch(exitWithFailure("An error occured!"));
});