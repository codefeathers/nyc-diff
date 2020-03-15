exports.exitWithFailure = msg => err => {
	console.error("\n[nyc-diff] ERR: " + msg);

	if (err) {
		console.error("==============================");
		console.error(err);
		console.error("==============================");
	}

	process.exit(1);
};

exports.exitWithSuccess = (msg, code = 0) => () => {
	if (msg) {
		console.log("\n[nyc-diff]: ", msg);
	}

	process.exit(code);
};
