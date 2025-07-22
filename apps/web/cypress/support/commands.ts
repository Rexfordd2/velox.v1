/// <reference types="cypress" />

// Custom command to attach a file
Cypress.Commands.add('attachFile', { prevSubject: 'element' }, (subject, fileName) => {
  return cy.window().then((win) => {
    const file = new win.File([''], fileName, { type: 'video/mp4' });
    const dataTransfer = new win.DataTransfer();
    dataTransfer.items.add(file);
    const input = subject[0] as HTMLInputElement;
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      attachFile(fileName: string): Chainable<JQuery<HTMLElement>>
    }
  }
} 