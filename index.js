const jsonpatcher = require('jsonpatch');
const traverseIterator = require('traverse-json');
const isPromise = require('is-promise');
const JSONPATCH_SEP = '/';
const JSONPATCH_OPS = ['replace', 'remove', 'add', 'copy', 'move', 'test'];

const parseIterator = (iterator) => {
  if (Array.isArray(iterator)) {
    iterator = iterator[Symbol.iterator]();
  }

  return iterator.next ? (extra) => iterator.next(extra) : iterator;
};

/**
 * Patch definition acording to the [jsonpatch standard](http://jsonpatch.com/)
 * @callback MutanPatch
 * @param {("add"|"remove"|"replace"|"move"|"copy"|"test")} op Patch operation
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
 * @param {Boolean} [promises=true] Processing promises taking the resolved as part of the result
 * @param {Array<MutationJsonEntry>|Iterable|Iterator} [iterator] Iterator default [traverse-json](https://github.com/rubeniskov/traverse-json)
 * @param {Function} [patcher] Patcher function
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
  const {
    promises = true,
    iterator = traverseIterator(target, opts),
    patcher = jsonpatcher.apply_patch,
  } = { ...opts };

  const mutations = [];
  const iteratee = parseIterator(iterator);

  if (typeof process !== 'function') {
    throw new Error('mutant-json: Process param must be defined and be a function');
  }

  const next = (extra) => {
    const { value: entry = [], done } = iteratee(extra);
    if (done) return { done };

    if (!Array.isArray(entry) || entry.length < 2) {
      throw new Error('mutant-json: Unexpected entry format, iterator must return an object entry [path: string, value: any]');
    }

    return { entry, done };
  };

  const mutate = (patches, entryPath) => {
    if (!Array.isArray(patches)) {
      patches = [patches];
    }
    for (let { op = JSONPATCH_OPS[0], path = entryPath, from, ...restPatch } of patches) {
      if (!JSONPATCH_OPS.includes(op)) {
        throw new Error(`mutant-json: Unexpected patch operation "${op}"`);
      }
      if ((path && path[0] !== JSONPATCH_SEP) || (from && from[0] !== JSONPATCH_SEP)) {
        throw new Error(`mutant-json: JSONPointer must starts with a slash "${JSONPATCH_SEP}" (or be an empty string)!`);
      }
      mutations.push({
        ...restPatch,
        op, from, path,
      });
    }
  };

  const traverse = (result, resolved) => {
    const { entry, done } = next(resolved);

    if (done) return result;

    const [ entryPath, entryValue ] = entry;

    if (promises && isPromise(entryValue)) {
      return entryValue.then((value) => {
        return traverse(patcher(result, [{
          op: 'replace',
          path: entryPath,
          value,
        }]), value);
      });
    }

    process((patch) => mutate(patch, entryPath), entryValue, entryPath, result);

    return traverse(result);
  };

  const applyMutations = (result) => {
    return patcher(result, mutations);
  };

  const result = traverse(target);

  if (isPromise(result)) {
    return result.then(applyMutations);
  }

  return applyMutations(result);
};

module.exports = mutantJson;
