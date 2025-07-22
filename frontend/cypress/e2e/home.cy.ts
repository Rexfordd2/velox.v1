describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the home page', () => {
    cy.get('h1').should('be.visible');
  });
}); 