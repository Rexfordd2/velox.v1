/// <reference types="cypress" />

describe('Video Upload Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should upload a video and analyze squat form', () => {
    // Upload video
    cy.get('input[type="file"]').attachFile('sample.mp4');
    
    // Wait for upload to complete
    cy.get('[data-testid="upload-progress"]').should('not.exist');
    
    // Select exercise
    cy.get('[data-testid="exercise-card"]').contains('Squat').click();
    
    // Wait for analysis
    cy.get('[data-testid="analysis-loading"]').should('not.exist');
    
    // Check results
    cy.get('[data-testid="form-score"]').should('be.visible');
    cy.get('[data-testid="feedback-list"]').should('be.visible');
    
    // Verify mock score
    cy.get('[data-testid="form-score"]').should('contain', '85');
    cy.get('[data-testid="feedback-list"]').should('contain', 'Good depth achieved');
  });
}); 