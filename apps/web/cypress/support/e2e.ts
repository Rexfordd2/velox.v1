/// <reference types="cypress" />

// Import commands.js using ES2015 syntax:
import './commands';
import '@testing-library/cypress/add-commands'

// Custom command to check feedback banner
Cypress.Commands.add('getFeedback', (severity?: 1 | 2 | 3 | 4 | 5) => {
  if (severity) {
    return cy.get(`[data-testid="feedback-banner"][data-severity="${severity}"]`)
  }
  return cy.get('[data-testid="feedback-banner"]')
})

// Custom command to wait for feedback to disappear
Cypress.Commands.add('waitForFeedbackToClear', () => {
  cy.wait(4000) // Wait for TTL
  cy.get('[data-testid="feedback-banner"]').should('not.exist')
})

declare global {
  namespace Cypress {
    interface Chainable {
      getFeedback(severity?: 1 | 2 | 3 | 4 | 5): Chainable<JQuery<HTMLElement>>
      waitForFeedbackToClear(): Chainable<void>
      attachFile(fileName: string): Chainable<JQuery<HTMLElement>>
    }
  }
} 