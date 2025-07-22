/// <reference types="cypress" />

describe('Feedback System', () => {
  beforeEach(() => {
    // Mock the pose detection and analysis
    cy.intercept('POST', '/api/analyze-pose', (req) => {
      // Simulate different feedback scenarios for each rep
      const mockFeedback = [
        [
          { severity: 4, msg: 'Keep your back straight' },
          { severity: 2, msg: 'Maintain stability' }
        ],
        [
          { severity: 3, msg: 'Control the descent' }
        ],
        [
          { severity: 5, msg: 'Stop immediately - improper form' },
          { severity: 3, msg: 'Keep knees aligned' }
        ],
        [
          { severity: 2, msg: 'Good depth' },
          { severity: 1, msg: 'Great power!' }
        ],
        []  // No feedback for perfect form
      ]

      // Get the current rep count from the request
      const repCount = req.body.repCount || 0
      
      req.reply({
        feedback: mockFeedback[repCount % mockFeedback.length],
        formScore: 85,
        isRepComplete: true
      })
    }).as('poseAnalysis')
  })

  it('should display and clear feedback banners correctly', () => {
    // Visit the workout page
    cy.visit('/workout')
    
    // Start recording
    cy.get('[data-testid="start-recording"]').click()

    // Verify first rep feedback
    cy.get('[data-testid="feedback-banner"]').should('have.length', 2)
    cy.contains('Keep your back straight').should('be.visible')
    cy.contains('Maintain stability').should('be.visible')

    // Wait for feedback to clear (4s TTL)
    cy.wait(4000)
    cy.get('[data-testid="feedback-banner"]').should('have.length', 0)

    // Trigger second rep
    cy.get('[data-testid="mock-rep"]').click()
    cy.contains('Control the descent').should('be.visible')
    cy.get('[data-testid="feedback-banner"]').should('have.length', 1)

    // Verify severe feedback for third rep
    cy.get('[data-testid="mock-rep"]').click()
    cy.contains('Stop immediately - improper form').should('be.visible')
    cy.contains('Keep knees aligned').should('be.visible')
    cy.get('[data-testid="feedback-banner"]').should('have.length', 2)

    // Verify positive feedback for fourth rep
    cy.get('[data-testid="mock-rep"]').click()
    cy.contains('Good depth').should('be.visible')
    cy.contains('Great power!').should('be.visible')

    // Verify no feedback for perfect form
    cy.get('[data-testid="mock-rep"]').click()
    cy.get('[data-testid="feedback-banner"]').should('have.length', 0)
  })

  it('should handle feedback priority correctly', () => {
    cy.visit('/workout')
    cy.get('[data-testid="start-recording"]').click()

    // Verify that only one high and one mid severity feedback is shown
    cy.intercept('POST', '/api/analyze-pose', {
      feedback: [
        { severity: 5, msg: 'Critical issue 1' },
        { severity: 4, msg: 'Critical issue 2' },
        { severity: 3, msg: 'Warning 1' },
        { severity: 2, msg: 'Warning 2' },
        { severity: 1, msg: 'Info 1' }
      ],
      formScore: 60,
      isRepComplete: true
    })

    cy.get('[data-testid="mock-rep"]').click()
    cy.get('[data-testid="feedback-banner"]').should('have.length', 2)
    cy.contains('Critical issue 1').should('be.visible')
    cy.contains('Warning 1').should('be.visible')
  })
}) 