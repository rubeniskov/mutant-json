const {
  JSONPATCH_SEP,
} = require('./constants');

const tap = (obj, path, defaultValue) => path.substring(1).split(JSONPATCH_SEP).reduce((prev, chunk) => typeof prev === 'object' && prev[chunk] !== undefined ? prev[chunk] : defaultValue, obj);

module.exports = tap;
