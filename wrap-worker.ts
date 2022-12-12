function isWorker(path: string) {
	if (path && path.match(/\.worker/g)) {
		return true;
	} else if (path === undefined) {
		return true;
	}
	return false;
}

export default function wrapWorker() {
	const stack: string[] = [];

	return {
		name: "wrap-workers",

		transform(src: string, id: string) {
			let code = src;

			if (!id.match("node_modules")) {
				stack.unshift(id);

				const prev_file = stack[1];

				if (!isWorker(prev_file) && isWorker(id)) {
					code = `
            import * as Comlink from "comlink";
            const worker = new Worker(new URL("${id}", import.meta.url), { type: "module" });
            export default Comlink.wrap(worker);
          `;
				} else {
					if (isWorker(id)) {
						code = `
              import * as Comlink from "comlink";
              ${code.replace("export default", "export const mod = ")}
              Comlink.expose(mod);
            `;

						console.log(id, code);
					}
				}
			}

			return {
				code,
				map: null, // provide source map if available
			};
		},
	};
}
