/// <reference types="cypress" />

describe('Save Session Flow', () => {
  beforeEach(() => {
    // Mock auth session
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      }));
    });

    cy.visit('/');
  });

  it('should save a session and show it in profile', () => {
    // Upload video
    cy.get('input[type="file"]').attachFile('sample.mp4');
    
    // Wait for upload to complete
    cy.get('[data-testid="upload-progress"]').should('not.exist');
    
    // Select exercise
    cy.get('[data-testid="exercise-card"]').contains('Squat').click();
    
    // Wait for analysis
    cy.get('[data-testid="analysis-loading"]').should('not.exist');
    
    // Save session
    cy.get('button').contains('Save Session').click();
    
    // Verify success message
    cy.get('[data-testid="save-success"]').should('be.visible');
    
    // Go to profile
    cy.visit('/profile');
    
    // Check if session appears in list
    cy.get('[data-testid="session-list"]')
      .should('contain', 'Squat')
      .and('contain', '85');
  });
}); 