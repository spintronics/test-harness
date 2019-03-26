# Test Harness

A hopefully elegant way to provide composable testing capabilities to every layer except for visual inconsistencies (maybe). Evaluate both by interacting with client models and through mocked user interaction. Test actions across both the browser and the server layer and how they interact.

## Motivation

Testing changes by hand (especially on the front-end) is highly inefficient. Regression testing is worse because it’s hard to know what might break when new code is introduced. Testing can also be time consuming but with the proper approach writing tests then updating/modifying them should be easy.

## Goals

- browser / server / e2e testing
- cli like interface for browser testing
  ```javascript
  ;[
    'with page',
    `click $[action="login"]`,
    'settle',
    'fillform $[name="mz-loginform"] -c kj@vn.net',
    `click $[action="loginpage-submit"]`,
    'settle'
  ]
  ```
- browser extension for listening to events & translating to commands
- parallelizable / composable
- mock / cached responses for api calls
- randomization
- scheduling
- cleanup
