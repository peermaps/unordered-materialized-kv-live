var umkv = require('unordered-materialized-kv')
var { EventEmitter } = require('events')

module.exports = KVL

function KVL (db, opts) {
  var self = this
  if (!(self instanceof KVL)) return new KVL(db, opts)
  self._subs = {}
  self._tick = 0 // prevent subscriptions from unfinished batch handlers
  self._umkv = umkv(db, {
    onupdate: function (update) {
      var keys = Object.keys(update)
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        if (!has(self._subs, key)) continue
        if (self._subs[key] === self._tick) continue
        self.emit('value', key, update[key])
      }
    }
  })
}
KVL.prototype = Object.create(EventEmitter.prototype)

KVL.prototype.open = function (key) {
  var self = this
  if (Array.isArray(key)) {
    key.forEach(function (k) {
      self._subs[k] = self._tick
      get(k)
    })
  } else {
    self._subs[key] = self._tick
    get(key)
  }
  function get (key) {
    self._umkv.get(key, function (err, ids) {
      if (err && err.notFound) self.emit('value', key, [])
      else if (err) self.emit('error', err)
      else self.emit('value', key, ids)
    })
  }
}

KVL.prototype.close = function (key) {
  var self = this
  if (Array.isArray(key)) {
    key.forEach(function (k) {
      delete self._subs[k]
    })
  } else {
    delete self._subs[key]
  }
}

KVL.prototype.get = function (key, cb) {
  this._umkv.get(key, cb)
}

KVL.prototype.batch = function (rows, cb) {
  var self = this
  self._umkv.batch(rows, function (err) {
    if (err) return cb(err)
    self._tick++
    cb()
  })
}

KVL.prototype.isLinked = function (key, cb) {
  this._umkv.isLinked(key, cb)
}

function has (obj, key) {
  return Object.hasOwnProperty.call(obj, key)
}
