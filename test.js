import { browser, page, Puppet } from './puppet'
import R from 'ramda'
import * as util from './util'
import puppeteer from 'puppeteer'
import Future from 'fluture'
import profile from './profile'

const { log, State, composeF } = util

const { compose, map, chain } = R

const context = State(
  {
    headyBrowser: 1,
    page: 1
  },
  true
)

const withBrowser = context.withProp(context.keys.headyBrowser)
const withPage = context.withProp(context.keys.page)

let puppet = Puppet(profile, context)

// puppet.login().fork(console.error, console.log)

let google = composeF(
  c => Future.after(10000, log(context)),
  puppet.login,
  withPage(page.goto.a1(profile.baseUrl)),
  withBrowser(
    compose(
      map(Future.of),
      map(context.set(context.keys.page)),
      browser.newPage
    )
  )
)

let test = compose(
  chain(withBrowser(browser.close)),
  google,
  map(context.set(context.keys.headyBrowser)),
  browser.launch({ headless: false })
)

test(puppeteer).fork(console.error, console.log)
