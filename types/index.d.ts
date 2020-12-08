export = mutantJson;
/**
 * Patch definition acording to the [jsonpatch standard](http://jsonpatch.com/)
 * @callback MutanPatch
 * @param {("remove"|"replace")} op Patch operation
 * @param {any} value
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
 * @prop {String|Function|RegeExp} [test=false] regexp, string [minimatch](https://www.npmjs.com/package/minimatch) or function to filter properties
 * @prop {Boolean} [once=false] Stops when applies the first mutation
 * @prop {Boolean} [promises=true] Processing promises taking the resolved as part of the result
 * @prop {Boolean} [promise=false] Forces to return a promise even if no promises detected
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
declare function mutantJson(target: any, process: MutantProcess, opts: MutantOptions): any;
declare namespace mutantJson {
    export { MutanPatch, MutantPatcher, MutantProcess, MutantJsonEntry, MutantOptions };
}
type MutantProcess = (mutate: any, value: any, path: string, result: any) => any;
type MutantOptions = {
    /**
     * enable/disable nested arrays and objects recursion
     */
    recursive?: boolean;
    /**
     * also emit nested array or objects
     */
    nested?: boolean;
    /**
     * the step to increment, default 1
     */
    step?: boolean;
    /**
     * regexp, string [minimatch](https://www.npmjs.com/package/minimatch) or function to filter properties
     */
    test?: string | Function | any;
    /**
     * Stops when applies the first mutation
     */
    once?: boolean;
    /**
     * Processing promises taking the resolved as part of the result
     */
    promises?: boolean;
    /**
     * Forces to return a promise even if no promises detected
     */
    promise?: boolean;
    /**
     * Iterator default [traverse-json](https://github.com/rubeniskov/traverse-json)
     */
    iterator?: Array<any> | any | any;
    /**
     * Patcher function
     */
    patcher?: Function;
};
/**
 * Patch definition acording to the [jsonpatch standard](http://jsonpatch.com/)
 */
type MutanPatch = (op: ("remove" | "replace"), value: any) => any;
type MutantPatcher = (patches: MutanPatch | MutanPatch[]) => any;
type MutantJsonEntry = any[];
