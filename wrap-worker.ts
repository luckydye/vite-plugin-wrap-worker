import crypto from "node:crypto";

interface WrapWorkerOptions {
  experimental: boolean;
}

export default function wrapWorker({ experimental }: WrapWorkerOptions = { experimental: false }) {
  let config: any;

  const workerSource: Map<string, string> = new Map();

  const workerIdPrefix = "\0worker:";
  const workerIdRegex = /\0worker:/g;
  const workerFileRegex = /\.worker/g;

  function importWorkerSource(url: string) {
    if (experimental) {
      return `
        import * as Comlink from "comlink";
  
        let __mod__ = null;
  
        {
          const workerPool = [];
  
          function spawnWorker() {
            const worker = new Worker("${url}", { type: "module" });
            return Comlink.wrap(worker)
          }
  
          function requestWorker() {
            if(workerPool.length === 0) {
              workerPool.unshift(spawnWorker());
            }
            return workerPool[0];
          }

          function createProxy() {
            const proxyHandler = {
              get(target, prop, receiver) {
                target = requestWorker();
  
                if(prop === "terminate") {
                  // cant manage pools here, since i dont know when a worker closed
                  // therefore waiting for a terminate message from the outside.
                  workerPool.pop();
                }
  
                if(prop === "spawn") {
                  // create new proxy and return that.
                }
  
                return target[prop];
              },
              set(target, prop, value) {
                target = requestWorker();
                target[prop] = value;
                return true;
              }
            }

            return new Proxy({}, proxyHandler);
          }
  
          __mod__ = createProxy();
        }
  
        export default __mod__;
      `;
    } else {
      return `
        import * as Comlink from "comlink";
        const worker = new Worker("${url}", { type: "module" });
        export default Comlink.wrap(worker);
      `;
    }
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
