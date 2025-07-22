import { FeedbackDemo } from '@/components/demo/FeedbackDemo'
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'

describe('FeedbackDemo', () => {
  it('should demonstrate feedback sequence', () => {
    // Mount both components since FeedbackBanner is rendered at root
    cy.mount(
      <>
        <FeedbackDemo />
        <FeedbackBanner />
      </>
    )

    // Start demo
    cy.get('[data-testid="start-demo"]').click()

    // Check initial success message
    cy.getFeedback(1).should('exist')
    cy.contains('Starting demo sequence...').should('be.visible')

    // Check warning appears
    cy.wait(1000)
    cy.getFeedback(3).should('exist')
    cy.contains('Maintain proper form').should('be.visible')

    // Check error appears
    cy.wait(1000)
    cy.getFeedback(5).should('exist')
    cy.contains('Stop immediately').should('be.visible')

    // Verify feedback clears
    cy.waitForFeedbackToClear()
    cy.get('[data-testid="feedback-banner"]').should('not.exist')
  })

  it('should clear feedback on demand', () => {
    cy.mount(
      <>
        <FeedbackDemo />
        <FeedbackBanner />
      </>
    )

    // Start demo
    cy.get('[data-testid="start-demo"]').click()

    // Wait for some feedback to appear
    cy.getFeedback().should('exist')

    // Clear feedback
    cy.get('[data-testid="clear-feedback"]').click()

    // Verify cleared
    cy.get('[data-testid="feedback-banner"]').should('not.exist')
  })
}) 