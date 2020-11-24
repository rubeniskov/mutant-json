# mutant-json

[![Build Status](https://travis-ci.org/rubeniskov/mutant-json.svg?branch=master)](https://travis-ci.org/rubeniskov/mutant-json)
![npm-publish](https://github.com/rubeniskov/mutant-json/workflows/npm-publish/badge.svg)
[![Downloads](https://img.shields.io/npm/dw/mutant-json)](https://www.npmjs.com/package/mutant-json)

A complete mutant json function with `iterable` interface.

## Motivation

Many time I've encontered with the difficult task of mutate a object with nested properties by filtering properties using a single function, so a `mutant-json` solves this using multiple options for traversing.


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
<dt><a href="#mutantJson">mutantJson(target, process, end)</a></dt>
<dd><p>Iterates through the given iterator and applies mutation
whereas the process callback is called. Also works with promises.
The iteratee must return an entry of [path, value].</p>
</dd>
</dl>

## Typedefs

<dl>
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

## mutantJson(target, process, end)
Iterates through the given iterator and applies mutation
whereas the process callback is called. Also works with promises.
The iteratee must return an entry of [path, value].

**Kind**: global function  

| Param | Type |
| --- | --- |
| target | <code>any</code> | 
| process | [<code>MutantProcess</code>](#MutantProcess) | 
| end | <code>Promise.&lt;any&gt;</code> \| <code>any</code> | 

<a name="MutantPatcher"></a>

## MutantPatcher : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| value | <code>any</code> | 
|  | <code>&#x27;add&#x27;</code> \| <code>&#x27;remove&#x27;</code> \| <code>&#x27;replace&#x27;</code> \| <code>&#x27;batch&#x27;</code> | 

<a name="MutantProcess"></a>

## MutantProcess : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| mutate | <code>MutationPatcher</code> | 
| value | <code>any</code> | 
| path | <code>string</code> | 

<a name="MutantJsonEntry"></a>

## MutantJsonEntry : <code>Array</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| 0 | <code>string</code> | Object path |
| 1 | <code>any</code> | Value |

<a name="MutantOptions"></a>

## MutantOptions : <code>Object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| iterator | <code>Array.&lt;MutationJsonEntry&gt;</code> \| <code>Iterable</code> \| <code>Iterator</code> | 
| process | <code>\*</code> | 
| opts | <code>\*</code> | 

