(() => {
  var __webpack_modules__ = {
    1573: (module) => {
      const getOptions = (input, { copy, wrap }) => {
        const result = {};
        if (input && typeof input === "object") {
          for (const prop of copy) {
            if (input[prop] !== undefined) {
              result[prop] = input[prop];
            }
          }
        } else {
          result[wrap] = input;
        }
        return result;
      };
      module.exports = getOptions;
    },
    2486: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const semver = __nccwpck_require__(4541);
      const satisfies = (range) =>
        semver.satisfies(process.version, range, { includePrerelease: true });
      module.exports = { satisfies };
    },
    8025: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { inspect } = __nccwpck_require__(3837);
      class SystemError {
        constructor(code, prefix, context) {
          let message =
            `${prefix}: ${context.syscall} returned ` +
            `${context.code} (${context.message})`;
          if (context.path !== undefined) {
            message += ` ${context.path}`;
          }
          if (context.dest !== undefined) {
            message += ` => ${context.dest}`;
          }
          this.code = code;
          Object.defineProperties(this, {
            name: {
              value: "SystemError",
              enumerable: false,
              writable: true,
              configurable: true,
            },
            message: {
              value: message,
              enumerable: false,
              writable: true,
              configurable: true,
            },
            info: {
              value: context,
              enumerable: true,
              configurable: true,
              writable: false,
            },
            errno: {
              get() {
                return context.errno;
              },
              set(value) {
                context.errno = value;
              },
              enumerable: true,
              configurable: true,
            },
            syscall: {
              get() {
                return context.syscall;
              },
              set(value) {
                context.syscall = value;
              },
              enumerable: true,
              configurable: true,
            },
          });
          if (context.path !== undefined) {
            Object.defineProperty(this, "path", {
              get() {
                return context.path;
              },
              set(value) {
                context.path = value;
              },
              enumerable: true,
              configurable: true,
            });
          }
          if (context.dest !== undefined) {
            Object.defineProperty(this, "dest", {
              get() {
                return context.dest;
              },
              set(value) {
                context.dest = value;
              },
              enumerable: true,
              configurable: true,
            });
          }
        }
        toString() {
          return `${this.name} [${this.code}]: ${this.message}`;
        }
        [Symbol.for("nodejs.util.inspect.custom")](_recurseTimes, ctx) {
          return inspect(this, { ...ctx, getters: true, customInspect: false });
        }
      }
      function E(code, message) {
        module.exports[code] = class NodeError extends SystemError {
          constructor(ctx) {
            super(code, message, ctx);
          }
        };
      }
      E(
        "ERR_FS_CP_DIR_TO_NON_DIR",
        "Cannot overwrite directory with non-directory",
      );
      E("ERR_FS_CP_EEXIST", "Target already exists");
      E("ERR_FS_CP_EINVAL", "Invalid src or dest");
      E("ERR_FS_CP_FIFO_PIPE", "Cannot copy a FIFO pipe");
      E(
        "ERR_FS_CP_NON_DIR_TO_DIR",
        "Cannot overwrite non-directory with directory",
      );
      E("ERR_FS_CP_SOCKET", "Cannot copy a socket file");
      E(
        "ERR_FS_CP_SYMLINK_TO_SUBDIRECTORY",
        "Cannot overwrite symlink in subdirectory of self",
      );
      E("ERR_FS_CP_UNKNOWN", "Cannot copy an unknown file type");
      E("ERR_FS_EISDIR", "Path is a directory");
      module.exports.ERR_INVALID_ARG_TYPE = class ERR_INVALID_ARG_TYPE extends (
        Error
      ) {
        constructor(name, expected, actual) {
          super();
          this.code = "ERR_INVALID_ARG_TYPE";
          this.message = `The ${name} argument must be ${expected}. Received ${typeof actual}`;
        }
      };
    },
    2702: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const fs = __nccwpck_require__(3292);
      const getOptions = __nccwpck_require__(1573);
      const node = __nccwpck_require__(2486);
      const polyfill = __nccwpck_require__(2613);
      const useNative = node.satisfies(">=16.7.0");
      const cp = async (src, dest, opts) => {
        const options = getOptions(opts, {
          copy: [
            "dereference",
            "errorOnExist",
            "filter",
            "force",
            "preserveTimestamps",
            "recursive",
          ],
        });
        return useNative
          ? fs.cp(src, dest, options)
          : polyfill(src, dest, options);
      };
      module.exports = cp;
    },
    2613: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const {
        ERR_FS_CP_DIR_TO_NON_DIR,
        ERR_FS_CP_EEXIST,
        ERR_FS_CP_EINVAL,
        ERR_FS_CP_FIFO_PIPE,
        ERR_FS_CP_NON_DIR_TO_DIR,
        ERR_FS_CP_SOCKET,
        ERR_FS_CP_SYMLINK_TO_SUBDIRECTORY,
        ERR_FS_CP_UNKNOWN,
        ERR_FS_EISDIR,
        ERR_INVALID_ARG_TYPE,
      } = __nccwpck_require__(8025);
      const {
        constants: {
          errno: { EEXIST, EISDIR, EINVAL, ENOTDIR },
        },
      } = __nccwpck_require__(2037);
      const {
        chmod,
        copyFile,
        lstat,
        mkdir,
        readdir,
        readlink,
        stat,
        symlink,
        unlink,
        utimes,
      } = __nccwpck_require__(3292);
      const {
        dirname,
        isAbsolute,
        join,
        parse,
        resolve,
        sep,
        toNamespacedPath,
      } = __nccwpck_require__(1017);
      const { fileURLToPath } = __nccwpck_require__(7310);
      const defaultOptions = {
        dereference: false,
        errorOnExist: false,
        filter: undefined,
        force: true,
        preserveTimestamps: false,
        recursive: false,
      };
      async function cp(src, dest, opts) {
        if (opts != null && typeof opts !== "object") {
          throw new ERR_INVALID_ARG_TYPE("options", ["Object"], opts);
        }
        return cpFn(
          toNamespacedPath(getValidatedPath(src)),
          toNamespacedPath(getValidatedPath(dest)),
          { ...defaultOptions, ...opts },
        );
      }
      function getValidatedPath(fileURLOrPath) {
        const path =
          fileURLOrPath != null && fileURLOrPath.href && fileURLOrPath.origin
            ? fileURLToPath(fileURLOrPath)
            : fileURLOrPath;
        return path;
      }
      async function cpFn(src, dest, opts) {
        if (opts.preserveTimestamps && process.arch === "ia32") {
          const warning =
            "Using the preserveTimestamps option in 32-bit " +
            "node is not recommended";
          process.emitWarning(warning, "TimestampPrecisionWarning");
        }
        const stats = await checkPaths(src, dest, opts);
        const { srcStat, destStat } = stats;
        await checkParentPaths(src, srcStat, dest);
        if (opts.filter) {
          return handleFilter(checkParentDir, destStat, src, dest, opts);
        }
        return checkParentDir(destStat, src, dest, opts);
      }
      async function checkPaths(src, dest, opts) {
        const { 0: srcStat, 1: destStat } = await getStats(src, dest, opts);
        if (destStat) {
          if (areIdentical(srcStat, destStat)) {
            throw new ERR_FS_CP_EINVAL({
              message: "src and dest cannot be the same",
              path: dest,
              syscall: "cp",
              errno: EINVAL,
            });
          }
          if (srcStat.isDirectory() && !destStat.isDirectory()) {
            throw new ERR_FS_CP_DIR_TO_NON_DIR({
              message:
                `cannot overwrite directory ${src} ` +
                `with non-directory ${dest}`,
              path: dest,
              syscall: "cp",
              errno: EISDIR,
            });
          }
          if (!srcStat.isDirectory() && destStat.isDirectory()) {
            throw new ERR_FS_CP_NON_DIR_TO_DIR({
              message:
                `cannot overwrite non-directory ${src} ` +
                `with directory ${dest}`,
              path: dest,
              syscall: "cp",
              errno: ENOTDIR,
            });
          }
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          throw new ERR_FS_CP_EINVAL({
            message: `cannot copy ${src} to a subdirectory of self ${dest}`,
            path: dest,
            syscall: "cp",
            errno: EINVAL,
          });
        }
        return { srcStat, destStat };
      }
      function areIdentical(srcStat, destStat) {
        return (
          destStat.ino &&
          destStat.dev &&
          destStat.ino === srcStat.ino &&
          destStat.dev === srcStat.dev
        );
      }
      function getStats(src, dest, opts) {
        const statFunc = opts.dereference
          ? (file) => stat(file, { bigint: true })
          : (file) => lstat(file, { bigint: true });
        return Promise.all([
          statFunc(src),
          statFunc(dest).catch((err) => {
            if (err.code === "ENOENT") {
              return null;
            }
            throw err;
          }),
        ]);
      }
      async function checkParentDir(destStat, src, dest, opts) {
        const destParent = dirname(dest);
        const dirExists = await pathExists(destParent);
        if (dirExists) {
          return getStatsForCopy(destStat, src, dest, opts);
        }
        await mkdir(destParent, { recursive: true });
        return getStatsForCopy(destStat, src, dest, opts);
      }
      function pathExists(dest) {
        return stat(dest).then(
          () => true,
          (err) => (err.code === "ENOENT" ? false : Promise.reject(err)),
        );
      }
      async function checkParentPaths(src, srcStat, dest) {
        const srcParent = resolve(dirname(src));
        const destParent = resolve(dirname(dest));
        if (destParent === srcParent || destParent === parse(destParent).root) {
          return;
        }
        let destStat;
        try {
          destStat = await stat(destParent, { bigint: true });
        } catch (err) {
          if (err.code === "ENOENT") {
            return;
          }
          throw err;
        }
        if (areIdentical(srcStat, destStat)) {
          throw new ERR_FS_CP_EINVAL({
            message: `cannot copy ${src} to a subdirectory of self ${dest}`,
            path: dest,
            syscall: "cp",
            errno: EINVAL,
          });
        }
        return checkParentPaths(src, srcStat, destParent);
      }
      const normalizePathToArray = (path) =>
        resolve(path).split(sep).filter(Boolean);
      function isSrcSubdir(src, dest) {
        const srcArr = normalizePathToArray(src);
        const destArr = normalizePathToArray(dest);
        return srcArr.every((cur, i) => destArr[i] === cur);
      }
      async function handleFilter(onInclude, destStat, src, dest, opts, cb) {
        const include = await opts.filter(src, dest);
        if (include) {
          return onInclude(destStat, src, dest, opts, cb);
        }
      }
      function startCopy(destStat, src, dest, opts) {
        if (opts.filter) {
          return handleFilter(getStatsForCopy, destStat, src, dest, opts);
        }
        return getStatsForCopy(destStat, src, dest, opts);
      }
      async function getStatsForCopy(destStat, src, dest, opts) {
        const statFn = opts.dereference ? stat : lstat;
        const srcStat = await statFn(src);
        if (srcStat.isDirectory() && opts.recursive) {
          return onDir(srcStat, destStat, src, dest, opts);
        } else if (srcStat.isDirectory()) {
          throw new ERR_FS_EISDIR({
            message: `${src} is a directory (not copied)`,
            path: src,
            syscall: "cp",
            errno: EINVAL,
          });
        } else if (
          srcStat.isFile() ||
          srcStat.isCharacterDevice() ||
          srcStat.isBlockDevice()
        ) {
          return onFile(srcStat, destStat, src, dest, opts);
        } else if (srcStat.isSymbolicLink()) {
          return onLink(destStat, src, dest);
        } else if (srcStat.isSocket()) {
          throw new ERR_FS_CP_SOCKET({
            message: `cannot copy a socket file: ${dest}`,
            path: dest,
            syscall: "cp",
            errno: EINVAL,
          });
        } else if (srcStat.isFIFO()) {
          throw new ERR_FS_CP_FIFO_PIPE({
            message: `cannot copy a FIFO pipe: ${dest}`,
            path: dest,
            syscall: "cp",
            errno: EINVAL,
          });
        }
        throw new ERR_FS_CP_UNKNOWN({
          message: `cannot copy an unknown file type: ${dest}`,
          path: dest,
          syscall: "cp",
          errno: EINVAL,
        });
      }
      function onFile(srcStat, destStat, src, dest, opts) {
        if (!destStat) {
          return _copyFile(srcStat, src, dest, opts);
        }
        return mayCopyFile(srcStat, src, dest, opts);
      }
      async function mayCopyFile(srcStat, src, dest, opts) {
        if (opts.force) {
          await unlink(dest);
          return _copyFile(srcStat, src, dest, opts);
        } else if (opts.errorOnExist) {
          throw new ERR_FS_CP_EEXIST({
            message: `${dest} already exists`,
            path: dest,
            syscall: "cp",
            errno: EEXIST,
          });
        }
      }
      async function _copyFile(srcStat, src, dest, opts) {
        await copyFile(src, dest);
        if (opts.preserveTimestamps) {
          return handleTimestampsAndMode(srcStat.mode, src, dest);
        }
        return setDestMode(dest, srcStat.mode);
      }
      async function handleTimestampsAndMode(srcMode, src, dest) {
        if (fileIsNotWritable(srcMode)) {
          await makeFileWritable(dest, srcMode);
          return setDestTimestampsAndMode(srcMode, src, dest);
        }
        return setDestTimestampsAndMode(srcMode, src, dest);
      }
      function fileIsNotWritable(srcMode) {
        return (srcMode & 128) === 0;
      }
      function makeFileWritable(dest, srcMode) {
        return setDestMode(dest, srcMode | 128);
      }
      async function setDestTimestampsAndMode(srcMode, src, dest) {
        await setDestTimestamps(src, dest);
        return setDestMode(dest, srcMode);
      }
      function setDestMode(dest, srcMode) {
        return chmod(dest, srcMode);
      }
      async function setDestTimestamps(src, dest) {
        const updatedSrcStat = await stat(src);
        return utimes(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
      }
      function onDir(srcStat, destStat, src, dest, opts) {
        if (!destStat) {
          return mkDirAndCopy(srcStat.mode, src, dest, opts);
        }
        return copyDir(src, dest, opts);
      }
      async function mkDirAndCopy(srcMode, src, dest, opts) {
        await mkdir(dest);
        await copyDir(src, dest, opts);
        return setDestMode(dest, srcMode);
      }
      async function copyDir(src, dest, opts) {
        const dir = await readdir(src);
        for (let i = 0; i < dir.length; i++) {
          const item = dir[i];
          const srcItem = join(src, item);
          const destItem = join(dest, item);
          const { destStat } = await checkPaths(srcItem, destItem, opts);
          await startCopy(destStat, srcItem, destItem, opts);
        }
      }
      async function onLink(destStat, src, dest) {
        let resolvedSrc = await readlink(src);
        if (!isAbsolute(resolvedSrc)) {
          resolvedSrc = resolve(dirname(src), resolvedSrc);
        }
        if (!destStat) {
          return symlink(resolvedSrc, dest);
        }
        let resolvedDest;
        try {
          resolvedDest = await readlink(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN") {
            return symlink(resolvedSrc, dest);
          }
          throw err;
        }
        if (!isAbsolute(resolvedDest)) {
          resolvedDest = resolve(dirname(dest), resolvedDest);
        }
        if (isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new ERR_FS_CP_EINVAL({
            message:
              `cannot copy ${resolvedSrc} to a subdirectory of self ` +
              `${resolvedDest}`,
            path: dest,
            syscall: "cp",
            errno: EINVAL,
          });
        }
        const srcStat = await stat(src);
        if (srcStat.isDirectory() && isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new ERR_FS_CP_SYMLINK_TO_SUBDIRECTORY({
            message: `cannot overwrite ${resolvedDest} with ${resolvedSrc}`,
            path: dest,
            syscall: "cp",
            errno: EINVAL,
          });
        }
        return copyLink(resolvedSrc, dest);
      }
      async function copyLink(resolvedSrc, dest) {
        await unlink(dest);
        return symlink(resolvedSrc, dest);
      }
      module.exports = cp;
    },
    575: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const cp = __nccwpck_require__(2702);
      const withTempDir = __nccwpck_require__(1045);
      const readdirScoped = __nccwpck_require__(7339);
      const moveFile = __nccwpck_require__(1690);
      module.exports = { cp, withTempDir, readdirScoped, moveFile };
    },
    1690: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const { dirname, join, resolve, relative, isAbsolute } =
        __nccwpck_require__(1017);
      const fs = __nccwpck_require__(3292);
      const pathExists = async (path) => {
        try {
          await fs.access(path);
          return true;
        } catch (er) {
          return er.code !== "ENOENT";
        }
      };
      const moveFile = async (
        source,
        destination,
        options = {},
        root = true,
        symlinks = [],
      ) => {
        if (!source || !destination) {
          throw new TypeError("`source` and `destination` file required");
        }
        options = { overwrite: true, ...options };
        if (!options.overwrite && (await pathExists(destination))) {
          throw new Error(`The destination file exists: ${destination}`);
        }
        await fs.mkdir(dirname(destination), { recursive: true });
        try {
          await fs.rename(source, destination);
        } catch (error) {
          if (error.code === "EXDEV" || error.code === "EPERM") {
            const sourceStat = await fs.lstat(source);
            if (sourceStat.isDirectory()) {
              const files = await fs.readdir(source);
              await Promise.all(
                files.map((file) =>
                  moveFile(
                    join(source, file),
                    join(destination, file),
                    options,
                    false,
                    symlinks,
                  ),
                ),
              );
            } else if (sourceStat.isSymbolicLink()) {
              symlinks.push({ source, destination });
            } else {
              await fs.copyFile(source, destination);
            }
          } else {
            throw error;
          }
        }
        if (root) {
          await Promise.all(
            symlinks.map(
              async ({ source: symSource, destination: symDestination }) => {
                let target = await fs.readlink(symSource);
                if (isAbsolute(target)) {
                  target = resolve(symDestination, relative(symSource, target));
                }
                let targetStat = "file";
                try {
                  targetStat = await fs.stat(
                    resolve(dirname(symSource), target),
                  );
                  if (targetStat.isDirectory()) {
                    targetStat = "junction";
                  }
                } catch {}
                await fs.symlink(target, symDestination, targetStat);
              },
            ),
          );
          await fs.rm(source, { recursive: true, force: true });
        }
      };
      module.exports = moveFile;
    },
    7339: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const { readdir } = __nccwpck_require__(3292);
      const { join } = __nccwpck_require__(1017);
      const readdirScoped = async (dir) => {
        const results = [];
        for (const item of await readdir(dir)) {
          if (item.startsWith("@")) {
            for (const scopedItem of await readdir(join(dir, item))) {
              results.push(join(item, scopedItem));
            }
          } else {
            results.push(item);
          }
        }
        return results;
      };
      module.exports = readdirScoped;
    },
    1045: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const { join, sep } = __nccwpck_require__(1017);
      const getOptions = __nccwpck_require__(1573);
      const { mkdir, mkdtemp, rm } = __nccwpck_require__(3292);
      const withTempDir = async (root, fn, opts) => {
        const options = getOptions(opts, { copy: ["tmpPrefix"] });
        await mkdir(root, { recursive: true });
        const target = await mkdtemp(
          join(`${root}${sep}`, options.tmpPrefix || ""),
        );
        let err;
        let result;
        try {
          result = await fn(target);
        } catch (_err) {
          err = _err;
        }
        try {
          await rm(target, { force: true, recursive: true });
        } catch {}
        if (err) {
          throw err;
        }
        return result;
      };
      module.exports = withTempDir;
    },
    9417: (module) => {
      "use strict";
      module.exports = balanced;
      function balanced(a, b, str) {
        if (a instanceof RegExp) a = maybeMatch(a, str);
        if (b instanceof RegExp) b = maybeMatch(b, str);
        var r = range(a, b, str);
        return (
          r && {
            start: r[0],
            end: r[1],
            pre: str.slice(0, r[0]),
            body: str.slice(r[0] + a.length, r[1]),
            post: str.slice(r[1] + b.length),
          }
        );
      }
      function maybeMatch(reg, str) {
        var m = str.match(reg);
        return m ? m[0] : null;
      }
      balanced.range = range;
      function range(a, b, str) {
        var begs, beg, left, right, result;
        var ai = str.indexOf(a);
        var bi = str.indexOf(b, ai + 1);
        var i = ai;
        if (ai >= 0 && bi > 0) {
          if (a === b) {
            return [ai, bi];
          }
          begs = [];
          left = str.length;
          while (i >= 0 && !result) {
            if (i == ai) {
              begs.push(i);
              ai = str.indexOf(a, i + 1);
            } else if (begs.length == 1) {
              result = [begs.pop(), bi];
            } else {
              beg = begs.pop();
              if (beg < left) {
                left = beg;
                right = bi;
              }
              bi = str.indexOf(b, i + 1);
            }
            i = ai < bi && ai >= 0 ? ai : bi;
          }
          if (begs.length) {
            result = [left, right];
          }
        }
        return result;
      }
    },
    3491: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const contentVer = __nccwpck_require__(3684)["cache-version"].content;
      const hashToSegments = __nccwpck_require__(2700);
      const path = __nccwpck_require__(1017);
      const ssri = __nccwpck_require__(2145);
      module.exports = contentPath;
      function contentPath(cache, integrity) {
        const sri = ssri.parse(integrity, { single: true });
        return path.join(
          contentDir(cache),
          sri.algorithm,
          ...hashToSegments(sri.hexDigest()),
        );
      }
      module.exports.contentDir = contentDir;
      function contentDir(cache) {
        return path.join(cache, `content-v${contentVer}`);
      }
    },
    9409: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(3292);
      const fsm = __nccwpck_require__(968);
      const ssri = __nccwpck_require__(2145);
      const contentPath = __nccwpck_require__(3491);
      const Pipeline = __nccwpck_require__(9891);
      module.exports = read;
      const MAX_SINGLE_READ_SIZE = 64 * 1024 * 1024;
      async function read(cache, integrity, opts = {}) {
        const { size } = opts;
        const { stat, cpath, sri } = await withContentSri(
          cache,
          integrity,
          async (cpath, sri) => {
            const stat = size ? { size } : await fs.stat(cpath);
            return { stat, cpath, sri };
          },
        );
        if (stat.size > MAX_SINGLE_READ_SIZE) {
          return readPipeline(cpath, stat.size, sri, new Pipeline()).concat();
        }
        const data = await fs.readFile(cpath, { encoding: null });
        if (stat.size !== data.length) {
          throw sizeError(stat.size, data.length);
        }
        if (!ssri.checkData(data, sri)) {
          throw integrityError(sri, cpath);
        }
        return data;
      }
      const readPipeline = (cpath, size, sri, stream) => {
        stream.push(
          new fsm.ReadStream(cpath, { size, readSize: MAX_SINGLE_READ_SIZE }),
          ssri.integrityStream({ integrity: sri, size }),
        );
        return stream;
      };
      module.exports.stream = readStream;
      module.exports.readStream = readStream;
      function readStream(cache, integrity, opts = {}) {
        const { size } = opts;
        const stream = new Pipeline();
        Promise.resolve()
          .then(async () => {
            const { stat, cpath, sri } = await withContentSri(
              cache,
              integrity,
              async (cpath, sri) => {
                const stat = size ? { size } : await fs.stat(cpath);
                return { stat, cpath, sri };
              },
            );
            return readPipeline(cpath, stat.size, sri, stream);
          })
          .catch((err) => stream.emit("error", err));
        return stream;
      }
      module.exports.copy = copy;
      function copy(cache, integrity, dest) {
        return withContentSri(cache, integrity, (cpath) =>
          fs.copyFile(cpath, dest),
        );
      }
      module.exports.hasContent = hasContent;
      async function hasContent(cache, integrity) {
        if (!integrity) {
          return false;
        }
        try {
          return await withContentSri(cache, integrity, async (cpath, sri) => {
            const stat = await fs.stat(cpath);
            return { size: stat.size, sri, stat };
          });
        } catch (err) {
          if (err.code === "ENOENT") {
            return false;
          }
          if (err.code === "EPERM") {
            if (process.platform !== "win32") {
              throw err;
            } else {
              return false;
            }
          }
        }
      }
      async function withContentSri(cache, integrity, fn) {
        const sri = ssri.parse(integrity);
        const algo = sri.pickAlgorithm();
        const digests = sri[algo];
        if (digests.length <= 1) {
          const cpath = contentPath(cache, digests[0]);
          return fn(cpath, digests[0]);
        } else {
          const results = await Promise.all(
            digests.map(async (meta) => {
              try {
                return await withContentSri(cache, meta, fn);
              } catch (err) {
                if (err.code === "ENOENT") {
                  return Object.assign(
                    new Error(
                      "No matching content found for " + sri.toString(),
                    ),
                    { code: "ENOENT" },
                  );
                }
                return err;
              }
            }),
          );
          const result = results.find((r) => !(r instanceof Error));
          if (result) {
            return result;
          }
          const enoentError = results.find((r) => r.code === "ENOENT");
          if (enoentError) {
            throw enoentError;
          }
          throw results.find((r) => r instanceof Error);
        }
      }
      function sizeError(expected, found) {
        const err = new Error(
          `Bad data size: expected inserted data to be ${expected} bytes, but got ${found} instead`,
        );
        err.expected = expected;
        err.found = found;
        err.code = "EBADSIZE";
        return err;
      }
      function integrityError(sri, path) {
        const err = new Error(
          `Integrity verification failed for ${sri} (${path})`,
        );
        err.code = "EINTEGRITY";
        err.sri = sri;
        err.path = path;
        return err;
      }
    },
    1343: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(3292);
      const contentPath = __nccwpck_require__(3491);
      const { hasContent } = __nccwpck_require__(9409);
      module.exports = rm;
      async function rm(cache, integrity) {
        const content = await hasContent(cache, integrity);
        if (content && content.sri) {
          await fs.rm(contentPath(cache, content.sri), {
            recursive: true,
            force: true,
          });
          return true;
        } else {
          return false;
        }
      }
    },
    3729: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const events = __nccwpck_require__(2361);
      const contentPath = __nccwpck_require__(3491);
      const fs = __nccwpck_require__(3292);
      const { moveFile } = __nccwpck_require__(575);
      const { Minipass } = __nccwpck_require__(4968);
      const Pipeline = __nccwpck_require__(9891);
      const Flush = __nccwpck_require__(4181);
      const path = __nccwpck_require__(1017);
      const ssri = __nccwpck_require__(2145);
      const uniqueFilename = __nccwpck_require__(1747);
      const fsm = __nccwpck_require__(968);
      module.exports = write;
      const moveOperations = new Map();
      async function write(cache, data, opts = {}) {
        const { algorithms, size, integrity } = opts;
        if (typeof size === "number" && data.length !== size) {
          throw sizeError(size, data.length);
        }
        const sri = ssri.fromData(data, algorithms ? { algorithms } : {});
        if (integrity && !ssri.checkData(data, integrity, opts)) {
          throw checksumError(integrity, sri);
        }
        for (const algo in sri) {
          const tmp = await makeTmp(cache, opts);
          const hash = sri[algo].toString();
          try {
            await fs.writeFile(tmp.target, data, { flag: "wx" });
            await moveToDestination(tmp, cache, hash, opts);
          } finally {
            if (!tmp.moved) {
              await fs.rm(tmp.target, { recursive: true, force: true });
            }
          }
        }
        return { integrity: sri, size: data.length };
      }
      module.exports.stream = writeStream;
      class CacacheWriteStream extends Flush {
        constructor(cache, opts) {
          super();
          this.opts = opts;
          this.cache = cache;
          this.inputStream = new Minipass();
          this.inputStream.on("error", (er) => this.emit("error", er));
          this.inputStream.on("drain", () => this.emit("drain"));
          this.handleContentP = null;
        }
        write(chunk, encoding, cb) {
          if (!this.handleContentP) {
            this.handleContentP = handleContent(
              this.inputStream,
              this.cache,
              this.opts,
            );
            this.handleContentP.catch((error) => this.emit("error", error));
          }
          return this.inputStream.write(chunk, encoding, cb);
        }
        flush(cb) {
          this.inputStream.end(() => {
            if (!this.handleContentP) {
              const e = new Error("Cache input stream was empty");
              e.code = "ENODATA";
              return Promise.reject(e).catch(cb);
            }
            this.handleContentP.then(
              (res) => {
                res.integrity && this.emit("integrity", res.integrity);
                res.size !== null && this.emit("size", res.size);
                cb();
              },
              (er) => cb(er),
            );
          });
        }
      }
      function writeStream(cache, opts = {}) {
        return new CacacheWriteStream(cache, opts);
      }
      async function handleContent(inputStream, cache, opts) {
        const tmp = await makeTmp(cache, opts);
        try {
          const res = await pipeToTmp(inputStream, cache, tmp.target, opts);
          await moveToDestination(tmp, cache, res.integrity, opts);
          return res;
        } finally {
          if (!tmp.moved) {
            await fs.rm(tmp.target, { recursive: true, force: true });
          }
        }
      }
      async function pipeToTmp(inputStream, cache, tmpTarget, opts) {
        const outStream = new fsm.WriteStream(tmpTarget, { flags: "wx" });
        if (opts.integrityEmitter) {
          const [integrity, size] = await Promise.all([
            events
              .once(opts.integrityEmitter, "integrity")
              .then((res) => res[0]),
            events.once(opts.integrityEmitter, "size").then((res) => res[0]),
            new Pipeline(inputStream, outStream).promise(),
          ]);
          return { integrity, size };
        }
        let integrity;
        let size;
        const hashStream = ssri.integrityStream({
          integrity: opts.integrity,
          algorithms: opts.algorithms,
          size: opts.size,
        });
        hashStream.on("integrity", (i) => {
          integrity = i;
        });
        hashStream.on("size", (s) => {
          size = s;
        });
        const pipeline = new Pipeline(inputStream, hashStream, outStream);
        await pipeline.promise();
        return { integrity, size };
      }
      async function makeTmp(cache, opts) {
        const tmpTarget = uniqueFilename(
          path.join(cache, "tmp"),
          opts.tmpPrefix,
        );
        await fs.mkdir(path.dirname(tmpTarget), { recursive: true });
        return { target: tmpTarget, moved: false };
      }
      async function moveToDestination(tmp, cache, sri) {
        const destination = contentPath(cache, sri);
        const destDir = path.dirname(destination);
        if (moveOperations.has(destination)) {
          return moveOperations.get(destination);
        }
        moveOperations.set(
          destination,
          fs
            .mkdir(destDir, { recursive: true })
            .then(async () => {
              await moveFile(tmp.target, destination, { overwrite: false });
              tmp.moved = true;
              return tmp.moved;
            })
            .catch((err) => {
              if (!err.message.startsWith("The destination file exists")) {
                throw Object.assign(err, { code: "EEXIST" });
              }
            })
            .finally(() => {
              moveOperations.delete(destination);
            }),
        );
        return moveOperations.get(destination);
      }
      function sizeError(expected, found) {
        const err = new Error(
          `Bad data size: expected inserted data to be ${expected} bytes, but got ${found} instead`,
        );
        err.expected = expected;
        err.found = found;
        err.code = "EBADSIZE";
        return err;
      }
      function checksumError(expected, found) {
        const err = new Error(
          `Integrity check failed:\n  Wanted: ${expected}\n   Found: ${found}`,
        );
        err.code = "EINTEGRITY";
        err.expected = expected;
        err.found = found;
        return err;
      }
    },
    595: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const crypto = __nccwpck_require__(6113);
      const { appendFile, mkdir, readFile, readdir, rm, writeFile } =
        __nccwpck_require__(3292);
      const { Minipass } = __nccwpck_require__(4968);
      const path = __nccwpck_require__(1017);
      const ssri = __nccwpck_require__(2145);
      const uniqueFilename = __nccwpck_require__(1747);
      const contentPath = __nccwpck_require__(3491);
      const hashToSegments = __nccwpck_require__(2700);
      const indexV = __nccwpck_require__(3684)["cache-version"].index;
      const { moveFile } = __nccwpck_require__(575);
      const lsStreamConcurrency = 5;
      module.exports.NotFoundError = class NotFoundError extends Error {
        constructor(cache, key) {
          super(`No cache entry for ${key} found in ${cache}`);
          this.code = "ENOENT";
          this.cache = cache;
          this.key = key;
        }
      };
      module.exports.compact = compact;
      async function compact(cache, key, matchFn, opts = {}) {
        const bucket = bucketPath(cache, key);
        const entries = await bucketEntries(bucket);
        const newEntries = [];
        for (let i = entries.length - 1; i >= 0; --i) {
          const entry = entries[i];
          if (entry.integrity === null && !opts.validateEntry) {
            break;
          }
          if (
            (!opts.validateEntry || opts.validateEntry(entry) === true) &&
            (newEntries.length === 0 ||
              !newEntries.find((oldEntry) => matchFn(oldEntry, entry)))
          ) {
            newEntries.unshift(entry);
          }
        }
        const newIndex =
          "\n" +
          newEntries
            .map((entry) => {
              const stringified = JSON.stringify(entry);
              const hash = hashEntry(stringified);
              return `${hash}\t${stringified}`;
            })
            .join("\n");
        const setup = async () => {
          const target = uniqueFilename(
            path.join(cache, "tmp"),
            opts.tmpPrefix,
          );
          await mkdir(path.dirname(target), { recursive: true });
          return { target, moved: false };
        };
        const teardown = async (tmp) => {
          if (!tmp.moved) {
            return rm(tmp.target, { recursive: true, force: true });
          }
        };
        const write = async (tmp) => {
          await writeFile(tmp.target, newIndex, { flag: "wx" });
          await mkdir(path.dirname(bucket), { recursive: true });
          await moveFile(tmp.target, bucket);
          tmp.moved = true;
        };
        const tmp = await setup();
        try {
          await write(tmp);
        } finally {
          await teardown(tmp);
        }
        return newEntries
          .reverse()
          .map((entry) => formatEntry(cache, entry, true));
      }
      module.exports.insert = insert;
      async function insert(cache, key, integrity, opts = {}) {
        const { metadata, size, time } = opts;
        const bucket = bucketPath(cache, key);
        const entry = {
          key,
          integrity: integrity && ssri.stringify(integrity),
          time: time || Date.now(),
          size,
          metadata,
        };
        try {
          await mkdir(path.dirname(bucket), { recursive: true });
          const stringified = JSON.stringify(entry);
          await appendFile(
            bucket,
            `\n${hashEntry(stringified)}\t${stringified}`,
          );
        } catch (err) {
          if (err.code === "ENOENT") {
            return undefined;
          }
          throw err;
        }
        return formatEntry(cache, entry);
      }
      module.exports.find = find;
      async function find(cache, key) {
        const bucket = bucketPath(cache, key);
        try {
          const entries = await bucketEntries(bucket);
          return entries.reduce((latest, next) => {
            if (next && next.key === key) {
              return formatEntry(cache, next);
            } else {
              return latest;
            }
          }, null);
        } catch (err) {
          if (err.code === "ENOENT") {
            return null;
          } else {
            throw err;
          }
        }
      }
      module.exports["delete"] = del;
      function del(cache, key, opts = {}) {
        if (!opts.removeFully) {
          return insert(cache, key, null, opts);
        }
        const bucket = bucketPath(cache, key);
        return rm(bucket, { recursive: true, force: true });
      }
      module.exports.lsStream = lsStream;
      function lsStream(cache) {
        const indexDir = bucketDir(cache);
        const stream = new Minipass({ objectMode: true });
        Promise.resolve()
          .then(async () => {
            const { default: pMap } = await __nccwpck_require__
              .e(689)
              .then(__nccwpck_require__.bind(__nccwpck_require__, 1689));
            const buckets = await readdirOrEmpty(indexDir);
            await pMap(
              buckets,
              async (bucket) => {
                const bucketPath = path.join(indexDir, bucket);
                const subbuckets = await readdirOrEmpty(bucketPath);
                await pMap(
                  subbuckets,
                  async (subbucket) => {
                    const subbucketPath = path.join(bucketPath, subbucket);
                    const subbucketEntries =
                      await readdirOrEmpty(subbucketPath);
                    await pMap(
                      subbucketEntries,
                      async (entry) => {
                        const entryPath = path.join(subbucketPath, entry);
                        try {
                          const entries = await bucketEntries(entryPath);
                          const reduced = entries.reduce((acc, entry) => {
                            acc.set(entry.key, entry);
                            return acc;
                          }, new Map());
                          for (const entry of reduced.values()) {
                            const formatted = formatEntry(cache, entry);
                            if (formatted) {
                              stream.write(formatted);
                            }
                          }
                        } catch (err) {
                          if (err.code === "ENOENT") {
                            return undefined;
                          }
                          throw err;
                        }
                      },
                      { concurrency: lsStreamConcurrency },
                    );
                  },
                  { concurrency: lsStreamConcurrency },
                );
              },
              { concurrency: lsStreamConcurrency },
            );
            stream.end();
            return stream;
          })
          .catch((err) => stream.emit("error", err));
        return stream;
      }
      module.exports.ls = ls;
      async function ls(cache) {
        const entries = await lsStream(cache).collect();
        return entries.reduce((acc, xs) => {
          acc[xs.key] = xs;
          return acc;
        }, {});
      }
      module.exports.bucketEntries = bucketEntries;
      async function bucketEntries(bucket, filter) {
        const data = await readFile(bucket, "utf8");
        return _bucketEntries(data, filter);
      }
      function _bucketEntries(data) {
        const entries = [];
        data.split("\n").forEach((entry) => {
          if (!entry) {
            return;
          }
          const pieces = entry.split("\t");
          if (!pieces[1] || hashEntry(pieces[1]) !== pieces[0]) {
            return;
          }
          let obj;
          try {
            obj = JSON.parse(pieces[1]);
          } catch (_) {}
          if (obj) {
            entries.push(obj);
          }
        });
        return entries;
      }
      module.exports.bucketDir = bucketDir;
      function bucketDir(cache) {
        return path.join(cache, `index-v${indexV}`);
      }
      module.exports.bucketPath = bucketPath;
      function bucketPath(cache, key) {
        const hashed = hashKey(key);
        return path.join.apply(
          path,
          [bucketDir(cache)].concat(hashToSegments(hashed)),
        );
      }
      module.exports.hashKey = hashKey;
      function hashKey(key) {
        return hash(key, "sha256");
      }
      module.exports.hashEntry = hashEntry;
      function hashEntry(str) {
        return hash(str, "sha1");
      }
      function hash(str, digest) {
        return crypto.createHash(digest).update(str).digest("hex");
      }
      function formatEntry(cache, entry, keepAll) {
        if (!entry.integrity && !keepAll) {
          return null;
        }
        return {
          key: entry.key,
          integrity: entry.integrity,
          path: entry.integrity
            ? contentPath(cache, entry.integrity)
            : undefined,
          size: entry.size,
          time: entry.time,
          metadata: entry.metadata,
        };
      }
      function readdirOrEmpty(dir) {
        return readdir(dir).catch((err) => {
          if (err.code === "ENOENT" || err.code === "ENOTDIR") {
            return [];
          }
          throw err;
        });
      }
    },
    408: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const Collect = __nccwpck_require__(4658);
      const { Minipass } = __nccwpck_require__(4968);
      const Pipeline = __nccwpck_require__(9891);
      const index = __nccwpck_require__(595);
      const memo = __nccwpck_require__(5575);
      const read = __nccwpck_require__(9409);
      async function getData(cache, key, opts = {}) {
        const { integrity, memoize, size } = opts;
        const memoized = memo.get(cache, key, opts);
        if (memoized && memoize !== false) {
          return {
            metadata: memoized.entry.metadata,
            data: memoized.data,
            integrity: memoized.entry.integrity,
            size: memoized.entry.size,
          };
        }
        const entry = await index.find(cache, key, opts);
        if (!entry) {
          throw new index.NotFoundError(cache, key);
        }
        const data = await read(cache, entry.integrity, { integrity, size });
        if (memoize) {
          memo.put(cache, entry, data, opts);
        }
        return {
          data,
          metadata: entry.metadata,
          size: entry.size,
          integrity: entry.integrity,
        };
      }
      module.exports = getData;
      async function getDataByDigest(cache, key, opts = {}) {
        const { integrity, memoize, size } = opts;
        const memoized = memo.get.byDigest(cache, key, opts);
        if (memoized && memoize !== false) {
          return memoized;
        }
        const res = await read(cache, key, { integrity, size });
        if (memoize) {
          memo.put.byDigest(cache, key, res, opts);
        }
        return res;
      }
      module.exports.byDigest = getDataByDigest;
      const getMemoizedStream = (memoized) => {
        const stream = new Minipass();
        stream.on("newListener", function (ev, cb) {
          ev === "metadata" && cb(memoized.entry.metadata);
          ev === "integrity" && cb(memoized.entry.integrity);
          ev === "size" && cb(memoized.entry.size);
        });
        stream.end(memoized.data);
        return stream;
      };
      function getStream(cache, key, opts = {}) {
        const { memoize, size } = opts;
        const memoized = memo.get(cache, key, opts);
        if (memoized && memoize !== false) {
          return getMemoizedStream(memoized);
        }
        const stream = new Pipeline();
        Promise.resolve()
          .then(async () => {
            const entry = await index.find(cache, key);
            if (!entry) {
              throw new index.NotFoundError(cache, key);
            }
            stream.emit("metadata", entry.metadata);
            stream.emit("integrity", entry.integrity);
            stream.emit("size", entry.size);
            stream.on("newListener", function (ev, cb) {
              ev === "metadata" && cb(entry.metadata);
              ev === "integrity" && cb(entry.integrity);
              ev === "size" && cb(entry.size);
            });
            const src = read.readStream(cache, entry.integrity, {
              ...opts,
              size: typeof size !== "number" ? entry.size : size,
            });
            if (memoize) {
              const memoStream = new Collect.PassThrough();
              memoStream.on("collect", (data) =>
                memo.put(cache, entry, data, opts),
              );
              stream.unshift(memoStream);
            }
            stream.unshift(src);
            return stream;
          })
          .catch((err) => stream.emit("error", err));
        return stream;
      }
      module.exports.stream = getStream;
      function getStreamDigest(cache, integrity, opts = {}) {
        const { memoize } = opts;
        const memoized = memo.get.byDigest(cache, integrity, opts);
        if (memoized && memoize !== false) {
          const stream = new Minipass();
          stream.end(memoized);
          return stream;
        } else {
          const stream = read.readStream(cache, integrity, opts);
          if (!memoize) {
            return stream;
          }
          const memoStream = new Collect.PassThrough();
          memoStream.on("collect", (data) =>
            memo.put.byDigest(cache, integrity, data, opts),
          );
          return new Pipeline(stream, memoStream);
        }
      }
      module.exports.stream.byDigest = getStreamDigest;
      function info(cache, key, opts = {}) {
        const { memoize } = opts;
        const memoized = memo.get(cache, key, opts);
        if (memoized && memoize !== false) {
          return Promise.resolve(memoized.entry);
        } else {
          return index.find(cache, key);
        }
      }
      module.exports.info = info;
      async function copy(cache, key, dest, opts = {}) {
        const entry = await index.find(cache, key, opts);
        if (!entry) {
          throw new index.NotFoundError(cache, key);
        }
        await read.copy(cache, entry.integrity, dest, opts);
        return {
          metadata: entry.metadata,
          size: entry.size,
          integrity: entry.integrity,
        };
      }
      module.exports.copy = copy;
      async function copyByDigest(cache, key, dest, opts = {}) {
        await read.copy(cache, key, dest, opts);
        return key;
      }
      module.exports.copy.byDigest = copyByDigest;
      module.exports.hasContent = read.hasContent;
    },
    5490: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const get = __nccwpck_require__(408);
      const put = __nccwpck_require__(178);
      const rm = __nccwpck_require__(123);
      const verify = __nccwpck_require__(584);
      const { clearMemoized } = __nccwpck_require__(5575);
      const tmp = __nccwpck_require__(644);
      const index = __nccwpck_require__(595);
      module.exports.index = {};
      module.exports.index.compact = index.compact;
      module.exports.index.insert = index.insert;
      module.exports.ls = index.ls;
      module.exports.ls.stream = index.lsStream;
      module.exports.get = get;
      module.exports.get.byDigest = get.byDigest;
      module.exports.get.stream = get.stream;
      module.exports.get.stream.byDigest = get.stream.byDigest;
      module.exports.get.copy = get.copy;
      module.exports.get.copy.byDigest = get.copy.byDigest;
      module.exports.get.info = get.info;
      module.exports.get.hasContent = get.hasContent;
      module.exports.put = put;
      module.exports.put.stream = put.stream;
      module.exports.rm = rm.entry;
      module.exports.rm.all = rm.all;
      module.exports.rm.entry = module.exports.rm;
      module.exports.rm.content = rm.content;
      module.exports.clearMemoized = clearMemoized;
      module.exports.tmp = {};
      module.exports.tmp.mkdir = tmp.mkdir;
      module.exports.tmp.withTmp = tmp.withTmp;
      module.exports.verify = verify;
      module.exports.verify.lastRun = verify.lastRun;
    },
    5575: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { LRUCache } = __nccwpck_require__(3866);
      const MEMOIZED = new LRUCache({
        max: 500,
        maxSize: 50 * 1024 * 1024,
        ttl: 3 * 60 * 1e3,
        sizeCalculation: (entry, key) =>
          key.startsWith("key:") ? entry.data.length : entry.length,
      });
      module.exports.clearMemoized = clearMemoized;
      function clearMemoized() {
        const old = {};
        MEMOIZED.forEach((v, k) => {
          old[k] = v;
        });
        MEMOIZED.clear();
        return old;
      }
      module.exports.put = put;
      function put(cache, entry, data, opts) {
        pickMem(opts).set(`key:${cache}:${entry.key}`, { entry, data });
        putDigest(cache, entry.integrity, data, opts);
      }
      module.exports.put.byDigest = putDigest;
      function putDigest(cache, integrity, data, opts) {
        pickMem(opts).set(`digest:${cache}:${integrity}`, data);
      }
      module.exports.get = get;
      function get(cache, key, opts) {
        return pickMem(opts).get(`key:${cache}:${key}`);
      }
      module.exports.get.byDigest = getDigest;
      function getDigest(cache, integrity, opts) {
        return pickMem(opts).get(`digest:${cache}:${integrity}`);
      }
      class ObjProxy {
        constructor(obj) {
          this.obj = obj;
        }
        get(key) {
          return this.obj[key];
        }
        set(key, val) {
          this.obj[key] = val;
        }
      }
      function pickMem(opts) {
        if (!opts || !opts.memoize) {
          return MEMOIZED;
        } else if (opts.memoize.get && opts.memoize.set) {
          return opts.memoize;
        } else if (typeof opts.memoize === "object") {
          return new ObjProxy(opts.memoize);
        } else {
          return MEMOIZED;
        }
      }
    },
    178: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const index = __nccwpck_require__(595);
      const memo = __nccwpck_require__(5575);
      const write = __nccwpck_require__(3729);
      const Flush = __nccwpck_require__(4181);
      const { PassThrough } = __nccwpck_require__(4658);
      const Pipeline = __nccwpck_require__(9891);
      const putOpts = (opts) => ({ algorithms: ["sha512"], ...opts });
      module.exports = putData;
      async function putData(cache, key, data, opts = {}) {
        const { memoize } = opts;
        opts = putOpts(opts);
        const res = await write(cache, data, opts);
        const entry = await index.insert(cache, key, res.integrity, {
          ...opts,
          size: res.size,
        });
        if (memoize) {
          memo.put(cache, entry, data, opts);
        }
        return res.integrity;
      }
      module.exports.stream = putStream;
      function putStream(cache, key, opts = {}) {
        const { memoize } = opts;
        opts = putOpts(opts);
        let integrity;
        let size;
        let error;
        let memoData;
        const pipeline = new Pipeline();
        if (memoize) {
          const memoizer = new PassThrough().on("collect", (data) => {
            memoData = data;
          });
          pipeline.push(memoizer);
        }
        const contentStream = write
          .stream(cache, opts)
          .on("integrity", (int) => {
            integrity = int;
          })
          .on("size", (s) => {
            size = s;
          })
          .on("error", (err) => {
            error = err;
          });
        pipeline.push(contentStream);
        pipeline.push(
          new Flush({
            async flush() {
              if (!error) {
                const entry = await index.insert(cache, key, integrity, {
                  ...opts,
                  size,
                });
                if (memoize && memoData) {
                  memo.put(cache, entry, memoData, opts);
                }
                pipeline.emit("integrity", integrity);
                pipeline.emit("size", size);
              }
            },
          }),
        );
        return pipeline;
      }
    },
    123: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { rm } = __nccwpck_require__(3292);
      const glob = __nccwpck_require__(8066);
      const index = __nccwpck_require__(595);
      const memo = __nccwpck_require__(5575);
      const path = __nccwpck_require__(1017);
      const rmContent = __nccwpck_require__(1343);
      module.exports = entry;
      module.exports.entry = entry;
      function entry(cache, key, opts) {
        memo.clearMemoized();
        return index.delete(cache, key, opts);
      }
      module.exports.content = content;
      function content(cache, integrity) {
        memo.clearMemoized();
        return rmContent(cache, integrity);
      }
      module.exports.all = all;
      async function all(cache) {
        memo.clearMemoized();
        const paths = await glob(path.join(cache, "*(content-*|index-*)"), {
          silent: true,
          nosort: true,
        });
        return Promise.all(
          paths.map((p) => rm(p, { recursive: true, force: true })),
        );
      }
    },
    8066: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { glob } = __nccwpck_require__(8211);
      const path = __nccwpck_require__(1017);
      const globify = (pattern) =>
        pattern.split(path.win32.sep).join(path.posix.sep);
      module.exports = (path, options) => glob(globify(path), options);
    },
    2700: (module) => {
      "use strict";
      module.exports = hashToSegments;
      function hashToSegments(hash) {
        return [hash.slice(0, 2), hash.slice(2, 4), hash.slice(4)];
      }
    },
    644: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { withTempDir } = __nccwpck_require__(575);
      const fs = __nccwpck_require__(3292);
      const path = __nccwpck_require__(1017);
      module.exports.mkdir = mktmpdir;
      async function mktmpdir(cache, opts = {}) {
        const { tmpPrefix } = opts;
        const tmpDir = path.join(cache, "tmp");
        await fs.mkdir(tmpDir, { recursive: true, owner: "inherit" });
        const target = `${tmpDir}${path.sep}${tmpPrefix || ""}`;
        return fs.mkdtemp(target, { owner: "inherit" });
      }
      module.exports.withTmp = withTmp;
      function withTmp(cache, opts, cb) {
        if (!cb) {
          cb = opts;
          opts = {};
        }
        return withTempDir(path.join(cache, "tmp"), cb, opts);
      }
    },
    584: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { mkdir, readFile, rm, stat, truncate, writeFile } =
        __nccwpck_require__(3292);
      const contentPath = __nccwpck_require__(3491);
      const fsm = __nccwpck_require__(968);
      const glob = __nccwpck_require__(8066);
      const index = __nccwpck_require__(595);
      const path = __nccwpck_require__(1017);
      const ssri = __nccwpck_require__(2145);
      const hasOwnProperty = (obj, key) =>
        Object.prototype.hasOwnProperty.call(obj, key);
      const verifyOpts = (opts) => ({
        concurrency: 20,
        log: { silly() {} },
        ...opts,
      });
      module.exports = verify;
      async function verify(cache, opts) {
        opts = verifyOpts(opts);
        opts.log.silly("verify", "verifying cache at", cache);
        const steps = [
          markStartTime,
          fixPerms,
          garbageCollect,
          rebuildIndex,
          cleanTmp,
          writeVerifile,
          markEndTime,
        ];
        const stats = {};
        for (const step of steps) {
          const label = step.name;
          const start = new Date();
          const s = await step(cache, opts);
          if (s) {
            Object.keys(s).forEach((k) => {
              stats[k] = s[k];
            });
          }
          const end = new Date();
          if (!stats.runTime) {
            stats.runTime = {};
          }
          stats.runTime[label] = end - start;
        }
        stats.runTime.total = stats.endTime - stats.startTime;
        opts.log.silly(
          "verify",
          "verification finished for",
          cache,
          "in",
          `${stats.runTime.total}ms`,
        );
        return stats;
      }
      async function markStartTime() {
        return { startTime: new Date() };
      }
      async function markEndTime() {
        return { endTime: new Date() };
      }
      async function fixPerms(cache, opts) {
        opts.log.silly("verify", "fixing cache permissions");
        await mkdir(cache, { recursive: true });
        return null;
      }
      async function garbageCollect(cache, opts) {
        opts.log.silly("verify", "garbage collecting content");
        const { default: pMap } = await __nccwpck_require__
          .e(689)
          .then(__nccwpck_require__.bind(__nccwpck_require__, 1689));
        const indexStream = index.lsStream(cache);
        const liveContent = new Set();
        indexStream.on("data", (entry) => {
          if (opts.filter && !opts.filter(entry)) {
            return;
          }
          const integrity = ssri.parse(entry.integrity);
          for (const algo in integrity) {
            liveContent.add(integrity[algo].toString());
          }
        });
        await new Promise((resolve, reject) => {
          indexStream.on("end", resolve).on("error", reject);
        });
        const contentDir = contentPath.contentDir(cache);
        const files = await glob(path.join(contentDir, "**"), {
          follow: false,
          nodir: true,
          nosort: true,
        });
        const stats = {
          verifiedContent: 0,
          reclaimedCount: 0,
          reclaimedSize: 0,
          badContentCount: 0,
          keptSize: 0,
        };
        await pMap(
          files,
          async (f) => {
            const split = f.split(/[/\\]/);
            const digest = split.slice(split.length - 3).join("");
            const algo = split[split.length - 4];
            const integrity = ssri.fromHex(digest, algo);
            if (liveContent.has(integrity.toString())) {
              const info = await verifyContent(f, integrity);
              if (!info.valid) {
                stats.reclaimedCount++;
                stats.badContentCount++;
                stats.reclaimedSize += info.size;
              } else {
                stats.verifiedContent++;
                stats.keptSize += info.size;
              }
            } else {
              stats.reclaimedCount++;
              const s = await stat(f);
              await rm(f, { recursive: true, force: true });
              stats.reclaimedSize += s.size;
            }
            return stats;
          },
          { concurrency: opts.concurrency },
        );
        return stats;
      }
      async function verifyContent(filepath, sri) {
        const contentInfo = {};
        try {
          const { size } = await stat(filepath);
          contentInfo.size = size;
          contentInfo.valid = true;
          await ssri.checkStream(new fsm.ReadStream(filepath), sri);
        } catch (err) {
          if (err.code === "ENOENT") {
            return { size: 0, valid: false };
          }
          if (err.code !== "EINTEGRITY") {
            throw err;
          }
          await rm(filepath, { recursive: true, force: true });
          contentInfo.valid = false;
        }
        return contentInfo;
      }
      async function rebuildIndex(cache, opts) {
        opts.log.silly("verify", "rebuilding index");
        const { default: pMap } = await __nccwpck_require__
          .e(689)
          .then(__nccwpck_require__.bind(__nccwpck_require__, 1689));
        const entries = await index.ls(cache);
        const stats = {
          missingContent: 0,
          rejectedEntries: 0,
          totalEntries: 0,
        };
        const buckets = {};
        for (const k in entries) {
          if (hasOwnProperty(entries, k)) {
            const hashed = index.hashKey(k);
            const entry = entries[k];
            const excluded = opts.filter && !opts.filter(entry);
            excluded && stats.rejectedEntries++;
            if (buckets[hashed] && !excluded) {
              buckets[hashed].push(entry);
            } else if (buckets[hashed] && excluded) {
            } else if (excluded) {
              buckets[hashed] = [];
              buckets[hashed]._path = index.bucketPath(cache, k);
            } else {
              buckets[hashed] = [entry];
              buckets[hashed]._path = index.bucketPath(cache, k);
            }
          }
        }
        await pMap(
          Object.keys(buckets),
          (key) => rebuildBucket(cache, buckets[key], stats, opts),
          { concurrency: opts.concurrency },
        );
        return stats;
      }
      async function rebuildBucket(cache, bucket, stats) {
        await truncate(bucket._path);
        for (const entry of bucket) {
          const content = contentPath(cache, entry.integrity);
          try {
            await stat(content);
            await index.insert(cache, entry.key, entry.integrity, {
              metadata: entry.metadata,
              size: entry.size,
              time: entry.time,
            });
            stats.totalEntries++;
          } catch (err) {
            if (err.code === "ENOENT") {
              stats.rejectedEntries++;
              stats.missingContent++;
            } else {
              throw err;
            }
          }
        }
      }
      function cleanTmp(cache, opts) {
        opts.log.silly("verify", "cleaning tmp directory");
        return rm(path.join(cache, "tmp"), { recursive: true, force: true });
      }
      async function writeVerifile(cache, opts) {
        const verifile = path.join(cache, "_lastverified");
        opts.log.silly("verify", "writing verifile to " + verifile);
        return writeFile(verifile, `${Date.now()}`);
      }
      module.exports.lastRun = lastRun;
      async function lastRun(cache) {
        const data = await readFile(path.join(cache, "_lastverified"), {
          encoding: "utf8",
        });
        return new Date(+data);
      }
    },
    2145: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const crypto = __nccwpck_require__(6113);
      const { Minipass } = __nccwpck_require__(4968);
      const SPEC_ALGORITHMS = ["sha512", "sha384", "sha256"];
      const DEFAULT_ALGORITHMS = ["sha512"];
      const BASE64_REGEX = /^[a-z0-9+/]+(?:=?=?)$/i;
      const SRI_REGEX = /^([a-z0-9]+)-([^?]+)([?\S*]*)$/;
      const STRICT_SRI_REGEX =
        /^([a-z0-9]+)-([A-Za-z0-9+/=]{44,88})(\?[\x21-\x7E]*)?$/;
      const VCHAR_REGEX = /^[\x21-\x7E]+$/;
      const getOptString = (options) =>
        options?.length ? `?${options.join("?")}` : "";
      class IntegrityStream extends Minipass {
        #emittedIntegrity;
        #emittedSize;
        #emittedVerified;
        constructor(opts) {
          super();
          this.size = 0;
          this.opts = opts;
          this.#getOptions();
          if (opts?.algorithms) {
            this.algorithms = [...opts.algorithms];
          } else {
            this.algorithms = [...DEFAULT_ALGORITHMS];
          }
          if (
            this.algorithm !== null &&
            !this.algorithms.includes(this.algorithm)
          ) {
            this.algorithms.push(this.algorithm);
          }
          this.hashes = this.algorithms.map(crypto.createHash);
        }
        #getOptions() {
          this.sri = this.opts?.integrity
            ? parse(this.opts?.integrity, this.opts)
            : null;
          this.expectedSize = this.opts?.size;
          if (!this.sri) {
            this.algorithm = null;
          } else if (this.sri.isHash) {
            this.goodSri = true;
            this.algorithm = this.sri.algorithm;
          } else {
            this.goodSri = !this.sri.isEmpty();
            this.algorithm = this.sri.pickAlgorithm(this.opts);
          }
          this.digests = this.goodSri ? this.sri[this.algorithm] : null;
          this.optString = getOptString(this.opts?.options);
        }
        on(ev, handler) {
          if (ev === "size" && this.#emittedSize) {
            return handler(this.#emittedSize);
          }
          if (ev === "integrity" && this.#emittedIntegrity) {
            return handler(this.#emittedIntegrity);
          }
          if (ev === "verified" && this.#emittedVerified) {
            return handler(this.#emittedVerified);
          }
          return super.on(ev, handler);
        }
        emit(ev, data) {
          if (ev === "end") {
            this.#onEnd();
          }
          return super.emit(ev, data);
        }
        write(data) {
          this.size += data.length;
          this.hashes.forEach((h) => h.update(data));
          return super.write(data);
        }
        #onEnd() {
          if (!this.goodSri) {
            this.#getOptions();
          }
          const newSri = parse(
            this.hashes
              .map(
                (h, i) =>
                  `${this.algorithms[i]}-${h.digest("base64")}${this.optString}`,
              )
              .join(" "),
            this.opts,
          );
          const match = this.goodSri && newSri.match(this.sri, this.opts);
          if (
            typeof this.expectedSize === "number" &&
            this.size !== this.expectedSize
          ) {
            const err = new Error(
              `stream size mismatch when checking ${this.sri}.\n  Wanted: ${this.expectedSize}\n  Found: ${this.size}`,
            );
            err.code = "EBADSIZE";
            err.found = this.size;
            err.expected = this.expectedSize;
            err.sri = this.sri;
            this.emit("error", err);
          } else if (this.sri && !match) {
            const err = new Error(
              `${this.sri} integrity checksum failed when using ${this.algorithm}: wanted ${this.digests} but got ${newSri}. (${this.size} bytes)`,
            );
            err.code = "EINTEGRITY";
            err.found = newSri;
            err.expected = this.digests;
            err.algorithm = this.algorithm;
            err.sri = this.sri;
            this.emit("error", err);
          } else {
            this.#emittedSize = this.size;
            this.emit("size", this.size);
            this.#emittedIntegrity = newSri;
            this.emit("integrity", newSri);
            if (match) {
              this.#emittedVerified = match;
              this.emit("verified", match);
            }
          }
        }
      }
      class Hash {
        get isHash() {
          return true;
        }
        constructor(hash, opts) {
          const strict = opts?.strict;
          this.source = hash.trim();
          this.digest = "";
          this.algorithm = "";
          this.options = [];
          const match = this.source.match(
            strict ? STRICT_SRI_REGEX : SRI_REGEX,
          );
          if (!match) {
            return;
          }
          if (strict && !SPEC_ALGORITHMS.includes(match[1])) {
            return;
          }
          this.algorithm = match[1];
          this.digest = match[2];
          const rawOpts = match[3];
          if (rawOpts) {
            this.options = rawOpts.slice(1).split("?");
          }
        }
        hexDigest() {
          return (
            this.digest && Buffer.from(this.digest, "base64").toString("hex")
          );
        }
        toJSON() {
          return this.toString();
        }
        match(integrity, opts) {
          const other = parse(integrity, opts);
          if (!other) {
            return false;
          }
          if (other.isIntegrity) {
            const algo = other.pickAlgorithm(opts, [this.algorithm]);
            if (!algo) {
              return false;
            }
            const foundHash = other[algo].find(
              (hash) => hash.digest === this.digest,
            );
            if (foundHash) {
              return foundHash;
            }
            return false;
          }
          return other.digest === this.digest ? other : false;
        }
        toString(opts) {
          if (opts?.strict) {
            if (
              !(
                SPEC_ALGORITHMS.includes(this.algorithm) &&
                this.digest.match(BASE64_REGEX) &&
                this.options.every((opt) => opt.match(VCHAR_REGEX))
              )
            ) {
              return "";
            }
          }
          return `${this.algorithm}-${this.digest}${getOptString(this.options)}`;
        }
      }
      function integrityHashToString(toString, sep, opts, hashes) {
        const toStringIsNotEmpty = toString !== "";
        let shouldAddFirstSep = false;
        let complement = "";
        const lastIndex = hashes.length - 1;
        for (let i = 0; i < lastIndex; i++) {
          const hashString = Hash.prototype.toString.call(hashes[i], opts);
          if (hashString) {
            shouldAddFirstSep = true;
            complement += hashString;
            complement += sep;
          }
        }
        const finalHashString = Hash.prototype.toString.call(
          hashes[lastIndex],
          opts,
        );
        if (finalHashString) {
          shouldAddFirstSep = true;
          complement += finalHashString;
        }
        if (toStringIsNotEmpty && shouldAddFirstSep) {
          return toString + sep + complement;
        }
        return toString + complement;
      }
      class Integrity {
        get isIntegrity() {
          return true;
        }
        toJSON() {
          return this.toString();
        }
        isEmpty() {
          return Object.keys(this).length === 0;
        }
        toString(opts) {
          let sep = opts?.sep || " ";
          let toString = "";
          if (opts?.strict) {
            sep = sep.replace(/\S+/g, " ");
            for (const hash of SPEC_ALGORITHMS) {
              if (this[hash]) {
                toString = integrityHashToString(
                  toString,
                  sep,
                  opts,
                  this[hash],
                );
              }
            }
          } else {
            for (const hash of Object.keys(this)) {
              toString = integrityHashToString(toString, sep, opts, this[hash]);
            }
          }
          return toString;
        }
        concat(integrity, opts) {
          const other =
            typeof integrity === "string"
              ? integrity
              : stringify(integrity, opts);
          return parse(`${this.toString(opts)} ${other}`, opts);
        }
        hexDigest() {
          return parse(this, { single: true }).hexDigest();
        }
        merge(integrity, opts) {
          const other = parse(integrity, opts);
          for (const algo in other) {
            if (this[algo]) {
              if (
                !this[algo].find((hash) =>
                  other[algo].find(
                    (otherhash) => hash.digest === otherhash.digest,
                  ),
                )
              ) {
                throw new Error("hashes do not match, cannot update integrity");
              }
            } else {
              this[algo] = other[algo];
            }
          }
        }
        match(integrity, opts) {
          const other = parse(integrity, opts);
          if (!other) {
            return false;
          }
          const algo = other.pickAlgorithm(opts, Object.keys(this));
          return (
            (!!algo &&
              this[algo] &&
              other[algo] &&
              this[algo].find((hash) =>
                other[algo].find(
                  (otherhash) => hash.digest === otherhash.digest,
                ),
              )) ||
            false
          );
        }
        pickAlgorithm(opts, hashes) {
          const pickAlgorithm = opts?.pickAlgorithm || getPrioritizedHash;
          const keys = Object.keys(this).filter((k) => {
            if (hashes?.length) {
              return hashes.includes(k);
            }
            return true;
          });
          if (keys.length) {
            return keys.reduce((acc, algo) => pickAlgorithm(acc, algo) || acc);
          }
          return null;
        }
      }
      module.exports.parse = parse;
      function parse(sri, opts) {
        if (!sri) {
          return null;
        }
        if (typeof sri === "string") {
          return _parse(sri, opts);
        } else if (sri.algorithm && sri.digest) {
          const fullSri = new Integrity();
          fullSri[sri.algorithm] = [sri];
          return _parse(stringify(fullSri, opts), opts);
        } else {
          return _parse(stringify(sri, opts), opts);
        }
      }
      function _parse(integrity, opts) {
        if (opts?.single) {
          return new Hash(integrity, opts);
        }
        const hashes = integrity
          .trim()
          .split(/\s+/)
          .reduce((acc, string) => {
            const hash = new Hash(string, opts);
            if (hash.algorithm && hash.digest) {
              const algo = hash.algorithm;
              if (!acc[algo]) {
                acc[algo] = [];
              }
              acc[algo].push(hash);
            }
            return acc;
          }, new Integrity());
        return hashes.isEmpty() ? null : hashes;
      }
      module.exports.stringify = stringify;
      function stringify(obj, opts) {
        if (obj.algorithm && obj.digest) {
          return Hash.prototype.toString.call(obj, opts);
        } else if (typeof obj === "string") {
          return stringify(parse(obj, opts), opts);
        } else {
          return Integrity.prototype.toString.call(obj, opts);
        }
      }
      module.exports.fromHex = fromHex;
      function fromHex(hexDigest, algorithm, opts) {
        const optString = getOptString(opts?.options);
        return parse(
          `${algorithm}-${Buffer.from(hexDigest, "hex").toString("base64")}${optString}`,
          opts,
        );
      }
      module.exports.fromData = fromData;
      function fromData(data, opts) {
        const algorithms = opts?.algorithms || [...DEFAULT_ALGORITHMS];
        const optString = getOptString(opts?.options);
        return algorithms.reduce((acc, algo) => {
          const digest = crypto.createHash(algo).update(data).digest("base64");
          const hash = new Hash(`${algo}-${digest}${optString}`, opts);
          if (hash.algorithm && hash.digest) {
            const hashAlgo = hash.algorithm;
            if (!acc[hashAlgo]) {
              acc[hashAlgo] = [];
            }
            acc[hashAlgo].push(hash);
          }
          return acc;
        }, new Integrity());
      }
      module.exports.fromStream = fromStream;
      function fromStream(stream, opts) {
        const istream = integrityStream(opts);
        return new Promise((resolve, reject) => {
          stream.pipe(istream);
          stream.on("error", reject);
          istream.on("error", reject);
          let sri;
          istream.on("integrity", (s) => {
            sri = s;
          });
          istream.on("end", () => resolve(sri));
          istream.resume();
        });
      }
      module.exports.checkData = checkData;
      function checkData(data, sri, opts) {
        sri = parse(sri, opts);
        if (!sri || !Object.keys(sri).length) {
          if (opts?.error) {
            throw Object.assign(
              new Error("No valid integrity hashes to check against"),
              { code: "EINTEGRITY" },
            );
          } else {
            return false;
          }
        }
        const algorithm = sri.pickAlgorithm(opts);
        const digest = crypto
          .createHash(algorithm)
          .update(data)
          .digest("base64");
        const newSri = parse({ algorithm, digest });
        const match = newSri.match(sri, opts);
        opts = opts || {};
        if (match || !opts.error) {
          return match;
        } else if (typeof opts.size === "number" && data.length !== opts.size) {
          const err = new Error(
            `data size mismatch when checking ${sri}.\n  Wanted: ${opts.size}\n  Found: ${data.length}`,
          );
          err.code = "EBADSIZE";
          err.found = data.length;
          err.expected = opts.size;
          err.sri = sri;
          throw err;
        } else {
          const err = new Error(
            `Integrity checksum failed when using ${algorithm}: Wanted ${sri}, but got ${newSri}. (${data.length} bytes)`,
          );
          err.code = "EINTEGRITY";
          err.found = newSri;
          err.expected = sri;
          err.algorithm = algorithm;
          err.sri = sri;
          throw err;
        }
      }
      module.exports.checkStream = checkStream;
      function checkStream(stream, sri, opts) {
        opts = opts || Object.create(null);
        opts.integrity = sri;
        sri = parse(sri, opts);
        if (!sri || !Object.keys(sri).length) {
          return Promise.reject(
            Object.assign(
              new Error("No valid integrity hashes to check against"),
              { code: "EINTEGRITY" },
            ),
          );
        }
        const checker = integrityStream(opts);
        return new Promise((resolve, reject) => {
          stream.pipe(checker);
          stream.on("error", reject);
          checker.on("error", reject);
          let verified;
          checker.on("verified", (s) => {
            verified = s;
          });
          checker.on("end", () => resolve(verified));
          checker.resume();
        });
      }
      module.exports.integrityStream = integrityStream;
      function integrityStream(opts = Object.create(null)) {
        return new IntegrityStream(opts);
      }
      module.exports.create = createIntegrity;
      function createIntegrity(opts) {
        const algorithms = opts?.algorithms || [...DEFAULT_ALGORITHMS];
        const optString = getOptString(opts?.options);
        const hashes = algorithms.map(crypto.createHash);
        return {
          update: function (chunk, enc) {
            hashes.forEach((h) => h.update(chunk, enc));
            return this;
          },
          digest: function () {
            const integrity = algorithms.reduce((acc, algo) => {
              const digest = hashes.shift().digest("base64");
              const hash = new Hash(`${algo}-${digest}${optString}`, opts);
              if (hash.algorithm && hash.digest) {
                const hashAlgo = hash.algorithm;
                if (!acc[hashAlgo]) {
                  acc[hashAlgo] = [];
                }
                acc[hashAlgo].push(hash);
              }
              return acc;
            }, new Integrity());
            return integrity;
          },
        };
      }
      const NODE_HASHES = crypto.getHashes();
      const DEFAULT_PRIORITY = [
        "md5",
        "whirlpool",
        "sha1",
        "sha224",
        "sha256",
        "sha384",
        "sha512",
        "sha3",
        "sha3-256",
        "sha3-384",
        "sha3-512",
        "sha3_256",
        "sha3_384",
        "sha3_512",
      ].filter((algo) => NODE_HASHES.includes(algo));
      function getPrioritizedHash(algo1, algo2) {
        return DEFAULT_PRIORITY.indexOf(algo1.toLowerCase()) >=
          DEFAULT_PRIORITY.indexOf(algo2.toLowerCase())
          ? algo1
          : algo2;
      }
    },
    968: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      const { Minipass } = __nccwpck_require__(4968);
      const EE = __nccwpck_require__(2361).EventEmitter;
      const fs = __nccwpck_require__(7147);
      const writev = fs.writev;
      const _autoClose = Symbol("_autoClose");
      const _close = Symbol("_close");
      const _ended = Symbol("_ended");
      const _fd = Symbol("_fd");
      const _finished = Symbol("_finished");
      const _flags = Symbol("_flags");
      const _flush = Symbol("_flush");
      const _handleChunk = Symbol("_handleChunk");
      const _makeBuf = Symbol("_makeBuf");
      const _mode = Symbol("_mode");
      const _needDrain = Symbol("_needDrain");
      const _onerror = Symbol("_onerror");
      const _onopen = Symbol("_onopen");
      const _onread = Symbol("_onread");
      const _onwrite = Symbol("_onwrite");
      const _open = Symbol("_open");
      const _path = Symbol("_path");
      const _pos = Symbol("_pos");
      const _queue = Symbol("_queue");
      const _read = Symbol("_read");
      const _readSize = Symbol("_readSize");
      const _reading = Symbol("_reading");
      const _remain = Symbol("_remain");
      const _size = Symbol("_size");
      const _write = Symbol("_write");
      const _writing = Symbol("_writing");
      const _defaultFlag = Symbol("_defaultFlag");
      const _errored = Symbol("_errored");
      class ReadStream extends Minipass {
        constructor(path, opt) {
          opt = opt || {};
          super(opt);
          this.readable = true;
          this.writable = false;
          if (typeof path !== "string") {
            throw new TypeError("path must be a string");
          }
          this[_errored] = false;
          this[_fd] = typeof opt.fd === "number" ? opt.fd : null;
          this[_path] = path;
          this[_readSize] = opt.readSize || 16 * 1024 * 1024;
          this[_reading] = false;
          this[_size] = typeof opt.size === "number" ? opt.size : Infinity;
          this[_remain] = this[_size];
          this[_autoClose] =
            typeof opt.autoClose === "boolean" ? opt.autoClose : true;
          if (typeof this[_fd] === "number") {
            this[_read]();
          } else {
            this[_open]();
          }
        }
        get fd() {
          return this[_fd];
        }
        get path() {
          return this[_path];
        }
        write() {
          throw new TypeError("this is a readable stream");
        }
        end() {
          throw new TypeError("this is a readable stream");
        }
        [_open]() {
          fs.open(this[_path], "r", (er, fd) => this[_onopen](er, fd));
        }
        [_onopen](er, fd) {
          if (er) {
            this[_onerror](er);
          } else {
            this[_fd] = fd;
            this.emit("open", fd);
            this[_read]();
          }
        }
        [_makeBuf]() {
          return Buffer.allocUnsafe(Math.min(this[_readSize], this[_remain]));
        }
        [_read]() {
          if (!this[_reading]) {
            this[_reading] = true;
            const buf = this[_makeBuf]();
            if (buf.length === 0) {
              return process.nextTick(() => this[_onread](null, 0, buf));
            }
            fs.read(this[_fd], buf, 0, buf.length, null, (er, br, b) =>
              this[_onread](er, br, b),
            );
          }
        }
        [_onread](er, br, buf) {
          this[_reading] = false;
          if (er) {
            this[_onerror](er);
          } else if (this[_handleChunk](br, buf)) {
            this[_read]();
          }
        }
        [_close]() {
          if (this[_autoClose] && typeof this[_fd] === "number") {
            const fd = this[_fd];
            this[_fd] = null;
            fs.close(fd, (er) =>
              er ? this.emit("error", er) : this.emit("close"),
            );
          }
        }
        [_onerror](er) {
          this[_reading] = true;
          this[_close]();
          this.emit("error", er);
        }
        [_handleChunk](br, buf) {
          let ret = false;
          this[_remain] -= br;
          if (br > 0) {
            ret = super.write(br < buf.length ? buf.slice(0, br) : buf);
          }
          if (br === 0 || this[_remain] <= 0) {
            ret = false;
            this[_close]();
            super.end();
          }
          return ret;
        }
        emit(ev, data) {
          switch (ev) {
            case "prefinish":
            case "finish":
              break;
            case "drain":
              if (typeof this[_fd] === "number") {
                this[_read]();
              }
              break;
            case "error":
              if (this[_errored]) {
                return;
              }
              this[_errored] = true;
              return super.emit(ev, data);
            default:
              return super.emit(ev, data);
          }
        }
      }
      class ReadStreamSync extends ReadStream {
        [_open]() {
          let threw = true;
          try {
            this[_onopen](null, fs.openSync(this[_path], "r"));
            threw = false;
          } finally {
            if (threw) {
              this[_close]();
            }
          }
        }
        [_read]() {
          let threw = true;
          try {
            if (!this[_reading]) {
              this[_reading] = true;
              do {
                const buf = this[_makeBuf]();
                const br =
                  buf.length === 0
                    ? 0
                    : fs.readSync(this[_fd], buf, 0, buf.length, null);
                if (!this[_handleChunk](br, buf)) {
                  break;
                }
              } while (true);
              this[_reading] = false;
            }
            threw = false;
          } finally {
            if (threw) {
              this[_close]();
            }
          }
        }
        [_close]() {
          if (this[_autoClose] && typeof this[_fd] === "number") {
            const fd = this[_fd];
            this[_fd] = null;
            fs.closeSync(fd);
            this.emit("close");
          }
        }
      }
      class WriteStream extends EE {
        constructor(path, opt) {
          opt = opt || {};
          super(opt);
          this.readable = false;
          this.writable = true;
          this[_errored] = false;
          this[_writing] = false;
          this[_ended] = false;
          this[_needDrain] = false;
          this[_queue] = [];
          this[_path] = path;
          this[_fd] = typeof opt.fd === "number" ? opt.fd : null;
          this[_mode] = opt.mode === undefined ? 438 : opt.mode;
          this[_pos] = typeof opt.start === "number" ? opt.start : null;
          this[_autoClose] =
            typeof opt.autoClose === "boolean" ? opt.autoClose : true;
          const defaultFlag = this[_pos] !== null ? "r+" : "w";
          this[_defaultFlag] = opt.flags === undefined;
          this[_flags] = this[_defaultFlag] ? defaultFlag : opt.flags;
          if (this[_fd] === null) {
            this[_open]();
          }
        }
        emit(ev, data) {
          if (ev === "error") {
            if (this[_errored]) {
              return;
            }
            this[_errored] = true;
          }
          return super.emit(ev, data);
        }
        get fd() {
          return this[_fd];
        }
        get path() {
          return this[_path];
        }
        [_onerror](er) {
          this[_close]();
          this[_writing] = true;
          this.emit("error", er);
        }
        [_open]() {
          fs.open(this[_path], this[_flags], this[_mode], (er, fd) =>
            this[_onopen](er, fd),
          );
        }
        [_onopen](er, fd) {
          if (
            this[_defaultFlag] &&
            this[_flags] === "r+" &&
            er &&
            er.code === "ENOENT"
          ) {
            this[_flags] = "w";
            this[_open]();
          } else if (er) {
            this[_onerror](er);
          } else {
            this[_fd] = fd;
            this.emit("open", fd);
            if (!this[_writing]) {
              this[_flush]();
            }
          }
        }
        end(buf, enc) {
          if (buf) {
            this.write(buf, enc);
          }
          this[_ended] = true;
          if (
            !this[_writing] &&
            !this[_queue].length &&
            typeof this[_fd] === "number"
          ) {
            this[_onwrite](null, 0);
          }
          return this;
        }
        write(buf, enc) {
          if (typeof buf === "string") {
            buf = Buffer.from(buf, enc);
          }
          if (this[_ended]) {
            this.emit("error", new Error("write() after end()"));
            return false;
          }
          if (this[_fd] === null || this[_writing] || this[_queue].length) {
            this[_queue].push(buf);
            this[_needDrain] = true;
            return false;
          }
          this[_writing] = true;
          this[_write](buf);
          return true;
        }
        [_write](buf) {
          fs.write(this[_fd], buf, 0, buf.length, this[_pos], (er, bw) =>
            this[_onwrite](er, bw),
          );
        }
        [_onwrite](er, bw) {
          if (er) {
            this[_onerror](er);
          } else {
            if (this[_pos] !== null) {
              this[_pos] += bw;
            }
            if (this[_queue].length) {
              this[_flush]();
            } else {
              this[_writing] = false;
              if (this[_ended] && !this[_finished]) {
                this[_finished] = true;
                this[_close]();
                this.emit("finish");
              } else if (this[_needDrain]) {
                this[_needDrain] = false;
                this.emit("drain");
              }
            }
          }
        }
        [_flush]() {
          if (this[_queue].length === 0) {
            if (this[_ended]) {
              this[_onwrite](null, 0);
            }
          } else if (this[_queue].length === 1) {
            this[_write](this[_queue].pop());
          } else {
            const iovec = this[_queue];
            this[_queue] = [];
            writev(this[_fd], iovec, this[_pos], (er, bw) =>
              this[_onwrite](er, bw),
            );
          }
        }
        [_close]() {
          if (this[_autoClose] && typeof this[_fd] === "number") {
            const fd = this[_fd];
            this[_fd] = null;
            fs.close(fd, (er) =>
              er ? this.emit("error", er) : this.emit("close"),
            );
          }
        }
      }
      class WriteStreamSync extends WriteStream {
        [_open]() {
          let fd;
          if (this[_defaultFlag] && this[_flags] === "r+") {
            try {
              fd = fs.openSync(this[_path], this[_flags], this[_mode]);
            } catch (er) {
              if (er.code === "ENOENT") {
                this[_flags] = "w";
                return this[_open]();
              } else {
                throw er;
              }
            }
          } else {
            fd = fs.openSync(this[_path], this[_flags], this[_mode]);
          }
          this[_onopen](null, fd);
        }
        [_close]() {
          if (this[_autoClose] && typeof this[_fd] === "number") {
            const fd = this[_fd];
            this[_fd] = null;
            fs.closeSync(fd);
            this.emit("close");
          }
        }
        [_write](buf) {
          let threw = true;
          try {
            this[_onwrite](
              null,
              fs.writeSync(this[_fd], buf, 0, buf.length, this[_pos]),
            );
            threw = false;
          } finally {
            if (threw) {
              try {
                this[_close]();
              } catch {}
            }
          }
        }
      }
      exports.ReadStream = ReadStream;
      exports.ReadStreamSync = ReadStreamSync;
      exports.WriteStream = WriteStream;
      exports.WriteStreamSync = WriteStreamSync;
    },
    2527: (module) => {
      /**
       * @preserve
       * JS Implementation of incremental MurmurHash3 (r150) (as of May 10, 2013)
       *
       * @author <a href="mailto:jensyt@gmail.com">Jens Taylor</a>
       * @see http://github.com/homebrewing/brauhaus-diff
       * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
       * @see http://github.com/garycourt/murmurhash-js
       * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
       * @see http://sites.google.com/site/murmurhash/
       */
      (function () {
        var cache;
        function MurmurHash3(key, seed) {
          var m = this instanceof MurmurHash3 ? this : cache;
          m.reset(seed);
          if (typeof key === "string" && key.length > 0) {
            m.hash(key);
          }
          if (m !== this) {
            return m;
          }
        }
        MurmurHash3.prototype.hash = function (key) {
          var h1, k1, i, top, len;
          len = key.length;
          this.len += len;
          k1 = this.k1;
          i = 0;
          switch (this.rem) {
            case 0:
              k1 ^= len > i ? key.charCodeAt(i++) & 65535 : 0;
            case 1:
              k1 ^= len > i ? (key.charCodeAt(i++) & 65535) << 8 : 0;
            case 2:
              k1 ^= len > i ? (key.charCodeAt(i++) & 65535) << 16 : 0;
            case 3:
              k1 ^= len > i ? (key.charCodeAt(i) & 255) << 24 : 0;
              k1 ^= len > i ? (key.charCodeAt(i++) & 65280) >> 8 : 0;
          }
          this.rem = (len + this.rem) & 3;
          len -= this.rem;
          if (len > 0) {
            h1 = this.h1;
            while (1) {
              k1 = (k1 * 11601 + (k1 & 65535) * 3432906752) & 4294967295;
              k1 = (k1 << 15) | (k1 >>> 17);
              k1 = (k1 * 13715 + (k1 & 65535) * 461832192) & 4294967295;
              h1 ^= k1;
              h1 = (h1 << 13) | (h1 >>> 19);
              h1 = (h1 * 5 + 3864292196) & 4294967295;
              if (i >= len) {
                break;
              }
              k1 =
                (key.charCodeAt(i++) & 65535) ^
                ((key.charCodeAt(i++) & 65535) << 8) ^
                ((key.charCodeAt(i++) & 65535) << 16);
              top = key.charCodeAt(i++);
              k1 ^= ((top & 255) << 24) ^ ((top & 65280) >> 8);
            }
            k1 = 0;
            switch (this.rem) {
              case 3:
                k1 ^= (key.charCodeAt(i + 2) & 65535) << 16;
              case 2:
                k1 ^= (key.charCodeAt(i + 1) & 65535) << 8;
              case 1:
                k1 ^= key.charCodeAt(i) & 65535;
            }
            this.h1 = h1;
          }
          this.k1 = k1;
          return this;
        };
        MurmurHash3.prototype.result = function () {
          var k1, h1;
          k1 = this.k1;
          h1 = this.h1;
          if (k1 > 0) {
            k1 = (k1 * 11601 + (k1 & 65535) * 3432906752) & 4294967295;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (k1 * 13715 + (k1 & 65535) * 461832192) & 4294967295;
            h1 ^= k1;
          }
          h1 ^= this.len;
          h1 ^= h1 >>> 16;
          h1 = (h1 * 51819 + (h1 & 65535) * 2246770688) & 4294967295;
          h1 ^= h1 >>> 13;
          h1 = (h1 * 44597 + (h1 & 65535) * 3266445312) & 4294967295;
          h1 ^= h1 >>> 16;
          return h1 >>> 0;
        };
        MurmurHash3.prototype.reset = function (seed) {
          this.h1 = typeof seed === "number" ? seed : 0;
          this.rem = this.k1 = this.len = 0;
          return this;
        };
        cache = new MurmurHash3();
        if (true) {
          module.exports = MurmurHash3;
        } else {
        }
      })();
    },
    8184: (module, __unused_webpack_exports, __nccwpck_require__) => {
      var balanced = __nccwpck_require__(9417);
      module.exports = expandTop;
      var escSlash = "\0SLASH" + Math.random() + "\0";
      var escOpen = "\0OPEN" + Math.random() + "\0";
      var escClose = "\0CLOSE" + Math.random() + "\0";
      var escComma = "\0COMMA" + Math.random() + "\0";
      var escPeriod = "\0PERIOD" + Math.random() + "\0";
      function numeric(str) {
        return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
      }
      function escapeBraces(str) {
        return str
          .split("\\\\")
          .join(escSlash)
          .split("\\{")
          .join(escOpen)
          .split("\\}")
          .join(escClose)
          .split("\\,")
          .join(escComma)
          .split("\\.")
          .join(escPeriod);
      }
      function unescapeBraces(str) {
        return str
          .split(escSlash)
          .join("\\")
          .split(escOpen)
          .join("{")
          .split(escClose)
          .join("}")
          .split(escComma)
          .join(",")
          .split(escPeriod)
          .join(".");
      }
      function parseCommaParts(str) {
        if (!str) return [""];
        var parts = [];
        var m = balanced("{", "}", str);
        if (!m) return str.split(",");
        var pre = m.pre;
        var body = m.body;
        var post = m.post;
        var p = pre.split(",");
        p[p.length - 1] += "{" + body + "}";
        var postParts = parseCommaParts(post);
        if (post.length) {
          p[p.length - 1] += postParts.shift();
          p.push.apply(p, postParts);
        }
        parts.push.apply(parts, p);
        return parts;
      }
      function expandTop(str) {
        if (!str) return [];
        if (str.substr(0, 2) === "{}") {
          str = "\\{\\}" + str.substr(2);
        }
        return expand(escapeBraces(str), true).map(unescapeBraces);
      }
      function embrace(str) {
        return "{" + str + "}";
      }
      function isPadded(el) {
        return /^-?0\d/.test(el);
      }
      function lte(i, y) {
        return i <= y;
      }
      function gte(i, y) {
        return i >= y;
      }
      function expand(str, isTop) {
        var expansions = [];
        var m = balanced("{", "}", str);
        if (!m) return [str];
        var pre = m.pre;
        var post = m.post.length ? expand(m.post, false) : [""];
        if (/\$$/.test(m.pre)) {
          for (var k = 0; k < post.length; k++) {
            var expansion = pre + "{" + m.body + "}" + post[k];
            expansions.push(expansion);
          }
        } else {
          var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
          var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(
            m.body,
          );
          var isSequence = isNumericSequence || isAlphaSequence;
          var isOptions = m.body.indexOf(",") >= 0;
          if (!isSequence && !isOptions) {
            if (m.post.match(/,.*\}/)) {
              str = m.pre + "{" + m.body + escClose + m.post;
              return expand(str);
            }
            return [str];
          }
          var n;
          if (isSequence) {
            n = m.body.split(/\.\./);
          } else {
            n = parseCommaParts(m.body);
            if (n.length === 1) {
              n = expand(n[0], false).map(embrace);
              if (n.length === 1) {
                return post.map(function (p) {
                  return m.pre + n[0] + p;
                });
              }
            }
          }
          var N;
          if (isSequence) {
            var x = numeric(n[0]);
            var y = numeric(n[1]);
            var width = Math.max(n[0].length, n[1].length);
            var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
            var test = lte;
            var reverse = y < x;
            if (reverse) {
              incr *= -1;
              test = gte;
            }
            var pad = n.some(isPadded);
            N = [];
            for (var i = x; test(i, y); i += incr) {
              var c;
              if (isAlphaSequence) {
                c = String.fromCharCode(i);
                if (c === "\\") c = "";
              } else {
                c = String(i);
                if (pad) {
                  var need = width - c.length;
                  if (need > 0) {
                    var z = new Array(need + 1).join("0");
                    if (i < 0) c = "-" + z + c.slice(1);
                    else c = z + c;
                  }
                }
              }
              N.push(c);
            }
          } else {
            N = [];
            for (var j = 0; j < n.length; j++) {
              N.push.apply(N, expand(n[j], false));
            }
          }
          for (var j = 0; j < N.length; j++) {
            for (var k = 0; k < post.length; k++) {
              var expansion = pre + N[j] + post[k];
              if (!isTop || isSequence || expansion) expansions.push(expansion);
            }
          }
        }
        return expansions;
      }
    },
    4658: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const { Minipass } = __nccwpck_require__(4968);
      const _data = Symbol("_data");
      const _length = Symbol("_length");
      class Collect extends Minipass {
        constructor(options) {
          super(options);
          this[_data] = [];
          this[_length] = 0;
        }
        write(chunk, encoding, cb) {
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (!encoding) encoding = "utf8";
          const c = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, encoding);
          this[_data].push(c);
          this[_length] += c.length;
          if (cb) cb();
          return true;
        }
        end(chunk, encoding, cb) {
          if (typeof chunk === "function") (cb = chunk), (chunk = null);
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (chunk) this.write(chunk, encoding);
          const result = Buffer.concat(this[_data], this[_length]);
          super.write(result);
          return super.end(cb);
        }
      }
      module.exports = Collect;
      class CollectPassThrough extends Minipass {
        constructor(options) {
          super(options);
          this[_data] = [];
          this[_length] = 0;
        }
        write(chunk, encoding, cb) {
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (!encoding) encoding = "utf8";
          const c = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, encoding);
          this[_data].push(c);
          this[_length] += c.length;
          return super.write(chunk, encoding, cb);
        }
        end(chunk, encoding, cb) {
          if (typeof chunk === "function") (cb = chunk), (chunk = null);
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (chunk) this.write(chunk, encoding);
          const result = Buffer.concat(this[_data], this[_length]);
          this.emit("collect", result);
          return super.end(cb);
        }
      }
      module.exports.PassThrough = CollectPassThrough;
    },
    4181: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const Minipass = __nccwpck_require__(7818);
      const _flush = Symbol("_flush");
      const _flushed = Symbol("_flushed");
      const _flushing = Symbol("_flushing");
      class Flush extends Minipass {
        constructor(opt = {}) {
          if (typeof opt === "function") opt = { flush: opt };
          super(opt);
          if (
            typeof opt.flush !== "function" &&
            typeof this.flush !== "function"
          )
            throw new TypeError("must provide flush function in options");
          this[_flush] = opt.flush || this.flush;
        }
        emit(ev, ...data) {
          if ((ev !== "end" && ev !== "finish") || this[_flushed])
            return super.emit(ev, ...data);
          if (this[_flushing]) return;
          this[_flushing] = true;
          const afterFlush = (er) => {
            this[_flushed] = true;
            er ? super.emit("error", er) : super.emit("end");
          };
          const ret = this[_flush](afterFlush);
          if (ret && ret.then)
            ret.then(
              () => afterFlush(),
              (er) => afterFlush(er),
            );
        }
      }
      module.exports = Flush;
    },
    7818: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const proc =
        typeof process === "object" && process
          ? process
          : { stdout: null, stderr: null };
      const EE = __nccwpck_require__(2361);
      const Stream = __nccwpck_require__(2781);
      const SD = __nccwpck_require__(1576).StringDecoder;
      const EOF = Symbol("EOF");
      const MAYBE_EMIT_END = Symbol("maybeEmitEnd");
      const EMITTED_END = Symbol("emittedEnd");
      const EMITTING_END = Symbol("emittingEnd");
      const EMITTED_ERROR = Symbol("emittedError");
      const CLOSED = Symbol("closed");
      const READ = Symbol("read");
      const FLUSH = Symbol("flush");
      const FLUSHCHUNK = Symbol("flushChunk");
      const ENCODING = Symbol("encoding");
      const DECODER = Symbol("decoder");
      const FLOWING = Symbol("flowing");
      const PAUSED = Symbol("paused");
      const RESUME = Symbol("resume");
      const BUFFERLENGTH = Symbol("bufferLength");
      const BUFFERPUSH = Symbol("bufferPush");
      const BUFFERSHIFT = Symbol("bufferShift");
      const OBJECTMODE = Symbol("objectMode");
      const DESTROYED = Symbol("destroyed");
      const EMITDATA = Symbol("emitData");
      const EMITEND = Symbol("emitEnd");
      const EMITEND2 = Symbol("emitEnd2");
      const ASYNC = Symbol("async");
      const defer = (fn) => Promise.resolve().then(fn);
      const doIter = global._MP_NO_ITERATOR_SYMBOLS_ !== "1";
      const ASYNCITERATOR =
        (doIter && Symbol.asyncIterator) ||
        Symbol("asyncIterator not implemented");
      const ITERATOR =
        (doIter && Symbol.iterator) || Symbol("iterator not implemented");
      const isEndish = (ev) =>
        ev === "end" || ev === "finish" || ev === "prefinish";
      const isArrayBuffer = (b) =>
        b instanceof ArrayBuffer ||
        (typeof b === "object" &&
          b.constructor &&
          b.constructor.name === "ArrayBuffer" &&
          b.byteLength >= 0);
      const isArrayBufferView = (b) =>
        !Buffer.isBuffer(b) && ArrayBuffer.isView(b);
      class Pipe {
        constructor(src, dest, opts) {
          this.src = src;
          this.dest = dest;
          this.opts = opts;
          this.ondrain = () => src[RESUME]();
          dest.on("drain", this.ondrain);
        }
        unpipe() {
          this.dest.removeListener("drain", this.ondrain);
        }
        proxyErrors() {}
        end() {
          this.unpipe();
          if (this.opts.end) this.dest.end();
        }
      }
      class PipeProxyErrors extends Pipe {
        unpipe() {
          this.src.removeListener("error", this.proxyErrors);
          super.unpipe();
        }
        constructor(src, dest, opts) {
          super(src, dest, opts);
          this.proxyErrors = (er) => dest.emit("error", er);
          src.on("error", this.proxyErrors);
        }
      }
      module.exports = class Minipass extends Stream {
        constructor(options) {
          super();
          this[FLOWING] = false;
          this[PAUSED] = false;
          this.pipes = [];
          this.buffer = [];
          this[OBJECTMODE] = (options && options.objectMode) || false;
          if (this[OBJECTMODE]) this[ENCODING] = null;
          else this[ENCODING] = (options && options.encoding) || null;
          if (this[ENCODING] === "buffer") this[ENCODING] = null;
          this[ASYNC] = (options && !!options.async) || false;
          this[DECODER] = this[ENCODING] ? new SD(this[ENCODING]) : null;
          this[EOF] = false;
          this[EMITTED_END] = false;
          this[EMITTING_END] = false;
          this[CLOSED] = false;
          this[EMITTED_ERROR] = null;
          this.writable = true;
          this.readable = true;
          this[BUFFERLENGTH] = 0;
          this[DESTROYED] = false;
        }
        get bufferLength() {
          return this[BUFFERLENGTH];
        }
        get encoding() {
          return this[ENCODING];
        }
        set encoding(enc) {
          if (this[OBJECTMODE])
            throw new Error("cannot set encoding in objectMode");
          if (
            this[ENCODING] &&
            enc !== this[ENCODING] &&
            ((this[DECODER] && this[DECODER].lastNeed) || this[BUFFERLENGTH])
          )
            throw new Error("cannot change encoding");
          if (this[ENCODING] !== enc) {
            this[DECODER] = enc ? new SD(enc) : null;
            if (this.buffer.length)
              this.buffer = this.buffer.map((chunk) =>
                this[DECODER].write(chunk),
              );
          }
          this[ENCODING] = enc;
        }
        setEncoding(enc) {
          this.encoding = enc;
        }
        get objectMode() {
          return this[OBJECTMODE];
        }
        set objectMode(om) {
          this[OBJECTMODE] = this[OBJECTMODE] || !!om;
        }
        get ["async"]() {
          return this[ASYNC];
        }
        set ["async"](a) {
          this[ASYNC] = this[ASYNC] || !!a;
        }
        write(chunk, encoding, cb) {
          if (this[EOF]) throw new Error("write after end");
          if (this[DESTROYED]) {
            this.emit(
              "error",
              Object.assign(
                new Error("Cannot call write after a stream was destroyed"),
                { code: "ERR_STREAM_DESTROYED" },
              ),
            );
            return true;
          }
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (!encoding) encoding = "utf8";
          const fn = this[ASYNC] ? defer : (f) => f();
          if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
            if (isArrayBufferView(chunk))
              chunk = Buffer.from(
                chunk.buffer,
                chunk.byteOffset,
                chunk.byteLength,
              );
            else if (isArrayBuffer(chunk)) chunk = Buffer.from(chunk);
            else if (typeof chunk !== "string") this.objectMode = true;
          }
          if (this[OBJECTMODE]) {
            if (this.flowing && this[BUFFERLENGTH] !== 0) this[FLUSH](true);
            if (this.flowing) this.emit("data", chunk);
            else this[BUFFERPUSH](chunk);
            if (this[BUFFERLENGTH] !== 0) this.emit("readable");
            if (cb) fn(cb);
            return this.flowing;
          }
          if (!chunk.length) {
            if (this[BUFFERLENGTH] !== 0) this.emit("readable");
            if (cb) fn(cb);
            return this.flowing;
          }
          if (
            typeof chunk === "string" &&
            !(encoding === this[ENCODING] && !this[DECODER].lastNeed)
          ) {
            chunk = Buffer.from(chunk, encoding);
          }
          if (Buffer.isBuffer(chunk) && this[ENCODING])
            chunk = this[DECODER].write(chunk);
          if (this.flowing && this[BUFFERLENGTH] !== 0) this[FLUSH](true);
          if (this.flowing) this.emit("data", chunk);
          else this[BUFFERPUSH](chunk);
          if (this[BUFFERLENGTH] !== 0) this.emit("readable");
          if (cb) fn(cb);
          return this.flowing;
        }
        read(n) {
          if (this[DESTROYED]) return null;
          if (this[BUFFERLENGTH] === 0 || n === 0 || n > this[BUFFERLENGTH]) {
            this[MAYBE_EMIT_END]();
            return null;
          }
          if (this[OBJECTMODE]) n = null;
          if (this.buffer.length > 1 && !this[OBJECTMODE]) {
            if (this.encoding) this.buffer = [this.buffer.join("")];
            else this.buffer = [Buffer.concat(this.buffer, this[BUFFERLENGTH])];
          }
          const ret = this[READ](n || null, this.buffer[0]);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [READ](n, chunk) {
          if (n === chunk.length || n === null) this[BUFFERSHIFT]();
          else {
            this.buffer[0] = chunk.slice(n);
            chunk = chunk.slice(0, n);
            this[BUFFERLENGTH] -= n;
          }
          this.emit("data", chunk);
          if (!this.buffer.length && !this[EOF]) this.emit("drain");
          return chunk;
        }
        end(chunk, encoding, cb) {
          if (typeof chunk === "function") (cb = chunk), (chunk = null);
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (chunk) this.write(chunk, encoding);
          if (cb) this.once("end", cb);
          this[EOF] = true;
          this.writable = false;
          if (this.flowing || !this[PAUSED]) this[MAYBE_EMIT_END]();
          return this;
        }
        [RESUME]() {
          if (this[DESTROYED]) return;
          this[PAUSED] = false;
          this[FLOWING] = true;
          this.emit("resume");
          if (this.buffer.length) this[FLUSH]();
          else if (this[EOF]) this[MAYBE_EMIT_END]();
          else this.emit("drain");
        }
        resume() {
          return this[RESUME]();
        }
        pause() {
          this[FLOWING] = false;
          this[PAUSED] = true;
        }
        get destroyed() {
          return this[DESTROYED];
        }
        get flowing() {
          return this[FLOWING];
        }
        get paused() {
          return this[PAUSED];
        }
        [BUFFERPUSH](chunk) {
          if (this[OBJECTMODE]) this[BUFFERLENGTH] += 1;
          else this[BUFFERLENGTH] += chunk.length;
          this.buffer.push(chunk);
        }
        [BUFFERSHIFT]() {
          if (this.buffer.length) {
            if (this[OBJECTMODE]) this[BUFFERLENGTH] -= 1;
            else this[BUFFERLENGTH] -= this.buffer[0].length;
          }
          return this.buffer.shift();
        }
        [FLUSH](noDrain) {
          do {} while (this[FLUSHCHUNK](this[BUFFERSHIFT]()));
          if (!noDrain && !this.buffer.length && !this[EOF]) this.emit("drain");
        }
        [FLUSHCHUNK](chunk) {
          return chunk ? (this.emit("data", chunk), this.flowing) : false;
        }
        pipe(dest, opts) {
          if (this[DESTROYED]) return;
          const ended = this[EMITTED_END];
          opts = opts || {};
          if (dest === proc.stdout || dest === proc.stderr) opts.end = false;
          else opts.end = opts.end !== false;
          opts.proxyErrors = !!opts.proxyErrors;
          if (ended) {
            if (opts.end) dest.end();
          } else {
            this.pipes.push(
              !opts.proxyErrors
                ? new Pipe(this, dest, opts)
                : new PipeProxyErrors(this, dest, opts),
            );
            if (this[ASYNC]) defer(() => this[RESUME]());
            else this[RESUME]();
          }
          return dest;
        }
        unpipe(dest) {
          const p = this.pipes.find((p) => p.dest === dest);
          if (p) {
            this.pipes.splice(this.pipes.indexOf(p), 1);
            p.unpipe();
          }
        }
        addListener(ev, fn) {
          return this.on(ev, fn);
        }
        on(ev, fn) {
          const ret = super.on(ev, fn);
          if (ev === "data" && !this.pipes.length && !this.flowing)
            this[RESUME]();
          else if (ev === "readable" && this[BUFFERLENGTH] !== 0)
            super.emit("readable");
          else if (isEndish(ev) && this[EMITTED_END]) {
            super.emit(ev);
            this.removeAllListeners(ev);
          } else if (ev === "error" && this[EMITTED_ERROR]) {
            if (this[ASYNC]) defer(() => fn.call(this, this[EMITTED_ERROR]));
            else fn.call(this, this[EMITTED_ERROR]);
          }
          return ret;
        }
        get emittedEnd() {
          return this[EMITTED_END];
        }
        [MAYBE_EMIT_END]() {
          if (
            !this[EMITTING_END] &&
            !this[EMITTED_END] &&
            !this[DESTROYED] &&
            this.buffer.length === 0 &&
            this[EOF]
          ) {
            this[EMITTING_END] = true;
            this.emit("end");
            this.emit("prefinish");
            this.emit("finish");
            if (this[CLOSED]) this.emit("close");
            this[EMITTING_END] = false;
          }
        }
        emit(ev, data, ...extra) {
          if (
            ev !== "error" &&
            ev !== "close" &&
            ev !== DESTROYED &&
            this[DESTROYED]
          )
            return;
          else if (ev === "data") {
            return !data
              ? false
              : this[ASYNC]
                ? defer(() => this[EMITDATA](data))
                : this[EMITDATA](data);
          } else if (ev === "end") {
            return this[EMITEND]();
          } else if (ev === "close") {
            this[CLOSED] = true;
            if (!this[EMITTED_END] && !this[DESTROYED]) return;
            const ret = super.emit("close");
            this.removeAllListeners("close");
            return ret;
          } else if (ev === "error") {
            this[EMITTED_ERROR] = data;
            const ret = super.emit("error", data);
            this[MAYBE_EMIT_END]();
            return ret;
          } else if (ev === "resume") {
            const ret = super.emit("resume");
            this[MAYBE_EMIT_END]();
            return ret;
          } else if (ev === "finish" || ev === "prefinish") {
            const ret = super.emit(ev);
            this.removeAllListeners(ev);
            return ret;
          }
          const ret = super.emit(ev, data, ...extra);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [EMITDATA](data) {
          for (const p of this.pipes) {
            if (p.dest.write(data) === false) this.pause();
          }
          const ret = super.emit("data", data);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [EMITEND]() {
          if (this[EMITTED_END]) return;
          this[EMITTED_END] = true;
          this.readable = false;
          if (this[ASYNC]) defer(() => this[EMITEND2]());
          else this[EMITEND2]();
        }
        [EMITEND2]() {
          if (this[DECODER]) {
            const data = this[DECODER].end();
            if (data) {
              for (const p of this.pipes) {
                p.dest.write(data);
              }
              super.emit("data", data);
            }
          }
          for (const p of this.pipes) {
            p.end();
          }
          const ret = super.emit("end");
          this.removeAllListeners("end");
          return ret;
        }
        collect() {
          const buf = [];
          if (!this[OBJECTMODE]) buf.dataLength = 0;
          const p = this.promise();
          this.on("data", (c) => {
            buf.push(c);
            if (!this[OBJECTMODE]) buf.dataLength += c.length;
          });
          return p.then(() => buf);
        }
        concat() {
          return this[OBJECTMODE]
            ? Promise.reject(new Error("cannot concat in objectMode"))
            : this.collect().then((buf) =>
                this[OBJECTMODE]
                  ? Promise.reject(new Error("cannot concat in objectMode"))
                  : this[ENCODING]
                    ? buf.join("")
                    : Buffer.concat(buf, buf.dataLength),
              );
        }
        promise() {
          return new Promise((resolve, reject) => {
            this.on(DESTROYED, () => reject(new Error("stream destroyed")));
            this.on("error", (er) => reject(er));
            this.on("end", () => resolve());
          });
        }
        [ASYNCITERATOR]() {
          const next = () => {
            const res = this.read();
            if (res !== null)
              return Promise.resolve({ done: false, value: res });
            if (this[EOF]) return Promise.resolve({ done: true });
            let resolve = null;
            let reject = null;
            const onerr = (er) => {
              this.removeListener("data", ondata);
              this.removeListener("end", onend);
              reject(er);
            };
            const ondata = (value) => {
              this.removeListener("error", onerr);
              this.removeListener("end", onend);
              this.pause();
              resolve({ value, done: !!this[EOF] });
            };
            const onend = () => {
              this.removeListener("error", onerr);
              this.removeListener("data", ondata);
              resolve({ done: true });
            };
            const ondestroy = () => onerr(new Error("stream destroyed"));
            return new Promise((res, rej) => {
              reject = rej;
              resolve = res;
              this.once(DESTROYED, ondestroy);
              this.once("error", onerr);
              this.once("end", onend);
              this.once("data", ondata);
            });
          };
          return { next };
        }
        [ITERATOR]() {
          const next = () => {
            const value = this.read();
            const done = value === null;
            return { value, done };
          };
          return { next };
        }
        destroy(er) {
          if (this[DESTROYED]) {
            if (er) this.emit("error", er);
            else this.emit(DESTROYED);
            return this;
          }
          this[DESTROYED] = true;
          this.buffer.length = 0;
          this[BUFFERLENGTH] = 0;
          if (typeof this.close === "function" && !this[CLOSED]) this.close();
          if (er) this.emit("error", er);
          else this.emit(DESTROYED);
          return this;
        }
        static isStream(s) {
          return (
            !!s &&
            (s instanceof Minipass ||
              s instanceof Stream ||
              (s instanceof EE &&
                (typeof s.pipe === "function" ||
                  (typeof s.write === "function" &&
                    typeof s.end === "function"))))
          );
        }
      };
    },
    9891: (module, __unused_webpack_exports, __nccwpck_require__) => {
      const Minipass = __nccwpck_require__(3392);
      const EE = __nccwpck_require__(2361);
      const isStream = (s) =>
        s &&
        s instanceof EE &&
        (typeof s.pipe === "function" ||
          (typeof s.write === "function" && typeof s.end === "function"));
      const _head = Symbol("_head");
      const _tail = Symbol("_tail");
      const _linkStreams = Symbol("_linkStreams");
      const _setHead = Symbol("_setHead");
      const _setTail = Symbol("_setTail");
      const _onError = Symbol("_onError");
      const _onData = Symbol("_onData");
      const _onEnd = Symbol("_onEnd");
      const _onDrain = Symbol("_onDrain");
      const _streams = Symbol("_streams");
      class Pipeline extends Minipass {
        constructor(opts, ...streams) {
          if (isStream(opts)) {
            streams.unshift(opts);
            opts = {};
          }
          super(opts);
          this[_streams] = [];
          if (streams.length) this.push(...streams);
        }
        [_linkStreams](streams) {
          return streams.reduce((src, dest) => {
            src.on("error", (er) => dest.emit("error", er));
            src.pipe(dest);
            return dest;
          });
        }
        push(...streams) {
          this[_streams].push(...streams);
          if (this[_tail]) streams.unshift(this[_tail]);
          const linkRet = this[_linkStreams](streams);
          this[_setTail](linkRet);
          if (!this[_head]) this[_setHead](streams[0]);
        }
        unshift(...streams) {
          this[_streams].unshift(...streams);
          if (this[_head]) streams.push(this[_head]);
          const linkRet = this[_linkStreams](streams);
          this[_setHead](streams[0]);
          if (!this[_tail]) this[_setTail](linkRet);
        }
        destroy(er) {
          this[_streams].forEach(
            (s) => typeof s.destroy === "function" && s.destroy(),
          );
          return super.destroy(er);
        }
        [_setTail](stream) {
          this[_tail] = stream;
          stream.on("error", (er) => this[_onError](stream, er));
          stream.on("data", (chunk) => this[_onData](stream, chunk));
          stream.on("end", () => this[_onEnd](stream));
          stream.on("finish", () => this[_onEnd](stream));
        }
        [_onError](stream, er) {
          if (stream === this[_tail]) this.emit("error", er);
        }
        [_onData](stream, chunk) {
          if (stream === this[_tail]) super.write(chunk);
        }
        [_onEnd](stream) {
          if (stream === this[_tail]) super.end();
        }
        pause() {
          super.pause();
          return this[_tail] && this[_tail].pause && this[_tail].pause();
        }
        emit(ev, ...args) {
          if (ev === "resume" && this[_tail] && this[_tail].resume)
            this[_tail].resume();
          return super.emit(ev, ...args);
        }
        [_setHead](stream) {
          this[_head] = stream;
          stream.on("drain", () => this[_onDrain](stream));
        }
        [_onDrain](stream) {
          if (stream === this[_head]) this.emit("drain");
        }
        write(chunk, enc, cb) {
          return (
            this[_head].write(chunk, enc, cb) &&
            (this.flowing || this.buffer.length === 0)
          );
        }
        end(chunk, enc, cb) {
          this[_head].end(chunk, enc, cb);
          return this;
        }
      }
      module.exports = Pipeline;
    },
    3392: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const proc =
        typeof process === "object" && process
          ? process
          : { stdout: null, stderr: null };
      const EE = __nccwpck_require__(2361);
      const Stream = __nccwpck_require__(2781);
      const SD = __nccwpck_require__(1576).StringDecoder;
      const EOF = Symbol("EOF");
      const MAYBE_EMIT_END = Symbol("maybeEmitEnd");
      const EMITTED_END = Symbol("emittedEnd");
      const EMITTING_END = Symbol("emittingEnd");
      const EMITTED_ERROR = Symbol("emittedError");
      const CLOSED = Symbol("closed");
      const READ = Symbol("read");
      const FLUSH = Symbol("flush");
      const FLUSHCHUNK = Symbol("flushChunk");
      const ENCODING = Symbol("encoding");
      const DECODER = Symbol("decoder");
      const FLOWING = Symbol("flowing");
      const PAUSED = Symbol("paused");
      const RESUME = Symbol("resume");
      const BUFFERLENGTH = Symbol("bufferLength");
      const BUFFERPUSH = Symbol("bufferPush");
      const BUFFERSHIFT = Symbol("bufferShift");
      const OBJECTMODE = Symbol("objectMode");
      const DESTROYED = Symbol("destroyed");
      const EMITDATA = Symbol("emitData");
      const EMITEND = Symbol("emitEnd");
      const EMITEND2 = Symbol("emitEnd2");
      const ASYNC = Symbol("async");
      const defer = (fn) => Promise.resolve().then(fn);
      const doIter = global._MP_NO_ITERATOR_SYMBOLS_ !== "1";
      const ASYNCITERATOR =
        (doIter && Symbol.asyncIterator) ||
        Symbol("asyncIterator not implemented");
      const ITERATOR =
        (doIter && Symbol.iterator) || Symbol("iterator not implemented");
      const isEndish = (ev) =>
        ev === "end" || ev === "finish" || ev === "prefinish";
      const isArrayBuffer = (b) =>
        b instanceof ArrayBuffer ||
        (typeof b === "object" &&
          b.constructor &&
          b.constructor.name === "ArrayBuffer" &&
          b.byteLength >= 0);
      const isArrayBufferView = (b) =>
        !Buffer.isBuffer(b) && ArrayBuffer.isView(b);
      class Pipe {
        constructor(src, dest, opts) {
          this.src = src;
          this.dest = dest;
          this.opts = opts;
          this.ondrain = () => src[RESUME]();
          dest.on("drain", this.ondrain);
        }
        unpipe() {
          this.dest.removeListener("drain", this.ondrain);
        }
        proxyErrors() {}
        end() {
          this.unpipe();
          if (this.opts.end) this.dest.end();
        }
      }
      class PipeProxyErrors extends Pipe {
        unpipe() {
          this.src.removeListener("error", this.proxyErrors);
          super.unpipe();
        }
        constructor(src, dest, opts) {
          super(src, dest, opts);
          this.proxyErrors = (er) => dest.emit("error", er);
          src.on("error", this.proxyErrors);
        }
      }
      module.exports = class Minipass extends Stream {
        constructor(options) {
          super();
          this[FLOWING] = false;
          this[PAUSED] = false;
          this.pipes = [];
          this.buffer = [];
          this[OBJECTMODE] = (options && options.objectMode) || false;
          if (this[OBJECTMODE]) this[ENCODING] = null;
          else this[ENCODING] = (options && options.encoding) || null;
          if (this[ENCODING] === "buffer") this[ENCODING] = null;
          this[ASYNC] = (options && !!options.async) || false;
          this[DECODER] = this[ENCODING] ? new SD(this[ENCODING]) : null;
          this[EOF] = false;
          this[EMITTED_END] = false;
          this[EMITTING_END] = false;
          this[CLOSED] = false;
          this[EMITTED_ERROR] = null;
          this.writable = true;
          this.readable = true;
          this[BUFFERLENGTH] = 0;
          this[DESTROYED] = false;
        }
        get bufferLength() {
          return this[BUFFERLENGTH];
        }
        get encoding() {
          return this[ENCODING];
        }
        set encoding(enc) {
          if (this[OBJECTMODE])
            throw new Error("cannot set encoding in objectMode");
          if (
            this[ENCODING] &&
            enc !== this[ENCODING] &&
            ((this[DECODER] && this[DECODER].lastNeed) || this[BUFFERLENGTH])
          )
            throw new Error("cannot change encoding");
          if (this[ENCODING] !== enc) {
            this[DECODER] = enc ? new SD(enc) : null;
            if (this.buffer.length)
              this.buffer = this.buffer.map((chunk) =>
                this[DECODER].write(chunk),
              );
          }
          this[ENCODING] = enc;
        }
        setEncoding(enc) {
          this.encoding = enc;
        }
        get objectMode() {
          return this[OBJECTMODE];
        }
        set objectMode(om) {
          this[OBJECTMODE] = this[OBJECTMODE] || !!om;
        }
        get ["async"]() {
          return this[ASYNC];
        }
        set ["async"](a) {
          this[ASYNC] = this[ASYNC] || !!a;
        }
        write(chunk, encoding, cb) {
          if (this[EOF]) throw new Error("write after end");
          if (this[DESTROYED]) {
            this.emit(
              "error",
              Object.assign(
                new Error("Cannot call write after a stream was destroyed"),
                { code: "ERR_STREAM_DESTROYED" },
              ),
            );
            return true;
          }
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (!encoding) encoding = "utf8";
          const fn = this[ASYNC] ? defer : (f) => f();
          if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
            if (isArrayBufferView(chunk))
              chunk = Buffer.from(
                chunk.buffer,
                chunk.byteOffset,
                chunk.byteLength,
              );
            else if (isArrayBuffer(chunk)) chunk = Buffer.from(chunk);
            else if (typeof chunk !== "string") this.objectMode = true;
          }
          if (this[OBJECTMODE]) {
            if (this.flowing && this[BUFFERLENGTH] !== 0) this[FLUSH](true);
            if (this.flowing) this.emit("data", chunk);
            else this[BUFFERPUSH](chunk);
            if (this[BUFFERLENGTH] !== 0) this.emit("readable");
            if (cb) fn(cb);
            return this.flowing;
          }
          if (!chunk.length) {
            if (this[BUFFERLENGTH] !== 0) this.emit("readable");
            if (cb) fn(cb);
            return this.flowing;
          }
          if (
            typeof chunk === "string" &&
            !(encoding === this[ENCODING] && !this[DECODER].lastNeed)
          ) {
            chunk = Buffer.from(chunk, encoding);
          }
          if (Buffer.isBuffer(chunk) && this[ENCODING])
            chunk = this[DECODER].write(chunk);
          if (this.flowing && this[BUFFERLENGTH] !== 0) this[FLUSH](true);
          if (this.flowing) this.emit("data", chunk);
          else this[BUFFERPUSH](chunk);
          if (this[BUFFERLENGTH] !== 0) this.emit("readable");
          if (cb) fn(cb);
          return this.flowing;
        }
        read(n) {
          if (this[DESTROYED]) return null;
          if (this[BUFFERLENGTH] === 0 || n === 0 || n > this[BUFFERLENGTH]) {
            this[MAYBE_EMIT_END]();
            return null;
          }
          if (this[OBJECTMODE]) n = null;
          if (this.buffer.length > 1 && !this[OBJECTMODE]) {
            if (this.encoding) this.buffer = [this.buffer.join("")];
            else this.buffer = [Buffer.concat(this.buffer, this[BUFFERLENGTH])];
          }
          const ret = this[READ](n || null, this.buffer[0]);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [READ](n, chunk) {
          if (n === chunk.length || n === null) this[BUFFERSHIFT]();
          else {
            this.buffer[0] = chunk.slice(n);
            chunk = chunk.slice(0, n);
            this[BUFFERLENGTH] -= n;
          }
          this.emit("data", chunk);
          if (!this.buffer.length && !this[EOF]) this.emit("drain");
          return chunk;
        }
        end(chunk, encoding, cb) {
          if (typeof chunk === "function") (cb = chunk), (chunk = null);
          if (typeof encoding === "function")
            (cb = encoding), (encoding = "utf8");
          if (chunk) this.write(chunk, encoding);
          if (cb) this.once("end", cb);
          this[EOF] = true;
          this.writable = false;
          if (this.flowing || !this[PAUSED]) this[MAYBE_EMIT_END]();
          return this;
        }
        [RESUME]() {
          if (this[DESTROYED]) return;
          this[PAUSED] = false;
          this[FLOWING] = true;
          this.emit("resume");
          if (this.buffer.length) this[FLUSH]();
          else if (this[EOF]) this[MAYBE_EMIT_END]();
          else this.emit("drain");
        }
        resume() {
          return this[RESUME]();
        }
        pause() {
          this[FLOWING] = false;
          this[PAUSED] = true;
        }
        get destroyed() {
          return this[DESTROYED];
        }
        get flowing() {
          return this[FLOWING];
        }
        get paused() {
          return this[PAUSED];
        }
        [BUFFERPUSH](chunk) {
          if (this[OBJECTMODE]) this[BUFFERLENGTH] += 1;
          else this[BUFFERLENGTH] += chunk.length;
          this.buffer.push(chunk);
        }
        [BUFFERSHIFT]() {
          if (this.buffer.length) {
            if (this[OBJECTMODE]) this[BUFFERLENGTH] -= 1;
            else this[BUFFERLENGTH] -= this.buffer[0].length;
          }
          return this.buffer.shift();
        }
        [FLUSH](noDrain) {
          do {} while (this[FLUSHCHUNK](this[BUFFERSHIFT]()));
          if (!noDrain && !this.buffer.length && !this[EOF]) this.emit("drain");
        }
        [FLUSHCHUNK](chunk) {
          return chunk ? (this.emit("data", chunk), this.flowing) : false;
        }
        pipe(dest, opts) {
          if (this[DESTROYED]) return;
          const ended = this[EMITTED_END];
          opts = opts || {};
          if (dest === proc.stdout || dest === proc.stderr) opts.end = false;
          else opts.end = opts.end !== false;
          opts.proxyErrors = !!opts.proxyErrors;
          if (ended) {
            if (opts.end) dest.end();
          } else {
            this.pipes.push(
              !opts.proxyErrors
                ? new Pipe(this, dest, opts)
                : new PipeProxyErrors(this, dest, opts),
            );
            if (this[ASYNC]) defer(() => this[RESUME]());
            else this[RESUME]();
          }
          return dest;
        }
        unpipe(dest) {
          const p = this.pipes.find((p) => p.dest === dest);
          if (p) {
            this.pipes.splice(this.pipes.indexOf(p), 1);
            p.unpipe();
          }
        }
        addListener(ev, fn) {
          return this.on(ev, fn);
        }
        on(ev, fn) {
          const ret = super.on(ev, fn);
          if (ev === "data" && !this.pipes.length && !this.flowing)
            this[RESUME]();
          else if (ev === "readable" && this[BUFFERLENGTH] !== 0)
            super.emit("readable");
          else if (isEndish(ev) && this[EMITTED_END]) {
            super.emit(ev);
            this.removeAllListeners(ev);
          } else if (ev === "error" && this[EMITTED_ERROR]) {
            if (this[ASYNC]) defer(() => fn.call(this, this[EMITTED_ERROR]));
            else fn.call(this, this[EMITTED_ERROR]);
          }
          return ret;
        }
        get emittedEnd() {
          return this[EMITTED_END];
        }
        [MAYBE_EMIT_END]() {
          if (
            !this[EMITTING_END] &&
            !this[EMITTED_END] &&
            !this[DESTROYED] &&
            this.buffer.length === 0 &&
            this[EOF]
          ) {
            this[EMITTING_END] = true;
            this.emit("end");
            this.emit("prefinish");
            this.emit("finish");
            if (this[CLOSED]) this.emit("close");
            this[EMITTING_END] = false;
          }
        }
        emit(ev, data, ...extra) {
          if (
            ev !== "error" &&
            ev !== "close" &&
            ev !== DESTROYED &&
            this[DESTROYED]
          )
            return;
          else if (ev === "data") {
            return !data
              ? false
              : this[ASYNC]
                ? defer(() => this[EMITDATA](data))
                : this[EMITDATA](data);
          } else if (ev === "end") {
            return this[EMITEND]();
          } else if (ev === "close") {
            this[CLOSED] = true;
            if (!this[EMITTED_END] && !this[DESTROYED]) return;
            const ret = super.emit("close");
            this.removeAllListeners("close");
            return ret;
          } else if (ev === "error") {
            this[EMITTED_ERROR] = data;
            const ret = super.emit("error", data);
            this[MAYBE_EMIT_END]();
            return ret;
          } else if (ev === "resume") {
            const ret = super.emit("resume");
            this[MAYBE_EMIT_END]();
            return ret;
          } else if (ev === "finish" || ev === "prefinish") {
            const ret = super.emit(ev);
            this.removeAllListeners(ev);
            return ret;
          }
          const ret = super.emit(ev, data, ...extra);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [EMITDATA](data) {
          for (const p of this.pipes) {
            if (p.dest.write(data) === false) this.pause();
          }
          const ret = super.emit("data", data);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [EMITEND]() {
          if (this[EMITTED_END]) return;
          this[EMITTED_END] = true;
          this.readable = false;
          if (this[ASYNC]) defer(() => this[EMITEND2]());
          else this[EMITEND2]();
        }
        [EMITEND2]() {
          if (this[DECODER]) {
            const data = this[DECODER].end();
            if (data) {
              for (const p of this.pipes) {
                p.dest.write(data);
              }
              super.emit("data", data);
            }
          }
          for (const p of this.pipes) {
            p.end();
          }
          const ret = super.emit("end");
          this.removeAllListeners("end");
          return ret;
        }
        collect() {
          const buf = [];
          if (!this[OBJECTMODE]) buf.dataLength = 0;
          const p = this.promise();
          this.on("data", (c) => {
            buf.push(c);
            if (!this[OBJECTMODE]) buf.dataLength += c.length;
          });
          return p.then(() => buf);
        }
        concat() {
          return this[OBJECTMODE]
            ? Promise.reject(new Error("cannot concat in objectMode"))
            : this.collect().then((buf) =>
                this[OBJECTMODE]
                  ? Promise.reject(new Error("cannot concat in objectMode"))
                  : this[ENCODING]
                    ? buf.join("")
                    : Buffer.concat(buf, buf.dataLength),
              );
        }
        promise() {
          return new Promise((resolve, reject) => {
            this.on(DESTROYED, () => reject(new Error("stream destroyed")));
            this.on("error", (er) => reject(er));
            this.on("end", () => resolve());
          });
        }
        [ASYNCITERATOR]() {
          const next = () => {
            const res = this.read();
            if (res !== null)
              return Promise.resolve({ done: false, value: res });
            if (this[EOF]) return Promise.resolve({ done: true });
            let resolve = null;
            let reject = null;
            const onerr = (er) => {
              this.removeListener("data", ondata);
              this.removeListener("end", onend);
              reject(er);
            };
            const ondata = (value) => {
              this.removeListener("error", onerr);
              this.removeListener("end", onend);
              this.pause();
              resolve({ value, done: !!this[EOF] });
            };
            const onend = () => {
              this.removeListener("error", onerr);
              this.removeListener("data", ondata);
              resolve({ done: true });
            };
            const ondestroy = () => onerr(new Error("stream destroyed"));
            return new Promise((res, rej) => {
              reject = rej;
              resolve = res;
              this.once(DESTROYED, ondestroy);
              this.once("error", onerr);
              this.once("end", onend);
              this.once("data", ondata);
            });
          };
          return { next };
        }
        [ITERATOR]() {
          const next = () => {
            const value = this.read();
            const done = value === null;
            return { value, done };
          };
          return { next };
        }
        destroy(er) {
          if (this[DESTROYED]) {
            if (er) this.emit("error", er);
            else this.emit(DESTROYED);
            return this;
          }
          this[DESTROYED] = true;
          this.buffer.length = 0;
          this[BUFFERLENGTH] = 0;
          if (typeof this.close === "function" && !this[CLOSED]) this.close();
          if (er) this.emit("error", er);
          else this.emit(DESTROYED);
          return this;
        }
        static isStream(s) {
          return (
            !!s &&
            (s instanceof Minipass ||
              s instanceof Stream ||
              (s instanceof EE &&
                (typeof s.pipe === "function" ||
                  (typeof s.write === "function" &&
                    typeof s.end === "function"))))
          );
        }
      };
    },
    1747: (module, __unused_webpack_exports, __nccwpck_require__) => {
      var path = __nccwpck_require__(1017);
      var uniqueSlug = __nccwpck_require__(7848);
      module.exports = function (filepath, prefix, uniq) {
        return path.join(
          filepath,
          (prefix ? prefix + "-" : "") + uniqueSlug(uniq),
        );
      };
    },
    7848: (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      var MurmurHash3 = __nccwpck_require__(2527);
      module.exports = function (uniq) {
        if (uniq) {
          var hash = new MurmurHash3(uniq);
          return ("00000000" + hash.result().toString(16)).slice(-8);
        } else {
          return (Math.random().toString(16) + "0000000").slice(2, 10);
        }
      };
    },
    4541: (module) => {
      "use strict";
      module.exports = require("../semver/index.js");
    },
    3684: (module) => {
      "use strict";
      module.exports = require("./package.json");
    },
    6113: (module) => {
      "use strict";
      module.exports = require("crypto");
    },
    2361: (module) => {
      "use strict";
      module.exports = require("events");
    },
    7147: (module) => {
      "use strict";
      module.exports = require("fs");
    },
    3292: (module) => {
      "use strict";
      module.exports = require("fs/promises");
    },
    5673: (module) => {
      "use strict";
      module.exports = require("node:events");
    },
    7561: (module) => {
      "use strict";
      module.exports = require("node:fs");
    },
    3977: (module) => {
      "use strict";
      module.exports = require("node:fs/promises");
    },
    9411: (module) => {
      "use strict";
      module.exports = require("node:path");
    },
    4492: (module) => {
      "use strict";
      module.exports = require("node:stream");
    },
    6915: (module) => {
      "use strict";
      module.exports = require("node:string_decoder");
    },
    1041: (module) => {
      "use strict";
      module.exports = require("node:url");
    },
    2037: (module) => {
      "use strict";
      module.exports = require("os");
    },
    1017: (module) => {
      "use strict";
      module.exports = require("path");
    },
    2781: (module) => {
      "use strict";
      module.exports = require("stream");
    },
    1576: (module) => {
      "use strict";
      module.exports = require("string_decoder");
    },
    7310: (module) => {
      "use strict";
      module.exports = require("url");
    },
    3837: (module) => {
      "use strict";
      module.exports = require("util");
    },
    2487: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Glob = void 0;
      const minimatch_1 = __nccwpck_require__(4501);
      const node_url_1 = __nccwpck_require__(1041);
      const path_scurry_1 = __nccwpck_require__(1081);
      const pattern_js_1 = __nccwpck_require__(6866);
      const walker_js_1 = __nccwpck_require__(153);
      const defaultPlatform =
        typeof process === "object" &&
        process &&
        typeof process.platform === "string"
          ? process.platform
          : "linux";
      class Glob {
        absolute;
        cwd;
        root;
        dot;
        dotRelative;
        follow;
        ignore;
        magicalBraces;
        mark;
        matchBase;
        maxDepth;
        nobrace;
        nocase;
        nodir;
        noext;
        noglobstar;
        pattern;
        platform;
        realpath;
        scurry;
        stat;
        signal;
        windowsPathsNoEscape;
        withFileTypes;
        includeChildMatches;
        opts;
        patterns;
        constructor(pattern, opts) {
          if (!opts) throw new TypeError("glob options required");
          this.withFileTypes = !!opts.withFileTypes;
          this.signal = opts.signal;
          this.follow = !!opts.follow;
          this.dot = !!opts.dot;
          this.dotRelative = !!opts.dotRelative;
          this.nodir = !!opts.nodir;
          this.mark = !!opts.mark;
          if (!opts.cwd) {
            this.cwd = "";
          } else if (
            opts.cwd instanceof URL ||
            opts.cwd.startsWith("file://")
          ) {
            opts.cwd = (0, node_url_1.fileURLToPath)(opts.cwd);
          }
          this.cwd = opts.cwd || "";
          this.root = opts.root;
          this.magicalBraces = !!opts.magicalBraces;
          this.nobrace = !!opts.nobrace;
          this.noext = !!opts.noext;
          this.realpath = !!opts.realpath;
          this.absolute = opts.absolute;
          this.includeChildMatches = opts.includeChildMatches !== false;
          this.noglobstar = !!opts.noglobstar;
          this.matchBase = !!opts.matchBase;
          this.maxDepth =
            typeof opts.maxDepth === "number" ? opts.maxDepth : Infinity;
          this.stat = !!opts.stat;
          this.ignore = opts.ignore;
          if (this.withFileTypes && this.absolute !== undefined) {
            throw new Error("cannot set absolute and withFileTypes:true");
          }
          if (typeof pattern === "string") {
            pattern = [pattern];
          }
          this.windowsPathsNoEscape =
            !!opts.windowsPathsNoEscape || opts.allowWindowsEscape === false;
          if (this.windowsPathsNoEscape) {
            pattern = pattern.map((p) => p.replace(/\\/g, "/"));
          }
          if (this.matchBase) {
            if (opts.noglobstar) {
              throw new TypeError("base matching requires globstar");
            }
            pattern = pattern.map((p) => (p.includes("/") ? p : `./**/${p}`));
          }
          this.pattern = pattern;
          this.platform = opts.platform || defaultPlatform;
          this.opts = { ...opts, platform: this.platform };
          if (opts.scurry) {
            this.scurry = opts.scurry;
            if (
              opts.nocase !== undefined &&
              opts.nocase !== opts.scurry.nocase
            ) {
              throw new Error(
                "nocase option contradicts provided scurry option",
              );
            }
          } else {
            const Scurry =
              opts.platform === "win32"
                ? path_scurry_1.PathScurryWin32
                : opts.platform === "darwin"
                  ? path_scurry_1.PathScurryDarwin
                  : opts.platform
                    ? path_scurry_1.PathScurryPosix
                    : path_scurry_1.PathScurry;
            this.scurry = new Scurry(this.cwd, {
              nocase: opts.nocase,
              fs: opts.fs,
            });
          }
          this.nocase = this.scurry.nocase;
          const nocaseMagicOnly =
            this.platform === "darwin" || this.platform === "win32";
          const mmo = {
            ...opts,
            dot: this.dot,
            matchBase: this.matchBase,
            nobrace: this.nobrace,
            nocase: this.nocase,
            nocaseMagicOnly,
            nocomment: true,
            noext: this.noext,
            nonegate: true,
            optimizationLevel: 2,
            platform: this.platform,
            windowsPathsNoEscape: this.windowsPathsNoEscape,
            debug: !!this.opts.debug,
          };
          const mms = this.pattern.map(
            (p) => new minimatch_1.Minimatch(p, mmo),
          );
          const [matchSet, globParts] = mms.reduce(
            (set, m) => {
              set[0].push(...m.set);
              set[1].push(...m.globParts);
              return set;
            },
            [[], []],
          );
          this.patterns = matchSet.map((set, i) => {
            const g = globParts[i];
            if (!g) throw new Error("invalid pattern object");
            return new pattern_js_1.Pattern(set, g, 0, this.platform);
          });
        }
        async walk() {
          return [
            ...(await new walker_js_1.GlobWalker(
              this.patterns,
              this.scurry.cwd,
              {
                ...this.opts,
                maxDepth:
                  this.maxDepth !== Infinity
                    ? this.maxDepth + this.scurry.cwd.depth()
                    : Infinity,
                platform: this.platform,
                nocase: this.nocase,
                includeChildMatches: this.includeChildMatches,
              },
            ).walk()),
          ];
        }
        walkSync() {
          return [
            ...new walker_js_1.GlobWalker(this.patterns, this.scurry.cwd, {
              ...this.opts,
              maxDepth:
                this.maxDepth !== Infinity
                  ? this.maxDepth + this.scurry.cwd.depth()
                  : Infinity,
              platform: this.platform,
              nocase: this.nocase,
              includeChildMatches: this.includeChildMatches,
            }).walkSync(),
          ];
        }
        stream() {
          return new walker_js_1.GlobStream(this.patterns, this.scurry.cwd, {
            ...this.opts,
            maxDepth:
              this.maxDepth !== Infinity
                ? this.maxDepth + this.scurry.cwd.depth()
                : Infinity,
            platform: this.platform,
            nocase: this.nocase,
            includeChildMatches: this.includeChildMatches,
          }).stream();
        }
        streamSync() {
          return new walker_js_1.GlobStream(this.patterns, this.scurry.cwd, {
            ...this.opts,
            maxDepth:
              this.maxDepth !== Infinity
                ? this.maxDepth + this.scurry.cwd.depth()
                : Infinity,
            platform: this.platform,
            nocase: this.nocase,
            includeChildMatches: this.includeChildMatches,
          }).streamSync();
        }
        iterateSync() {
          return this.streamSync()[Symbol.iterator]();
        }
        [Symbol.iterator]() {
          return this.iterateSync();
        }
        iterate() {
          return this.stream()[Symbol.asyncIterator]();
        }
        [Symbol.asyncIterator]() {
          return this.iterate();
        }
      }
      exports.Glob = Glob;
    },
    3133: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasMagic = void 0;
      const minimatch_1 = __nccwpck_require__(4501);
      const hasMagic = (pattern, options = {}) => {
        if (!Array.isArray(pattern)) {
          pattern = [pattern];
        }
        for (const p of pattern) {
          if (new minimatch_1.Minimatch(p, options).hasMagic()) return true;
        }
        return false;
      };
      exports.hasMagic = hasMagic;
    },
    9703: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Ignore = void 0;
      const minimatch_1 = __nccwpck_require__(4501);
      const pattern_js_1 = __nccwpck_require__(6866);
      const defaultPlatform =
        typeof process === "object" &&
        process &&
        typeof process.platform === "string"
          ? process.platform
          : "linux";
      class Ignore {
        relative;
        relativeChildren;
        absolute;
        absoluteChildren;
        platform;
        mmopts;
        constructor(
          ignored,
          { nobrace, nocase, noext, noglobstar, platform = defaultPlatform },
        ) {
          this.relative = [];
          this.absolute = [];
          this.relativeChildren = [];
          this.absoluteChildren = [];
          this.platform = platform;
          this.mmopts = {
            dot: true,
            nobrace,
            nocase,
            noext,
            noglobstar,
            optimizationLevel: 2,
            platform,
            nocomment: true,
            nonegate: true,
          };
          for (const ign of ignored) this.add(ign);
        }
        add(ign) {
          const mm = new minimatch_1.Minimatch(ign, this.mmopts);
          for (let i = 0; i < mm.set.length; i++) {
            const parsed = mm.set[i];
            const globParts = mm.globParts[i];
            if (!parsed || !globParts) {
              throw new Error("invalid pattern object");
            }
            while (parsed[0] === "." && globParts[0] === ".") {
              parsed.shift();
              globParts.shift();
            }
            const p = new pattern_js_1.Pattern(
              parsed,
              globParts,
              0,
              this.platform,
            );
            const m = new minimatch_1.Minimatch(p.globString(), this.mmopts);
            const children = globParts[globParts.length - 1] === "**";
            const absolute = p.isAbsolute();
            if (absolute) this.absolute.push(m);
            else this.relative.push(m);
            if (children) {
              if (absolute) this.absoluteChildren.push(m);
              else this.relativeChildren.push(m);
            }
          }
        }
        ignored(p) {
          const fullpath = p.fullpath();
          const fullpaths = `${fullpath}/`;
          const relative = p.relative() || ".";
          const relatives = `${relative}/`;
          for (const m of this.relative) {
            if (m.match(relative) || m.match(relatives)) return true;
          }
          for (const m of this.absolute) {
            if (m.match(fullpath) || m.match(fullpaths)) return true;
          }
          return false;
        }
        childrenIgnored(p) {
          const fullpath = p.fullpath() + "/";
          const relative = (p.relative() || ".") + "/";
          for (const m of this.relativeChildren) {
            if (m.match(relative)) return true;
          }
          for (const m of this.absoluteChildren) {
            if (m.match(fullpath)) return true;
          }
          return false;
        }
      }
      exports.Ignore = Ignore;
    },
    8211: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.glob =
        exports.sync =
        exports.iterate =
        exports.iterateSync =
        exports.stream =
        exports.streamSync =
        exports.Ignore =
        exports.hasMagic =
        exports.Glob =
        exports.unescape =
        exports.escape =
          void 0;
      exports.globStreamSync = globStreamSync;
      exports.globStream = globStream;
      exports.globSync = globSync;
      exports.globIterateSync = globIterateSync;
      exports.globIterate = globIterate;
      const minimatch_1 = __nccwpck_require__(4501);
      const glob_js_1 = __nccwpck_require__(2487);
      const has_magic_js_1 = __nccwpck_require__(3133);
      var minimatch_2 = __nccwpck_require__(4501);
      Object.defineProperty(exports, "escape", {
        enumerable: true,
        get: function () {
          return minimatch_2.escape;
        },
      });
      Object.defineProperty(exports, "unescape", {
        enumerable: true,
        get: function () {
          return minimatch_2.unescape;
        },
      });
      var glob_js_2 = __nccwpck_require__(2487);
      Object.defineProperty(exports, "Glob", {
        enumerable: true,
        get: function () {
          return glob_js_2.Glob;
        },
      });
      var has_magic_js_2 = __nccwpck_require__(3133);
      Object.defineProperty(exports, "hasMagic", {
        enumerable: true,
        get: function () {
          return has_magic_js_2.hasMagic;
        },
      });
      var ignore_js_1 = __nccwpck_require__(9703);
      Object.defineProperty(exports, "Ignore", {
        enumerable: true,
        get: function () {
          return ignore_js_1.Ignore;
        },
      });
      function globStreamSync(pattern, options = {}) {
        return new glob_js_1.Glob(pattern, options).streamSync();
      }
      function globStream(pattern, options = {}) {
        return new glob_js_1.Glob(pattern, options).stream();
      }
      function globSync(pattern, options = {}) {
        return new glob_js_1.Glob(pattern, options).walkSync();
      }
      async function glob_(pattern, options = {}) {
        return new glob_js_1.Glob(pattern, options).walk();
      }
      function globIterateSync(pattern, options = {}) {
        return new glob_js_1.Glob(pattern, options).iterateSync();
      }
      function globIterate(pattern, options = {}) {
        return new glob_js_1.Glob(pattern, options).iterate();
      }
      exports.streamSync = globStreamSync;
      exports.stream = Object.assign(globStream, { sync: globStreamSync });
      exports.iterateSync = globIterateSync;
      exports.iterate = Object.assign(globIterate, { sync: globIterateSync });
      exports.sync = Object.assign(globSync, {
        stream: globStreamSync,
        iterate: globIterateSync,
      });
      exports.glob = Object.assign(glob_, {
        glob: glob_,
        globSync,
        sync: exports.sync,
        globStream,
        stream: exports.stream,
        globStreamSync,
        streamSync: exports.streamSync,
        globIterate,
        iterate: exports.iterate,
        globIterateSync,
        iterateSync: exports.iterateSync,
        Glob: glob_js_1.Glob,
        hasMagic: has_magic_js_1.hasMagic,
        escape: minimatch_1.escape,
        unescape: minimatch_1.unescape,
      });
      exports.glob.glob = exports.glob;
    },
    6866: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Pattern = void 0;
      const minimatch_1 = __nccwpck_require__(4501);
      const isPatternList = (pl) => pl.length >= 1;
      const isGlobList = (gl) => gl.length >= 1;
      class Pattern {
        #patternList;
        #globList;
        #index;
        length;
        #platform;
        #rest;
        #globString;
        #isDrive;
        #isUNC;
        #isAbsolute;
        #followGlobstar = true;
        constructor(patternList, globList, index, platform) {
          if (!isPatternList(patternList)) {
            throw new TypeError("empty pattern list");
          }
          if (!isGlobList(globList)) {
            throw new TypeError("empty glob list");
          }
          if (globList.length !== patternList.length) {
            throw new TypeError(
              "mismatched pattern list and glob list lengths",
            );
          }
          this.length = patternList.length;
          if (index < 0 || index >= this.length) {
            throw new TypeError("index out of range");
          }
          this.#patternList = patternList;
          this.#globList = globList;
          this.#index = index;
          this.#platform = platform;
          if (this.#index === 0) {
            if (this.isUNC()) {
              const [p0, p1, p2, p3, ...prest] = this.#patternList;
              const [g0, g1, g2, g3, ...grest] = this.#globList;
              if (prest[0] === "") {
                prest.shift();
                grest.shift();
              }
              const p = [p0, p1, p2, p3, ""].join("/");
              const g = [g0, g1, g2, g3, ""].join("/");
              this.#patternList = [p, ...prest];
              this.#globList = [g, ...grest];
              this.length = this.#patternList.length;
            } else if (this.isDrive() || this.isAbsolute()) {
              const [p1, ...prest] = this.#patternList;
              const [g1, ...grest] = this.#globList;
              if (prest[0] === "") {
                prest.shift();
                grest.shift();
              }
              const p = p1 + "/";
              const g = g1 + "/";
              this.#patternList = [p, ...prest];
              this.#globList = [g, ...grest];
              this.length = this.#patternList.length;
            }
          }
        }
        pattern() {
          return this.#patternList[this.#index];
        }
        isString() {
          return typeof this.#patternList[this.#index] === "string";
        }
        isGlobstar() {
          return this.#patternList[this.#index] === minimatch_1.GLOBSTAR;
        }
        isRegExp() {
          return this.#patternList[this.#index] instanceof RegExp;
        }
        globString() {
          return (this.#globString =
            this.#globString ||
            (this.#index === 0
              ? this.isAbsolute()
                ? this.#globList[0] + this.#globList.slice(1).join("/")
                : this.#globList.join("/")
              : this.#globList.slice(this.#index).join("/")));
        }
        hasMore() {
          return this.length > this.#index + 1;
        }
        rest() {
          if (this.#rest !== undefined) return this.#rest;
          if (!this.hasMore()) return (this.#rest = null);
          this.#rest = new Pattern(
            this.#patternList,
            this.#globList,
            this.#index + 1,
            this.#platform,
          );
          this.#rest.#isAbsolute = this.#isAbsolute;
          this.#rest.#isUNC = this.#isUNC;
          this.#rest.#isDrive = this.#isDrive;
          return this.#rest;
        }
        isUNC() {
          const pl = this.#patternList;
          return this.#isUNC !== undefined
            ? this.#isUNC
            : (this.#isUNC =
                this.#platform === "win32" &&
                this.#index === 0 &&
                pl[0] === "" &&
                pl[1] === "" &&
                typeof pl[2] === "string" &&
                !!pl[2] &&
                typeof pl[3] === "string" &&
                !!pl[3]);
        }
        isDrive() {
          const pl = this.#patternList;
          return this.#isDrive !== undefined
            ? this.#isDrive
            : (this.#isDrive =
                this.#platform === "win32" &&
                this.#index === 0 &&
                this.length > 1 &&
                typeof pl[0] === "string" &&
                /^[a-z]:$/i.test(pl[0]));
        }
        isAbsolute() {
          const pl = this.#patternList;
          return this.#isAbsolute !== undefined
            ? this.#isAbsolute
            : (this.#isAbsolute =
                (pl[0] === "" && pl.length > 1) ||
                this.isDrive() ||
                this.isUNC());
        }
        root() {
          const p = this.#patternList[0];
          return typeof p === "string" && this.isAbsolute() && this.#index === 0
            ? p
            : "";
        }
        checkFollowGlobstar() {
          return !(
            this.#index === 0 ||
            !this.isGlobstar() ||
            !this.#followGlobstar
          );
        }
        markFollowGlobstar() {
          if (this.#index === 0 || !this.isGlobstar() || !this.#followGlobstar)
            return false;
          this.#followGlobstar = false;
          return true;
        }
      }
      exports.Pattern = Pattern;
    },
    4628: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Processor =
        exports.SubWalks =
        exports.MatchRecord =
        exports.HasWalkedCache =
          void 0;
      const minimatch_1 = __nccwpck_require__(4501);
      class HasWalkedCache {
        store;
        constructor(store = new Map()) {
          this.store = store;
        }
        copy() {
          return new HasWalkedCache(new Map(this.store));
        }
        hasWalked(target, pattern) {
          return this.store.get(target.fullpath())?.has(pattern.globString());
        }
        storeWalked(target, pattern) {
          const fullpath = target.fullpath();
          const cached = this.store.get(fullpath);
          if (cached) cached.add(pattern.globString());
          else this.store.set(fullpath, new Set([pattern.globString()]));
        }
      }
      exports.HasWalkedCache = HasWalkedCache;
      class MatchRecord {
        store = new Map();
        add(target, absolute, ifDir) {
          const n = (absolute ? 2 : 0) | (ifDir ? 1 : 0);
          const current = this.store.get(target);
          this.store.set(target, current === undefined ? n : n & current);
        }
        entries() {
          return [...this.store.entries()].map(([path, n]) => [
            path,
            !!(n & 2),
            !!(n & 1),
          ]);
        }
      }
      exports.MatchRecord = MatchRecord;
      class SubWalks {
        store = new Map();
        add(target, pattern) {
          if (!target.canReaddir()) {
            return;
          }
          const subs = this.store.get(target);
          if (subs) {
            if (!subs.find((p) => p.globString() === pattern.globString())) {
              subs.push(pattern);
            }
          } else this.store.set(target, [pattern]);
        }
        get(target) {
          const subs = this.store.get(target);
          if (!subs) {
            throw new Error("attempting to walk unknown path");
          }
          return subs;
        }
        entries() {
          return this.keys().map((k) => [k, this.store.get(k)]);
        }
        keys() {
          return [...this.store.keys()].filter((t) => t.canReaddir());
        }
      }
      exports.SubWalks = SubWalks;
      class Processor {
        hasWalkedCache;
        matches = new MatchRecord();
        subwalks = new SubWalks();
        patterns;
        follow;
        dot;
        opts;
        constructor(opts, hasWalkedCache) {
          this.opts = opts;
          this.follow = !!opts.follow;
          this.dot = !!opts.dot;
          this.hasWalkedCache = hasWalkedCache
            ? hasWalkedCache.copy()
            : new HasWalkedCache();
        }
        processPatterns(target, patterns) {
          this.patterns = patterns;
          const processingSet = patterns.map((p) => [target, p]);
          for (let [t, pattern] of processingSet) {
            this.hasWalkedCache.storeWalked(t, pattern);
            const root = pattern.root();
            const absolute =
              pattern.isAbsolute() && this.opts.absolute !== false;
            if (root) {
              t = t.resolve(
                root === "/" && this.opts.root !== undefined
                  ? this.opts.root
                  : root,
              );
              const rest = pattern.rest();
              if (!rest) {
                this.matches.add(t, true, false);
                continue;
              } else {
                pattern = rest;
              }
            }
            if (t.isENOENT()) continue;
            let p;
            let rest;
            let changed = false;
            while (
              typeof (p = pattern.pattern()) === "string" &&
              (rest = pattern.rest())
            ) {
              const c = t.resolve(p);
              t = c;
              pattern = rest;
              changed = true;
            }
            p = pattern.pattern();
            rest = pattern.rest();
            if (changed) {
              if (this.hasWalkedCache.hasWalked(t, pattern)) continue;
              this.hasWalkedCache.storeWalked(t, pattern);
            }
            if (typeof p === "string") {
              const ifDir = p === ".." || p === "" || p === ".";
              this.matches.add(t.resolve(p), absolute, ifDir);
              continue;
            } else if (p === minimatch_1.GLOBSTAR) {
              if (
                !t.isSymbolicLink() ||
                this.follow ||
                pattern.checkFollowGlobstar()
              ) {
                this.subwalks.add(t, pattern);
              }
              const rp = rest?.pattern();
              const rrest = rest?.rest();
              if (!rest || ((rp === "" || rp === ".") && !rrest)) {
                this.matches.add(t, absolute, rp === "" || rp === ".");
              } else {
                if (rp === "..") {
                  const tp = t.parent || t;
                  if (!rrest) this.matches.add(tp, absolute, true);
                  else if (!this.hasWalkedCache.hasWalked(tp, rrest)) {
                    this.subwalks.add(tp, rrest);
                  }
                }
              }
            } else if (p instanceof RegExp) {
              this.subwalks.add(t, pattern);
            }
          }
          return this;
        }
        subwalkTargets() {
          return this.subwalks.keys();
        }
        child() {
          return new Processor(this.opts, this.hasWalkedCache);
        }
        filterEntries(parent, entries) {
          const patterns = this.subwalks.get(parent);
          const results = this.child();
          for (const e of entries) {
            for (const pattern of patterns) {
              const absolute = pattern.isAbsolute();
              const p = pattern.pattern();
              const rest = pattern.rest();
              if (p === minimatch_1.GLOBSTAR) {
                results.testGlobstar(e, pattern, rest, absolute);
              } else if (p instanceof RegExp) {
                results.testRegExp(e, p, rest, absolute);
              } else {
                results.testString(e, p, rest, absolute);
              }
            }
          }
          return results;
        }
        testGlobstar(e, pattern, rest, absolute) {
          if (this.dot || !e.name.startsWith(".")) {
            if (!pattern.hasMore()) {
              this.matches.add(e, absolute, false);
            }
            if (e.canReaddir()) {
              if (this.follow || !e.isSymbolicLink()) {
                this.subwalks.add(e, pattern);
              } else if (e.isSymbolicLink()) {
                if (rest && pattern.checkFollowGlobstar()) {
                  this.subwalks.add(e, rest);
                } else if (pattern.markFollowGlobstar()) {
                  this.subwalks.add(e, pattern);
                }
              }
            }
          }
          if (rest) {
            const rp = rest.pattern();
            if (
              typeof rp === "string" &&
              rp !== ".." &&
              rp !== "" &&
              rp !== "."
            ) {
              this.testString(e, rp, rest.rest(), absolute);
            } else if (rp === "..") {
              const ep = e.parent || e;
              this.subwalks.add(ep, rest);
            } else if (rp instanceof RegExp) {
              this.testRegExp(e, rp, rest.rest(), absolute);
            }
          }
        }
        testRegExp(e, p, rest, absolute) {
          if (!p.test(e.name)) return;
          if (!rest) {
            this.matches.add(e, absolute, false);
          } else {
            this.subwalks.add(e, rest);
          }
        }
        testString(e, p, rest, absolute) {
          if (!e.isNamed(p)) return;
          if (!rest) {
            this.matches.add(e, absolute, false);
          } else {
            this.subwalks.add(e, rest);
          }
        }
      }
      exports.Processor = Processor;
    },
    153: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.GlobStream = exports.GlobWalker = exports.GlobUtil = void 0;
      const minipass_1 = __nccwpck_require__(4968);
      const ignore_js_1 = __nccwpck_require__(9703);
      const processor_js_1 = __nccwpck_require__(4628);
      const makeIgnore = (ignore, opts) =>
        typeof ignore === "string"
          ? new ignore_js_1.Ignore([ignore], opts)
          : Array.isArray(ignore)
            ? new ignore_js_1.Ignore(ignore, opts)
            : ignore;
      class GlobUtil {
        path;
        patterns;
        opts;
        seen = new Set();
        paused = false;
        aborted = false;
        #onResume = [];
        #ignore;
        #sep;
        signal;
        maxDepth;
        includeChildMatches;
        constructor(patterns, path, opts) {
          this.patterns = patterns;
          this.path = path;
          this.opts = opts;
          this.#sep = !opts.posix && opts.platform === "win32" ? "\\" : "/";
          this.includeChildMatches = opts.includeChildMatches !== false;
          if (opts.ignore || !this.includeChildMatches) {
            this.#ignore = makeIgnore(opts.ignore ?? [], opts);
            if (
              !this.includeChildMatches &&
              typeof this.#ignore.add !== "function"
            ) {
              const m =
                "cannot ignore child matches, ignore lacks add() method.";
              throw new Error(m);
            }
          }
          this.maxDepth = opts.maxDepth || Infinity;
          if (opts.signal) {
            this.signal = opts.signal;
            this.signal.addEventListener("abort", () => {
              this.#onResume.length = 0;
            });
          }
        }
        #ignored(path) {
          return this.seen.has(path) || !!this.#ignore?.ignored?.(path);
        }
        #childrenIgnored(path) {
          return !!this.#ignore?.childrenIgnored?.(path);
        }
        pause() {
          this.paused = true;
        }
        resume() {
          if (this.signal?.aborted) return;
          this.paused = false;
          let fn = undefined;
          while (!this.paused && (fn = this.#onResume.shift())) {
            fn();
          }
        }
        onResume(fn) {
          if (this.signal?.aborted) return;
          if (!this.paused) {
            fn();
          } else {
            this.#onResume.push(fn);
          }
        }
        async matchCheck(e, ifDir) {
          if (ifDir && this.opts.nodir) return undefined;
          let rpc;
          if (this.opts.realpath) {
            rpc = e.realpathCached() || (await e.realpath());
            if (!rpc) return undefined;
            e = rpc;
          }
          const needStat = e.isUnknown() || this.opts.stat;
          const s = needStat ? await e.lstat() : e;
          if (this.opts.follow && this.opts.nodir && s?.isSymbolicLink()) {
            const target = await s.realpath();
            if (target && (target.isUnknown() || this.opts.stat)) {
              await target.lstat();
            }
          }
          return this.matchCheckTest(s, ifDir);
        }
        matchCheckTest(e, ifDir) {
          return e &&
            (this.maxDepth === Infinity || e.depth() <= this.maxDepth) &&
            (!ifDir || e.canReaddir()) &&
            (!this.opts.nodir || !e.isDirectory()) &&
            (!this.opts.nodir ||
              !this.opts.follow ||
              !e.isSymbolicLink() ||
              !e.realpathCached()?.isDirectory()) &&
            !this.#ignored(e)
            ? e
            : undefined;
        }
        matchCheckSync(e, ifDir) {
          if (ifDir && this.opts.nodir) return undefined;
          let rpc;
          if (this.opts.realpath) {
            rpc = e.realpathCached() || e.realpathSync();
            if (!rpc) return undefined;
            e = rpc;
          }
          const needStat = e.isUnknown() || this.opts.stat;
          const s = needStat ? e.lstatSync() : e;
          if (this.opts.follow && this.opts.nodir && s?.isSymbolicLink()) {
            const target = s.realpathSync();
            if (target && (target?.isUnknown() || this.opts.stat)) {
              target.lstatSync();
            }
          }
          return this.matchCheckTest(s, ifDir);
        }
        matchFinish(e, absolute) {
          if (this.#ignored(e)) return;
          if (!this.includeChildMatches && this.#ignore?.add) {
            const ign = `${e.relativePosix()}/**`;
            this.#ignore.add(ign);
          }
          const abs =
            this.opts.absolute === undefined ? absolute : this.opts.absolute;
          this.seen.add(e);
          const mark = this.opts.mark && e.isDirectory() ? this.#sep : "";
          if (this.opts.withFileTypes) {
            this.matchEmit(e);
          } else if (abs) {
            const abs = this.opts.posix ? e.fullpathPosix() : e.fullpath();
            this.matchEmit(abs + mark);
          } else {
            const rel = this.opts.posix ? e.relativePosix() : e.relative();
            const pre =
              this.opts.dotRelative && !rel.startsWith(".." + this.#sep)
                ? "." + this.#sep
                : "";
            this.matchEmit(!rel ? "." + mark : pre + rel + mark);
          }
        }
        async match(e, absolute, ifDir) {
          const p = await this.matchCheck(e, ifDir);
          if (p) this.matchFinish(p, absolute);
        }
        matchSync(e, absolute, ifDir) {
          const p = this.matchCheckSync(e, ifDir);
          if (p) this.matchFinish(p, absolute);
        }
        walkCB(target, patterns, cb) {
          if (this.signal?.aborted) cb();
          this.walkCB2(
            target,
            patterns,
            new processor_js_1.Processor(this.opts),
            cb,
          );
        }
        walkCB2(target, patterns, processor, cb) {
          if (this.#childrenIgnored(target)) return cb();
          if (this.signal?.aborted) cb();
          if (this.paused) {
            this.onResume(() => this.walkCB2(target, patterns, processor, cb));
            return;
          }
          processor.processPatterns(target, patterns);
          let tasks = 1;
          const next = () => {
            if (--tasks === 0) cb();
          };
          for (const [m, absolute, ifDir] of processor.matches.entries()) {
            if (this.#ignored(m)) continue;
            tasks++;
            this.match(m, absolute, ifDir).then(() => next());
          }
          for (const t of processor.subwalkTargets()) {
            if (this.maxDepth !== Infinity && t.depth() >= this.maxDepth) {
              continue;
            }
            tasks++;
            const childrenCached = t.readdirCached();
            if (t.calledReaddir())
              this.walkCB3(t, childrenCached, processor, next);
            else {
              t.readdirCB(
                (_, entries) => this.walkCB3(t, entries, processor, next),
                true,
              );
            }
          }
          next();
        }
        walkCB3(target, entries, processor, cb) {
          processor = processor.filterEntries(target, entries);
          let tasks = 1;
          const next = () => {
            if (--tasks === 0) cb();
          };
          for (const [m, absolute, ifDir] of processor.matches.entries()) {
            if (this.#ignored(m)) continue;
            tasks++;
            this.match(m, absolute, ifDir).then(() => next());
          }
          for (const [target, patterns] of processor.subwalks.entries()) {
            tasks++;
            this.walkCB2(target, patterns, processor.child(), next);
          }
          next();
        }
        walkCBSync(target, patterns, cb) {
          if (this.signal?.aborted) cb();
          this.walkCB2Sync(
            target,
            patterns,
            new processor_js_1.Processor(this.opts),
            cb,
          );
        }
        walkCB2Sync(target, patterns, processor, cb) {
          if (this.#childrenIgnored(target)) return cb();
          if (this.signal?.aborted) cb();
          if (this.paused) {
            this.onResume(() =>
              this.walkCB2Sync(target, patterns, processor, cb),
            );
            return;
          }
          processor.processPatterns(target, patterns);
          let tasks = 1;
          const next = () => {
            if (--tasks === 0) cb();
          };
          for (const [m, absolute, ifDir] of processor.matches.entries()) {
            if (this.#ignored(m)) continue;
            this.matchSync(m, absolute, ifDir);
          }
          for (const t of processor.subwalkTargets()) {
            if (this.maxDepth !== Infinity && t.depth() >= this.maxDepth) {
              continue;
            }
            tasks++;
            const children = t.readdirSync();
            this.walkCB3Sync(t, children, processor, next);
          }
          next();
        }
        walkCB3Sync(target, entries, processor, cb) {
          processor = processor.filterEntries(target, entries);
          let tasks = 1;
          const next = () => {
            if (--tasks === 0) cb();
          };
          for (const [m, absolute, ifDir] of processor.matches.entries()) {
            if (this.#ignored(m)) continue;
            this.matchSync(m, absolute, ifDir);
          }
          for (const [target, patterns] of processor.subwalks.entries()) {
            tasks++;
            this.walkCB2Sync(target, patterns, processor.child(), next);
          }
          next();
        }
      }
      exports.GlobUtil = GlobUtil;
      class GlobWalker extends GlobUtil {
        matches = new Set();
        constructor(patterns, path, opts) {
          super(patterns, path, opts);
        }
        matchEmit(e) {
          this.matches.add(e);
        }
        async walk() {
          if (this.signal?.aborted) throw this.signal.reason;
          if (this.path.isUnknown()) {
            await this.path.lstat();
          }
          await new Promise((res, rej) => {
            this.walkCB(this.path, this.patterns, () => {
              if (this.signal?.aborted) {
                rej(this.signal.reason);
              } else {
                res(this.matches);
              }
            });
          });
          return this.matches;
        }
        walkSync() {
          if (this.signal?.aborted) throw this.signal.reason;
          if (this.path.isUnknown()) {
            this.path.lstatSync();
          }
          this.walkCBSync(this.path, this.patterns, () => {
            if (this.signal?.aborted) throw this.signal.reason;
          });
          return this.matches;
        }
      }
      exports.GlobWalker = GlobWalker;
      class GlobStream extends GlobUtil {
        results;
        constructor(patterns, path, opts) {
          super(patterns, path, opts);
          this.results = new minipass_1.Minipass({
            signal: this.signal,
            objectMode: true,
          });
          this.results.on("drain", () => this.resume());
          this.results.on("resume", () => this.resume());
        }
        matchEmit(e) {
          this.results.write(e);
          if (!this.results.flowing) this.pause();
        }
        stream() {
          const target = this.path;
          if (target.isUnknown()) {
            target.lstat().then(() => {
              this.walkCB(target, this.patterns, () => this.results.end());
            });
          } else {
            this.walkCB(target, this.patterns, () => this.results.end());
          }
          return this.results;
        }
        streamSync() {
          if (this.path.isUnknown()) {
            this.path.lstatSync();
          }
          this.walkCBSync(this.path, this.patterns, () => this.results.end());
          return this.results;
        }
      }
      exports.GlobStream = GlobStream;
    },
    3866: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LRUCache = void 0;
      const perf =
        typeof performance === "object" &&
        performance &&
        typeof performance.now === "function"
          ? performance
          : Date;
      const warned = new Set();
      const PROCESS = typeof process === "object" && !!process ? process : {};
      const emitWarning = (msg, type, code, fn) => {
        typeof PROCESS.emitWarning === "function"
          ? PROCESS.emitWarning(msg, type, code, fn)
          : console.error(`[${code}] ${type}: ${msg}`);
      };
      let AC = globalThis.AbortController;
      let AS = globalThis.AbortSignal;
      if (typeof AC === "undefined") {
        AS = class AbortSignal {
          onabort;
          _onabort = [];
          reason;
          aborted = false;
          addEventListener(_, fn) {
            this._onabort.push(fn);
          }
        };
        AC = class AbortController {
          constructor() {
            warnACPolyfill();
          }
          signal = new AS();
          abort(reason) {
            if (this.signal.aborted) return;
            this.signal.reason = reason;
            this.signal.aborted = true;
            for (const fn of this.signal._onabort) {
              fn(reason);
            }
            this.signal.onabort?.(reason);
          }
        };
        let printACPolyfillWarning =
          PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
        const warnACPolyfill = () => {
          if (!printACPolyfillWarning) return;
          printACPolyfillWarning = false;
          emitWarning(
            "AbortController is not defined. If using lru-cache in " +
              "node 14, load an AbortController polyfill from the " +
              "`node-abort-controller` package. A minimal polyfill is " +
              "provided for use by LRUCache.fetch(), but it should not be " +
              "relied upon in other contexts (eg, passing it to other APIs that " +
              "use AbortController/AbortSignal might have undesirable effects). " +
              "You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.",
            "NO_ABORT_CONTROLLER",
            "ENOTSUP",
            warnACPolyfill,
          );
        };
      }
      const shouldWarn = (code) => !warned.has(code);
      const TYPE = Symbol("type");
      const isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
      const getUintArray = (max) =>
        !isPosInt(max)
          ? null
          : max <= Math.pow(2, 8)
            ? Uint8Array
            : max <= Math.pow(2, 16)
              ? Uint16Array
              : max <= Math.pow(2, 32)
                ? Uint32Array
                : max <= Number.MAX_SAFE_INTEGER
                  ? ZeroArray
                  : null;
      class ZeroArray extends Array {
        constructor(size) {
          super(size);
          this.fill(0);
        }
      }
      class Stack {
        heap;
        length;
        static #constructing = false;
        static create(max) {
          const HeapCls = getUintArray(max);
          if (!HeapCls) return [];
          Stack.#constructing = true;
          const s = new Stack(max, HeapCls);
          Stack.#constructing = false;
          return s;
        }
        constructor(max, HeapCls) {
          if (!Stack.#constructing) {
            throw new TypeError("instantiate Stack using Stack.create(n)");
          }
          this.heap = new HeapCls(max);
          this.length = 0;
        }
        push(n) {
          this.heap[this.length++] = n;
        }
        pop() {
          return this.heap[--this.length];
        }
      }
      class LRUCache {
        #max;
        #maxSize;
        #dispose;
        #disposeAfter;
        #fetchMethod;
        #memoMethod;
        ttl;
        ttlResolution;
        ttlAutopurge;
        updateAgeOnGet;
        updateAgeOnHas;
        allowStale;
        noDisposeOnSet;
        noUpdateTTL;
        maxEntrySize;
        sizeCalculation;
        noDeleteOnFetchRejection;
        noDeleteOnStaleGet;
        allowStaleOnFetchAbort;
        allowStaleOnFetchRejection;
        ignoreFetchAbort;
        #size;
        #calculatedSize;
        #keyMap;
        #keyList;
        #valList;
        #next;
        #prev;
        #head;
        #tail;
        #free;
        #disposed;
        #sizes;
        #starts;
        #ttls;
        #hasDispose;
        #hasFetchMethod;
        #hasDisposeAfter;
        static unsafeExposeInternals(c) {
          return {
            starts: c.#starts,
            ttls: c.#ttls,
            sizes: c.#sizes,
            keyMap: c.#keyMap,
            keyList: c.#keyList,
            valList: c.#valList,
            next: c.#next,
            prev: c.#prev,
            get head() {
              return c.#head;
            },
            get tail() {
              return c.#tail;
            },
            free: c.#free,
            isBackgroundFetch: (p) => c.#isBackgroundFetch(p),
            backgroundFetch: (k, index, options, context) =>
              c.#backgroundFetch(k, index, options, context),
            moveToTail: (index) => c.#moveToTail(index),
            indexes: (options) => c.#indexes(options),
            rindexes: (options) => c.#rindexes(options),
            isStale: (index) => c.#isStale(index),
          };
        }
        get max() {
          return this.#max;
        }
        get maxSize() {
          return this.#maxSize;
        }
        get calculatedSize() {
          return this.#calculatedSize;
        }
        get size() {
          return this.#size;
        }
        get fetchMethod() {
          return this.#fetchMethod;
        }
        get memoMethod() {
          return this.#memoMethod;
        }
        get dispose() {
          return this.#dispose;
        }
        get disposeAfter() {
          return this.#disposeAfter;
        }
        constructor(options) {
          const {
            max = 0,
            ttl,
            ttlResolution = 1,
            ttlAutopurge,
            updateAgeOnGet,
            updateAgeOnHas,
            allowStale,
            dispose,
            disposeAfter,
            noDisposeOnSet,
            noUpdateTTL,
            maxSize = 0,
            maxEntrySize = 0,
            sizeCalculation,
            fetchMethod,
            memoMethod,
            noDeleteOnFetchRejection,
            noDeleteOnStaleGet,
            allowStaleOnFetchRejection,
            allowStaleOnFetchAbort,
            ignoreFetchAbort,
          } = options;
          if (max !== 0 && !isPosInt(max)) {
            throw new TypeError("max option must be a nonnegative integer");
          }
          const UintArray = max ? getUintArray(max) : Array;
          if (!UintArray) {
            throw new Error("invalid max value: " + max);
          }
          this.#max = max;
          this.#maxSize = maxSize;
          this.maxEntrySize = maxEntrySize || this.#maxSize;
          this.sizeCalculation = sizeCalculation;
          if (this.sizeCalculation) {
            if (!this.#maxSize && !this.maxEntrySize) {
              throw new TypeError(
                "cannot set sizeCalculation without setting maxSize or maxEntrySize",
              );
            }
            if (typeof this.sizeCalculation !== "function") {
              throw new TypeError("sizeCalculation set to non-function");
            }
          }
          if (memoMethod !== undefined && typeof memoMethod !== "function") {
            throw new TypeError("memoMethod must be a function if defined");
          }
          this.#memoMethod = memoMethod;
          if (fetchMethod !== undefined && typeof fetchMethod !== "function") {
            throw new TypeError("fetchMethod must be a function if specified");
          }
          this.#fetchMethod = fetchMethod;
          this.#hasFetchMethod = !!fetchMethod;
          this.#keyMap = new Map();
          this.#keyList = new Array(max).fill(undefined);
          this.#valList = new Array(max).fill(undefined);
          this.#next = new UintArray(max);
          this.#prev = new UintArray(max);
          this.#head = 0;
          this.#tail = 0;
          this.#free = Stack.create(max);
          this.#size = 0;
          this.#calculatedSize = 0;
          if (typeof dispose === "function") {
            this.#dispose = dispose;
          }
          if (typeof disposeAfter === "function") {
            this.#disposeAfter = disposeAfter;
            this.#disposed = [];
          } else {
            this.#disposeAfter = undefined;
            this.#disposed = undefined;
          }
          this.#hasDispose = !!this.#dispose;
          this.#hasDisposeAfter = !!this.#disposeAfter;
          this.noDisposeOnSet = !!noDisposeOnSet;
          this.noUpdateTTL = !!noUpdateTTL;
          this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
          this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
          this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
          this.ignoreFetchAbort = !!ignoreFetchAbort;
          if (this.maxEntrySize !== 0) {
            if (this.#maxSize !== 0) {
              if (!isPosInt(this.#maxSize)) {
                throw new TypeError(
                  "maxSize must be a positive integer if specified",
                );
              }
            }
            if (!isPosInt(this.maxEntrySize)) {
              throw new TypeError(
                "maxEntrySize must be a positive integer if specified",
              );
            }
            this.#initializeSizeTracking();
          }
          this.allowStale = !!allowStale;
          this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
          this.updateAgeOnGet = !!updateAgeOnGet;
          this.updateAgeOnHas = !!updateAgeOnHas;
          this.ttlResolution =
            isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
          this.ttlAutopurge = !!ttlAutopurge;
          this.ttl = ttl || 0;
          if (this.ttl) {
            if (!isPosInt(this.ttl)) {
              throw new TypeError(
                "ttl must be a positive integer if specified",
              );
            }
            this.#initializeTTLTracking();
          }
          if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) {
            throw new TypeError(
              "At least one of max, maxSize, or ttl is required",
            );
          }
          if (!this.ttlAutopurge && !this.#max && !this.#maxSize) {
            const code = "LRU_CACHE_UNBOUNDED";
            if (shouldWarn(code)) {
              warned.add(code);
              const msg =
                "TTL caching without ttlAutopurge, max, or maxSize can " +
                "result in unbounded memory consumption.";
              emitWarning(msg, "UnboundedCacheWarning", code, LRUCache);
            }
          }
        }
        getRemainingTTL(key) {
          return this.#keyMap.has(key) ? Infinity : 0;
        }
        #initializeTTLTracking() {
          const ttls = new ZeroArray(this.#max);
          const starts = new ZeroArray(this.#max);
          this.#ttls = ttls;
          this.#starts = starts;
          this.#setItemTTL = (index, ttl, start = perf.now()) => {
            starts[index] = ttl !== 0 ? start : 0;
            ttls[index] = ttl;
            if (ttl !== 0 && this.ttlAutopurge) {
              const t = setTimeout(() => {
                if (this.#isStale(index)) {
                  this.#delete(this.#keyList[index], "expire");
                }
              }, ttl + 1);
              if (t.unref) {
                t.unref();
              }
            }
          };
          this.#updateItemAge = (index) => {
            starts[index] = ttls[index] !== 0 ? perf.now() : 0;
          };
          this.#statusTTL = (status, index) => {
            if (ttls[index]) {
              const ttl = ttls[index];
              const start = starts[index];
              if (!ttl || !start) return;
              status.ttl = ttl;
              status.start = start;
              status.now = cachedNow || getNow();
              const age = status.now - start;
              status.remainingTTL = ttl - age;
            }
          };
          let cachedNow = 0;
          const getNow = () => {
            const n = perf.now();
            if (this.ttlResolution > 0) {
              cachedNow = n;
              const t = setTimeout(() => (cachedNow = 0), this.ttlResolution);
              if (t.unref) {
                t.unref();
              }
            }
            return n;
          };
          this.getRemainingTTL = (key) => {
            const index = this.#keyMap.get(key);
            if (index === undefined) {
              return 0;
            }
            const ttl = ttls[index];
            const start = starts[index];
            if (!ttl || !start) {
              return Infinity;
            }
            const age = (cachedNow || getNow()) - start;
            return ttl - age;
          };
          this.#isStale = (index) => {
            const s = starts[index];
            const t = ttls[index];
            return !!t && !!s && (cachedNow || getNow()) - s > t;
          };
        }
        #updateItemAge = () => {};
        #statusTTL = () => {};
        #setItemTTL = () => {};
        #isStale = () => false;
        #initializeSizeTracking() {
          const sizes = new ZeroArray(this.#max);
          this.#calculatedSize = 0;
          this.#sizes = sizes;
          this.#removeItemSize = (index) => {
            this.#calculatedSize -= sizes[index];
            sizes[index] = 0;
          };
          this.#requireSize = (k, v, size, sizeCalculation) => {
            if (this.#isBackgroundFetch(v)) {
              return 0;
            }
            if (!isPosInt(size)) {
              if (sizeCalculation) {
                if (typeof sizeCalculation !== "function") {
                  throw new TypeError("sizeCalculation must be a function");
                }
                size = sizeCalculation(v, k);
                if (!isPosInt(size)) {
                  throw new TypeError(
                    "sizeCalculation return invalid (expect positive integer)",
                  );
                }
              } else {
                throw new TypeError(
                  "invalid size value (must be positive integer). " +
                    "When maxSize or maxEntrySize is used, sizeCalculation " +
                    "or size must be set.",
                );
              }
            }
            return size;
          };
          this.#addItemSize = (index, size, status) => {
            sizes[index] = size;
            if (this.#maxSize) {
              const maxSize = this.#maxSize - sizes[index];
              while (this.#calculatedSize > maxSize) {
                this.#evict(true);
              }
            }
            this.#calculatedSize += sizes[index];
            if (status) {
              status.entrySize = size;
              status.totalCalculatedSize = this.#calculatedSize;
            }
          };
        }
        #removeItemSize = (_i) => {};
        #addItemSize = (_i, _s, _st) => {};
        #requireSize = (_k, _v, size, sizeCalculation) => {
          if (size || sizeCalculation) {
            throw new TypeError(
              "cannot set size without setting maxSize or maxEntrySize on cache",
            );
          }
          return 0;
        };
        *#indexes({ allowStale = this.allowStale } = {}) {
          if (this.#size) {
            for (let i = this.#tail; true; ) {
              if (!this.#isValidIndex(i)) {
                break;
              }
              if (allowStale || !this.#isStale(i)) {
                yield i;
              }
              if (i === this.#head) {
                break;
              } else {
                i = this.#prev[i];
              }
            }
          }
        }
        *#rindexes({ allowStale = this.allowStale } = {}) {
          if (this.#size) {
            for (let i = this.#head; true; ) {
              if (!this.#isValidIndex(i)) {
                break;
              }
              if (allowStale || !this.#isStale(i)) {
                yield i;
              }
              if (i === this.#tail) {
                break;
              } else {
                i = this.#next[i];
              }
            }
          }
        }
        #isValidIndex(index) {
          return (
            index !== undefined &&
            this.#keyMap.get(this.#keyList[index]) === index
          );
        }
        *entries() {
          for (const i of this.#indexes()) {
            if (
              this.#valList[i] !== undefined &&
              this.#keyList[i] !== undefined &&
              !this.#isBackgroundFetch(this.#valList[i])
            ) {
              yield [this.#keyList[i], this.#valList[i]];
            }
          }
        }
        *rentries() {
          for (const i of this.#rindexes()) {
            if (
              this.#valList[i] !== undefined &&
              this.#keyList[i] !== undefined &&
              !this.#isBackgroundFetch(this.#valList[i])
            ) {
              yield [this.#keyList[i], this.#valList[i]];
            }
          }
        }
        *keys() {
          for (const i of this.#indexes()) {
            const k = this.#keyList[i];
            if (k !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
              yield k;
            }
          }
        }
        *rkeys() {
          for (const i of this.#rindexes()) {
            const k = this.#keyList[i];
            if (k !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
              yield k;
            }
          }
        }
        *values() {
          for (const i of this.#indexes()) {
            const v = this.#valList[i];
            if (v !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
              yield this.#valList[i];
            }
          }
        }
        *rvalues() {
          for (const i of this.#rindexes()) {
            const v = this.#valList[i];
            if (v !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
              yield this.#valList[i];
            }
          }
        }
        [Symbol.iterator]() {
          return this.entries();
        }
        [Symbol.toStringTag] = "LRUCache";
        find(fn, getOptions = {}) {
          for (const i of this.#indexes()) {
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
              ? v.__staleWhileFetching
              : v;
            if (value === undefined) continue;
            if (fn(value, this.#keyList[i], this)) {
              return this.get(this.#keyList[i], getOptions);
            }
          }
        }
        forEach(fn, thisp = this) {
          for (const i of this.#indexes()) {
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
              ? v.__staleWhileFetching
              : v;
            if (value === undefined) continue;
            fn.call(thisp, value, this.#keyList[i], this);
          }
        }
        rforEach(fn, thisp = this) {
          for (const i of this.#rindexes()) {
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
              ? v.__staleWhileFetching
              : v;
            if (value === undefined) continue;
            fn.call(thisp, value, this.#keyList[i], this);
          }
        }
        purgeStale() {
          let deleted = false;
          for (const i of this.#rindexes({ allowStale: true })) {
            if (this.#isStale(i)) {
              this.#delete(this.#keyList[i], "expire");
              deleted = true;
            }
          }
          return deleted;
        }
        info(key) {
          const i = this.#keyMap.get(key);
          if (i === undefined) return undefined;
          const v = this.#valList[i];
          const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
          if (value === undefined) return undefined;
          const entry = { value };
          if (this.#ttls && this.#starts) {
            const ttl = this.#ttls[i];
            const start = this.#starts[i];
            if (ttl && start) {
              const remain = ttl - (perf.now() - start);
              entry.ttl = remain;
              entry.start = Date.now();
            }
          }
          if (this.#sizes) {
            entry.size = this.#sizes[i];
          }
          return entry;
        }
        dump() {
          const arr = [];
          for (const i of this.#indexes({ allowStale: true })) {
            const key = this.#keyList[i];
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
              ? v.__staleWhileFetching
              : v;
            if (value === undefined || key === undefined) continue;
            const entry = { value };
            if (this.#ttls && this.#starts) {
              entry.ttl = this.#ttls[i];
              const age = perf.now() - this.#starts[i];
              entry.start = Math.floor(Date.now() - age);
            }
            if (this.#sizes) {
              entry.size = this.#sizes[i];
            }
            arr.unshift([key, entry]);
          }
          return arr;
        }
        load(arr) {
          this.clear();
          for (const [key, entry] of arr) {
            if (entry.start) {
              const age = Date.now() - entry.start;
              entry.start = perf.now() - age;
            }
            this.set(key, entry.value, entry);
          }
        }
        set(k, v, setOptions = {}) {
          if (v === undefined) {
            this.delete(k);
            return this;
          }
          const {
            ttl = this.ttl,
            start,
            noDisposeOnSet = this.noDisposeOnSet,
            sizeCalculation = this.sizeCalculation,
            status,
          } = setOptions;
          let { noUpdateTTL = this.noUpdateTTL } = setOptions;
          const size = this.#requireSize(
            k,
            v,
            setOptions.size || 0,
            sizeCalculation,
          );
          if (this.maxEntrySize && size > this.maxEntrySize) {
            if (status) {
              status.set = "miss";
              status.maxEntrySizeExceeded = true;
            }
            this.#delete(k, "set");
            return this;
          }
          let index = this.#size === 0 ? undefined : this.#keyMap.get(k);
          if (index === undefined) {
            index =
              this.#size === 0
                ? this.#tail
                : this.#free.length !== 0
                  ? this.#free.pop()
                  : this.#size === this.#max
                    ? this.#evict(false)
                    : this.#size;
            this.#keyList[index] = k;
            this.#valList[index] = v;
            this.#keyMap.set(k, index);
            this.#next[this.#tail] = index;
            this.#prev[index] = this.#tail;
            this.#tail = index;
            this.#size++;
            this.#addItemSize(index, size, status);
            if (status) status.set = "add";
            noUpdateTTL = false;
          } else {
            this.#moveToTail(index);
            const oldVal = this.#valList[index];
            if (v !== oldVal) {
              if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
                oldVal.__abortController.abort(new Error("replaced"));
                const { __staleWhileFetching: s } = oldVal;
                if (s !== undefined && !noDisposeOnSet) {
                  if (this.#hasDispose) {
                    this.#dispose?.(s, k, "set");
                  }
                  if (this.#hasDisposeAfter) {
                    this.#disposed?.push([s, k, "set"]);
                  }
                }
              } else if (!noDisposeOnSet) {
                if (this.#hasDispose) {
                  this.#dispose?.(oldVal, k, "set");
                }
                if (this.#hasDisposeAfter) {
                  this.#disposed?.push([oldVal, k, "set"]);
                }
              }
              this.#removeItemSize(index);
              this.#addItemSize(index, size, status);
              this.#valList[index] = v;
              if (status) {
                status.set = "replace";
                const oldValue =
                  oldVal && this.#isBackgroundFetch(oldVal)
                    ? oldVal.__staleWhileFetching
                    : oldVal;
                if (oldValue !== undefined) status.oldValue = oldValue;
              }
            } else if (status) {
              status.set = "update";
            }
          }
          if (ttl !== 0 && !this.#ttls) {
            this.#initializeTTLTracking();
          }
          if (this.#ttls) {
            if (!noUpdateTTL) {
              this.#setItemTTL(index, ttl, start);
            }
            if (status) this.#statusTTL(status, index);
          }
          if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
              this.#disposeAfter?.(...task);
            }
          }
          return this;
        }
        pop() {
          try {
            while (this.#size) {
              const val = this.#valList[this.#head];
              this.#evict(true);
              if (this.#isBackgroundFetch(val)) {
                if (val.__staleWhileFetching) {
                  return val.__staleWhileFetching;
                }
              } else if (val !== undefined) {
                return val;
              }
            }
          } finally {
            if (this.#hasDisposeAfter && this.#disposed) {
              const dt = this.#disposed;
              let task;
              while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
              }
            }
          }
        }
        #evict(free) {
          const head = this.#head;
          const k = this.#keyList[head];
          const v = this.#valList[head];
          if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
            v.__abortController.abort(new Error("evicted"));
          } else if (this.#hasDispose || this.#hasDisposeAfter) {
            if (this.#hasDispose) {
              this.#dispose?.(v, k, "evict");
            }
            if (this.#hasDisposeAfter) {
              this.#disposed?.push([v, k, "evict"]);
            }
          }
          this.#removeItemSize(head);
          if (free) {
            this.#keyList[head] = undefined;
            this.#valList[head] = undefined;
            this.#free.push(head);
          }
          if (this.#size === 1) {
            this.#head = this.#tail = 0;
            this.#free.length = 0;
          } else {
            this.#head = this.#next[head];
          }
          this.#keyMap.delete(k);
          this.#size--;
          return head;
        }
        has(k, hasOptions = {}) {
          const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
          const index = this.#keyMap.get(k);
          if (index !== undefined) {
            const v = this.#valList[index];
            if (
              this.#isBackgroundFetch(v) &&
              v.__staleWhileFetching === undefined
            ) {
              return false;
            }
            if (!this.#isStale(index)) {
              if (updateAgeOnHas) {
                this.#updateItemAge(index);
              }
              if (status) {
                status.has = "hit";
                this.#statusTTL(status, index);
              }
              return true;
            } else if (status) {
              status.has = "stale";
              this.#statusTTL(status, index);
            }
          } else if (status) {
            status.has = "miss";
          }
          return false;
        }
        peek(k, peekOptions = {}) {
          const { allowStale = this.allowStale } = peekOptions;
          const index = this.#keyMap.get(k);
          if (index === undefined || (!allowStale && this.#isStale(index))) {
            return;
          }
          const v = this.#valList[index];
          return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
        }
        #backgroundFetch(k, index, options, context) {
          const v = index === undefined ? undefined : this.#valList[index];
          if (this.#isBackgroundFetch(v)) {
            return v;
          }
          const ac = new AC();
          const { signal } = options;
          signal?.addEventListener("abort", () => ac.abort(signal.reason), {
            signal: ac.signal,
          });
          const fetchOpts = { signal: ac.signal, options, context };
          const cb = (v, updateCache = false) => {
            const { aborted } = ac.signal;
            const ignoreAbort = options.ignoreFetchAbort && v !== undefined;
            if (options.status) {
              if (aborted && !updateCache) {
                options.status.fetchAborted = true;
                options.status.fetchError = ac.signal.reason;
                if (ignoreAbort) options.status.fetchAbortIgnored = true;
              } else {
                options.status.fetchResolved = true;
              }
            }
            if (aborted && !ignoreAbort && !updateCache) {
              return fetchFail(ac.signal.reason);
            }
            const bf = p;
            if (this.#valList[index] === p) {
              if (v === undefined) {
                if (bf.__staleWhileFetching) {
                  this.#valList[index] = bf.__staleWhileFetching;
                } else {
                  this.#delete(k, "fetch");
                }
              } else {
                if (options.status) options.status.fetchUpdated = true;
                this.set(k, v, fetchOpts.options);
              }
            }
            return v;
          };
          const eb = (er) => {
            if (options.status) {
              options.status.fetchRejected = true;
              options.status.fetchError = er;
            }
            return fetchFail(er);
          };
          const fetchFail = (er) => {
            const { aborted } = ac.signal;
            const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
            const allowStale =
              allowStaleAborted || options.allowStaleOnFetchRejection;
            const noDelete = allowStale || options.noDeleteOnFetchRejection;
            const bf = p;
            if (this.#valList[index] === p) {
              const del = !noDelete || bf.__staleWhileFetching === undefined;
              if (del) {
                this.#delete(k, "fetch");
              } else if (!allowStaleAborted) {
                this.#valList[index] = bf.__staleWhileFetching;
              }
            }
            if (allowStale) {
              if (options.status && bf.__staleWhileFetching !== undefined) {
                options.status.returnedStale = true;
              }
              return bf.__staleWhileFetching;
            } else if (bf.__returned === bf) {
              throw er;
            }
          };
          const pcall = (res, rej) => {
            const fmp = this.#fetchMethod?.(k, v, fetchOpts);
            if (fmp && fmp instanceof Promise) {
              fmp.then((v) => res(v === undefined ? undefined : v), rej);
            }
            ac.signal.addEventListener("abort", () => {
              if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
                res(undefined);
                if (options.allowStaleOnFetchAbort) {
                  res = (v) => cb(v, true);
                }
              }
            });
          };
          if (options.status) options.status.fetchDispatched = true;
          const p = new Promise(pcall).then(cb, eb);
          const bf = Object.assign(p, {
            __abortController: ac,
            __staleWhileFetching: v,
            __returned: undefined,
          });
          if (index === undefined) {
            this.set(k, bf, { ...fetchOpts.options, status: undefined });
            index = this.#keyMap.get(k);
          } else {
            this.#valList[index] = bf;
          }
          return bf;
        }
        #isBackgroundFetch(p) {
          if (!this.#hasFetchMethod) return false;
          const b = p;
          return (
            !!b &&
            b instanceof Promise &&
            b.hasOwnProperty("__staleWhileFetching") &&
            b.__abortController instanceof AC
          );
        }
        async fetch(k, fetchOptions = {}) {
          const {
            allowStale = this.allowStale,
            updateAgeOnGet = this.updateAgeOnGet,
            noDeleteOnStaleGet = this.noDeleteOnStaleGet,
            ttl = this.ttl,
            noDisposeOnSet = this.noDisposeOnSet,
            size = 0,
            sizeCalculation = this.sizeCalculation,
            noUpdateTTL = this.noUpdateTTL,
            noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
            allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
            ignoreFetchAbort = this.ignoreFetchAbort,
            allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
            context,
            forceRefresh = false,
            status,
            signal,
          } = fetchOptions;
          if (!this.#hasFetchMethod) {
            if (status) status.fetch = "get";
            return this.get(k, {
              allowStale,
              updateAgeOnGet,
              noDeleteOnStaleGet,
              status,
            });
          }
          const options = {
            allowStale,
            updateAgeOnGet,
            noDeleteOnStaleGet,
            ttl,
            noDisposeOnSet,
            size,
            sizeCalculation,
            noUpdateTTL,
            noDeleteOnFetchRejection,
            allowStaleOnFetchRejection,
            allowStaleOnFetchAbort,
            ignoreFetchAbort,
            status,
            signal,
          };
          let index = this.#keyMap.get(k);
          if (index === undefined) {
            if (status) status.fetch = "miss";
            const p = this.#backgroundFetch(k, index, options, context);
            return (p.__returned = p);
          } else {
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v)) {
              const stale = allowStale && v.__staleWhileFetching !== undefined;
              if (status) {
                status.fetch = "inflight";
                if (stale) status.returnedStale = true;
              }
              return stale ? v.__staleWhileFetching : (v.__returned = v);
            }
            const isStale = this.#isStale(index);
            if (!forceRefresh && !isStale) {
              if (status) status.fetch = "hit";
              this.#moveToTail(index);
              if (updateAgeOnGet) {
                this.#updateItemAge(index);
              }
              if (status) this.#statusTTL(status, index);
              return v;
            }
            const p = this.#backgroundFetch(k, index, options, context);
            const hasStale = p.__staleWhileFetching !== undefined;
            const staleVal = hasStale && allowStale;
            if (status) {
              status.fetch = isStale ? "stale" : "refresh";
              if (staleVal && isStale) status.returnedStale = true;
            }
            return staleVal ? p.__staleWhileFetching : (p.__returned = p);
          }
        }
        async forceFetch(k, fetchOptions = {}) {
          const v = await this.fetch(k, fetchOptions);
          if (v === undefined) throw new Error("fetch() returned undefined");
          return v;
        }
        memo(k, memoOptions = {}) {
          const memoMethod = this.#memoMethod;
          if (!memoMethod) {
            throw new Error("no memoMethod provided to constructor");
          }
          const { context, forceRefresh, ...options } = memoOptions;
          const v = this.get(k, options);
          if (!forceRefresh && v !== undefined) return v;
          const vv = memoMethod(k, v, { options, context });
          this.set(k, vv, options);
          return vv;
        }
        get(k, getOptions = {}) {
          const {
            allowStale = this.allowStale,
            updateAgeOnGet = this.updateAgeOnGet,
            noDeleteOnStaleGet = this.noDeleteOnStaleGet,
            status,
          } = getOptions;
          const index = this.#keyMap.get(k);
          if (index !== undefined) {
            const value = this.#valList[index];
            const fetching = this.#isBackgroundFetch(value);
            if (status) this.#statusTTL(status, index);
            if (this.#isStale(index)) {
              if (status) status.get = "stale";
              if (!fetching) {
                if (!noDeleteOnStaleGet) {
                  this.#delete(k, "expire");
                }
                if (status && allowStale) status.returnedStale = true;
                return allowStale ? value : undefined;
              } else {
                if (
                  status &&
                  allowStale &&
                  value.__staleWhileFetching !== undefined
                ) {
                  status.returnedStale = true;
                }
                return allowStale ? value.__staleWhileFetching : undefined;
              }
            } else {
              if (status) status.get = "hit";
              if (fetching) {
                return value.__staleWhileFetching;
              }
              this.#moveToTail(index);
              if (updateAgeOnGet) {
                this.#updateItemAge(index);
              }
              return value;
            }
          } else if (status) {
            status.get = "miss";
          }
        }
        #connect(p, n) {
          this.#prev[n] = p;
          this.#next[p] = n;
        }
        #moveToTail(index) {
          if (index !== this.#tail) {
            if (index === this.#head) {
              this.#head = this.#next[index];
            } else {
              this.#connect(this.#prev[index], this.#next[index]);
            }
            this.#connect(this.#tail, index);
            this.#tail = index;
          }
        }
        delete(k) {
          return this.#delete(k, "delete");
        }
        #delete(k, reason) {
          let deleted = false;
          if (this.#size !== 0) {
            const index = this.#keyMap.get(k);
            if (index !== undefined) {
              deleted = true;
              if (this.#size === 1) {
                this.#clear(reason);
              } else {
                this.#removeItemSize(index);
                const v = this.#valList[index];
                if (this.#isBackgroundFetch(v)) {
                  v.__abortController.abort(new Error("deleted"));
                } else if (this.#hasDispose || this.#hasDisposeAfter) {
                  if (this.#hasDispose) {
                    this.#dispose?.(v, k, reason);
                  }
                  if (this.#hasDisposeAfter) {
                    this.#disposed?.push([v, k, reason]);
                  }
                }
                this.#keyMap.delete(k);
                this.#keyList[index] = undefined;
                this.#valList[index] = undefined;
                if (index === this.#tail) {
                  this.#tail = this.#prev[index];
                } else if (index === this.#head) {
                  this.#head = this.#next[index];
                } else {
                  const pi = this.#prev[index];
                  this.#next[pi] = this.#next[index];
                  const ni = this.#next[index];
                  this.#prev[ni] = this.#prev[index];
                }
                this.#size--;
                this.#free.push(index);
              }
            }
          }
          if (this.#hasDisposeAfter && this.#disposed?.length) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
              this.#disposeAfter?.(...task);
            }
          }
          return deleted;
        }
        clear() {
          return this.#clear("delete");
        }
        #clear(reason) {
          for (const index of this.#rindexes({ allowStale: true })) {
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v)) {
              v.__abortController.abort(new Error("deleted"));
            } else {
              const k = this.#keyList[index];
              if (this.#hasDispose) {
                this.#dispose?.(v, k, reason);
              }
              if (this.#hasDisposeAfter) {
                this.#disposed?.push([v, k, reason]);
              }
            }
          }
          this.#keyMap.clear();
          this.#valList.fill(undefined);
          this.#keyList.fill(undefined);
          if (this.#ttls && this.#starts) {
            this.#ttls.fill(0);
            this.#starts.fill(0);
          }
          if (this.#sizes) {
            this.#sizes.fill(0);
          }
          this.#head = 0;
          this.#tail = 0;
          this.#free.length = 0;
          this.#calculatedSize = 0;
          this.#size = 0;
          if (this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
              this.#disposeAfter?.(...task);
            }
          }
        }
      }
      exports.LRUCache = LRUCache;
    },
    4149: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.assertValidPattern = void 0;
      const MAX_PATTERN_LENGTH = 1024 * 64;
      const assertValidPattern = (pattern) => {
        if (typeof pattern !== "string") {
          throw new TypeError("invalid pattern");
        }
        if (pattern.length > MAX_PATTERN_LENGTH) {
          throw new TypeError("pattern is too long");
        }
      };
      exports.assertValidPattern = assertValidPattern;
    },
    5136: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.AST = void 0;
      const brace_expressions_js_1 = __nccwpck_require__(1812);
      const unescape_js_1 = __nccwpck_require__(5698);
      const types = new Set(["!", "?", "+", "*", "@"]);
      const isExtglobType = (c) => types.has(c);
      const startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
      const startNoDot = "(?!\\.)";
      const addPatternStart = new Set(["[", "."]);
      const justDots = new Set(["..", "."]);
      const reSpecials = new Set("().*{}+?[]^$\\!");
      const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const qmark = "[^/]";
      const star = qmark + "*?";
      const starNoEmpty = qmark + "+?";
      class AST {
        type;
        #root;
        #hasMagic;
        #uflag = false;
        #parts = [];
        #parent;
        #parentIndex;
        #negs;
        #filledNegs = false;
        #options;
        #toString;
        #emptyExt = false;
        constructor(type, parent, options = {}) {
          this.type = type;
          if (type) this.#hasMagic = true;
          this.#parent = parent;
          this.#root = this.#parent ? this.#parent.#root : this;
          this.#options = this.#root === this ? options : this.#root.#options;
          this.#negs = this.#root === this ? [] : this.#root.#negs;
          if (type === "!" && !this.#root.#filledNegs) this.#negs.push(this);
          this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
        }
        get hasMagic() {
          if (this.#hasMagic !== undefined) return this.#hasMagic;
          for (const p of this.#parts) {
            if (typeof p === "string") continue;
            if (p.type || p.hasMagic) return (this.#hasMagic = true);
          }
          return this.#hasMagic;
        }
        toString() {
          if (this.#toString !== undefined) return this.#toString;
          if (!this.type) {
            return (this.#toString = this.#parts
              .map((p) => String(p))
              .join(""));
          } else {
            return (this.#toString =
              this.type +
              "(" +
              this.#parts.map((p) => String(p)).join("|") +
              ")");
          }
        }
        #fillNegs() {
          if (this !== this.#root) throw new Error("should only call on root");
          if (this.#filledNegs) return this;
          this.toString();
          this.#filledNegs = true;
          let n;
          while ((n = this.#negs.pop())) {
            if (n.type !== "!") continue;
            let p = n;
            let pp = p.#parent;
            while (pp) {
              for (
                let i = p.#parentIndex + 1;
                !pp.type && i < pp.#parts.length;
                i++
              ) {
                for (const part of n.#parts) {
                  if (typeof part === "string") {
                    throw new Error("string part in extglob AST??");
                  }
                  part.copyIn(pp.#parts[i]);
                }
              }
              p = pp;
              pp = p.#parent;
            }
          }
          return this;
        }
        push(...parts) {
          for (const p of parts) {
            if (p === "") continue;
            if (
              typeof p !== "string" &&
              !(p instanceof AST && p.#parent === this)
            ) {
              throw new Error("invalid part: " + p);
            }
            this.#parts.push(p);
          }
        }
        toJSON() {
          const ret =
            this.type === null
              ? this.#parts
                  .slice()
                  .map((p) => (typeof p === "string" ? p : p.toJSON()))
              : [this.type, ...this.#parts.map((p) => p.toJSON())];
          if (this.isStart() && !this.type) ret.unshift([]);
          if (
            this.isEnd() &&
            (this === this.#root ||
              (this.#root.#filledNegs && this.#parent?.type === "!"))
          ) {
            ret.push({});
          }
          return ret;
        }
        isStart() {
          if (this.#root === this) return true;
          if (!this.#parent?.isStart()) return false;
          if (this.#parentIndex === 0) return true;
          const p = this.#parent;
          for (let i = 0; i < this.#parentIndex; i++) {
            const pp = p.#parts[i];
            if (!(pp instanceof AST && pp.type === "!")) {
              return false;
            }
          }
          return true;
        }
        isEnd() {
          if (this.#root === this) return true;
          if (this.#parent?.type === "!") return true;
          if (!this.#parent?.isEnd()) return false;
          if (!this.type) return this.#parent?.isEnd();
          const pl = this.#parent ? this.#parent.#parts.length : 0;
          return this.#parentIndex === pl - 1;
        }
        copyIn(part) {
          if (typeof part === "string") this.push(part);
          else this.push(part.clone(this));
        }
        clone(parent) {
          const c = new AST(this.type, parent);
          for (const p of this.#parts) {
            c.copyIn(p);
          }
          return c;
        }
        static #parseAST(str, ast, pos, opt) {
          let escaping = false;
          let inBrace = false;
          let braceStart = -1;
          let braceNeg = false;
          if (ast.type === null) {
            let i = pos;
            let acc = "";
            while (i < str.length) {
              const c = str.charAt(i++);
              if (escaping || c === "\\") {
                escaping = !escaping;
                acc += c;
                continue;
              }
              if (inBrace) {
                if (i === braceStart + 1) {
                  if (c === "^" || c === "!") {
                    braceNeg = true;
                  }
                } else if (c === "]" && !(i === braceStart + 2 && braceNeg)) {
                  inBrace = false;
                }
                acc += c;
                continue;
              } else if (c === "[") {
                inBrace = true;
                braceStart = i;
                braceNeg = false;
                acc += c;
                continue;
              }
              if (!opt.noext && isExtglobType(c) && str.charAt(i) === "(") {
                ast.push(acc);
                acc = "";
                const ext = new AST(c, ast);
                i = AST.#parseAST(str, ext, i, opt);
                ast.push(ext);
                continue;
              }
              acc += c;
            }
            ast.push(acc);
            return i;
          }
          let i = pos + 1;
          let part = new AST(null, ast);
          const parts = [];
          let acc = "";
          while (i < str.length) {
            const c = str.charAt(i++);
            if (escaping || c === "\\") {
              escaping = !escaping;
              acc += c;
              continue;
            }
            if (inBrace) {
              if (i === braceStart + 1) {
                if (c === "^" || c === "!") {
                  braceNeg = true;
                }
              } else if (c === "]" && !(i === braceStart + 2 && braceNeg)) {
                inBrace = false;
              }
              acc += c;
              continue;
            } else if (c === "[") {
              inBrace = true;
              braceStart = i;
              braceNeg = false;
              acc += c;
              continue;
            }
            if (isExtglobType(c) && str.charAt(i) === "(") {
              part.push(acc);
              acc = "";
              const ext = new AST(c, part);
              part.push(ext);
              i = AST.#parseAST(str, ext, i, opt);
              continue;
            }
            if (c === "|") {
              part.push(acc);
              acc = "";
              parts.push(part);
              part = new AST(null, ast);
              continue;
            }
            if (c === ")") {
              if (acc === "" && ast.#parts.length === 0) {
                ast.#emptyExt = true;
              }
              part.push(acc);
              acc = "";
              ast.push(...parts, part);
              return i;
            }
            acc += c;
          }
          ast.type = null;
          ast.#hasMagic = undefined;
          ast.#parts = [str.substring(pos - 1)];
          return i;
        }
        static fromGlob(pattern, options = {}) {
          const ast = new AST(null, undefined, options);
          AST.#parseAST(pattern, ast, 0, options);
          return ast;
        }
        toMMPattern() {
          if (this !== this.#root) return this.#root.toMMPattern();
          const glob = this.toString();
          const [re, body, hasMagic, uflag] = this.toRegExpSource();
          const anyMagic =
            hasMagic ||
            this.#hasMagic ||
            (this.#options.nocase &&
              !this.#options.nocaseMagicOnly &&
              glob.toUpperCase() !== glob.toLowerCase());
          if (!anyMagic) {
            return body;
          }
          const flags = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
          return Object.assign(new RegExp(`^${re}$`, flags), {
            _src: re,
            _glob: glob,
          });
        }
        get options() {
          return this.#options;
        }
        toRegExpSource(allowDot) {
          const dot = allowDot ?? !!this.#options.dot;
          if (this.#root === this) this.#fillNegs();
          if (!this.type) {
            const noEmpty = this.isStart() && this.isEnd();
            const src = this.#parts
              .map((p) => {
                const [re, _, hasMagic, uflag] =
                  typeof p === "string"
                    ? AST.#parseGlob(p, this.#hasMagic, noEmpty)
                    : p.toRegExpSource(allowDot);
                this.#hasMagic = this.#hasMagic || hasMagic;
                this.#uflag = this.#uflag || uflag;
                return re;
              })
              .join("");
            let start = "";
            if (this.isStart()) {
              if (typeof this.#parts[0] === "string") {
                const dotTravAllowed =
                  this.#parts.length === 1 && justDots.has(this.#parts[0]);
                if (!dotTravAllowed) {
                  const aps = addPatternStart;
                  const needNoTrav =
                    (dot && aps.has(src.charAt(0))) ||
                    (src.startsWith("\\.") && aps.has(src.charAt(2))) ||
                    (src.startsWith("\\.\\.") && aps.has(src.charAt(4)));
                  const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
                  start = needNoTrav
                    ? startNoTraversal
                    : needNoDot
                      ? startNoDot
                      : "";
                }
              }
            }
            let end = "";
            if (
              this.isEnd() &&
              this.#root.#filledNegs &&
              this.#parent?.type === "!"
            ) {
              end = "(?:$|\\/)";
            }
            const final = start + src + end;
            return [
              final,
              (0, unescape_js_1.unescape)(src),
              (this.#hasMagic = !!this.#hasMagic),
              this.#uflag,
            ];
          }
          const repeated = this.type === "*" || this.type === "+";
          const start = this.type === "!" ? "(?:(?!(?:" : "(?:";
          let body = this.#partsToRegExp(dot);
          if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
            const s = this.toString();
            this.#parts = [s];
            this.type = null;
            this.#hasMagic = undefined;
            return [
              s,
              (0, unescape_js_1.unescape)(this.toString()),
              false,
              false,
            ];
          }
          let bodyDotAllowed =
            !repeated || allowDot || dot || !startNoDot
              ? ""
              : this.#partsToRegExp(true);
          if (bodyDotAllowed === body) {
            bodyDotAllowed = "";
          }
          if (bodyDotAllowed) {
            body = `(?:${body})(?:${bodyDotAllowed})*?`;
          }
          let final = "";
          if (this.type === "!" && this.#emptyExt) {
            final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
          } else {
            const close =
              this.type === "!"
                ? "))" +
                  (this.isStart() && !dot && !allowDot ? startNoDot : "") +
                  star +
                  ")"
                : this.type === "@"
                  ? ")"
                  : this.type === "?"
                    ? ")?"
                    : this.type === "+" && bodyDotAllowed
                      ? ")"
                      : this.type === "*" && bodyDotAllowed
                        ? `)?`
                        : `)${this.type}`;
            final = start + body + close;
          }
          return [
            final,
            (0, unescape_js_1.unescape)(body),
            (this.#hasMagic = !!this.#hasMagic),
            this.#uflag,
          ];
        }
        #partsToRegExp(dot) {
          return this.#parts
            .map((p) => {
              if (typeof p === "string") {
                throw new Error("string type in extglob ast??");
              }
              const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
              this.#uflag = this.#uflag || uflag;
              return re;
            })
            .filter((p) => !(this.isStart() && this.isEnd()) || !!p)
            .join("|");
        }
        static #parseGlob(glob, hasMagic, noEmpty = false) {
          let escaping = false;
          let re = "";
          let uflag = false;
          for (let i = 0; i < glob.length; i++) {
            const c = glob.charAt(i);
            if (escaping) {
              escaping = false;
              re += (reSpecials.has(c) ? "\\" : "") + c;
              continue;
            }
            if (c === "\\") {
              if (i === glob.length - 1) {
                re += "\\\\";
              } else {
                escaping = true;
              }
              continue;
            }
            if (c === "[") {
              const [src, needUflag, consumed, magic] = (0,
              brace_expressions_js_1.parseClass)(glob, i);
              if (consumed) {
                re += src;
                uflag = uflag || needUflag;
                i += consumed - 1;
                hasMagic = hasMagic || magic;
                continue;
              }
            }
            if (c === "*") {
              if (noEmpty && glob === "*") re += starNoEmpty;
              else re += star;
              hasMagic = true;
              continue;
            }
            if (c === "?") {
              re += qmark;
              hasMagic = true;
              continue;
            }
            re += regExpEscape(c);
          }
          return [re, (0, unescape_js_1.unescape)(glob), !!hasMagic, uflag];
        }
      }
      exports.AST = AST;
    },
    1812: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseClass = void 0;
      const posixClasses = {
        "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
        "[:alpha:]": ["\\p{L}\\p{Nl}", true],
        "[:ascii:]": ["\\x" + "00-\\x" + "7f", false],
        "[:blank:]": ["\\p{Zs}\\t", true],
        "[:cntrl:]": ["\\p{Cc}", true],
        "[:digit:]": ["\\p{Nd}", true],
        "[:graph:]": ["\\p{Z}\\p{C}", true, true],
        "[:lower:]": ["\\p{Ll}", true],
        "[:print:]": ["\\p{C}", true],
        "[:punct:]": ["\\p{P}", true],
        "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
        "[:upper:]": ["\\p{Lu}", true],
        "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
        "[:xdigit:]": ["A-Fa-f0-9", false],
      };
      const braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
      const regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const rangesToString = (ranges) => ranges.join("");
      const parseClass = (glob, position) => {
        const pos = position;
        if (glob.charAt(pos) !== "[") {
          throw new Error("not in a brace expression");
        }
        const ranges = [];
        const negs = [];
        let i = pos + 1;
        let sawStart = false;
        let uflag = false;
        let escaping = false;
        let negate = false;
        let endPos = pos;
        let rangeStart = "";
        WHILE: while (i < glob.length) {
          const c = glob.charAt(i);
          if ((c === "!" || c === "^") && i === pos + 1) {
            negate = true;
            i++;
            continue;
          }
          if (c === "]" && sawStart && !escaping) {
            endPos = i + 1;
            break;
          }
          sawStart = true;
          if (c === "\\") {
            if (!escaping) {
              escaping = true;
              i++;
              continue;
            }
          }
          if (c === "[" && !escaping) {
            for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
              if (glob.startsWith(cls, i)) {
                if (rangeStart) {
                  return ["$.", false, glob.length - pos, true];
                }
                i += cls.length;
                if (neg) negs.push(unip);
                else ranges.push(unip);
                uflag = uflag || u;
                continue WHILE;
              }
            }
          }
          escaping = false;
          if (rangeStart) {
            if (c > rangeStart) {
              ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
            } else if (c === rangeStart) {
              ranges.push(braceEscape(c));
            }
            rangeStart = "";
            i++;
            continue;
          }
          if (glob.startsWith("-]", i + 1)) {
            ranges.push(braceEscape(c + "-"));
            i += 2;
            continue;
          }
          if (glob.startsWith("-", i + 1)) {
            rangeStart = c;
            i += 2;
            continue;
          }
          ranges.push(braceEscape(c));
          i++;
        }
        if (endPos < i) {
          return ["", false, 0, false];
        }
        if (!ranges.length && !negs.length) {
          return ["$.", false, glob.length - pos, true];
        }
        if (
          negs.length === 0 &&
          ranges.length === 1 &&
          /^\\?.$/.test(ranges[0]) &&
          !negate
        ) {
          const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
          return [regexpEscape(r), false, endPos - pos, false];
        }
        const sranges =
          "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
        const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
        const comb =
          ranges.length && negs.length
            ? "(" + sranges + "|" + snegs + ")"
            : ranges.length
              ? sranges
              : snegs;
        return [comb, uflag, endPos - pos, true];
      };
      exports.parseClass = parseClass;
    },
    2804: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.escape = void 0;
      const escape = (s, { windowsPathsNoEscape = false } = {}) =>
        windowsPathsNoEscape
          ? s.replace(/[?*()[\]]/g, "[$&]")
          : s.replace(/[?*()[\]\\]/g, "\\$&");
      exports.escape = escape;
    },
    4501: function (__unused_webpack_module, exports, __nccwpck_require__) {
      "use strict";
      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unescape =
        exports.escape =
        exports.AST =
        exports.Minimatch =
        exports.match =
        exports.makeRe =
        exports.braceExpand =
        exports.defaults =
        exports.filter =
        exports.GLOBSTAR =
        exports.sep =
        exports.minimatch =
          void 0;
      const brace_expansion_1 = __importDefault(__nccwpck_require__(8184));
      const assert_valid_pattern_js_1 = __nccwpck_require__(4149);
      const ast_js_1 = __nccwpck_require__(5136);
      const escape_js_1 = __nccwpck_require__(2804);
      const unescape_js_1 = __nccwpck_require__(5698);
      const minimatch = (p, pattern, options = {}) => {
        (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
        if (!options.nocomment && pattern.charAt(0) === "#") {
          return false;
        }
        return new Minimatch(pattern, options).match(p);
      };
      exports.minimatch = minimatch;
      const starDotExtRE = /^\*+([^+@!?\*\[\(]*)$/;
      const starDotExtTest = (ext) => (f) =>
        !f.startsWith(".") && f.endsWith(ext);
      const starDotExtTestDot = (ext) => (f) => f.endsWith(ext);
      const starDotExtTestNocase = (ext) => {
        ext = ext.toLowerCase();
        return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext);
      };
      const starDotExtTestNocaseDot = (ext) => {
        ext = ext.toLowerCase();
        return (f) => f.toLowerCase().endsWith(ext);
      };
      const starDotStarRE = /^\*+\.\*+$/;
      const starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
      const starDotStarTestDot = (f) =>
        f !== "." && f !== ".." && f.includes(".");
      const dotStarRE = /^\.\*+$/;
      const dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
      const starRE = /^\*+$/;
      const starTest = (f) => f.length !== 0 && !f.startsWith(".");
      const starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
      const qmarksRE = /^\?+([^+@!?\*\[\(]*)?$/;
      const qmarksTestNocase = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExt([$0]);
        if (!ext) return noext;
        ext = ext.toLowerCase();
        return (f) => noext(f) && f.toLowerCase().endsWith(ext);
      };
      const qmarksTestNocaseDot = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExtDot([$0]);
        if (!ext) return noext;
        ext = ext.toLowerCase();
        return (f) => noext(f) && f.toLowerCase().endsWith(ext);
      };
      const qmarksTestDot = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExtDot([$0]);
        return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
      };
      const qmarksTest = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExt([$0]);
        return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
      };
      const qmarksTestNoExt = ([$0]) => {
        const len = $0.length;
        return (f) => f.length === len && !f.startsWith(".");
      };
      const qmarksTestNoExtDot = ([$0]) => {
        const len = $0.length;
        return (f) => f.length === len && f !== "." && f !== "..";
      };
      const defaultPlatform =
        typeof process === "object" && process
          ? (typeof process.env === "object" &&
              process.env &&
              process.env.__MINIMATCH_TESTING_PLATFORM__) ||
            process.platform
          : "posix";
      const path = { win32: { sep: "\\" }, posix: { sep: "/" } };
      exports.sep =
        defaultPlatform === "win32" ? path.win32.sep : path.posix.sep;
      exports.minimatch.sep = exports.sep;
      exports.GLOBSTAR = Symbol("globstar **");
      exports.minimatch.GLOBSTAR = exports.GLOBSTAR;
      const qmark = "[^/]";
      const star = qmark + "*?";
      const twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
      const twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
      const filter =
        (pattern, options = {}) =>
        (p) =>
          (0, exports.minimatch)(p, pattern, options);
      exports.filter = filter;
      exports.minimatch.filter = exports.filter;
      const ext = (a, b = {}) => Object.assign({}, a, b);
      const defaults = (def) => {
        if (!def || typeof def !== "object" || !Object.keys(def).length) {
          return exports.minimatch;
        }
        const orig = exports.minimatch;
        const m = (p, pattern, options = {}) =>
          orig(p, pattern, ext(def, options));
        return Object.assign(m, {
          Minimatch: class Minimatch extends orig.Minimatch {
            constructor(pattern, options = {}) {
              super(pattern, ext(def, options));
            }
            static defaults(options) {
              return orig.defaults(ext(def, options)).Minimatch;
            }
          },
          AST: class AST extends orig.AST {
            constructor(type, parent, options = {}) {
              super(type, parent, ext(def, options));
            }
            static fromGlob(pattern, options = {}) {
              return orig.AST.fromGlob(pattern, ext(def, options));
            }
          },
          unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
          escape: (s, options = {}) => orig.escape(s, ext(def, options)),
          filter: (pattern, options = {}) =>
            orig.filter(pattern, ext(def, options)),
          defaults: (options) => orig.defaults(ext(def, options)),
          makeRe: (pattern, options = {}) =>
            orig.makeRe(pattern, ext(def, options)),
          braceExpand: (pattern, options = {}) =>
            orig.braceExpand(pattern, ext(def, options)),
          match: (list, pattern, options = {}) =>
            orig.match(list, pattern, ext(def, options)),
          sep: orig.sep,
          GLOBSTAR: exports.GLOBSTAR,
        });
      };
      exports.defaults = defaults;
      exports.minimatch.defaults = exports.defaults;
      const braceExpand = (pattern, options = {}) => {
        (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
        if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
          return [pattern];
        }
        return (0, brace_expansion_1.default)(pattern);
      };
      exports.braceExpand = braceExpand;
      exports.minimatch.braceExpand = exports.braceExpand;
      const makeRe = (pattern, options = {}) =>
        new Minimatch(pattern, options).makeRe();
      exports.makeRe = makeRe;
      exports.minimatch.makeRe = exports.makeRe;
      const match = (list, pattern, options = {}) => {
        const mm = new Minimatch(pattern, options);
        list = list.filter((f) => mm.match(f));
        if (mm.options.nonull && !list.length) {
          list.push(pattern);
        }
        return list;
      };
      exports.match = match;
      exports.minimatch.match = exports.match;
      const globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
      const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      class Minimatch {
        options;
        set;
        pattern;
        windowsPathsNoEscape;
        nonegate;
        negate;
        comment;
        empty;
        preserveMultipleSlashes;
        partial;
        globSet;
        globParts;
        nocase;
        isWindows;
        platform;
        windowsNoMagicRoot;
        regexp;
        constructor(pattern, options = {}) {
          (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
          options = options || {};
          this.options = options;
          this.pattern = pattern;
          this.platform = options.platform || defaultPlatform;
          this.isWindows = this.platform === "win32";
          this.windowsPathsNoEscape =
            !!options.windowsPathsNoEscape ||
            options.allowWindowsEscape === false;
          if (this.windowsPathsNoEscape) {
            this.pattern = this.pattern.replace(/\\/g, "/");
          }
          this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
          this.regexp = null;
          this.negate = false;
          this.nonegate = !!options.nonegate;
          this.comment = false;
          this.empty = false;
          this.partial = !!options.partial;
          this.nocase = !!this.options.nocase;
          this.windowsNoMagicRoot =
            options.windowsNoMagicRoot !== undefined
              ? options.windowsNoMagicRoot
              : !!(this.isWindows && this.nocase);
          this.globSet = [];
          this.globParts = [];
          this.set = [];
          this.make();
        }
        hasMagic() {
          if (this.options.magicalBraces && this.set.length > 1) {
            return true;
          }
          for (const pattern of this.set) {
            for (const part of pattern) {
              if (typeof part !== "string") return true;
            }
          }
          return false;
        }
        debug(..._) {}
        make() {
          const pattern = this.pattern;
          const options = this.options;
          if (!options.nocomment && pattern.charAt(0) === "#") {
            this.comment = true;
            return;
          }
          if (!pattern) {
            this.empty = true;
            return;
          }
          this.parseNegate();
          this.globSet = [...new Set(this.braceExpand())];
          if (options.debug) {
            this.debug = (...args) => console.error(...args);
          }
          this.debug(this.pattern, this.globSet);
          const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
          this.globParts = this.preprocess(rawGlobParts);
          this.debug(this.pattern, this.globParts);
          let set = this.globParts.map((s, _, __) => {
            if (this.isWindows && this.windowsNoMagicRoot) {
              const isUNC =
                s[0] === "" &&
                s[1] === "" &&
                (s[2] === "?" || !globMagic.test(s[2])) &&
                !globMagic.test(s[3]);
              const isDrive = /^[a-z]:/i.test(s[0]);
              if (isUNC) {
                return [
                  ...s.slice(0, 4),
                  ...s.slice(4).map((ss) => this.parse(ss)),
                ];
              } else if (isDrive) {
                return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
              }
            }
            return s.map((ss) => this.parse(ss));
          });
          this.debug(this.pattern, set);
          this.set = set.filter((s) => s.indexOf(false) === -1);
          if (this.isWindows) {
            for (let i = 0; i < this.set.length; i++) {
              const p = this.set[i];
              if (
                p[0] === "" &&
                p[1] === "" &&
                this.globParts[i][2] === "?" &&
                typeof p[3] === "string" &&
                /^[a-z]:$/i.test(p[3])
              ) {
                p[2] = "?";
              }
            }
          }
          this.debug(this.pattern, this.set);
        }
        preprocess(globParts) {
          if (this.options.noglobstar) {
            for (let i = 0; i < globParts.length; i++) {
              for (let j = 0; j < globParts[i].length; j++) {
                if (globParts[i][j] === "**") {
                  globParts[i][j] = "*";
                }
              }
            }
          }
          const { optimizationLevel = 1 } = this.options;
          if (optimizationLevel >= 2) {
            globParts = this.firstPhasePreProcess(globParts);
            globParts = this.secondPhasePreProcess(globParts);
          } else if (optimizationLevel >= 1) {
            globParts = this.levelOneOptimize(globParts);
          } else {
            globParts = this.adjascentGlobstarOptimize(globParts);
          }
          return globParts;
        }
        adjascentGlobstarOptimize(globParts) {
          return globParts.map((parts) => {
            let gs = -1;
            while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
              let i = gs;
              while (parts[i + 1] === "**") {
                i++;
              }
              if (i !== gs) {
                parts.splice(gs, i - gs);
              }
            }
            return parts;
          });
        }
        levelOneOptimize(globParts) {
          return globParts.map((parts) => {
            parts = parts.reduce((set, part) => {
              const prev = set[set.length - 1];
              if (part === "**" && prev === "**") {
                return set;
              }
              if (part === "..") {
                if (prev && prev !== ".." && prev !== "." && prev !== "**") {
                  set.pop();
                  return set;
                }
              }
              set.push(part);
              return set;
            }, []);
            return parts.length === 0 ? [""] : parts;
          });
        }
        levelTwoFileOptimize(parts) {
          if (!Array.isArray(parts)) {
            parts = this.slashSplit(parts);
          }
          let didSomething = false;
          do {
            didSomething = false;
            if (!this.preserveMultipleSlashes) {
              for (let i = 1; i < parts.length - 1; i++) {
                const p = parts[i];
                if (i === 1 && p === "" && parts[0] === "") continue;
                if (p === "." || p === "") {
                  didSomething = true;
                  parts.splice(i, 1);
                  i--;
                }
              }
              if (
                parts[0] === "." &&
                parts.length === 2 &&
                (parts[1] === "." || parts[1] === "")
              ) {
                didSomething = true;
                parts.pop();
              }
            }
            let dd = 0;
            while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
              const p = parts[dd - 1];
              if (p && p !== "." && p !== ".." && p !== "**") {
                didSomething = true;
                parts.splice(dd - 1, 2);
                dd -= 2;
              }
            }
          } while (didSomething);
          return parts.length === 0 ? [""] : parts;
        }
        firstPhasePreProcess(globParts) {
          let didSomething = false;
          do {
            didSomething = false;
            for (let parts of globParts) {
              let gs = -1;
              while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
                let gss = gs;
                while (parts[gss + 1] === "**") {
                  gss++;
                }
                if (gss > gs) {
                  parts.splice(gs + 1, gss - gs);
                }
                let next = parts[gs + 1];
                const p = parts[gs + 2];
                const p2 = parts[gs + 3];
                if (next !== "..") continue;
                if (
                  !p ||
                  p === "." ||
                  p === ".." ||
                  !p2 ||
                  p2 === "." ||
                  p2 === ".."
                ) {
                  continue;
                }
                didSomething = true;
                parts.splice(gs, 1);
                const other = parts.slice(0);
                other[gs] = "**";
                globParts.push(other);
                gs--;
              }
              if (!this.preserveMultipleSlashes) {
                for (let i = 1; i < parts.length - 1; i++) {
                  const p = parts[i];
                  if (i === 1 && p === "" && parts[0] === "") continue;
                  if (p === "." || p === "") {
                    didSomething = true;
                    parts.splice(i, 1);
                    i--;
                  }
                }
                if (
                  parts[0] === "." &&
                  parts.length === 2 &&
                  (parts[1] === "." || parts[1] === "")
                ) {
                  didSomething = true;
                  parts.pop();
                }
              }
              let dd = 0;
              while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
                const p = parts[dd - 1];
                if (p && p !== "." && p !== ".." && p !== "**") {
                  didSomething = true;
                  const needDot = dd === 1 && parts[dd + 1] === "**";
                  const splin = needDot ? ["."] : [];
                  parts.splice(dd - 1, 2, ...splin);
                  if (parts.length === 0) parts.push("");
                  dd -= 2;
                }
              }
            }
          } while (didSomething);
          return globParts;
        }
        secondPhasePreProcess(globParts) {
          for (let i = 0; i < globParts.length - 1; i++) {
            for (let j = i + 1; j < globParts.length; j++) {
              const matched = this.partsMatch(
                globParts[i],
                globParts[j],
                !this.preserveMultipleSlashes,
              );
              if (matched) {
                globParts[i] = [];
                globParts[j] = matched;
                break;
              }
            }
          }
          return globParts.filter((gs) => gs.length);
        }
        partsMatch(a, b, emptyGSMatch = false) {
          let ai = 0;
          let bi = 0;
          let result = [];
          let which = "";
          while (ai < a.length && bi < b.length) {
            if (a[ai] === b[bi]) {
              result.push(which === "b" ? b[bi] : a[ai]);
              ai++;
              bi++;
            } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
              result.push(a[ai]);
              ai++;
            } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
              result.push(b[bi]);
              bi++;
            } else if (
              a[ai] === "*" &&
              b[bi] &&
              (this.options.dot || !b[bi].startsWith(".")) &&
              b[bi] !== "**"
            ) {
              if (which === "b") return false;
              which = "a";
              result.push(a[ai]);
              ai++;
              bi++;
            } else if (
              b[bi] === "*" &&
              a[ai] &&
              (this.options.dot || !a[ai].startsWith(".")) &&
              a[ai] !== "**"
            ) {
              if (which === "a") return false;
              which = "b";
              result.push(b[bi]);
              ai++;
              bi++;
            } else {
              return false;
            }
          }
          return a.length === b.length && result;
        }
        parseNegate() {
          if (this.nonegate) return;
          const pattern = this.pattern;
          let negate = false;
          let negateOffset = 0;
          for (
            let i = 0;
            i < pattern.length && pattern.charAt(i) === "!";
            i++
          ) {
            negate = !negate;
            negateOffset++;
          }
          if (negateOffset) this.pattern = pattern.slice(negateOffset);
          this.negate = negate;
        }
        matchOne(file, pattern, partial = false) {
          const options = this.options;
          if (this.isWindows) {
            const fileDrive =
              typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
            const fileUNC =
              !fileDrive &&
              file[0] === "" &&
              file[1] === "" &&
              file[2] === "?" &&
              /^[a-z]:$/i.test(file[3]);
            const patternDrive =
              typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
            const patternUNC =
              !patternDrive &&
              pattern[0] === "" &&
              pattern[1] === "" &&
              pattern[2] === "?" &&
              typeof pattern[3] === "string" &&
              /^[a-z]:$/i.test(pattern[3]);
            const fdi = fileUNC ? 3 : fileDrive ? 0 : undefined;
            const pdi = patternUNC ? 3 : patternDrive ? 0 : undefined;
            if (typeof fdi === "number" && typeof pdi === "number") {
              const [fd, pd] = [file[fdi], pattern[pdi]];
              if (fd.toLowerCase() === pd.toLowerCase()) {
                pattern[pdi] = fd;
                if (pdi > fdi) {
                  pattern = pattern.slice(pdi);
                } else if (fdi > pdi) {
                  file = file.slice(fdi);
                }
              }
            }
          }
          const { optimizationLevel = 1 } = this.options;
          if (optimizationLevel >= 2) {
            file = this.levelTwoFileOptimize(file);
          }
          this.debug("matchOne", this, { file, pattern });
          this.debug("matchOne", file.length, pattern.length);
          for (
            var fi = 0, pi = 0, fl = file.length, pl = pattern.length;
            fi < fl && pi < pl;
            fi++, pi++
          ) {
            this.debug("matchOne loop");
            var p = pattern[pi];
            var f = file[fi];
            this.debug(pattern, p, f);
            if (p === false) {
              return false;
            }
            if (p === exports.GLOBSTAR) {
              this.debug("GLOBSTAR", [pattern, p, f]);
              var fr = fi;
              var pr = pi + 1;
              if (pr === pl) {
                this.debug("** at the end");
                for (; fi < fl; fi++) {
                  if (
                    file[fi] === "." ||
                    file[fi] === ".." ||
                    (!options.dot && file[fi].charAt(0) === ".")
                  )
                    return false;
                }
                return true;
              }
              while (fr < fl) {
                var swallowee = file[fr];
                this.debug(
                  "\nglobstar while",
                  file,
                  fr,
                  pattern,
                  pr,
                  swallowee,
                );
                if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
                  this.debug("globstar found match!", fr, fl, swallowee);
                  return true;
                } else {
                  if (
                    swallowee === "." ||
                    swallowee === ".." ||
                    (!options.dot && swallowee.charAt(0) === ".")
                  ) {
                    this.debug("dot detected!", file, fr, pattern, pr);
                    break;
                  }
                  this.debug("globstar swallow a segment, and continue");
                  fr++;
                }
              }
              if (partial) {
                this.debug("\n>>> no match, partial?", file, fr, pattern, pr);
                if (fr === fl) {
                  return true;
                }
              }
              return false;
            }
            let hit;
            if (typeof p === "string") {
              hit = f === p;
              this.debug("string match", p, f, hit);
            } else {
              hit = p.test(f);
              this.debug("pattern match", p, f, hit);
            }
            if (!hit) return false;
          }
          if (fi === fl && pi === pl) {
            return true;
          } else if (fi === fl) {
            return partial;
          } else if (pi === pl) {
            return fi === fl - 1 && file[fi] === "";
          } else {
            throw new Error("wtf?");
          }
        }
        braceExpand() {
          return (0, exports.braceExpand)(this.pattern, this.options);
        }
        parse(pattern) {
          (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
          const options = this.options;
          if (pattern === "**") return exports.GLOBSTAR;
          if (pattern === "") return "";
          let m;
          let fastTest = null;
          if ((m = pattern.match(starRE))) {
            fastTest = options.dot ? starTestDot : starTest;
          } else if ((m = pattern.match(starDotExtRE))) {
            fastTest = (
              options.nocase
                ? options.dot
                  ? starDotExtTestNocaseDot
                  : starDotExtTestNocase
                : options.dot
                  ? starDotExtTestDot
                  : starDotExtTest
            )(m[1]);
          } else if ((m = pattern.match(qmarksRE))) {
            fastTest = (
              options.nocase
                ? options.dot
                  ? qmarksTestNocaseDot
                  : qmarksTestNocase
                : options.dot
                  ? qmarksTestDot
                  : qmarksTest
            )(m);
          } else if ((m = pattern.match(starDotStarRE))) {
            fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
          } else if ((m = pattern.match(dotStarRE))) {
            fastTest = dotStarTest;
          }
          const re = ast_js_1.AST.fromGlob(pattern, this.options).toMMPattern();
          if (fastTest && typeof re === "object") {
            Reflect.defineProperty(re, "test", { value: fastTest });
          }
          return re;
        }
        makeRe() {
          if (this.regexp || this.regexp === false) return this.regexp;
          const set = this.set;
          if (!set.length) {
            this.regexp = false;
            return this.regexp;
          }
          const options = this.options;
          const twoStar = options.noglobstar
            ? star
            : options.dot
              ? twoStarDot
              : twoStarNoDot;
          const flags = new Set(options.nocase ? ["i"] : []);
          let re = set
            .map((pattern) => {
              const pp = pattern.map((p) => {
                if (p instanceof RegExp) {
                  for (const f of p.flags.split("")) flags.add(f);
                }
                return typeof p === "string"
                  ? regExpEscape(p)
                  : p === exports.GLOBSTAR
                    ? exports.GLOBSTAR
                    : p._src;
              });
              pp.forEach((p, i) => {
                const next = pp[i + 1];
                const prev = pp[i - 1];
                if (p !== exports.GLOBSTAR || prev === exports.GLOBSTAR) {
                  return;
                }
                if (prev === undefined) {
                  if (next !== undefined && next !== exports.GLOBSTAR) {
                    pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
                  } else {
                    pp[i] = twoStar;
                  }
                } else if (next === undefined) {
                  pp[i - 1] = prev + "(?:\\/|" + twoStar + ")?";
                } else if (next !== exports.GLOBSTAR) {
                  pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
                  pp[i + 1] = exports.GLOBSTAR;
                }
              });
              return pp.filter((p) => p !== exports.GLOBSTAR).join("/");
            })
            .join("|");
          const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
          re = "^" + open + re + close + "$";
          if (this.negate) re = "^(?!" + re + ").+$";
          try {
            this.regexp = new RegExp(re, [...flags].join(""));
          } catch (ex) {
            this.regexp = false;
          }
          return this.regexp;
        }
        slashSplit(p) {
          if (this.preserveMultipleSlashes) {
            return p.split("/");
          } else if (this.isWindows && /^\/\/[^\/]+/.test(p)) {
            return ["", ...p.split(/\/+/)];
          } else {
            return p.split(/\/+/);
          }
        }
        match(f, partial = this.partial) {
          this.debug("match", f, this.pattern);
          if (this.comment) {
            return false;
          }
          if (this.empty) {
            return f === "";
          }
          if (f === "/" && partial) {
            return true;
          }
          const options = this.options;
          if (this.isWindows) {
            f = f.split("\\").join("/");
          }
          const ff = this.slashSplit(f);
          this.debug(this.pattern, "split", ff);
          const set = this.set;
          this.debug(this.pattern, "set", set);
          let filename = ff[ff.length - 1];
          if (!filename) {
            for (let i = ff.length - 2; !filename && i >= 0; i--) {
              filename = ff[i];
            }
          }
          for (let i = 0; i < set.length; i++) {
            const pattern = set[i];
            let file = ff;
            if (options.matchBase && pattern.length === 1) {
              file = [filename];
            }
            const hit = this.matchOne(file, pattern, partial);
            if (hit) {
              if (options.flipNegate) {
                return true;
              }
              return !this.negate;
            }
          }
          if (options.flipNegate) {
            return false;
          }
          return this.negate;
        }
        static defaults(def) {
          return exports.minimatch.defaults(def).Minimatch;
        }
      }
      exports.Minimatch = Minimatch;
      var ast_js_2 = __nccwpck_require__(5136);
      Object.defineProperty(exports, "AST", {
        enumerable: true,
        get: function () {
          return ast_js_2.AST;
        },
      });
      var escape_js_2 = __nccwpck_require__(2804);
      Object.defineProperty(exports, "escape", {
        enumerable: true,
        get: function () {
          return escape_js_2.escape;
        },
      });
      var unescape_js_2 = __nccwpck_require__(5698);
      Object.defineProperty(exports, "unescape", {
        enumerable: true,
        get: function () {
          return unescape_js_2.unescape;
        },
      });
      exports.minimatch.AST = ast_js_1.AST;
      exports.minimatch.Minimatch = Minimatch;
      exports.minimatch.escape = escape_js_1.escape;
      exports.minimatch.unescape = unescape_js_1.unescape;
    },
    5698: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unescape = void 0;
      const unescape = (s, { windowsPathsNoEscape = false } = {}) =>
        windowsPathsNoEscape
          ? s.replace(/\[([^\/\\])\]/g, "$1")
          : s
              .replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2")
              .replace(/\\([^\/])/g, "$1");
      exports.unescape = unescape;
    },
    4968: function (__unused_webpack_module, exports, __nccwpck_require__) {
      "use strict";
      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Minipass =
        exports.isWritable =
        exports.isReadable =
        exports.isStream =
          void 0;
      const proc =
        typeof process === "object" && process
          ? process
          : { stdout: null, stderr: null };
      const node_events_1 = __nccwpck_require__(5673);
      const node_stream_1 = __importDefault(__nccwpck_require__(4492));
      const node_string_decoder_1 = __nccwpck_require__(6915);
      const isStream = (s) =>
        !!s &&
        typeof s === "object" &&
        (s instanceof Minipass ||
          s instanceof node_stream_1.default ||
          (0, exports.isReadable)(s) ||
          (0, exports.isWritable)(s));
      exports.isStream = isStream;
      const isReadable = (s) =>
        !!s &&
        typeof s === "object" &&
        s instanceof node_events_1.EventEmitter &&
        typeof s.pipe === "function" &&
        s.pipe !== node_stream_1.default.Writable.prototype.pipe;
      exports.isReadable = isReadable;
      const isWritable = (s) =>
        !!s &&
        typeof s === "object" &&
        s instanceof node_events_1.EventEmitter &&
        typeof s.write === "function" &&
        typeof s.end === "function";
      exports.isWritable = isWritable;
      const EOF = Symbol("EOF");
      const MAYBE_EMIT_END = Symbol("maybeEmitEnd");
      const EMITTED_END = Symbol("emittedEnd");
      const EMITTING_END = Symbol("emittingEnd");
      const EMITTED_ERROR = Symbol("emittedError");
      const CLOSED = Symbol("closed");
      const READ = Symbol("read");
      const FLUSH = Symbol("flush");
      const FLUSHCHUNK = Symbol("flushChunk");
      const ENCODING = Symbol("encoding");
      const DECODER = Symbol("decoder");
      const FLOWING = Symbol("flowing");
      const PAUSED = Symbol("paused");
      const RESUME = Symbol("resume");
      const BUFFER = Symbol("buffer");
      const PIPES = Symbol("pipes");
      const BUFFERLENGTH = Symbol("bufferLength");
      const BUFFERPUSH = Symbol("bufferPush");
      const BUFFERSHIFT = Symbol("bufferShift");
      const OBJECTMODE = Symbol("objectMode");
      const DESTROYED = Symbol("destroyed");
      const ERROR = Symbol("error");
      const EMITDATA = Symbol("emitData");
      const EMITEND = Symbol("emitEnd");
      const EMITEND2 = Symbol("emitEnd2");
      const ASYNC = Symbol("async");
      const ABORT = Symbol("abort");
      const ABORTED = Symbol("aborted");
      const SIGNAL = Symbol("signal");
      const DATALISTENERS = Symbol("dataListeners");
      const DISCARDED = Symbol("discarded");
      const defer = (fn) => Promise.resolve().then(fn);
      const nodefer = (fn) => fn();
      const isEndish = (ev) =>
        ev === "end" || ev === "finish" || ev === "prefinish";
      const isArrayBufferLike = (b) =>
        b instanceof ArrayBuffer ||
        (!!b &&
          typeof b === "object" &&
          b.constructor &&
          b.constructor.name === "ArrayBuffer" &&
          b.byteLength >= 0);
      const isArrayBufferView = (b) =>
        !Buffer.isBuffer(b) && ArrayBuffer.isView(b);
      class Pipe {
        src;
        dest;
        opts;
        ondrain;
        constructor(src, dest, opts) {
          this.src = src;
          this.dest = dest;
          this.opts = opts;
          this.ondrain = () => src[RESUME]();
          this.dest.on("drain", this.ondrain);
        }
        unpipe() {
          this.dest.removeListener("drain", this.ondrain);
        }
        proxyErrors(_er) {}
        end() {
          this.unpipe();
          if (this.opts.end) this.dest.end();
        }
      }
      class PipeProxyErrors extends Pipe {
        unpipe() {
          this.src.removeListener("error", this.proxyErrors);
          super.unpipe();
        }
        constructor(src, dest, opts) {
          super(src, dest, opts);
          this.proxyErrors = (er) => dest.emit("error", er);
          src.on("error", this.proxyErrors);
        }
      }
      const isObjectModeOptions = (o) => !!o.objectMode;
      const isEncodingOptions = (o) =>
        !o.objectMode && !!o.encoding && o.encoding !== "buffer";
      class Minipass extends node_events_1.EventEmitter {
        [FLOWING] = false;
        [PAUSED] = false;
        [PIPES] = [];
        [BUFFER] = [];
        [OBJECTMODE];
        [ENCODING];
        [ASYNC];
        [DECODER];
        [EOF] = false;
        [EMITTED_END] = false;
        [EMITTING_END] = false;
        [CLOSED] = false;
        [EMITTED_ERROR] = null;
        [BUFFERLENGTH] = 0;
        [DESTROYED] = false;
        [SIGNAL];
        [ABORTED] = false;
        [DATALISTENERS] = 0;
        [DISCARDED] = false;
        writable = true;
        readable = true;
        constructor(...args) {
          const options = args[0] || {};
          super();
          if (options.objectMode && typeof options.encoding === "string") {
            throw new TypeError(
              "Encoding and objectMode may not be used together",
            );
          }
          if (isObjectModeOptions(options)) {
            this[OBJECTMODE] = true;
            this[ENCODING] = null;
          } else if (isEncodingOptions(options)) {
            this[ENCODING] = options.encoding;
            this[OBJECTMODE] = false;
          } else {
            this[OBJECTMODE] = false;
            this[ENCODING] = null;
          }
          this[ASYNC] = !!options.async;
          this[DECODER] = this[ENCODING]
            ? new node_string_decoder_1.StringDecoder(this[ENCODING])
            : null;
          if (options && options.debugExposeBuffer === true) {
            Object.defineProperty(this, "buffer", { get: () => this[BUFFER] });
          }
          if (options && options.debugExposePipes === true) {
            Object.defineProperty(this, "pipes", { get: () => this[PIPES] });
          }
          const { signal } = options;
          if (signal) {
            this[SIGNAL] = signal;
            if (signal.aborted) {
              this[ABORT]();
            } else {
              signal.addEventListener("abort", () => this[ABORT]());
            }
          }
        }
        get bufferLength() {
          return this[BUFFERLENGTH];
        }
        get encoding() {
          return this[ENCODING];
        }
        set encoding(_enc) {
          throw new Error("Encoding must be set at instantiation time");
        }
        setEncoding(_enc) {
          throw new Error("Encoding must be set at instantiation time");
        }
        get objectMode() {
          return this[OBJECTMODE];
        }
        set objectMode(_om) {
          throw new Error("objectMode must be set at instantiation time");
        }
        get ["async"]() {
          return this[ASYNC];
        }
        set ["async"](a) {
          this[ASYNC] = this[ASYNC] || !!a;
        }
        [ABORT]() {
          this[ABORTED] = true;
          this.emit("abort", this[SIGNAL]?.reason);
          this.destroy(this[SIGNAL]?.reason);
        }
        get aborted() {
          return this[ABORTED];
        }
        set aborted(_) {}
        write(chunk, encoding, cb) {
          if (this[ABORTED]) return false;
          if (this[EOF]) throw new Error("write after end");
          if (this[DESTROYED]) {
            this.emit(
              "error",
              Object.assign(
                new Error("Cannot call write after a stream was destroyed"),
                { code: "ERR_STREAM_DESTROYED" },
              ),
            );
            return true;
          }
          if (typeof encoding === "function") {
            cb = encoding;
            encoding = "utf8";
          }
          if (!encoding) encoding = "utf8";
          const fn = this[ASYNC] ? defer : nodefer;
          if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
            if (isArrayBufferView(chunk)) {
              chunk = Buffer.from(
                chunk.buffer,
                chunk.byteOffset,
                chunk.byteLength,
              );
            } else if (isArrayBufferLike(chunk)) {
              chunk = Buffer.from(chunk);
            } else if (typeof chunk !== "string") {
              throw new Error(
                "Non-contiguous data written to non-objectMode stream",
              );
            }
          }
          if (this[OBJECTMODE]) {
            if (this[FLOWING] && this[BUFFERLENGTH] !== 0) this[FLUSH](true);
            if (this[FLOWING]) this.emit("data", chunk);
            else this[BUFFERPUSH](chunk);
            if (this[BUFFERLENGTH] !== 0) this.emit("readable");
            if (cb) fn(cb);
            return this[FLOWING];
          }
          if (!chunk.length) {
            if (this[BUFFERLENGTH] !== 0) this.emit("readable");
            if (cb) fn(cb);
            return this[FLOWING];
          }
          if (
            typeof chunk === "string" &&
            !(encoding === this[ENCODING] && !this[DECODER]?.lastNeed)
          ) {
            chunk = Buffer.from(chunk, encoding);
          }
          if (Buffer.isBuffer(chunk) && this[ENCODING]) {
            chunk = this[DECODER].write(chunk);
          }
          if (this[FLOWING] && this[BUFFERLENGTH] !== 0) this[FLUSH](true);
          if (this[FLOWING]) this.emit("data", chunk);
          else this[BUFFERPUSH](chunk);
          if (this[BUFFERLENGTH] !== 0) this.emit("readable");
          if (cb) fn(cb);
          return this[FLOWING];
        }
        read(n) {
          if (this[DESTROYED]) return null;
          this[DISCARDED] = false;
          if (
            this[BUFFERLENGTH] === 0 ||
            n === 0 ||
            (n && n > this[BUFFERLENGTH])
          ) {
            this[MAYBE_EMIT_END]();
            return null;
          }
          if (this[OBJECTMODE]) n = null;
          if (this[BUFFER].length > 1 && !this[OBJECTMODE]) {
            this[BUFFER] = [
              this[ENCODING]
                ? this[BUFFER].join("")
                : Buffer.concat(this[BUFFER], this[BUFFERLENGTH]),
            ];
          }
          const ret = this[READ](n || null, this[BUFFER][0]);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [READ](n, chunk) {
          if (this[OBJECTMODE]) this[BUFFERSHIFT]();
          else {
            const c = chunk;
            if (n === c.length || n === null) this[BUFFERSHIFT]();
            else if (typeof c === "string") {
              this[BUFFER][0] = c.slice(n);
              chunk = c.slice(0, n);
              this[BUFFERLENGTH] -= n;
            } else {
              this[BUFFER][0] = c.subarray(n);
              chunk = c.subarray(0, n);
              this[BUFFERLENGTH] -= n;
            }
          }
          this.emit("data", chunk);
          if (!this[BUFFER].length && !this[EOF]) this.emit("drain");
          return chunk;
        }
        end(chunk, encoding, cb) {
          if (typeof chunk === "function") {
            cb = chunk;
            chunk = undefined;
          }
          if (typeof encoding === "function") {
            cb = encoding;
            encoding = "utf8";
          }
          if (chunk !== undefined) this.write(chunk, encoding);
          if (cb) this.once("end", cb);
          this[EOF] = true;
          this.writable = false;
          if (this[FLOWING] || !this[PAUSED]) this[MAYBE_EMIT_END]();
          return this;
        }
        [RESUME]() {
          if (this[DESTROYED]) return;
          if (!this[DATALISTENERS] && !this[PIPES].length) {
            this[DISCARDED] = true;
          }
          this[PAUSED] = false;
          this[FLOWING] = true;
          this.emit("resume");
          if (this[BUFFER].length) this[FLUSH]();
          else if (this[EOF]) this[MAYBE_EMIT_END]();
          else this.emit("drain");
        }
        resume() {
          return this[RESUME]();
        }
        pause() {
          this[FLOWING] = false;
          this[PAUSED] = true;
          this[DISCARDED] = false;
        }
        get destroyed() {
          return this[DESTROYED];
        }
        get flowing() {
          return this[FLOWING];
        }
        get paused() {
          return this[PAUSED];
        }
        [BUFFERPUSH](chunk) {
          if (this[OBJECTMODE]) this[BUFFERLENGTH] += 1;
          else this[BUFFERLENGTH] += chunk.length;
          this[BUFFER].push(chunk);
        }
        [BUFFERSHIFT]() {
          if (this[OBJECTMODE]) this[BUFFERLENGTH] -= 1;
          else this[BUFFERLENGTH] -= this[BUFFER][0].length;
          return this[BUFFER].shift();
        }
        [FLUSH](noDrain = false) {
          do {} while (
            this[FLUSHCHUNK](this[BUFFERSHIFT]()) &&
            this[BUFFER].length
          );
          if (!noDrain && !this[BUFFER].length && !this[EOF])
            this.emit("drain");
        }
        [FLUSHCHUNK](chunk) {
          this.emit("data", chunk);
          return this[FLOWING];
        }
        pipe(dest, opts) {
          if (this[DESTROYED]) return dest;
          this[DISCARDED] = false;
          const ended = this[EMITTED_END];
          opts = opts || {};
          if (dest === proc.stdout || dest === proc.stderr) opts.end = false;
          else opts.end = opts.end !== false;
          opts.proxyErrors = !!opts.proxyErrors;
          if (ended) {
            if (opts.end) dest.end();
          } else {
            this[PIPES].push(
              !opts.proxyErrors
                ? new Pipe(this, dest, opts)
                : new PipeProxyErrors(this, dest, opts),
            );
            if (this[ASYNC]) defer(() => this[RESUME]());
            else this[RESUME]();
          }
          return dest;
        }
        unpipe(dest) {
          const p = this[PIPES].find((p) => p.dest === dest);
          if (p) {
            if (this[PIPES].length === 1) {
              if (this[FLOWING] && this[DATALISTENERS] === 0) {
                this[FLOWING] = false;
              }
              this[PIPES] = [];
            } else this[PIPES].splice(this[PIPES].indexOf(p), 1);
            p.unpipe();
          }
        }
        addListener(ev, handler) {
          return this.on(ev, handler);
        }
        on(ev, handler) {
          const ret = super.on(ev, handler);
          if (ev === "data") {
            this[DISCARDED] = false;
            this[DATALISTENERS]++;
            if (!this[PIPES].length && !this[FLOWING]) {
              this[RESUME]();
            }
          } else if (ev === "readable" && this[BUFFERLENGTH] !== 0) {
            super.emit("readable");
          } else if (isEndish(ev) && this[EMITTED_END]) {
            super.emit(ev);
            this.removeAllListeners(ev);
          } else if (ev === "error" && this[EMITTED_ERROR]) {
            const h = handler;
            if (this[ASYNC]) defer(() => h.call(this, this[EMITTED_ERROR]));
            else h.call(this, this[EMITTED_ERROR]);
          }
          return ret;
        }
        removeListener(ev, handler) {
          return this.off(ev, handler);
        }
        off(ev, handler) {
          const ret = super.off(ev, handler);
          if (ev === "data") {
            this[DATALISTENERS] = this.listeners("data").length;
            if (
              this[DATALISTENERS] === 0 &&
              !this[DISCARDED] &&
              !this[PIPES].length
            ) {
              this[FLOWING] = false;
            }
          }
          return ret;
        }
        removeAllListeners(ev) {
          const ret = super.removeAllListeners(ev);
          if (ev === "data" || ev === undefined) {
            this[DATALISTENERS] = 0;
            if (!this[DISCARDED] && !this[PIPES].length) {
              this[FLOWING] = false;
            }
          }
          return ret;
        }
        get emittedEnd() {
          return this[EMITTED_END];
        }
        [MAYBE_EMIT_END]() {
          if (
            !this[EMITTING_END] &&
            !this[EMITTED_END] &&
            !this[DESTROYED] &&
            this[BUFFER].length === 0 &&
            this[EOF]
          ) {
            this[EMITTING_END] = true;
            this.emit("end");
            this.emit("prefinish");
            this.emit("finish");
            if (this[CLOSED]) this.emit("close");
            this[EMITTING_END] = false;
          }
        }
        emit(ev, ...args) {
          const data = args[0];
          if (
            ev !== "error" &&
            ev !== "close" &&
            ev !== DESTROYED &&
            this[DESTROYED]
          ) {
            return false;
          } else if (ev === "data") {
            return !this[OBJECTMODE] && !data
              ? false
              : this[ASYNC]
                ? (defer(() => this[EMITDATA](data)), true)
                : this[EMITDATA](data);
          } else if (ev === "end") {
            return this[EMITEND]();
          } else if (ev === "close") {
            this[CLOSED] = true;
            if (!this[EMITTED_END] && !this[DESTROYED]) return false;
            const ret = super.emit("close");
            this.removeAllListeners("close");
            return ret;
          } else if (ev === "error") {
            this[EMITTED_ERROR] = data;
            super.emit(ERROR, data);
            const ret =
              !this[SIGNAL] || this.listeners("error").length
                ? super.emit("error", data)
                : false;
            this[MAYBE_EMIT_END]();
            return ret;
          } else if (ev === "resume") {
            const ret = super.emit("resume");
            this[MAYBE_EMIT_END]();
            return ret;
          } else if (ev === "finish" || ev === "prefinish") {
            const ret = super.emit(ev);
            this.removeAllListeners(ev);
            return ret;
          }
          const ret = super.emit(ev, ...args);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [EMITDATA](data) {
          for (const p of this[PIPES]) {
            if (p.dest.write(data) === false) this.pause();
          }
          const ret = this[DISCARDED] ? false : super.emit("data", data);
          this[MAYBE_EMIT_END]();
          return ret;
        }
        [EMITEND]() {
          if (this[EMITTED_END]) return false;
          this[EMITTED_END] = true;
          this.readable = false;
          return this[ASYNC]
            ? (defer(() => this[EMITEND2]()), true)
            : this[EMITEND2]();
        }
        [EMITEND2]() {
          if (this[DECODER]) {
            const data = this[DECODER].end();
            if (data) {
              for (const p of this[PIPES]) {
                p.dest.write(data);
              }
              if (!this[DISCARDED]) super.emit("data", data);
            }
          }
          for (const p of this[PIPES]) {
            p.end();
          }
          const ret = super.emit("end");
          this.removeAllListeners("end");
          return ret;
        }
        async collect() {
          const buf = Object.assign([], { dataLength: 0 });
          if (!this[OBJECTMODE]) buf.dataLength = 0;
          const p = this.promise();
          this.on("data", (c) => {
            buf.push(c);
            if (!this[OBJECTMODE]) buf.dataLength += c.length;
          });
          await p;
          return buf;
        }
        async concat() {
          if (this[OBJECTMODE]) {
            throw new Error("cannot concat in objectMode");
          }
          const buf = await this.collect();
          return this[ENCODING]
            ? buf.join("")
            : Buffer.concat(buf, buf.dataLength);
        }
        async promise() {
          return new Promise((resolve, reject) => {
            this.on(DESTROYED, () => reject(new Error("stream destroyed")));
            this.on("error", (er) => reject(er));
            this.on("end", () => resolve());
          });
        }
        [Symbol.asyncIterator]() {
          this[DISCARDED] = false;
          let stopped = false;
          const stop = async () => {
            this.pause();
            stopped = true;
            return { value: undefined, done: true };
          };
          const next = () => {
            if (stopped) return stop();
            const res = this.read();
            if (res !== null)
              return Promise.resolve({ done: false, value: res });
            if (this[EOF]) return stop();
            let resolve;
            let reject;
            const onerr = (er) => {
              this.off("data", ondata);
              this.off("end", onend);
              this.off(DESTROYED, ondestroy);
              stop();
              reject(er);
            };
            const ondata = (value) => {
              this.off("error", onerr);
              this.off("end", onend);
              this.off(DESTROYED, ondestroy);
              this.pause();
              resolve({ value, done: !!this[EOF] });
            };
            const onend = () => {
              this.off("error", onerr);
              this.off("data", ondata);
              this.off(DESTROYED, ondestroy);
              stop();
              resolve({ done: true, value: undefined });
            };
            const ondestroy = () => onerr(new Error("stream destroyed"));
            return new Promise((res, rej) => {
              reject = rej;
              resolve = res;
              this.once(DESTROYED, ondestroy);
              this.once("error", onerr);
              this.once("end", onend);
              this.once("data", ondata);
            });
          };
          return {
            next,
            throw: stop,
            return: stop,
            [Symbol.asyncIterator]() {
              return this;
            },
          };
        }
        [Symbol.iterator]() {
          this[DISCARDED] = false;
          let stopped = false;
          const stop = () => {
            this.pause();
            this.off(ERROR, stop);
            this.off(DESTROYED, stop);
            this.off("end", stop);
            stopped = true;
            return { done: true, value: undefined };
          };
          const next = () => {
            if (stopped) return stop();
            const value = this.read();
            return value === null ? stop() : { done: false, value };
          };
          this.once("end", stop);
          this.once(ERROR, stop);
          this.once(DESTROYED, stop);
          return {
            next,
            throw: stop,
            return: stop,
            [Symbol.iterator]() {
              return this;
            },
          };
        }
        destroy(er) {
          if (this[DESTROYED]) {
            if (er) this.emit("error", er);
            else this.emit(DESTROYED);
            return this;
          }
          this[DESTROYED] = true;
          this[DISCARDED] = true;
          this[BUFFER].length = 0;
          this[BUFFERLENGTH] = 0;
          const wc = this;
          if (typeof wc.close === "function" && !this[CLOSED]) wc.close();
          if (er) this.emit("error", er);
          else this.emit(DESTROYED);
          return this;
        }
        static get isStream() {
          return exports.isStream;
        }
      }
      exports.Minipass = Minipass;
    },
    1081: function (__unused_webpack_module, exports, __nccwpck_require__) {
      "use strict";
      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (
                !desc ||
                ("get" in desc
                  ? !m.__esModule
                  : desc.writable || desc.configurable)
              ) {
                desc = {
                  enumerable: true,
                  get: function () {
                    return m[k];
                  },
                };
              }
              Object.defineProperty(o, k2, desc);
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (
                k !== "default" &&
                Object.prototype.hasOwnProperty.call(mod, k)
              )
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PathScurry =
        exports.Path =
        exports.PathScurryDarwin =
        exports.PathScurryPosix =
        exports.PathScurryWin32 =
        exports.PathScurryBase =
        exports.PathPosix =
        exports.PathWin32 =
        exports.PathBase =
        exports.ChildrenCache =
        exports.ResolveCache =
          void 0;
      const lru_cache_1 = __nccwpck_require__(3866);
      const node_path_1 = __nccwpck_require__(9411);
      const node_url_1 = __nccwpck_require__(1041);
      const fs_1 = __nccwpck_require__(7147);
      const actualFS = __importStar(__nccwpck_require__(7561));
      const realpathSync = fs_1.realpathSync.native;
      const promises_1 = __nccwpck_require__(3977);
      const minipass_1 = __nccwpck_require__(4968);
      const defaultFS = {
        lstatSync: fs_1.lstatSync,
        readdir: fs_1.readdir,
        readdirSync: fs_1.readdirSync,
        readlinkSync: fs_1.readlinkSync,
        realpathSync,
        promises: {
          lstat: promises_1.lstat,
          readdir: promises_1.readdir,
          readlink: promises_1.readlink,
          realpath: promises_1.realpath,
        },
      };
      const fsFromOption = (fsOption) =>
        !fsOption || fsOption === defaultFS || fsOption === actualFS
          ? defaultFS
          : {
              ...defaultFS,
              ...fsOption,
              promises: { ...defaultFS.promises, ...(fsOption.promises || {}) },
            };
      const uncDriveRegexp = /^\\\\\?\\([a-z]:)\\?$/i;
      const uncToDrive = (rootPath) =>
        rootPath.replace(/\//g, "\\").replace(uncDriveRegexp, "$1\\");
      const eitherSep = /[\\\/]/;
      const UNKNOWN = 0;
      const IFIFO = 1;
      const IFCHR = 2;
      const IFDIR = 4;
      const IFBLK = 6;
      const IFREG = 8;
      const IFLNK = 10;
      const IFSOCK = 12;
      const IFMT = 15;
      const IFMT_UNKNOWN = ~IFMT;
      const READDIR_CALLED = 16;
      const LSTAT_CALLED = 32;
      const ENOTDIR = 64;
      const ENOENT = 128;
      const ENOREADLINK = 256;
      const ENOREALPATH = 512;
      const ENOCHILD = ENOTDIR | ENOENT | ENOREALPATH;
      const TYPEMASK = 1023;
      const entToType = (s) =>
        s.isFile()
          ? IFREG
          : s.isDirectory()
            ? IFDIR
            : s.isSymbolicLink()
              ? IFLNK
              : s.isCharacterDevice()
                ? IFCHR
                : s.isBlockDevice()
                  ? IFBLK
                  : s.isSocket()
                    ? IFSOCK
                    : s.isFIFO()
                      ? IFIFO
                      : UNKNOWN;
      const normalizeCache = new Map();
      const normalize = (s) => {
        const c = normalizeCache.get(s);
        if (c) return c;
        const n = s.normalize("NFKD");
        normalizeCache.set(s, n);
        return n;
      };
      const normalizeNocaseCache = new Map();
      const normalizeNocase = (s) => {
        const c = normalizeNocaseCache.get(s);
        if (c) return c;
        const n = normalize(s.toLowerCase());
        normalizeNocaseCache.set(s, n);
        return n;
      };
      class ResolveCache extends lru_cache_1.LRUCache {
        constructor() {
          super({ max: 256 });
        }
      }
      exports.ResolveCache = ResolveCache;
      class ChildrenCache extends lru_cache_1.LRUCache {
        constructor(maxSize = 16 * 1024) {
          super({ maxSize, sizeCalculation: (a) => a.length + 1 });
        }
      }
      exports.ChildrenCache = ChildrenCache;
      const setAsCwd = Symbol("PathScurry setAsCwd");
      class PathBase {
        name;
        root;
        roots;
        parent;
        nocase;
        isCWD = false;
        #fs;
        #dev;
        get dev() {
          return this.#dev;
        }
        #mode;
        get mode() {
          return this.#mode;
        }
        #nlink;
        get nlink() {
          return this.#nlink;
        }
        #uid;
        get uid() {
          return this.#uid;
        }
        #gid;
        get gid() {
          return this.#gid;
        }
        #rdev;
        get rdev() {
          return this.#rdev;
        }
        #blksize;
        get blksize() {
          return this.#blksize;
        }
        #ino;
        get ino() {
          return this.#ino;
        }
        #size;
        get size() {
          return this.#size;
        }
        #blocks;
        get blocks() {
          return this.#blocks;
        }
        #atimeMs;
        get atimeMs() {
          return this.#atimeMs;
        }
        #mtimeMs;
        get mtimeMs() {
          return this.#mtimeMs;
        }
        #ctimeMs;
        get ctimeMs() {
          return this.#ctimeMs;
        }
        #birthtimeMs;
        get birthtimeMs() {
          return this.#birthtimeMs;
        }
        #atime;
        get atime() {
          return this.#atime;
        }
        #mtime;
        get mtime() {
          return this.#mtime;
        }
        #ctime;
        get ctime() {
          return this.#ctime;
        }
        #birthtime;
        get birthtime() {
          return this.#birthtime;
        }
        #matchName;
        #depth;
        #fullpath;
        #fullpathPosix;
        #relative;
        #relativePosix;
        #type;
        #children;
        #linkTarget;
        #realpath;
        get parentPath() {
          return (this.parent || this).fullpath();
        }
        get path() {
          return this.parentPath;
        }
        constructor(name, type = UNKNOWN, root, roots, nocase, children, opts) {
          this.name = name;
          this.#matchName = nocase ? normalizeNocase(name) : normalize(name);
          this.#type = type & TYPEMASK;
          this.nocase = nocase;
          this.roots = roots;
          this.root = root || this;
          this.#children = children;
          this.#fullpath = opts.fullpath;
          this.#relative = opts.relative;
          this.#relativePosix = opts.relativePosix;
          this.parent = opts.parent;
          if (this.parent) {
            this.#fs = this.parent.#fs;
          } else {
            this.#fs = fsFromOption(opts.fs);
          }
        }
        depth() {
          if (this.#depth !== undefined) return this.#depth;
          if (!this.parent) return (this.#depth = 0);
          return (this.#depth = this.parent.depth() + 1);
        }
        childrenCache() {
          return this.#children;
        }
        resolve(path) {
          if (!path) {
            return this;
          }
          const rootPath = this.getRootString(path);
          const dir = path.substring(rootPath.length);
          const dirParts = dir.split(this.splitSep);
          const result = rootPath
            ? this.getRoot(rootPath).#resolveParts(dirParts)
            : this.#resolveParts(dirParts);
          return result;
        }
        #resolveParts(dirParts) {
          let p = this;
          for (const part of dirParts) {
            p = p.child(part);
          }
          return p;
        }
        children() {
          const cached = this.#children.get(this);
          if (cached) {
            return cached;
          }
          const children = Object.assign([], { provisional: 0 });
          this.#children.set(this, children);
          this.#type &= ~READDIR_CALLED;
          return children;
        }
        child(pathPart, opts) {
          if (pathPart === "" || pathPart === ".") {
            return this;
          }
          if (pathPart === "..") {
            return this.parent || this;
          }
          const children = this.children();
          const name = this.nocase
            ? normalizeNocase(pathPart)
            : normalize(pathPart);
          for (const p of children) {
            if (p.#matchName === name) {
              return p;
            }
          }
          const s = this.parent ? this.sep : "";
          const fullpath = this.#fullpath
            ? this.#fullpath + s + pathPart
            : undefined;
          const pchild = this.newChild(pathPart, UNKNOWN, {
            ...opts,
            parent: this,
            fullpath,
          });
          if (!this.canReaddir()) {
            pchild.#type |= ENOENT;
          }
          children.push(pchild);
          return pchild;
        }
        relative() {
          if (this.isCWD) return "";
          if (this.#relative !== undefined) {
            return this.#relative;
          }
          const name = this.name;
          const p = this.parent;
          if (!p) {
            return (this.#relative = this.name);
          }
          const pv = p.relative();
          return pv + (!pv || !p.parent ? "" : this.sep) + name;
        }
        relativePosix() {
          if (this.sep === "/") return this.relative();
          if (this.isCWD) return "";
          if (this.#relativePosix !== undefined) return this.#relativePosix;
          const name = this.name;
          const p = this.parent;
          if (!p) {
            return (this.#relativePosix = this.fullpathPosix());
          }
          const pv = p.relativePosix();
          return pv + (!pv || !p.parent ? "" : "/") + name;
        }
        fullpath() {
          if (this.#fullpath !== undefined) {
            return this.#fullpath;
          }
          const name = this.name;
          const p = this.parent;
          if (!p) {
            return (this.#fullpath = this.name);
          }
          const pv = p.fullpath();
          const fp = pv + (!p.parent ? "" : this.sep) + name;
          return (this.#fullpath = fp);
        }
        fullpathPosix() {
          if (this.#fullpathPosix !== undefined) return this.#fullpathPosix;
          if (this.sep === "/") return (this.#fullpathPosix = this.fullpath());
          if (!this.parent) {
            const p = this.fullpath().replace(/\\/g, "/");
            if (/^[a-z]:\//i.test(p)) {
              return (this.#fullpathPosix = `//?/${p}`);
            } else {
              return (this.#fullpathPosix = p);
            }
          }
          const p = this.parent;
          const pfpp = p.fullpathPosix();
          const fpp = pfpp + (!pfpp || !p.parent ? "" : "/") + this.name;
          return (this.#fullpathPosix = fpp);
        }
        isUnknown() {
          return (this.#type & IFMT) === UNKNOWN;
        }
        isType(type) {
          return this[`is${type}`]();
        }
        getType() {
          return this.isUnknown()
            ? "Unknown"
            : this.isDirectory()
              ? "Directory"
              : this.isFile()
                ? "File"
                : this.isSymbolicLink()
                  ? "SymbolicLink"
                  : this.isFIFO()
                    ? "FIFO"
                    : this.isCharacterDevice()
                      ? "CharacterDevice"
                      : this.isBlockDevice()
                        ? "BlockDevice"
                        : this.isSocket()
                          ? "Socket"
                          : "Unknown";
        }
        isFile() {
          return (this.#type & IFMT) === IFREG;
        }
        isDirectory() {
          return (this.#type & IFMT) === IFDIR;
        }
        isCharacterDevice() {
          return (this.#type & IFMT) === IFCHR;
        }
        isBlockDevice() {
          return (this.#type & IFMT) === IFBLK;
        }
        isFIFO() {
          return (this.#type & IFMT) === IFIFO;
        }
        isSocket() {
          return (this.#type & IFMT) === IFSOCK;
        }
        isSymbolicLink() {
          return (this.#type & IFLNK) === IFLNK;
        }
        lstatCached() {
          return this.#type & LSTAT_CALLED ? this : undefined;
        }
        readlinkCached() {
          return this.#linkTarget;
        }
        realpathCached() {
          return this.#realpath;
        }
        readdirCached() {
          const children = this.children();
          return children.slice(0, children.provisional);
        }
        canReadlink() {
          if (this.#linkTarget) return true;
          if (!this.parent) return false;
          const ifmt = this.#type & IFMT;
          return !(
            (ifmt !== UNKNOWN && ifmt !== IFLNK) ||
            this.#type & ENOREADLINK ||
            this.#type & ENOENT
          );
        }
        calledReaddir() {
          return !!(this.#type & READDIR_CALLED);
        }
        isENOENT() {
          return !!(this.#type & ENOENT);
        }
        isNamed(n) {
          return !this.nocase
            ? this.#matchName === normalize(n)
            : this.#matchName === normalizeNocase(n);
        }
        async readlink() {
          const target = this.#linkTarget;
          if (target) {
            return target;
          }
          if (!this.canReadlink()) {
            return undefined;
          }
          if (!this.parent) {
            return undefined;
          }
          try {
            const read = await this.#fs.promises.readlink(this.fullpath());
            const linkTarget = (await this.parent.realpath())?.resolve(read);
            if (linkTarget) {
              return (this.#linkTarget = linkTarget);
            }
          } catch (er) {
            this.#readlinkFail(er.code);
            return undefined;
          }
        }
        readlinkSync() {
          const target = this.#linkTarget;
          if (target) {
            return target;
          }
          if (!this.canReadlink()) {
            return undefined;
          }
          if (!this.parent) {
            return undefined;
          }
          try {
            const read = this.#fs.readlinkSync(this.fullpath());
            const linkTarget = this.parent.realpathSync()?.resolve(read);
            if (linkTarget) {
              return (this.#linkTarget = linkTarget);
            }
          } catch (er) {
            this.#readlinkFail(er.code);
            return undefined;
          }
        }
        #readdirSuccess(children) {
          this.#type |= READDIR_CALLED;
          for (let p = children.provisional; p < children.length; p++) {
            const c = children[p];
            if (c) c.#markENOENT();
          }
        }
        #markENOENT() {
          if (this.#type & ENOENT) return;
          this.#type = (this.#type | ENOENT) & IFMT_UNKNOWN;
          this.#markChildrenENOENT();
        }
        #markChildrenENOENT() {
          const children = this.children();
          children.provisional = 0;
          for (const p of children) {
            p.#markENOENT();
          }
        }
        #markENOREALPATH() {
          this.#type |= ENOREALPATH;
          this.#markENOTDIR();
        }
        #markENOTDIR() {
          if (this.#type & ENOTDIR) return;
          let t = this.#type;
          if ((t & IFMT) === IFDIR) t &= IFMT_UNKNOWN;
          this.#type = t | ENOTDIR;
          this.#markChildrenENOENT();
        }
        #readdirFail(code = "") {
          if (code === "ENOTDIR" || code === "EPERM") {
            this.#markENOTDIR();
          } else if (code === "ENOENT") {
            this.#markENOENT();
          } else {
            this.children().provisional = 0;
          }
        }
        #lstatFail(code = "") {
          if (code === "ENOTDIR") {
            const p = this.parent;
            p.#markENOTDIR();
          } else if (code === "ENOENT") {
            this.#markENOENT();
          }
        }
        #readlinkFail(code = "") {
          let ter = this.#type;
          ter |= ENOREADLINK;
          if (code === "ENOENT") ter |= ENOENT;
          if (code === "EINVAL" || code === "UNKNOWN") {
            ter &= IFMT_UNKNOWN;
          }
          this.#type = ter;
          if (code === "ENOTDIR" && this.parent) {
            this.parent.#markENOTDIR();
          }
        }
        #readdirAddChild(e, c) {
          return (
            this.#readdirMaybePromoteChild(e, c) ||
            this.#readdirAddNewChild(e, c)
          );
        }
        #readdirAddNewChild(e, c) {
          const type = entToType(e);
          const child = this.newChild(e.name, type, { parent: this });
          const ifmt = child.#type & IFMT;
          if (ifmt !== IFDIR && ifmt !== IFLNK && ifmt !== UNKNOWN) {
            child.#type |= ENOTDIR;
          }
          c.unshift(child);
          c.provisional++;
          return child;
        }
        #readdirMaybePromoteChild(e, c) {
          for (let p = c.provisional; p < c.length; p++) {
            const pchild = c[p];
            const name = this.nocase
              ? normalizeNocase(e.name)
              : normalize(e.name);
            if (name !== pchild.#matchName) {
              continue;
            }
            return this.#readdirPromoteChild(e, pchild, p, c);
          }
        }
        #readdirPromoteChild(e, p, index, c) {
          const v = p.name;
          p.#type = (p.#type & IFMT_UNKNOWN) | entToType(e);
          if (v !== e.name) p.name = e.name;
          if (index !== c.provisional) {
            if (index === c.length - 1) c.pop();
            else c.splice(index, 1);
            c.unshift(p);
          }
          c.provisional++;
          return p;
        }
        async lstat() {
          if ((this.#type & ENOENT) === 0) {
            try {
              this.#applyStat(await this.#fs.promises.lstat(this.fullpath()));
              return this;
            } catch (er) {
              this.#lstatFail(er.code);
            }
          }
        }
        lstatSync() {
          if ((this.#type & ENOENT) === 0) {
            try {
              this.#applyStat(this.#fs.lstatSync(this.fullpath()));
              return this;
            } catch (er) {
              this.#lstatFail(er.code);
            }
          }
        }
        #applyStat(st) {
          const {
            atime,
            atimeMs,
            birthtime,
            birthtimeMs,
            blksize,
            blocks,
            ctime,
            ctimeMs,
            dev,
            gid,
            ino,
            mode,
            mtime,
            mtimeMs,
            nlink,
            rdev,
            size,
            uid,
          } = st;
          this.#atime = atime;
          this.#atimeMs = atimeMs;
          this.#birthtime = birthtime;
          this.#birthtimeMs = birthtimeMs;
          this.#blksize = blksize;
          this.#blocks = blocks;
          this.#ctime = ctime;
          this.#ctimeMs = ctimeMs;
          this.#dev = dev;
          this.#gid = gid;
          this.#ino = ino;
          this.#mode = mode;
          this.#mtime = mtime;
          this.#mtimeMs = mtimeMs;
          this.#nlink = nlink;
          this.#rdev = rdev;
          this.#size = size;
          this.#uid = uid;
          const ifmt = entToType(st);
          this.#type = (this.#type & IFMT_UNKNOWN) | ifmt | LSTAT_CALLED;
          if (ifmt !== UNKNOWN && ifmt !== IFDIR && ifmt !== IFLNK) {
            this.#type |= ENOTDIR;
          }
        }
        #onReaddirCB = [];
        #readdirCBInFlight = false;
        #callOnReaddirCB(children) {
          this.#readdirCBInFlight = false;
          const cbs = this.#onReaddirCB.slice();
          this.#onReaddirCB.length = 0;
          cbs.forEach((cb) => cb(null, children));
        }
        readdirCB(cb, allowZalgo = false) {
          if (!this.canReaddir()) {
            if (allowZalgo) cb(null, []);
            else queueMicrotask(() => cb(null, []));
            return;
          }
          const children = this.children();
          if (this.calledReaddir()) {
            const c = children.slice(0, children.provisional);
            if (allowZalgo) cb(null, c);
            else queueMicrotask(() => cb(null, c));
            return;
          }
          this.#onReaddirCB.push(cb);
          if (this.#readdirCBInFlight) {
            return;
          }
          this.#readdirCBInFlight = true;
          const fullpath = this.fullpath();
          this.#fs.readdir(fullpath, { withFileTypes: true }, (er, entries) => {
            if (er) {
              this.#readdirFail(er.code);
              children.provisional = 0;
            } else {
              for (const e of entries) {
                this.#readdirAddChild(e, children);
              }
              this.#readdirSuccess(children);
            }
            this.#callOnReaddirCB(children.slice(0, children.provisional));
            return;
          });
        }
        #asyncReaddirInFlight;
        async readdir() {
          if (!this.canReaddir()) {
            return [];
          }
          const children = this.children();
          if (this.calledReaddir()) {
            return children.slice(0, children.provisional);
          }
          const fullpath = this.fullpath();
          if (this.#asyncReaddirInFlight) {
            await this.#asyncReaddirInFlight;
          } else {
            let resolve = () => {};
            this.#asyncReaddirInFlight = new Promise((res) => (resolve = res));
            try {
              for (const e of await this.#fs.promises.readdir(fullpath, {
                withFileTypes: true,
              })) {
                this.#readdirAddChild(e, children);
              }
              this.#readdirSuccess(children);
            } catch (er) {
              this.#readdirFail(er.code);
              children.provisional = 0;
            }
            this.#asyncReaddirInFlight = undefined;
            resolve();
          }
          return children.slice(0, children.provisional);
        }
        readdirSync() {
          if (!this.canReaddir()) {
            return [];
          }
          const children = this.children();
          if (this.calledReaddir()) {
            return children.slice(0, children.provisional);
          }
          const fullpath = this.fullpath();
          try {
            for (const e of this.#fs.readdirSync(fullpath, {
              withFileTypes: true,
            })) {
              this.#readdirAddChild(e, children);
            }
            this.#readdirSuccess(children);
          } catch (er) {
            this.#readdirFail(er.code);
            children.provisional = 0;
          }
          return children.slice(0, children.provisional);
        }
        canReaddir() {
          if (this.#type & ENOCHILD) return false;
          const ifmt = IFMT & this.#type;
          if (!(ifmt === UNKNOWN || ifmt === IFDIR || ifmt === IFLNK)) {
            return false;
          }
          return true;
        }
        shouldWalk(dirs, walkFilter) {
          return (
            (this.#type & IFDIR) === IFDIR &&
            !(this.#type & ENOCHILD) &&
            !dirs.has(this) &&
            (!walkFilter || walkFilter(this))
          );
        }
        async realpath() {
          if (this.#realpath) return this.#realpath;
          if ((ENOREALPATH | ENOREADLINK | ENOENT) & this.#type)
            return undefined;
          try {
            const rp = await this.#fs.promises.realpath(this.fullpath());
            return (this.#realpath = this.resolve(rp));
          } catch (_) {
            this.#markENOREALPATH();
          }
        }
        realpathSync() {
          if (this.#realpath) return this.#realpath;
          if ((ENOREALPATH | ENOREADLINK | ENOENT) & this.#type)
            return undefined;
          try {
            const rp = this.#fs.realpathSync(this.fullpath());
            return (this.#realpath = this.resolve(rp));
          } catch (_) {
            this.#markENOREALPATH();
          }
        }
        [setAsCwd](oldCwd) {
          if (oldCwd === this) return;
          oldCwd.isCWD = false;
          this.isCWD = true;
          const changed = new Set([]);
          let rp = [];
          let p = this;
          while (p && p.parent) {
            changed.add(p);
            p.#relative = rp.join(this.sep);
            p.#relativePosix = rp.join("/");
            p = p.parent;
            rp.push("..");
          }
          p = oldCwd;
          while (p && p.parent && !changed.has(p)) {
            p.#relative = undefined;
            p.#relativePosix = undefined;
            p = p.parent;
          }
        }
      }
      exports.PathBase = PathBase;
      class PathWin32 extends PathBase {
        sep = "\\";
        splitSep = eitherSep;
        constructor(name, type = UNKNOWN, root, roots, nocase, children, opts) {
          super(name, type, root, roots, nocase, children, opts);
        }
        newChild(name, type = UNKNOWN, opts = {}) {
          return new PathWin32(
            name,
            type,
            this.root,
            this.roots,
            this.nocase,
            this.childrenCache(),
            opts,
          );
        }
        getRootString(path) {
          return node_path_1.win32.parse(path).root;
        }
        getRoot(rootPath) {
          rootPath = uncToDrive(rootPath.toUpperCase());
          if (rootPath === this.root.name) {
            return this.root;
          }
          for (const [compare, root] of Object.entries(this.roots)) {
            if (this.sameRoot(rootPath, compare)) {
              return (this.roots[rootPath] = root);
            }
          }
          return (this.roots[rootPath] = new PathScurryWin32(
            rootPath,
            this,
          ).root);
        }
        sameRoot(rootPath, compare = this.root.name) {
          rootPath = rootPath
            .toUpperCase()
            .replace(/\//g, "\\")
            .replace(uncDriveRegexp, "$1\\");
          return rootPath === compare;
        }
      }
      exports.PathWin32 = PathWin32;
      class PathPosix extends PathBase {
        splitSep = "/";
        sep = "/";
        constructor(name, type = UNKNOWN, root, roots, nocase, children, opts) {
          super(name, type, root, roots, nocase, children, opts);
        }
        getRootString(path) {
          return path.startsWith("/") ? "/" : "";
        }
        getRoot(_rootPath) {
          return this.root;
        }
        newChild(name, type = UNKNOWN, opts = {}) {
          return new PathPosix(
            name,
            type,
            this.root,
            this.roots,
            this.nocase,
            this.childrenCache(),
            opts,
          );
        }
      }
      exports.PathPosix = PathPosix;
      class PathScurryBase {
        root;
        rootPath;
        roots;
        cwd;
        #resolveCache;
        #resolvePosixCache;
        #children;
        nocase;
        #fs;
        constructor(
          cwd = process.cwd(),
          pathImpl,
          sep,
          { nocase, childrenCacheSize = 16 * 1024, fs = defaultFS } = {},
        ) {
          this.#fs = fsFromOption(fs);
          if (cwd instanceof URL || cwd.startsWith("file://")) {
            cwd = (0, node_url_1.fileURLToPath)(cwd);
          }
          const cwdPath = pathImpl.resolve(cwd);
          this.roots = Object.create(null);
          this.rootPath = this.parseRootPath(cwdPath);
          this.#resolveCache = new ResolveCache();
          this.#resolvePosixCache = new ResolveCache();
          this.#children = new ChildrenCache(childrenCacheSize);
          const split = cwdPath.substring(this.rootPath.length).split(sep);
          if (split.length === 1 && !split[0]) {
            split.pop();
          }
          if (nocase === undefined) {
            throw new TypeError(
              "must provide nocase setting to PathScurryBase ctor",
            );
          }
          this.nocase = nocase;
          this.root = this.newRoot(this.#fs);
          this.roots[this.rootPath] = this.root;
          let prev = this.root;
          let len = split.length - 1;
          const joinSep = pathImpl.sep;
          let abs = this.rootPath;
          let sawFirst = false;
          for (const part of split) {
            const l = len--;
            prev = prev.child(part, {
              relative: new Array(l).fill("..").join(joinSep),
              relativePosix: new Array(l).fill("..").join("/"),
              fullpath: (abs += (sawFirst ? "" : joinSep) + part),
            });
            sawFirst = true;
          }
          this.cwd = prev;
        }
        depth(path = this.cwd) {
          if (typeof path === "string") {
            path = this.cwd.resolve(path);
          }
          return path.depth();
        }
        childrenCache() {
          return this.#children;
        }
        resolve(...paths) {
          let r = "";
          for (let i = paths.length - 1; i >= 0; i--) {
            const p = paths[i];
            if (!p || p === ".") continue;
            r = r ? `${p}/${r}` : p;
            if (this.isAbsolute(p)) {
              break;
            }
          }
          const cached = this.#resolveCache.get(r);
          if (cached !== undefined) {
            return cached;
          }
          const result = this.cwd.resolve(r).fullpath();
          this.#resolveCache.set(r, result);
          return result;
        }
        resolvePosix(...paths) {
          let r = "";
          for (let i = paths.length - 1; i >= 0; i--) {
            const p = paths[i];
            if (!p || p === ".") continue;
            r = r ? `${p}/${r}` : p;
            if (this.isAbsolute(p)) {
              break;
            }
          }
          const cached = this.#resolvePosixCache.get(r);
          if (cached !== undefined) {
            return cached;
          }
          const result = this.cwd.resolve(r).fullpathPosix();
          this.#resolvePosixCache.set(r, result);
          return result;
        }
        relative(entry = this.cwd) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          }
          return entry.relative();
        }
        relativePosix(entry = this.cwd) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          }
          return entry.relativePosix();
        }
        basename(entry = this.cwd) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          }
          return entry.name;
        }
        dirname(entry = this.cwd) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          }
          return (entry.parent || entry).fullpath();
        }
        async readdir(entry = this.cwd, opts = { withFileTypes: true }) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const { withFileTypes } = opts;
          if (!entry.canReaddir()) {
            return [];
          } else {
            const p = await entry.readdir();
            return withFileTypes ? p : p.map((e) => e.name);
          }
        }
        readdirSync(entry = this.cwd, opts = { withFileTypes: true }) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const { withFileTypes = true } = opts;
          if (!entry.canReaddir()) {
            return [];
          } else if (withFileTypes) {
            return entry.readdirSync();
          } else {
            return entry.readdirSync().map((e) => e.name);
          }
        }
        async lstat(entry = this.cwd) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          }
          return entry.lstat();
        }
        lstatSync(entry = this.cwd) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          }
          return entry.lstatSync();
        }
        async readlink(
          entry = this.cwd,
          { withFileTypes } = { withFileTypes: false },
        ) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            withFileTypes = entry.withFileTypes;
            entry = this.cwd;
          }
          const e = await entry.readlink();
          return withFileTypes ? e : e?.fullpath();
        }
        readlinkSync(
          entry = this.cwd,
          { withFileTypes } = { withFileTypes: false },
        ) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            withFileTypes = entry.withFileTypes;
            entry = this.cwd;
          }
          const e = entry.readlinkSync();
          return withFileTypes ? e : e?.fullpath();
        }
        async realpath(
          entry = this.cwd,
          { withFileTypes } = { withFileTypes: false },
        ) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            withFileTypes = entry.withFileTypes;
            entry = this.cwd;
          }
          const e = await entry.realpath();
          return withFileTypes ? e : e?.fullpath();
        }
        realpathSync(
          entry = this.cwd,
          { withFileTypes } = { withFileTypes: false },
        ) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            withFileTypes = entry.withFileTypes;
            entry = this.cwd;
          }
          const e = entry.realpathSync();
          return withFileTypes ? e : e?.fullpath();
        }
        async walk(entry = this.cwd, opts = {}) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const {
            withFileTypes = true,
            follow = false,
            filter,
            walkFilter,
          } = opts;
          const results = [];
          if (!filter || filter(entry)) {
            results.push(withFileTypes ? entry : entry.fullpath());
          }
          const dirs = new Set();
          const walk = (dir, cb) => {
            dirs.add(dir);
            dir.readdirCB((er, entries) => {
              if (er) {
                return cb(er);
              }
              let len = entries.length;
              if (!len) return cb();
              const next = () => {
                if (--len === 0) {
                  cb();
                }
              };
              for (const e of entries) {
                if (!filter || filter(e)) {
                  results.push(withFileTypes ? e : e.fullpath());
                }
                if (follow && e.isSymbolicLink()) {
                  e.realpath()
                    .then((r) => (r?.isUnknown() ? r.lstat() : r))
                    .then((r) =>
                      r?.shouldWalk(dirs, walkFilter) ? walk(r, next) : next(),
                    );
                } else {
                  if (e.shouldWalk(dirs, walkFilter)) {
                    walk(e, next);
                  } else {
                    next();
                  }
                }
              }
            }, true);
          };
          const start = entry;
          return new Promise((res, rej) => {
            walk(start, (er) => {
              if (er) return rej(er);
              res(results);
            });
          });
        }
        walkSync(entry = this.cwd, opts = {}) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const {
            withFileTypes = true,
            follow = false,
            filter,
            walkFilter,
          } = opts;
          const results = [];
          if (!filter || filter(entry)) {
            results.push(withFileTypes ? entry : entry.fullpath());
          }
          const dirs = new Set([entry]);
          for (const dir of dirs) {
            const entries = dir.readdirSync();
            for (const e of entries) {
              if (!filter || filter(e)) {
                results.push(withFileTypes ? e : e.fullpath());
              }
              let r = e;
              if (e.isSymbolicLink()) {
                if (!(follow && (r = e.realpathSync()))) continue;
                if (r.isUnknown()) r.lstatSync();
              }
              if (r.shouldWalk(dirs, walkFilter)) {
                dirs.add(r);
              }
            }
          }
          return results;
        }
        [Symbol.asyncIterator]() {
          return this.iterate();
        }
        iterate(entry = this.cwd, options = {}) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            options = entry;
            entry = this.cwd;
          }
          return this.stream(entry, options)[Symbol.asyncIterator]();
        }
        [Symbol.iterator]() {
          return this.iterateSync();
        }
        *iterateSync(entry = this.cwd, opts = {}) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const {
            withFileTypes = true,
            follow = false,
            filter,
            walkFilter,
          } = opts;
          if (!filter || filter(entry)) {
            yield withFileTypes ? entry : entry.fullpath();
          }
          const dirs = new Set([entry]);
          for (const dir of dirs) {
            const entries = dir.readdirSync();
            for (const e of entries) {
              if (!filter || filter(e)) {
                yield withFileTypes ? e : e.fullpath();
              }
              let r = e;
              if (e.isSymbolicLink()) {
                if (!(follow && (r = e.realpathSync()))) continue;
                if (r.isUnknown()) r.lstatSync();
              }
              if (r.shouldWalk(dirs, walkFilter)) {
                dirs.add(r);
              }
            }
          }
        }
        stream(entry = this.cwd, opts = {}) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const {
            withFileTypes = true,
            follow = false,
            filter,
            walkFilter,
          } = opts;
          const results = new minipass_1.Minipass({ objectMode: true });
          if (!filter || filter(entry)) {
            results.write(withFileTypes ? entry : entry.fullpath());
          }
          const dirs = new Set();
          const queue = [entry];
          let processing = 0;
          const process = () => {
            let paused = false;
            while (!paused) {
              const dir = queue.shift();
              if (!dir) {
                if (processing === 0) results.end();
                return;
              }
              processing++;
              dirs.add(dir);
              const onReaddir = (er, entries, didRealpaths = false) => {
                if (er) return results.emit("error", er);
                if (follow && !didRealpaths) {
                  const promises = [];
                  for (const e of entries) {
                    if (e.isSymbolicLink()) {
                      promises.push(
                        e
                          .realpath()
                          .then((r) => (r?.isUnknown() ? r.lstat() : r)),
                      );
                    }
                  }
                  if (promises.length) {
                    Promise.all(promises).then(() =>
                      onReaddir(null, entries, true),
                    );
                    return;
                  }
                }
                for (const e of entries) {
                  if (e && (!filter || filter(e))) {
                    if (!results.write(withFileTypes ? e : e.fullpath())) {
                      paused = true;
                    }
                  }
                }
                processing--;
                for (const e of entries) {
                  const r = e.realpathCached() || e;
                  if (r.shouldWalk(dirs, walkFilter)) {
                    queue.push(r);
                  }
                }
                if (paused && !results.flowing) {
                  results.once("drain", process);
                } else if (!sync) {
                  process();
                }
              };
              let sync = true;
              dir.readdirCB(onReaddir, true);
              sync = false;
            }
          };
          process();
          return results;
        }
        streamSync(entry = this.cwd, opts = {}) {
          if (typeof entry === "string") {
            entry = this.cwd.resolve(entry);
          } else if (!(entry instanceof PathBase)) {
            opts = entry;
            entry = this.cwd;
          }
          const {
            withFileTypes = true,
            follow = false,
            filter,
            walkFilter,
          } = opts;
          const results = new minipass_1.Minipass({ objectMode: true });
          const dirs = new Set();
          if (!filter || filter(entry)) {
            results.write(withFileTypes ? entry : entry.fullpath());
          }
          const queue = [entry];
          let processing = 0;
          const process = () => {
            let paused = false;
            while (!paused) {
              const dir = queue.shift();
              if (!dir) {
                if (processing === 0) results.end();
                return;
              }
              processing++;
              dirs.add(dir);
              const entries = dir.readdirSync();
              for (const e of entries) {
                if (!filter || filter(e)) {
                  if (!results.write(withFileTypes ? e : e.fullpath())) {
                    paused = true;
                  }
                }
              }
              processing--;
              for (const e of entries) {
                let r = e;
                if (e.isSymbolicLink()) {
                  if (!(follow && (r = e.realpathSync()))) continue;
                  if (r.isUnknown()) r.lstatSync();
                }
                if (r.shouldWalk(dirs, walkFilter)) {
                  queue.push(r);
                }
              }
            }
            if (paused && !results.flowing) results.once("drain", process);
          };
          process();
          return results;
        }
        chdir(path = this.cwd) {
          const oldCwd = this.cwd;
          this.cwd = typeof path === "string" ? this.cwd.resolve(path) : path;
          this.cwd[setAsCwd](oldCwd);
        }
      }
      exports.PathScurryBase = PathScurryBase;
      class PathScurryWin32 extends PathScurryBase {
        sep = "\\";
        constructor(cwd = process.cwd(), opts = {}) {
          const { nocase = true } = opts;
          super(cwd, node_path_1.win32, "\\", { ...opts, nocase });
          this.nocase = nocase;
          for (let p = this.cwd; p; p = p.parent) {
            p.nocase = this.nocase;
          }
        }
        parseRootPath(dir) {
          return node_path_1.win32.parse(dir).root.toUpperCase();
        }
        newRoot(fs) {
          return new PathWin32(
            this.rootPath,
            IFDIR,
            undefined,
            this.roots,
            this.nocase,
            this.childrenCache(),
            { fs },
          );
        }
        isAbsolute(p) {
          return (
            p.startsWith("/") || p.startsWith("\\") || /^[a-z]:(\/|\\)/i.test(p)
          );
        }
      }
      exports.PathScurryWin32 = PathScurryWin32;
      class PathScurryPosix extends PathScurryBase {
        sep = "/";
        constructor(cwd = process.cwd(), opts = {}) {
          const { nocase = false } = opts;
          super(cwd, node_path_1.posix, "/", { ...opts, nocase });
          this.nocase = nocase;
        }
        parseRootPath(_dir) {
          return "/";
        }
        newRoot(fs) {
          return new PathPosix(
            this.rootPath,
            IFDIR,
            undefined,
            this.roots,
            this.nocase,
            this.childrenCache(),
            { fs },
          );
        }
        isAbsolute(p) {
          return p.startsWith("/");
        }
      }
      exports.PathScurryPosix = PathScurryPosix;
      class PathScurryDarwin extends PathScurryPosix {
        constructor(cwd = process.cwd(), opts = {}) {
          const { nocase = true } = opts;
          super(cwd, { ...opts, nocase });
        }
      }
      exports.PathScurryDarwin = PathScurryDarwin;
      exports.Path = process.platform === "win32" ? PathWin32 : PathPosix;
      exports.PathScurry =
        process.platform === "win32"
          ? PathScurryWin32
          : process.platform === "darwin"
            ? PathScurryDarwin
            : PathScurryPosix;
    },
  };
  var __webpack_module_cache__ = {};
  function __nccwpck_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) {
      return cachedModule.exports;
    }
    var module = (__webpack_module_cache__[moduleId] = { exports: {} });
    var threw = true;
    try {
      __webpack_modules__[moduleId].call(
        module.exports,
        module,
        module.exports,
        __nccwpck_require__,
      );
      threw = false;
    } finally {
      if (threw) delete __webpack_module_cache__[moduleId];
    }
    return module.exports;
  }
  __nccwpck_require__.m = __webpack_modules__;
  (() => {
    __nccwpck_require__.d = (exports, definition) => {
      for (var key in definition) {
        if (
          __nccwpck_require__.o(definition, key) &&
          !__nccwpck_require__.o(exports, key)
        ) {
          Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          });
        }
      }
    };
  })();
  (() => {
    __nccwpck_require__.f = {};
    __nccwpck_require__.e = (chunkId) =>
      Promise.all(
        Object.keys(__nccwpck_require__.f).reduce((promises, key) => {
          __nccwpck_require__.f[key](chunkId, promises);
          return promises;
        }, []),
      );
  })();
  (() => {
    __nccwpck_require__.u = (chunkId) => "" + chunkId + ".index.js";
  })();
  (() => {
    __nccwpck_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
  })();
  (() => {
    __nccwpck_require__.r = (exports) => {
      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
      }
      Object.defineProperty(exports, "__esModule", { value: true });
    };
  })();
  if (typeof __nccwpck_require__ !== "undefined")
    __nccwpck_require__.ab = __dirname + "/";
  (() => {
    var installedChunks = { 179: 1 };
    var installChunk = (chunk) => {
      var moreModules = chunk.modules,
        chunkIds = chunk.ids,
        runtime = chunk.runtime;
      for (var moduleId in moreModules) {
        if (__nccwpck_require__.o(moreModules, moduleId)) {
          __nccwpck_require__.m[moduleId] = moreModules[moduleId];
        }
      }
      if (runtime) runtime(__nccwpck_require__);
      for (var i = 0; i < chunkIds.length; i++)
        installedChunks[chunkIds[i]] = 1;
    };
    __nccwpck_require__.f.require = (chunkId, promises) => {
      if (!installedChunks[chunkId]) {
        if (true) {
          installChunk(require("./" + __nccwpck_require__.u(chunkId)));
        } else installedChunks[chunkId] = 1;
      }
    };
  })();
  var __webpack_exports__ = __nccwpck_require__(5490);
  module.exports = __webpack_exports__;
})();
