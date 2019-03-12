import R from 'ramda'
import Future from 'fluture'
import * as util from './util'

const { makeInvoker, makeInvoker1, makeInvoker0, makeInvoker2 } = util

const { curry, merge } = R

const { encaseP } = Future
const defaultOptions = {}

//browser
//options -> puppeteer -> browser
export const launch = makeInvoker1('launch', encaseP)
export const defaultBrowser = R.defaultTo(launch)
export const newPage = makeInvoker0('newPage', encaseP)
export const close = makeInvoker0('close', encaseP)
export const browser = {
  launch,
  default: defaultBrowser,
  newPage,
  close
}
//page
export const goto = makeInvoker2('goto', encaseP)

export const page = {
  goto
}

export default {
  browser,
  page
}
