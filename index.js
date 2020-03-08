#! /usr/bin/node

const fs = require("fs");

const { exitWithFailure, exitWithSuccess } = require("./lib/common");

const DIFF_PATH = __dirname + "/branch.diff";

const WORKING_DIR = process.env.WORKING_DIR;

const state = {
	watch: false,
	range: {
		src: {
			start: 0,
			end: 0
		},
		dest: {
			start: 0,
			end: 0
		}
	},
	curr: {
		src: 0,
		dest: 0
	}
};

const write = line => fs.appendFileSync(DIFF_PATH, `${line}\n`);

const convertAndWrite = {
	src: line => {
		write(`${String(state.curr.src).padEnd(4, " ")} : ${line}`);
		++state.curr.src;
	},
	dest: line => {
		write(`${String(state.curr.dest).padEnd(4, " ")} : ${line}`);
		++state.curr.dest;
	},
	neutral: line => {
		write(`${String(state.curr.dest).padEnd(4, " ")} : ${line}`);
		++state.curr.dest;
		++state.curr.src;
	}
};

const processDiff = () => {
	if (fs.existsSync(DIFF_PATH)) {
		return new Promise((resolve, reject) => {
			const map = [];
			fs.createReadStream(DIFF_PATH)
				.on('data', chunk => {
					chunk = chunk.toString();
					const lines = chunk.split("\n");
					if (chunk && lines && lines[0] && lines[0] !== "") {
						const filePathFromRoot = lines[0].replace(/(diff --git )(a\/)|(b\/.*)/gi, "").split(" ")[0];
						const diffLines = chunk.match(/[0-9]+(\s)+:\s\+/gi);
						if (diffLines && diffLines instanceof Array) {
							let lineNumbers;
							try {
								lineNumbers = diffLines.map(l => parseInt(l.replace(/(\s)+(:)/g, "")));
							} catch (err) {
								exitWithFailure("An error occured while parsing diff for line numbers.")(err);
							}
							// eslint-disable-next-line security/detect-object-injection
							map.push([filePathFromRoot, lineNumbers]);
						}
					}
				})
				.on("end", () => {
					resolve(map);
				})
				.on("error", err => {
					reject(err);
				});
		});
	} else {
		return Promise.reject(new Error("No diff found."))
	}
}

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

