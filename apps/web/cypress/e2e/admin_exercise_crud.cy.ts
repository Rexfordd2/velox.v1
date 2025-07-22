import { createClient } from '@supabase/supabase-js';

describe('Admin Exercise CRUD', () => {
  beforeEach(() => {
    // Stub Supabase auth cookie
    cy.setCookie('sb-access-token', 'fake-token');
    cy.setCookie('sb-refresh-token', 'fake-refresh-token');
  });

  it('completes full CRUD flow', () => {
    // 1. Visit admin page
    cy.visit('/admin/exercises');
    cy.get('h2').should('contain', 'Exercises');

    // 2. Create new exercise
    cy.get('button').contains('New Exercise').click();
    cy.get('form').within(() => {
      cy.get('input[name="name"]').type('Test Exercise');
      cy.get('input[name="slug"]').should('have.value', 'test-exercise');
      cy.get('textarea[name="description"]').type('Test description');
      cy.get('select[name="difficulty"]').select('intermediate');
      cy.get('select[name="primary_muscle"]').select('chest');
      cy.get('input[type="checkbox"]').first().check();
      cy.get('button[type="submit"]').click();
    });

    // 3. Verify creation toast
    cy.get('[data-sonner-toast]').should('contain', 'Exercise created');

    // 4. Edit exercise
    cy.get('tr').contains('Test Exercise').parent().within(() => {
      cy.get('button').contains('Edit').click();
    });
    cy.get('form').within(() => {
      cy.get('select[name="difficulty"]').select('advanced');
      cy.get('button[type="submit"]').click();
    });

    // 5. Verify edit toast
    cy.get('[data-sonner-toast]').should('contain', 'Exercise updated');

    // 6. Delete exercise
    cy.get('tr').contains('Test Exercise').parent().within(() => {
      cy.get('button').contains('Delete').click();
    });

    // 7. Verify deletion
    cy.get('tr').contains('Test Exercise').should('not.exist');

    // 8. Check public page
    cy.visit('/exercises');
    cy.get('div').contains('Test Exercise').should('not.exist');
  });
}); 