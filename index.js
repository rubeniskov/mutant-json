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
 * @callback MutantPatcher
 * @param {any} value
 * @param {('add'|'remove'|'replace'|'batch')}
 */

/**
 * @callback MutantProcess
 * @param {MutationPatcher} mutate
 * @param {any} value
 * @param {string} path
 */

/**
 * @typedef {Array} MutantJsonEntry
 * @prop {string} 0 Object path
 * @prop {any} 1 Value
 */

/**
 * @typedef {Object} MutantOptions
 * @param {Array<MutationJsonEntry>|Iterable|Iterator} iterator
 * @param {*} process
 * @param {*} opts
 */

/**
 * Iterates through the given iterator and applies mutation
 * whereas the process callback is called. Also works with promises.
 * The iteratee must return an entry of [path, value].
 *
 * @param {any} target
 * @param {MutantProcess} process
 * @param {Promise<any>|any} end
 */
const mutantJson = (target, process, opts) => {
  const {
    promises = true,
    iterator = traverseIterator(target, opts),
    applyPatch = jsonpatcher.apply_patch,
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
        return traverse(applyPatch(result, [{
          op: 'replace',
          path: entryPath,
          value,
        }]), value);
      });
    }

    process((patch) => mutate(patch, entryPath), entryValue, entryPath);

    return traverse(result);
  };

  const applyMutations = (result) => {
    return applyPatch(result, mutations);
  };

  const result = traverse(target);

  if (isPromise(result)) {
    return result.then(applyMutations);
  }

  return applyMutations(result);
};

module.exports = mutantJson;
