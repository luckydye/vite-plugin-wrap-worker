import crypto from "crypto";

export default function wrapWorker(options = {}) {
  let config: any;

  const workerSource: Map<string, string> = new Map();

  const workerIdPrefix = "\0worker:";
  const workerIdRegex = /\0worker:/g;
  const workerFileRegex = /\.worker/g;

  function importWorkerSource(url: string) {
    return `
      import * as Comlink from "comlink";
      const worker = new Worker("${url}", { type: "module" });
      export default Comlink.wrap(worker);
    `;
  }

  function wrapWorkerSource(code: string) {
    code = `
      import * as Comlink from "comlink";
      ${code.replace("export default", "const __mod__ = ")}
      Comlink.expose(__mod__);
      export default __mod__;
    `;
    return code;
  }

  function loadWorkerSource(id: string) {
    const source = workerSource.get(id);
    if (source) {
      return wrapWorkerSource(source);
    }
  }

  return {
    name: "wrap-workers",

    configResolved(resolvedConfig: any) {
      config = resolvedConfig;
    },

    resolveId(id: string) {
      if (id.match(workerIdRegex)) return id;
    },

    load(id: string) {
      return loadWorkerSource(id);
    },

    async transform(src: string, id: string) {
      let code = src;

      // handle transform in serve command only
      if (id.match(/\?worker=/g)) {
        const workerId = id.split("?worker=")[1];
        const code = loadWorkerSource(workerId);
        if (code) {
          return {
            code,
          };
        }
      }

      if (id.match(workerFileRegex)) {
        const hash = crypto.randomUUID().split("-")[0];
        const workerId = workerIdPrefix + hash;

        if (!workerSource.has(workerId)) {
          let url;

          if (config.command === "serve") {
            url = id + "?worker=" + workerId;
          } else {
            const name = id.split("/").pop()?.split(".")[0];
            const fileName = `assets/${name}-${hash}.js`;

            this.emitFile({
              id: workerId,
              type: "chunk",
              fileName: fileName,
            });

            url = fileName;
          }

          workerSource.set(workerId, code);
          code = importWorkerSource(url);
        }

        return {
          code,
        };
      }
    },
  };
}
