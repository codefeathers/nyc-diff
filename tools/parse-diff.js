const fs = require("fs");

module.exports = path => {
	if (fs.existsSync(path)) {
		return new Promise((resolve, reject) => {
			const map = [];
			fs.createReadStream(path)
				.on('data', chunk => {
					chunk = chunk.toString();
					const lines = chunk.split("\n");
					if (chunk && lines && lines[0] && lines[0] !== "") {
						const filePathFromRoot = lines[0].replace(/(diff --git )(a\/)|(b\/.*)/gi, "").split(" ")[0];
						const diffLines = chunk.match(/[0-9]+(\s){0,}\:(\+)/gi);
						if (diffLines && diffLines instanceof Array) {
							let lineNumbers;
							try {
								lineNumbers = diffLines.map(l => parseInt(l.replace(/(\s)+(:)/g, "")));
							} catch (err) {
								exitWithFailure("An error occured while parsing diff for line numbers.")(err);
							}
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