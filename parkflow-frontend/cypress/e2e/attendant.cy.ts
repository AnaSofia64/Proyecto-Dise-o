describe('Celador - ParkFlow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[placeholder="Ingresa tu usuario"]').type('celador');
    cy.get('input[type="password"]').type('1234');
    cy.get('form').submit();
    cy.url().should('include', '/attendant/dashboard');
  });

  it('Dashboard muestra estadísticas de plazas', () => {
    cy.get('.stats-grid').should('exist');
    cy.get('.stat-card').should('have.length.at.least', 3);
  });

  it('Sidebar tiene opciones de celador', () => {
    cy.get('.sidebar').should('exist');
    cy.get('.nav-item').should('contain', 'Panel');
    cy.get('.nav-item').should('contain', 'Registrar Entrada');
    cy.get('.nav-item').should('contain', 'Reportes');
  });

  it('Sidebar NO muestra opciones de admin', () => {
    cy.get('.nav-item').should('not.contain', 'Trabajadores');
    cy.get('.nav-item').should('not.contain', 'Panel Admin');
  });

  it('Navega a Registrar Entrada', () => {
    cy.get('.nav-item').contains('Registrar Entrada').click();
    cy.url().should('include', '/attendant/entry');
    cy.get('.card').should('exist');
  });

  it('Navega a Reportes', () => {
    cy.get('.nav-item').contains('Reportes').click();
    cy.url().should('include', '/attendant/reports');
    cy.get('.card').should('exist');
  });

  it('Cierra sesión correctamente', () => {
    cy.get('.btn-logout').click();
    cy.url().should('include', '/login');
  });
});