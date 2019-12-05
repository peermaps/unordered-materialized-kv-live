var umkvl = require('../')
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
