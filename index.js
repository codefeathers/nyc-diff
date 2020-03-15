#! /usr/bin/env node

const fs = require("fs");
const path = require("path");

const argv = require("minimist")(process.argv.slice(2), {
	string: ["o", "output", "project-dir"],
});

const { exitWithFailure, exitWithSuccess } = require("./lib/common");

const diffLineNumbers = require("./tools/diff-line-numbers");
const parseDiff = require("./tools/parse-diff");
const compareDiff = require("./tools/compare-diff");

const NYC_OUTPUT_LOCATION = argv["project-dir"] || process.cwd();

if (!fs.existsSync(path.resolve(NYC_OUTPUT_LOCATION, ".nyc_output"))) {
	exitWithFailure(
		[
			`Could not find .nyc_output at ${NYC_OUTPUT_LOCATION}.`,
			`Please run nyc-diff in your repo root, or specify where ` +
				`nyc is run using the --project-dir option.`,
			`Check usage instructions at https://github.com/codefeathers/nyc-diff.`,
		].join("\n\n"),
	)();
}

const RESULT_PATH = path.resolve(
	argv.output || argv.o || path.resolve(NYC_OUTPUT_LOCATION, ".."),
	`nyc-diff-${Date.now()}.json`,
);

const DIFF_LOCATION = __dirname + "/branch.diff";

diffLineNumbers(process.stdin, fs.createWriteStream(DIFF_LOCATION))
	.then(() => parseDiff(DIFF_LOCATION))
	.then(map => compareDiff(NYC_OUTPUT_LOCATION, map))
	.then(result => {
		if (result && result.length) {
			fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 4));
			exitWithSuccess(`diff has been written to ${RESULT_PATH}`, 1)();
		} else {
			exitWithSuccess("No diff was calculated.")();
		}
	})
	.catch(exitWithFailure("An unexpected error occured!"));
