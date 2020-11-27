const test = require('ava');
const traverseJson = require('traverse-json');
const mutateJson = require('.');
const tap = require('./tap');

const oneDepthObject = {
  a: 0,
  b: 1,
  c: 2,
};

const nestedObject = {
  a: 0,
  b: 1,
  c: {
    foo: {
      bar: [1, 2, 3, {
        value: {
          foo: 'bar',
        },
      }],
    },
  },
  d: 3,
};

const recursiveObject = {
  foo: 0,
  nested: {
    depth: 1,
    nested: {
      depth: 2,
      nested: {
        depth: 3,
        nested: {
          depth: 4,
        },
      },
    },
  },
  bar: 1,
};

test('should tap return the desired value from path', (t) => {
  t.is(tap(recursiveObject, '/nested/nested/depth'), 2);
  t.is(tap(recursiveObject, '/nested/nested/depth/depth'), undefined);
  t.is(tap(recursiveObject, '/nested/nested/depth/depth', null), null);
  t.is(tap(recursiveObject, '/nested/nested/depth/depth', 3), 3);
  t.is(tap(recursiveObject, '/nested/nested/depth/depth', 0), 0);
  t.is(tap(recursiveObject, '/foo'), 0);
  t.is(tap(recursiveObject, '/foo', 1), 0);
});

test('should raise error when the process param is not defined', (t) => {
  t.throws(() => mutateJson({}, []), {
    message: /Process param must be defined and be a function/,
  });
});

test('should raise error when the entry has not the right format', (t) => {
  t.throws(() => mutateJson({}, () => {}, {
    iterator: [undefined],
  }), {
    message: /Unexpected entry format, iterator must return a entry object/,
  });
});

test('should raise error when the path is not well formated', (t) => {
  t.throws(() => mutateJson({}, (mutate) => mutate({ op: 'remove' }), {
    iterator: [['a', 0]],
  }), {
    message: /JSONPointer must starts with a slash "\/"/,
  });
});

test('should raise error when no operation available', (t) => {
  t.throws(() => mutateJson({}, (mutate) => mutate({
    op: 'no_valid_op',
  }), {
    iterator: [['a', 0]],
  }), {
    message: /Unexpected patch operation "no_valid_op"/,
  });
});

test('should mutate all entries of the iterator', (t) => {
  const expected = {
    a: 1,
    b: 2,
    c: 3,
   };

  const entries = Object.entries(oneDepthObject).map(([k, v]) => [`/${k}`, v]);

  t.plan(4);
  let idx = 0;
  const actual = mutateJson(oneDepthObject, (mutate, value, path) => {
    t.deepEqual([path, value], entries[idx++]);
    mutate({ value: value + 1 });
  }, {
    iterator: entries,
  });

  t.deepEqual(actual, expected);
});

test('should mutate only the first entry of the iterator', (t) => {
  const expected = {
    a: 1,
    b: 1,
    c: 2,
   };

  const entries = Object.entries(oneDepthObject).map(([k, v]) => [`/${k}`, v]);

  t.plan(2);
  let idx = 0;
  const actual = mutateJson(oneDepthObject, (mutate, value, path) => {
    t.deepEqual([path, value], entries[idx++]);
    mutate({ value: value + 1 });
  }, {
    iterator: entries, once: true,
  });

  t.deepEqual(actual, expected);
});

test('should throws error when copy operation detected', (t) => {

  const entries = Object.entries(oneDepthObject).map(([k, v]) => [`/${k}`, v]);

  t.throws(()=> {
    mutateJson(oneDepthObject, (mutate) => {
      mutate({ op: 'copy', from: '/c' });
    }, {
      iterator: entries, once: true,
    });
  }, {
    message: 'mutant-json: Unexpected patch operation "copy"',
  });
});

test('should replace all the values entries by an string using replace', (t) => {
  const expected = {
    a: 'replaced',
    b: 'replaced',
    c: 'replaced',
   };

  const entries = Object.entries(oneDepthObject).map(([k, v]) => [`/${k}`, v]);

  t.plan(4);
  let idx = 0;
  const actual = mutateJson(oneDepthObject, (mutate, value, path) => {
    t.deepEqual([path, value], entries[idx++]);
    mutate({
      op: 'replace',
      value: 'replaced',
    });
  }, {
    iterator: entries,
  });

  t.deepEqual(actual, expected);
});

