const fs = require("fs");
const { exitWithFailure } = require("../lib/common");

module.exports = (outputLocation, map) => {
	const nycOutputPath = outputLocation + "/.nyc_output/";
	const nycIndexPath = nycOutputPath + "processinfo/index.json";

	if (fs.existsSync(nycIndexPath)) {

		// eslint-disable-next-line security/detect-non-literal-require
		const nycFiles = require(nycIndexPath).files;

		const diffResultMap = [];

		if (nycFiles) {
			map.forEach(gitFile => {
				const [filePathFromProjectDir, linesFromGitDiff] = gitFile;
				const completeFilePath = outputLocation + "/" + filePathFromProjectDir;

				let found = false;
				for (const nycFile in nycFiles) {
					if (nycFile === completeFilePath) {
						console.log(`Checking coverage for ${filePathFromProjectDir}`);
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
				if (!found) console.log(`${filePathFromProjectDir} not instrumented in this test run.`);
			});

			return diffResultMap
		} else {
			exitWithFailure("`.nyc_output/processinfo/index.json` file does not contain the `files` object.")();
		}
	} else {
		exitWithFailure("`.nyc_output/processinfo/index.json` file was not found in predefined location.")();
	}
}