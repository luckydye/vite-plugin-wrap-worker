export default function wrapWorker() {
  const stack: string[] = [];

  return {
    name: "wrap-workers",

    transform(src: string, id: string) {
      let code = src;

      if (!id.match("node_modules")) {
        stack.unshift(id);
      }

      if (id.match(/\.worker/g)) {
        const prev_file = stack[1];
        if (!prev_file.match(/\.worker/g)) {
          code = `
            import * as Comlink from "comlink";
            const worker = new Worker(new URL("${id}", import.meta.url), { type: "module" });
            export default Comlink.wrap(worker);
          `;
        }
      }

      return {
        code,
        map: null, // provide source map if available
      };
    },
  };
}
