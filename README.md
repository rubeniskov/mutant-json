# mutant-json

[![unit-testing](https://github.com/rubeniskov/mutant-json/workflows/unit-testing/badge.svg)](https://github.com/rubeniskov/mutant-json/actions?query=workflow%3Aunit-testing)
[![npm-publish](https://github.com/rubeniskov/mutant-json/workflows/npm-publish/badge.svg)](https://github.com/rubeniskov/mutant-json/actions?query=workflow%3Anpm-publish)
[![npm-downloads](https://img.shields.io/npm/dw/mutant-json)](https://www.npmjs.com/package/mutant-json)
[![codecov](https://codecov.io/gh/rubeniskov/mutant-json/branch/master/graph/badge.svg)](https://codecov.io/gh/rubeniskov/mutant-json)
[![patreon-donate](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://patreon.com/rubeniskov)
[![github-sponsor](https://img.shields.io/badge/github-donate-yellow.svg)](https://github.com/sponsors/rubeniskov)
[![paypal-sponsor](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://paypal.me/rubeniskov)

A complete mutant json which uses [traverse-json](https://github.com/rubeniskov/traverse-json) to enable traverse filtering.

## Motivation

Many time I've encontered with the difficult task of mutate a object with nested properties by filtering properties using a single function, so a `mutant-json` solves this using `traverse-json` with multiple options for traversing.


## Installation

### Npm:
```shell
npm install mutant-json --save
```
### Yarn:
```shell
yarn add mutant-json
```
## Functions

<dl>
<dt><a href="#mutantJson">mutantJson(target, process, opts)</a></dt>
<dd><p>Iterates through the given iterator and applies mutation
whereas the iterator entry returns. Also works with promises.
The iteratee must return an entry of [path, value].</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#MutanPatch">MutanPatch</a> : <code>function</code></dt>
<dd><p>Patch definition acording to the <a href="http://jsonpatch.com/">jsonpatch standard</a></p>
</dd>
<dt><a href="#MutantPatcher">MutantPatcher</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#MutantProcess">MutantProcess</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#MutantJsonEntry">MutantJsonEntry</a> : <code>Array</code></dt>
<dd></dd>
<dt><a href="#MutantOptions">MutantOptions</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="mutantJson"></a>

## mutantJson(target, process, opts)
Iterates through the given iterator and applies mutation
whereas the iterator entry returns. Also works with promises.
The iteratee must return an entry of [path, value].

**Kind**: global function  

| Param | Type |
| --- | --- |
| target | <code>any</code> | 
| process | [<code>MutantProcess</code>](#MutantProcess) | 
| opts | [<code>MutantOptions</code>](#MutantOptions) | 

**Example**  
### Working with promises

```javascript
const mutateJson = require('mutant-json');

const recursiveObjectPromises = {
  foo: 0,
  nested: Promise.resolve({
    depth: 1,
    nested: Promise.resolve({
      depth: 2,
      nested: Promise.resolve({
        depth: 3,
        nested: Promise.resolve({
          depth: 4,
        }),
      }),
    }),
  }),
  bar: 1,
};

const actual = await mutateJson(recursiveObjectPromises, (mutate, value) => {
  mutate({
    value: value * 2,
  });
});

console.log(actual);
```

### Output
```
{
  foo: 0,
  nested: {
    depth: 2,
    nested: {
      depth: 4,
      nested: {
        depth: 6,
        nested: {
          depth: 8,
        },
      },
    },
  },
  bar: 2,
}
```
<a name="MutanPatch"></a>

## MutanPatch : <code>function</code>
Patch definition acording to the [jsonpatch standard](http://jsonpatch.com/)

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| op | <code>&quot;remove&quot;</code> \| <code>&quot;replace&quot;</code> | Patch operation |
| value | <code>any</code> |  |
| [path] | <code>String</code> | [JSONPointer](https://tools.ietf.org/html/rfc6901) |
| [from] | <code>String</code> | [JSONPointer](https://tools.ietf.org/html/rfc6901) |

<a name="MutantPatcher"></a>

## MutantPatcher : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| patches | [<code>MutanPatch</code>](#MutanPatch) \| [<code>Array.&lt;MutanPatch&gt;</code>](#MutanPatch) | 

<a name="MutantProcess"></a>

## MutantProcess : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| mutate | <code>MutationPatcher</code> | 
| value | <code>any</code> | 
| path | <code>string</code> | 
| result | <code>any</code> | 

<a name="MutantJsonEntry"></a>

## MutantJsonEntry : <code>Array</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| 0 | <code>string</code> | [JSONPointer](https://tools.ietf.org/html/rfc6901) |
| 1 | <code>any</code> | Value |

<a name="MutantOptions"></a>

## MutantOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [recursive] | <code>Boolean</code> | <code>true</code> | enable/disable nested arrays and objects recursion |
| [nested] | <code>Boolean</code> | <code>false</code> | also emit nested array or objects |
| [step] | <code>Boolean</code> | <code>1</code> | the step to increment, default 1 |
| [opts.test] | <code>String</code> \| <code>function</code> \| <code>RegeExp</code> | <code>false</code> | regexp, string [minimatch](https://www.npmjs.com/package/minimatch) or function to filter properties |
| [once] | <code>Boolean</code> | <code>false</code> | Stops when applies the first mutation |
| [promises] | <code>Boolean</code> | <code>true</code> | Processing promises taking the resolved as part of the result |
| [iterator] | <code>Array.&lt;MutationJsonEntry&gt;</code> \| <code>Iterable</code> \| <code>Iterator</code> |  | Iterator default [traverse-json](https://github.com/rubeniskov/traverse-json) |
| [patcher] | <code>function</code> |  | Patcher function |

