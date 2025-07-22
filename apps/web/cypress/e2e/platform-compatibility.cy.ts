/// <reference types="cypress" />

interface ViewportConfig {
  width: number;
  height: number;
  name: string;
}

describe('Web Platform Compatibility', () => {
  beforeEach(() => {
    cy.visit('/analyze');
    cy.intercept('POST', '/api/analysis').as('analysisRequest');
  });

  const viewports: ViewportConfig[] = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1366, height: 768, name: 'laptop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 812, name: 'mobile' }
  ];

  viewports.forEach(viewport => {
    describe(`${viewport.name} viewport (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      it('renders UI components correctly', () => {
        // Check main components visibility
        cy.get('[data-testid="video-upload"]').should('be.visible');
        cy.get('[data-testid="exercise-selector"]').should('be.visible');
        
        if (viewport.width <= 768) {
          // Mobile-specific checks
          cy.get('[data-testid="mobile-menu"]').should('be.visible');
          cy.get('[data-testid="desktop-menu"]').should('not.be.visible');
        } else {
          // Desktop-specific checks
          cy.get('[data-testid="desktop-menu"]').should('be.visible');
          cy.get('[data-testid="mobile-menu"]').should('not.be.visible');
        }
      });

      it('handles video playback correctly', () => {
        // Upload video
        cy.fixture('sample-squat.mp4', 'binary')
          .then(Cypress.Blob.binaryStringToBlob)
          .then(fileContent => {
            cy.get('[data-testid="video-upload"]')
              .trigger('change', { 
                target: { 
                  files: [new File([fileContent], 'sample-squat.mp4', { type: 'video/mp4' })]
                }
              });
          });

        // Wait for analysis
        cy.wait('@analysisRequest');

        // Check video player
        cy.get('[data-testid="video-player"]').should('be.visible');
        cy.get('[data-testid="play-button"]').click();
        cy.get('[data-testid="video-player"]').should('have.prop', 'paused', false);

        // Check video controls visibility
        cy.get('[data-testid="video-controls"]').should('be.visible');
        if (viewport.width <= 768) {
          cy.get('[data-testid="video-controls"]').should('have.class', 'mobile');
        }
      });

      it('maintains performance during analysis', () => {
        // Start performance monitoring
        cy.window().then(win => {
          const observer = new win.PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              expect(entry.duration).to.be.lessThan(3000); // Max 3s for any operation
            });
          });
          observer.observe({ entryTypes: ['measure'] });
        });

        // Upload and analyze video
        cy.fixture('sample-squat.mp4', 'binary')
          .then(Cypress.Blob.binaryStringToBlob)
          .then(fileContent => {
            cy.get('[data-testid="video-upload"]')
              .trigger('change', { 
                target: { 
                  files: [new File([fileContent], 'sample-squat.mp4', { type: 'video/mp4' })]
                }
              });
          });

        // Check analysis performance
        cy.wait('@analysisRequest').then((interception) => {
          expect(interception.response?.statusCode).to.equal(200);
          expect(interception.response?.headers['x-response-time']).to.exist;
          const responseTime = parseInt(interception.response?.headers['x-response-time'] || '0');
          expect(responseTime).to.be.lessThan(5000); // Max 5s for analysis
        });
      });

      it('handles browser API compatibility', () => {
        // Check WebRTC support
        cy.window().then(win => {
          expect(win.navigator.mediaDevices).to.exist;
          expect(win.navigator.mediaDevices.getUserMedia).to.exist;
        });

        // Check WebGL support
        cy.window().then(win => {
          const canvas = win.document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          expect(gl).to.exist;
        });

        // Check IndexedDB support
        cy.window().then(win => {
          expect(win.indexedDB).to.exist;
        });

        // Check Web Workers support
        cy.window().then(win => {
          expect(win.Worker).to.exist;
        });
      });

      it('handles offline mode gracefully', () => {
        // Simulate offline mode
        cy.intercept('*', (req) => {
          req.destroy();
        });

        // Try to upload video
        cy.fixture('sample-squat.mp4', 'binary')
          .then(Cypress.Blob.binaryStringToBlob)
          .then(fileContent => {
            cy.get('[data-testid="video-upload"]')
              .trigger('change', { 
                target: { 
                  files: [new File([fileContent], 'sample-squat.mp4', { type: 'video/mp4' })]
                }
              });
          });

        // Check offline message
        cy.get('[data-testid="offline-message"]').should('be.visible');
        cy.get('[data-testid="retry-button"]').should('be.visible');
      });

      it('supports different browsers and versions', () => {
        // Check browser-specific CSS properties
        cy.get('[data-testid="video-player"]').should('have.css', 'object-fit');
        cy.get('[data-testid="form-score"]').should('have.css', 'display', 'flex');

        // Check flexbox support
        cy.get('[data-testid="feedback-list"]').should('have.css', 'display', 'flex');
        cy.get('[data-testid="feedback-list"]').should('have.css', 'flex-direction');

        // Check grid support
        cy.get('[data-testid="analysis-grid"]').should('have.css', 'display', 'grid');

        // Check CSS variables support
        cy.get('body').should('have.css', '--primary-color');
      });
    });
  });

  it('handles high DPI displays correctly', () => {
    // Force high DPI mode
    cy.viewport(1920, 1080);
    cy.window().then(win => {
      Object.defineProperty(win.screen, 'devicePixelRatio', { value: 2 });
    });

    // Check image quality
    cy.get('[data-testid="logo"]').should('have.attr', 'srcset');
    cy.get('[data-testid="pose-overlay"]').should('have.css', 'transform', 'scale(0.5)');
  });

  it('supports touch interactions', () => {
    // Enable touch simulation
    cy.viewport(375, 812);

    // Test touch gestures
    cy.get('[data-testid="video-player"]')
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchend');

    // Check touch feedback
    cy.get('[data-testid="video-controls"]').should('be.visible');
  });
}); 