import R from 'ramda'
import Future, { encase } from 'fluture'
import * as util from './util'

const {
  makeInvoker,
  makeInvoker1,
  makeInvoker0,
  makeInvoker2,
  invokeFuture
} = util

const { curry, merge } = R

const { encaseP } = Future
const defaultOptions = {}

//browser
//options -> puppeteer -> browser
export const launch = makeInvoker1('launch', encaseP)
export const defaultBrowser = R.defaultTo(launch)
export const newPage = makeInvoker0('newPage', encaseP)
export const close = makeInvoker0('close', encaseP)
export const settle = invokeFuture('waitForNavigation', {
  waitUntil: 'networkidle0'
})

export const browser = {
  launch,
  default: defaultBrowser,
  newPage,
  close,
  settle
}

//page
export const click = makeInvoker2('click', encaseP)
export const goto = makeInvoker2('goto', encaseP)

export const page = {
  goto,
  click
}

const regex = {
  attr: /\[[a-zA-z]*=".*"\]/,
  flag: /--?.*/,
  class: /\..*/,
  id: /\#.*/
}

const Action = (action, flags = {}) => {
  action.flags = flags
  return action
}

//flag fn will get (arg, context, state)
const actions = {
  type: Action(
    ({ selector, value, delay = 0 }) =>
      invokeFuture('type', selector, value, { delay }),
    { delay: Number }
  ),
  fillform: Action(
    ({ selector, contact = {}, delay = 0 }) => page => {
      return R.toPairs(contact).reduce(
        (F, [field, value]) =>
          F.chain(
            actions.type({
              selector: selector + `>[name="${field}]`,
              value,
              delay
            })(page)
          ),
        Future.of(null)
      )
    },
    {
      contact: (arg, context) => R.pathOr({}, ['contact', arg], context)
    }
  ),
  settle: Action(
    invokeFuture('waitForNavigation', {
      waitUntil: 'networkidle0'
    })
  ),
  click: Action(({ selector = '' }) => invokeFuture('click', selector))
}

//make flags with a unique first char
R.map(action => {
  return R.keys(action).reduce((a, x) => {
    //flag fns will return the result as an object with the same key
    //contact(arg, context, state) -> {contact: a}
    let wrapper = (...args) => ({ [x]: action[x](...args) })
    action[x] = wrapper
    a[x[0]] = action[x]
    return a
  }, action)
}, actions)

export const Puppet = (profile = {}, context = {}) => {
  let puppet = commands => () => {
    commands = Array.isArray(commands) ? commands : [commands]
    let invokee = context.withProp('page')
    return commands
      .map(command => {
        let split = command.split(' ')
        let action = R.head(split)
        if (!(action in actions)) return Promise.reject('unknown action')
        let args = R.tail(split).map((arg, dex, list) => {
          if (util.isObj(arg)) return arg

          if (!arg) return {}

          if (arg[0] in { $: 1, '.': 1, '[': 1, '#': 1 }) {
            // if (regex.attr.match(arg)) {
            //   let attrName = arg.replace(/[$\[\]]/g, '').split('=')[0]
            //   if (attrName in profile.attributes)
            //     arg = arg.replace(attrName, profile.attributes[attrName])
            // }
            // if (arg[1] === '#' || arg[2] === '#') {
            //   let id = arg.replace(/[$#]/g, '')
            //   if (id in profile.ids) arg = arg.replace(id, profile.ids[id])
            // }
            // if (arg[1] === '.' || arg[2] === '.') {
            //   let clss = arg.replace(/[$\.]/g, '')
            //   if (clss in profile.classes)
            //     arg = arg.replace(clss, profile.classes[clss])
            // }
            if (arg[1] === '$') return { selectorAll: arg.slice(1) }
            return { selector: arg.slice(2) }
          }

          if (regex.flag.test(arg)) {
            let flag = arg.replace('-', '')
            let flags = actions[action].flags
            let flagFn =
              flags[flag] || flags[Object.keys(flags).find(f => f[0] === flag)]
            if (!flagFn) return `${arg} flag not defined for ${action}`
            let result = flags[action][flag](
              list[dex + 1] || '',
              profile,
              context
            )
            list[dex + 1] = ''
            return result
          }

          return { value: arg }
        })
        let errors = args.filter(util.isStr)
        if (errors.length) return Future.reject(errors)

        return R.mergeAll(args.concat({ action }))
      })
      .map(config => {
        if (!util.isObj(config) || Future.isFuture(config)) return config
        if (config.action === 'with') {
          invokee = context.withProp(config.value)
          return Future.of(invokee)
        }
        return actions[config.action](config)
      })
      .reduce(
        (F, command) =>
          Future.isFuture(command) ? command : F.chain(invokee(command)),
        Future.of(context)
      )
  }
  return R.toPairs(profile.actions).reduce((a, [name, process]) => {
    a[name] = puppet.bind(null, process)
    return a
  }, puppet)
}

export default {
  browser,
  page,
  Puppet
}
