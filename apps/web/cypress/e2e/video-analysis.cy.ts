import { defineConfig } from 'cypress';

describe('Video Analysis Flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/analysis').as('analysisRequest');
    cy.intercept('GET', '/api/exercises').as('exercisesRequest');
    cy.visit('/analyze');
  });

  it('completes full video analysis workflow', () => {
    // Wait for exercise list to load
    cy.wait('@exercisesRequest');
    
    // Select exercise type
    cy.get('[data-testid="exercise-selector"]').click();
    cy.get('[data-testid="exercise-option-squat"]').click();
    
    // Upload video file
    cy.fixture('sample-squat.mp4', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then(fileContent => {
        cy.get('[data-testid="video-upload"]').attachFile({
          fileContent,
          fileName: 'sample-squat.mp4',
          mimeType: 'video/mp4'
        });
      });

    // Verify upload progress
    cy.get('[data-testid="upload-progress"]').should('be.visible');
    cy.get('[data-testid="upload-progress"]').should('not.exist');

    // Wait for analysis to complete
    cy.wait('@analysisRequest').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
      expect(interception.response?.body).to.have.property('formScore');
      expect(interception.response?.body).to.have.property('feedback');
    });

    // Verify results display
    cy.get('[data-testid="form-score"]').should('be.visible');
    cy.get('[data-testid="feedback-list"]').should('be.visible');
    cy.get('[data-testid="form-score"]').invoke('text').then(parseFloat)
      .should('be.within', 0, 100);

    // Verify video playback
    cy.get('[data-testid="video-player"]').should('be.visible');
    cy.get('[data-testid="play-button"]').click();
    cy.get('[data-testid="video-player"]').should('have.prop', 'paused', false);

    // Test frame-by-frame navigation
    cy.get('[data-testid="next-frame"]').click();
    cy.get('[data-testid="pose-overlay"]').should('be.visible');
    cy.get('[data-testid="keypoint-marker"]').should('have.length.at.least', 10);

    // Verify feedback interaction
    cy.get('[data-testid="feedback-item"]').first().click();
    cy.get('[data-testid="feedback-detail"]').should('be.visible');
    cy.get('[data-testid="feedback-timestamp"]').click();
    cy.get('[data-testid="video-player"]').should('have.attr', 'currentTime');
  });

  it('handles invalid video upload gracefully', () => {
    cy.fixture('invalid.txt', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then(fileContent => {
        cy.get('[data-testid="video-upload"]').attachFile({
          fileContent,
          fileName: 'invalid.txt',
          mimeType: 'text/plain'
        });
      });

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid file type');
  });

  it('handles analysis errors gracefully', () => {
    cy.intercept('POST', '/api/analysis', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('failedAnalysis');

    cy.fixture('sample-squat.mp4', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then(fileContent => {
        cy.get('[data-testid="video-upload"]').attachFile({
          fileContent,
          fileName: 'sample-squat.mp4',
          mimeType: 'video/mp4'
        });
      });

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'analysis failed');
  });

  it('preserves analysis results after page reload', () => {
    // Complete successful analysis first
    cy.fixture('sample-squat.mp4', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then(fileContent => {
        cy.get('[data-testid="video-upload"]').attachFile({
          fileContent,
          fileName: 'sample-squat.mp4',
          mimeType: 'video/mp4'
        });
      });

    cy.wait('@analysisRequest');
    
    // Store score for comparison
    let originalScore: string;
    cy.get('[data-testid="form-score"]')
      .invoke('text')
      .then(text => {
        originalScore = text;
      });

    // Reload page
    cy.reload();

    // Verify data persistence
    cy.get('[data-testid="form-score"]')
      .should('be.visible')
      .invoke('text')
      .should(text => {
        expect(text).to.equal(originalScore);
      });
  });
}); 