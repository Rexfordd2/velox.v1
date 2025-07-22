import { mount } from 'cypress/react18'
import { MountOptions, MountReturn } from 'cypress/react'
import '@testing-library/cypress/add-commands'

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />) 