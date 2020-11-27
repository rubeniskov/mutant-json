const jsonpatcher = require('jsonpatch');
const traverseIterator = require('traverse-json');
const isPromise = require('is-promise');
const {
  JSONPATCH_SEP,
  JSONPATCH_OPS,
} = require('./constants');
const tap = require('./tap');

const parseIterator = (iterator) => {
  if (Array.isArray(iterator)) {
    iterator = iterator[Symbol.iterator]();
  }

  return iterator.next ? (extra) => iterator.next(extra) : iterator;
};

/**
 * Patch definition acording to the [jsonpatch standard](http://jsonpatch.com/)
 * @callback MutanPatch
 * @param {("remove"|"replace")} op Patch operation
 * @param {any} value
 * @param {String} [path] [JSONPointer](https://tools.ietf.org/html/rfc6901)
 * @param {String} [from] [JSONPointer](https://tools.ietf.org/html/rfc6901)
 */

/**
 * @callback MutantPatcher
 * @param {MutanPatch|MutanPatch[]} patches
 */

/**
 * @callback MutantProcess
 * @param {MutationPatcher} mutate
 * @param {any} value
 * @param {string} path
 * @param {any} result
 */

/**
 * @typedef {Array} MutantJsonEntry
 * @prop {string} 0 [JSONPointer](https://tools.ietf.org/html/rfc6901)
 * @prop {any} 1 Value
 */

/**
 * @typedef {Object} MutantOptions
 * @prop {Boolean} [recursive=true] enable/disable nested arrays and objects recursion
 * @prop {Boolean} [nested=false] also emit nested array or objects
 * @prop {Boolean} [step=1] the step to increment, default 1
 * @prop {String|Function|RegeExp} [opts.test=false] regexp, string [minimatch](https://www.npmjs.com/package/minimatch) or function to filter properties
 * @prop {Boolean} [once=false] Stops when applies the first mutation
 * @prop {Boolean} [promises=true] Processing promises taking the resolved as part of the result
 * @prop {Array<MutationJsonEntry>|Iterable|Iterator} [iterator] Iterator default [traverse-json](https://github.com/rubeniskov/traverse-json)
 * @prop {Function} [patcher] Patcher function
 */

/**
 * Iterates through the given iterator and applies mutation
 * whereas the iterator entry returns. Also works with promises.
 * The iteratee must return an entry of [path, value].
 *
 * @param {any} target
 * @param {MutantProcess} process
 * @param {MutantOptions} opts
 * @example
 *
 * ### Working with promises
 *
 * ```javascript
 * const mutateJson = require('mutant-json');
 *
 * const recursiveObjectPromises = {
 *   foo: 0,
 *   nested: Promise.resolve({
 *     depth: 1,
 *     nested: Promise.resolve({
 *       depth: 2,
 *       nested: Promise.resolve({
 *         depth: 3,
 *         nested: Promise.resolve({
 *           depth: 4,
 *         }),
 *       }),
 *     }),
 *   }),
 *   bar: 1,
 * };
 *
 * const actual = await mutateJson(recursiveObjectPromises, (mutate, value) => {
 *   mutate({
 *     value: value * 2,
 *   });
 * });
 *
 * console.log(actual);
 * ```
 *
 * ### Output
 * ```
 * {
 *   foo: 0,
 *   nested: {
 *     depth: 2,
 *     nested: {
 *       depth: 4,
 *       nested: {
 *         depth: 6,
 *         nested: {
 *           depth: 8,
 *         },
 *       },
 *     },
 *   },
 *   bar: 2,
 * }
 * ```
 */
const mutantJson = (target, process, opts) => {

  if (isPromise(target)) {
    return target.then((res) => mutantJson(res, process, opts));
  }

  const {
    once = false,
    promises = true,
    iterator = traverseIterator(target, opts),
    patcher = (target, patch) => jsonpatcher.apply_patch(target, [patch]),
  } = { ...opts };

  const iteratee = parseIterator(iterator);

  if (typeof process !== 'function') {
    throw new Error('mutant-json: Process param must be defined and be a function');
  }

  const next = (extra) => {
    const { value: entry = [], done } = extra ? iteratee(extra[0], extra[1]) : iteratee();
    if (done) return { done };

    if (!Array.isArray(entry) || entry.length < 2) {
      throw new Error('mutant-json: Unexpected entry format, iterator must return a entry object [path: string, value: any]');
    }

    return { entry, done };
  };

  const applyPatches = (patch, path, result) => {

    if (isPromise(patch)) {
      return patch.then((res) => applyPatches(res, path, result));
    }

    const parsedPatch = {  op: JSONPATCH_OPS[0], ...patch, path };

    if (!JSONPATCH_OPS.includes(parsedPatch.op)) {
      throw new Error(`mutant-json: Unexpected patch operation "${parsedPatch.op}"`);
    }

    if ((path && path[0] !== JSONPATCH_SEP)) {
      throw new Error(`mutant-json: JSONPointer must starts with a slash "${JSONPATCH_SEP}" (or be an empty string)!`);
    }

    const patched = patcher(result, parsedPatch);

    return {
      result: patched,
      extra: parsedPatch.op !== 'remove' && typeof parsedPatch.value === 'object'
        ? [parsedPatch.path, tap(patched, parsedPatch.path)]
        : undefined,
    };
  };

  const processMutation = (value, path, target) => {
    let ret;

    process((patch) => {
      ret = applyPatches(patch, path, target);
    }, value, path, target);

    return ret;
  };

  const traverse = (result, extra, mutated) => {

    if (mutated && once) return result;

    const { entry, done } = next(extra);

    if (done) return result;

    const [ entryPath, entryValue ] = entry;

    if (promises && isPromise(entryValue)) {
      return entryValue.then((value) => {
        return traverse(patcher(result, {
          op: 'replace',
          path: entryPath,
          value,
        }), [entryPath, value]);
      });
    }

    const processResult = processMutation(entryValue, entryPath, result);

    if (isPromise(processResult)) {
      return processResult.then(({ result, ...rest }) => traverse(result, rest, true));
    }

    if (processResult) {
      const { result, ...rest } = processResult;
      return traverse(result, rest, true);
    }

    return traverse(result);
  };

  return traverse(target);
};

module.exports = mutantJson;
