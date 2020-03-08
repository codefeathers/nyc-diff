#! /usr/bin/node

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

const convertAndLog = {
	src: line => {
		console.log(String(state.curr.src).padEnd(4, " "), ":", line);
		++state.curr.src;
	},
	dest: line => {
		console.log(String(state.curr.dest).padEnd(4, " "), ":", line);
		++state.curr.dest;
	},
	neutral: line => {
		console.log(String(state.curr.dest).padEnd(4, " "), ":", line);
		++state.curr.dest;
		++state.curr.src;
	}
};

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
			return console.log(line);
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
				console.log(line);
			}
		} else console.log(line);
	});
});