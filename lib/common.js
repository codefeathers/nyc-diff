const exitWithFailure = msg => err => {
	console.error(msg);
	if (err) {
		console.error("==============================");
		console.error(err);
		console.error("==============================");
	}
	process.exit(1);
};
exports.exitWithFailure = exitWithFailure;

const exitWithSuccess = msg => () => {
	if (msg) {
		console.log(msg);
	}
	process.exit(0)
};
exports.exitWithSuccess = exitWithSuccess;
