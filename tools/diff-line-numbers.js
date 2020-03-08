module.exports = (inputStream, outputStream) => {
	const state = {
		watch: false,
		curr: {
			src: 0,
			dest: 0,
		},
	};

	const write = (...segs) => outputStream.write(segs.join("") + "\n");

	const convertAndLog = {
		src: line => {
			write(String(state.curr.src).padEnd(4, " "), ":", line);
			++state.curr.src;
		},
		dest: line => {
			write(String(state.curr.dest).padEnd(4, " "), ":", line);
			++state.curr.dest;
		},
		neutral: line => {
			write(String(state.curr.dest).padEnd(4, " "), ":", line);
			++state.curr.dest;
			++state.curr.src;
		},
	};

	inputStream.on("data", data => {
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
						end: Number(end),
					}));
				state.watch = true;
				// Reset counter to reflect current context
				Object.assign(state.curr, { src: src.start, dest: dest.start });
				return write(line);
			} else if (state.watch) {
				if (line.startsWith(" ")) {
					convertAndLog.neutral(line);
				}
				if (line.startsWith("+")) {
					convertAndLog.dest(line);
				}
				if (line.startsWith("-")) {
					convertAndLog.src(line);
				}
				if (line.startsWith("diff")) {
					state.watch = false;
					write(line);
				}
			} else write(line);
		});
	});

	inputStream.on("end", () => outputStream.end());
};
