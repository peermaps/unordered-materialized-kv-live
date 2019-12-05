# unordered-materialized-kv-live

live-updating materialized view for unordered key/id log messages

extends the [unordered-materialized-kv][] api with `open()` and `close()`
methods for subscribing and unsubscribing to key changes

The intended use with this module is the same as [unordered-materialized-kv][]
where another database is expected to store the actual documents for your
application and this module only manages linking in order to determine what the
"heads" or most recent versions, of the documents are.

# example

``` js
var umkvl = require('unordered-materialized-kv-live')
var kv = umkvl(require('memdb')())

kv.open(['a','b','c'])

kv.on('value', function (key, ids) {
  console.log(`${key} => ${ids.join(',')}`)
})

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
    if (err) return console.error(err)
    console.log('---')
    next(i+1)
  })
})(0)
```

output:

```
a => 
b => 
c => 
---
a => 00
b => 01
---
a => 02
b => 03,04
---
b => 05
c => 06
```

# api

``` js
var umkvl = require('unordered-materialized-kv-live')
```

## var kv = umkvl(db)

Create a new `umkvl` instance `kv` from a leveldb instance `db`.

## kv.open(keys)

Subscribe to an array of string `keys` or a single string key.

When you first subscribe to a key, the value is looked up with `kv.get()` and
the value is emitted in the `'value'` event. Then every time the key changes,
a `'value'` event will be emitted.

## kv.close(keys)

Unsubscribe to an array of string `keys` or a single string key.

Stop receiving `'value'` events for a key or keys.

## kv.on('value', function (key, ids) { })

Receive values whenever a key that is subscribed to changes. This event also
fires the first time a key is subscribed to.

## kv.get(key, cb)

Lookup the array of ids that map to a given string `key` as `cb(err, ids)`.

These ids are the most recent versions or "heads" of the graph for that key.

## kv.batch(rows, cb)

Write an array of `rows` into the `kv`. Each `row` in the `rows` array has:

* `row.key` - string key to use
* `row.id` - unique id string of this record
* `row.links` - array of id string ancestor links

## kv.isLinked(key, cb)

Test if a `key` is linked to as `cb(err, exists)` for a boolean `exists`.

# license

BSD