test('should remove entries with value 1', (t) => {
  const expected = {
    a: 0,
    c: 2,
   };

  const actual = mutateJson(oneDepthObject, (mutate, value) => {
    if (value === 1) {
      mutate({ op: 'remove' });
    }
  });

  t.deepEqual(actual, expected);
});

test('should raise an error when the object has not the iterated path', (t) => {
  const ientries = traverseJson(nestedObject);

  t.throws(() => mutateJson(oneDepthObject, (mutate) => mutate({ value: 1}), { iterator: ientries }), {
    message: /Path not found in document/,
  });
});

test('should stringify numeric values', (t) => {
  const expected = {
    a: '0',
    b: '1',
    c: {
      foo: {
        bar: ['1', '2', '3', {
          value: {
            foo: 'bar',
          },
        }],
      },
    },
    d: '3',
  };

  const actual = mutateJson(nestedObject, (mutate, value) => {
    if (typeof value === 'number') {
      mutate({
        value: `${value}`,
      });
    }
  });

  t.deepEqual(actual, expected);
});

test('should append nested and detects in the next iteration', (t) => {
  const entry = {
    a: 'nested',
  };

  const expected = {
    a: {
      nested: {
        nested: {
          nested: 'nested',
        },
      },
    },
  };

  let idx = 0;
  const actual = mutateJson(entry, (mutate) => {
    if (idx ++ < 3) {
      mutate({
        value: {
          nested: 'nested',
        },
      });
    }
  }, ([, value]) => value === 'nested');

  t.deepEqual(actual, expected);
});

test('should modify the nested values', (t) => {
  const expected = {
    foo: 0,
    nested: {
      depth: 1,
      foo: 'bar 1',
      nested: {
        depth: 2,
        foo: 'bar 2',
        nested: {
          depth: 3,
          foo: 'bar 3',
          nested: {
            foo: 'bar 4',
            depth: 4,
          },
        },
      },
    },
    bar: 1,
  };

  const actual = mutateJson(recursiveObject, (mutate, value) => {
    mutate({
      value: { ...value, foo: `bar ${value.depth}`},
    });
  }, '@nested');

  t.deepEqual(actual, expected);
});


test('should works with promises', async (t) => {

  const flattenObjectPromises = {
    foo: Promise.resolve(1),
    bar: Promise.resolve(2),
  };

  const expected = {
    foo: 100,
    bar: 200,
  };

  const actual = await mutateJson(flattenObjectPromises, (mutate, value) => {
    mutate({
      value: value * 100,
    });
  });

  t.deepEqual(actual, expected);
});

test('should works with target object as promise', async (t) => {

  const flattenObjectPromises = {
    foo: Promise.resolve(1),
    bar: Promise.resolve(2),
  };

  const expected = {
    foo: 100,
    bar: 200,
  };

  const actual = await mutateJson(Promise.resolve(flattenObjectPromises), (mutate, value) => {
    mutate({
      value: value * 100,
    });
  });

  t.deepEqual(actual, expected);
});

test('should works with promises recursively', async (t) => {

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

  const expected = {
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
  };

  const actual = await mutateJson(recursiveObjectPromises, (mutate, value) => {
    mutate({
      value: value * 2,
    });
  });

  t.deepEqual(actual, expected);
  t.pass();
});

test('should mutate using a promise', async (t) => {

  const flattenObjectPromises = {
    foo: Promise.resolve(1),
    bar: Promise.resolve(2),
  };

  const expected = {
    foo: 100,
    bar: 200,
  };

  const actual = await mutateJson(Promise.resolve(flattenObjectPromises), (mutate, value) => {
    // mutate(Promise.resolve({
    //   value: value * 100,
    // }));
    mutate(Promise.resolve({
      value: value * 100,
    }));
  });

  t.deepEqual(actual, expected);
});
