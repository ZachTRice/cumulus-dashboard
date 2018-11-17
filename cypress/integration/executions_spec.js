import { shouldBeRedirectedToLogin } from '../support/assertions';

describe('Dashboard Executions Page', () => {
  describe('When not logged in', () => {
    it('should redirect to login page', () => {
      cy.visit('/#/executions');
      shouldBeRedirectedToLogin();
    });
  });

  describe('When logged in', () => {
    beforeEach(() => {
      cy.login();
      cy.task('resetState');
    });

    after(() => {
      cy.task('resetState');
    });

    it('should display a link to view executions', () => {
      cy.visit('/');

      cy.contains('nav li a', 'Executions').as('executions');
      cy.get('@executions').should('have.attr', 'href', '#/executions');
      cy.get('@executions').click();

      cy.url().should('include', 'executions');
      cy.contains('.heading--xlarge', 'Executions');
      cy.contains('.heading--large', 'Execution Overview');

      // shows a summary count of completed and failed executions
      cy.get('.overview-num__wrapper ul li')
        .first().contains('li', '3 Completed')
        .next().contains('li', '1 Failed')
        .next().contains('li', '1 Running');

      // shows a list of executions with IDs and status
      const executionStatusFile = './test/fake-api-fixtures/executions/index.json';
      cy.readFile(executionStatusFile).as('executionStatus');

      cy.get('table tbody tr').as('list');
      cy.get('@list').its('length').should('be.eq', 5);

      // compare data in each row with the data from fixture
      cy.get('@list').each(($el, index, $list) => {
        cy.wrap($el).children().as('rows');
        cy.get('@rows').its('length').should('be.eq', 6);

        cy.get('@executionStatus').its('results').then((executions) => {
          const execution = executions[index];
          cy.get('@rows').eq(0).children('a')
            .should('have.attr', 'href')
            .and('include', execution.arn);
          cy.get('@rows').eq(0).children('a')
            .should('have.attr', 'title')
            .and('be.eq', execution.name);
          cy.get('@rows').eq(1).invoke('text')
            .should('be.eq', execution.status.replace(/^\w/, c => c.toUpperCase()));
          cy.get('@rows').eq(2).invoke('text')
            .should('be.eq', execution.type);
          cy.get('@rows').eq(3).invoke('text')
            .should('match', /.+ago$/);
          cy.get('@rows').eq(4).invoke('text')
            .should('be.eq', `${(Math.round(execution.duration * 100) / 100).toString()}s`);
          cy.get('@rows').eq(5).invoke('text')
            .should('be.eq', execution.collectionId);
        });
      });
    });
  });
});