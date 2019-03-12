import R from 'ramda'

const { curry, compose } = R

const FL = {
  alt: 'fantasy-land/alt',
  ap: 'fantasy-land/ap',
  bimap: 'fantasy-land/bimap',
  chain: 'fantasy-land/chain',
  chainRec: 'fantasy-land/chainRec',
  map: 'fantasy-land/map',
  of: 'fantasy-land/of',
  zero: 'fantasy-land/zero'
}

export const makeInvoker = curry((arity, key, wrap = x => x) => {
  let make = (a, k, w) => {
    return !a
      ? wrap(obj => {
          return obj[k]()
        })
      : R.curryN(a, (...args) =>
          w(obj => {
            return obj[k](...args)
          })
        )
  }
  return Array(arity)
    .fill()
    .reduce((inv, z, i) => {
      inv['a' + i] = make(i, key, wrap)
      return inv
    }, make(arity, key, wrap))
})
export const makeInvoker0 = makeInvoker(0)
export const makeInvoker1 = makeInvoker(1)
export const makeInvoker2 = makeInvoker(2)
export const makeInvoker3 = makeInvoker(3)
export const makeInvoker4 = makeInvoker(4)
export const makeInvoker5 = makeInvoker(5)

export const log = R.tap(console.log)
export const logAll = (...args) => {
  console.log(...args)
  return args[0]
}

export const composeF = (...fns) => compose.apply(R, R.map(R.chain, fns))

export const id = x => x
export const isFn = x => 'function' === typeof x

//proto
export const keyMapWith = curry((f, keys) =>
  keys.reduce((a, x) => R.assoc(x, f(x), a), {})
)
export const keyMap = keyMapWith(id)
export const defineGetter = curry((get, key, obj) => {
  return Object.defineProperty(obj, key, {
    get
  })
})

export const State = (initialState = {}, impure = false) => {
  let _state

  let state = newState => {
    if (newState) {
      _state = impure ? newState : R.clone(newState)
      state.keys = keyMap(R.keys(_state))
    }
    return impure ? _state : R.clone(_state)
  }

  state.set = curry(
    function(key, val) {
      return this(R[isFn(key) ? 'set' : 'assoc'](key, val, this()))
    }.bind(state)
  )

  state.with = R.curryN(
    3,
    function(lens, f, ...args) {
      return f(R.view(lens, this()), ...args) || this
    }.bind(state)
  )

  state.withProp = (key, ...args) => state.with(R.lensProp(key), ...args)

  state.withPath = (path, ...args) => state.with(R.lensPath(path), ...args)

  state.invoke = R.curryN(
    2,
    function(key, ...args) {
      if (key instanceof Array) return R.view(R.lensPath(key), this())(...args)
      return this()[key](...args)
    }.bind(state)
  )

  state.get = function(key) {
    return R.view(isFn(key) ? key : R.lensProp(key), this())
  }.bind(state)

  state.map = state[FL.map] = function(m) {
    return this(f(this))
  }.bind(state)

  state(initialState)

  return state
}

State.get = makeInvoker1('get')
State.set = makeInvoker1('set')
