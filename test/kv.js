var test = require('tape')
var umkv = require('../')
var memdb = require('memdb')

test('open all keys', function (t) {
  t.plan(4)
  var kv = umkv(memdb())
  kv.open(['a','b','c'])
  var actual = []
  var expected = [
    { key: 'a', ids: [] },
    { key: 'b', ids: [] },
    { key: 'c', ids: [] },
    { key: 'a', ids: ['00'] },
    { key: 'b', ids: ['01'] },
    { key: 'a', ids: ['02'] },
    { key: 'b', ids: ['03','04'] },
    { key: 'b', ids: ['05'] },
    { key: 'c', ids: ['06'] }
  ]
  kv.on('value', function (key, ids) {
    actual.push({ key, ids })
    if (actual.length >= expected.length) check()
  })
  function check () {
    t.deepEqual(actual, expected)
  }

  var batches = [
    [
      { id: '00', key: 'a', links: [] },
      { id: '01', key: 'b', links: [] }
    ],
    [
      { id: '02', key: 'a', links: ['00'] },
      { id: '03', key: 'b', links: ['01'] },
      { id: '04', key: 'b', links: ['01'] }
    ],
    [
      { id: '05', key: 'b', links: ['03','04'] },
      { id: '06', key: 'c', links: [] }
    ]
  ]
  ;(function next (i) {
    if (i >= batches.length) return
    kv.batch(batches[i], function (err) {
      t.ifError(err)
      next(i+1)
    })
  })(0)
})

test('open some keys', function (t) {
  t.plan(4)
  var kv = umkv(memdb())
  kv.open(['a','c'])
  var actual = []
  var expected = [
    { key: 'a', ids: [] },
    { key: 'c', ids: [] },
    { key: 'a', ids: ['00'] },
    { key: 'a', ids: ['02'] },
    { key: 'c', ids: ['06'] }
  ]
  kv.on('value', function (key, ids) {
    actual.push({ key, ids })
    if (actual.length >= expected.length) check()
  })
  function check () {
    t.deepEqual(actual, expected)
  }

  var batches = [
    [
      { id: '00', key: 'a', links: [] },
      { id: '01', key: 'b', links: [] }
    ],
    [
      { id: '02', key: 'a', links: ['00'] },
      { id: '03', key: 'b', links: ['01'] },
      { id: '04', key: 'b', links: ['01'] }
    ],
    [
      { id: '05', key: 'b', links: ['03','04'] },
      { id: '06', key: 'c', links: [] }
    ]
  ]
  ;(function next (i) {
    if (i >= batches.length) return
    kv.batch(batches[i], function (err) {
      t.ifError(err)
      next(i+1)
    })
  })(0)
})

test('open with existing keys', function (t) {
  t.plan(3)
  var kv = umkv(memdb())
  var actual = []
  var expected = [
    { key: 'a', ids: ['02'] },
    { key: 'c', ids: [] },
    { key: 'c', ids: ['06'] }
  ]
  kv.on('value', function (key, ids) {
    actual.push({ key, ids })
    if (actual.length >= expected.length) check()
  })
  function check () {
    t.deepEqual(actual, expected)
  }

  var firstBatches = [
    [
      { id: '00', key: 'a', links: [] },
      { id: '01', key: 'b', links: [] }
    ],
    [
      { id: '02', key: 'a', links: ['00'] },
      { id: '03', key: 'b', links: ['01'] },
      { id: '04', key: 'b', links: ['01'] }
    ]
  ]
  var secondBatches = [
    [
      { id: '05', key: 'b', links: ['03','04'] },
      { id: '06', key: 'c', links: [] }
    ]
  ]
  writeBatches(firstBatches, function (err) {
    t.ifError(err)
    kv.open(['a','c'])
    writeBatches(secondBatches, function (err) {
      t.ifError(err)
    })
  })
  function writeBatches (batches, cb) {
    ;(function next (i) {
      if (i >= batches.length) return cb()
      kv.batch(batches[i], function (err) {
        if (err) cb(err)
        else next(i+1)
      })
    })(0)
  }
})

test('open and close', function (t) {
  t.plan(5)
  var kv = umkv(memdb())
  var actual = []
  var expected = [
    { key: 'a', ids: ['02'] },
    { key: 'c', ids: [] },
    { key: 'c', ids: ['06'] },
    { key: 'c', ids: ['09','11'] },
    { key: 'c', ids: ['13'] },
    { key: 'a', ids: ['12'] },
    { key: 'a', ids: ['12','14'] },
    { key: 'a', ids: ['15'] },
    { key: 'c', ids: ['16'] }
  ]
  kv.on('value', function (key, ids) {
    actual.push({ key, ids })
    if (actual.length >= expected.length) check()
  })
  function check () {
    t.deepEqual(actual, expected)
  }

  var xbatches = [
    [
      [
        { id: '00', key: 'a', links: [] },
        { id: '01', key: 'b', links: [] }
      ],
      [
        { id: '02', key: 'a', links: ['00'] },
        { id: '03', key: 'b', links: ['01'] },
        { id: '04', key: 'b', links: ['01'] }
      ]
    ],
    [
      [
        { id: '05', key: 'b', links: ['03','04'] },
        { id: '06', key: 'c', links: [] }
      ]
    ],
    [
      [
        { id: '07', key: 'a', links: ['02'] },
        { id: '08', key: 'b', links: ['05'] },
        { id: '09', key: 'c', links: ['06'] },
        { id: '10', key: 'a', links: ['02'] },
        { id: '11', key: 'c', links: ['06'] }
      ],
      [
        { id: '12', key: 'a', links: ['07','10'] },
        { id: '13', key: 'c', links: ['09','11'] }
      ]
    ],
    [
      [
        { id: '14', key: 'a', links: ['10'] },
        { id: '15', key: 'b', links: ['08'] }
      ],
      [
        { id: '15', key: 'a', links: ['12','14'] },
        { id: '16', key: 'c', links: ['13'] }
      ]
    ]
  ]
  writeBatches(xbatches[0], function (err) {
    t.ifError(err)
    kv.open(['a','c'])
    writeBatches(xbatches[1], function (err) {
      t.ifError(err)
      kv.close(['a'])
      writeBatches(xbatches[2], function (err) {
        t.ifError(err)
        kv.open('a')
        writeBatches(xbatches[3], function (err) {
          t.ifError(err)
        })
      })
    })
  })
  function writeBatches (batches, cb) {
    ;(function next (i) {
      if (i >= batches.length) return cb()
      kv.batch(batches[i], function (err) {
        if (err) cb(err)
        else next(i+1)
      })
    })(0)
  }
})
