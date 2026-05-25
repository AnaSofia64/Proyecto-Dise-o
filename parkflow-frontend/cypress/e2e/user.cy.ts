describe('Usuario - ParkFlow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[placeholder="Ingresa tu usuario"]').type('usuario');
    cy.get('input[type="password"]').type('user123');
    cy.get('form').submit();
    cy.url().should('include', '/user/dashboard');
  });

  it('Dashboard de usuario carga correctamente', () => {
    cy.get('.main-content').should('exist');
    cy.get('.card').should('exist');
  });

  it('Sidebar muestra opciones de usuario', () => {
    cy.get('.nav-item').should('contain', 'Mi Parqueo');
    cy.get('.nav-item').should('contain', 'Ticket & Pago');
  });

  it('Sidebar NO muestra opciones de celador ni admin', () => {
    cy.get('.nav-item').should('not.contain', 'Registrar Entrada');
    cy.get('.nav-item').should('not.contain', 'Trabajadores');
  });

  it('Sección de vehículos existe', () => {
    cy.get('#plates-card').should('exist');
    cy.get('#btn-show-plate-form').should('exist');
  });

  it('Puede abrir formulario para agregar placa', () => {
    cy.get('#btn-show-plate-form').click();
    cy.get('#plate-form').should('be.visible');
    cy.get('#plate-input').should('exist');
    cy.get('#type-input').should('exist');
  });

  it('Navega a Ticket y Pago', () => {
    cy.get('.nav-item').contains('Ticket & Pago').click();
    cy.url().should('include', '/user/ticket');
    cy.get('.card').should('exist');
  });

  it('Cierra sesión correctamente', () => {
    cy.get('.btn-logout').click();
    cy.url().should('include', '/login');
  });
});