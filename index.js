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

const compareDiff = map => {
	if (map.length == 0) {
		resolve([]);
	}
	const nycOutputPath = WORKING_DIR + "/.nyc_output";
	const nycIndexPath = nycOutputPath + "/processinfo/index.json";

	if (fs.existsSync(nycIndexPath)) {

		// eslint-disable-next-line security/detect-non-literal-require
		const nycFiles = require(nycIndexPath).files;

		const diffResultMap = [];

		if (nycFiles) {
			map.forEach(gitFile => {
				const [filePathFromProjectDir, linesFromGitDiff] = gitFile;
				const completeFilePath = WORKING_DIR + "/" + filePathFromProjectDir;

				let found = false;
				for (const nycFile in nycFiles) {
					if (nycFile === completeFilePath) {
						found = true;
						const nyc = require(nycOutputPath + nycFiles[nycFile]);
						if (nyc && nyc[nycFile]) {
							const { statementMap, s } = nyc[nycFile];
							const uncoveredLines = [];
							linesFromGitDiff.forEach(l => {
								for (const statement in statementMap) {
									if (statementMap[statement] != null
										&& statementMap[statement].start
										&& statementMap[statement].end
										&& (statementMap[statement].start.line <= l && statementMap[statement].end.line >= l)) {
										if (s[statement] === 0) { // Not covered
											uncoveredLines.push(l);
											break;
										}
									}
								}
							});
							if (uncoveredLines.length) diffResultMap.push([filePathFromProjectDir, uncoveredLines]);
						}
					}
				}
				if (!found) console.log(`${filePathFromProjectDir} not found in nyc output data`);
			});

			return resolve(diffResultMap);
		} else {
			exitWithFailure("`.nyc_output/processinfo/index.json` file does not contain the `files` object.")();
		}
	} else {
		exitWithFailure("`.nyc_output/processinfo/index.json` file was not found in predefined location.")();
	}
}

process.stdin.on("data", data => {
	const lines = String(data).split("\n");
	lines.forEach(line => {
		if (line.startsWith("@@")) {
			const [src, dest] = line
				.split(" ")
				.filter(x => x !== "@@")
				// Remove +, -
				.map(x => x.slice(1))
				// Split to components
				.map(x => x.split(","))
				// parse as Number
				.map(([start, end]) => ({
					start: Number(start),
					end: Number(end)
				}));
			state.watch = true;
			Object.assign(state.range, { src, dest });
			Object.assign(state.curr, { src: src.start, dest: dest.start });
			return write(line);
		} else if (state.watch) {
			if (line.startsWith(" ")) {
				convertAndWrite.neutral(line);
			}
			if (line.startsWith("+")) {
				convertAndWrite.dest(line);
			}
			if (line.startsWith("-")) {
				convertAndWrite.src(line);
			}
			if (line.startsWith("diff")) {
				state.watch = false;
				write(line);
			}
		} else write(line)
	});
});

process.stdin.on("close", () => {
	processDiff()
		.then(compareDiff)
		.catch(exitWithFailure("No diff found."));
});

