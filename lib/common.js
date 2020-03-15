const exitWithFailure = msg => err => {
	console.error("[nyc-diff] ERR: " + msg);
	if (err) {
		console.error("==============================");
		console.error(err);
		console.error("==============================");
	}
	process.exit(1);
};
exports.exitWithFailure = exitWithFailure;

const exitWithSuccess = (msg, code = 0) => () => {
	if (msg) {
		console.log("[nyc-diff]: ", msg);
	}
	process.exit(code)
};
exports.exitWithSuccess = exitWithSuccess;
