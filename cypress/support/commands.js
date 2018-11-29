// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { SET_TOKEN } from '../../app/scripts/actions';

function login () {
  const authUrl = `${Cypress.config('baseUrl')}/#/auth`;
  cy.request({
    url: `${Cypress.env('APIROOT')}/token`,
    qs: {
      state: encodeURIComponent(authUrl)
    },
    followRedirect: false
  }).then((response) => {
    const query = response.redirectedToUrl.substr(response.redirectedToUrl.indexOf('?') + 1);
    const token = query.split('=')[1];
    cy.window().its('appStore').then((store) => {
      store.dispatch({
        type: SET_TOKEN,
        token
      });
    });
  });
}

function loginWaitOnInflightTokens () {
  cy.window().its('appStore').then((store) => {
    const inflight = store.getState().api.tokens.inflight;
    cy.log(inflight);
    if (!inflight) {
      return login();
    }
    loginWaitOnInflightTokens();
  });
}

Cypress.Commands.add('login', () => {
  loginWaitOnInflightTokens();

  // const authUrl = `${Cypress.config('baseUrl')}/#/auth`;
  // cy.request({
  //   url: `${Cypress.env('APIROOT')}/token`,
  //   qs: {
  //     state: encodeURIComponent(authUrl)
  //   },
  //   followRedirect: false
  // }).then((response) => {
  //   const query = response.redirectedToUrl.substr(response.redirectedToUrl.indexOf('?') + 1);
  //   const token = query.split('=')[1];
  //   cy.window().its('appStore').then((store) => {
  //     store.dispatch({
  //       type: SET_TOKEN,
  //       token
  //     });
  //   });
  // });
});

Cypress.Commands.add('editJsonTextarea', ({ data, update = false }) => {
  cy.window().its('aceEditorRef').its('editor').then((editor) => {
    if (update) {
      const value = editor.getValue();
      let currentObject = JSON.parse(value);
      data = Cypress._.assign(currentObject, data);
    }
    data = JSON.stringify(data);
    editor.setValue(data);
  });
});

Cypress.Commands.add('getJsonTextareaValue', () => {
  return cy.window().its('aceEditorRef').its('editor').then((editor) => {
    const value = editor.getValue();
    return JSON.parse(value);
  });
});

Cypress.Commands.add('getFakeApiFixture', (fixturePath) => {
  const fixtureFile = `./test/fake-api/fixtures/${fixturePath}/index.json`;
  return cy.readFile(fixtureFile);
});
