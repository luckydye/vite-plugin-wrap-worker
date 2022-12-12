function wrapWorker() {
  return {
    name: "wrap-workers",
    filename: "",

    transform(src: string, id: string) {
      let code = src;

      if (this.filename.match(/\.worker/g)) {
        if (this.filename.match(/\&worker_file/g)) {
          // imported on main trhead
          code = `
            import * as Comlink from "comlink";
            ${code.replace("export default", "export const mod = ")}
            Comlink.expose(mod);
          `;
        } else {
          // inside worker
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
