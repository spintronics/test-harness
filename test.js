import { browser, page } from './puppet'
import R from 'ramda'
import * as util from './util'
import puppeteer from 'puppeteer'
import Future from 'fluture'

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

let google = composeF(
  c => Future.after(10000, log(context)),
  withPage(page.goto.a1('https://google.com')),

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
