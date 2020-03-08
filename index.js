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
				.on('data', function (chunk) {
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
				.on("end", function () {
					resolve(map);
				})
				.on("error", function (err) {
					reject(err);
				});
		});
	} else {
		return Promise.reject(new Error("No diff found."))
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
		.catch(exitWithFailure("No diff found."));
});

