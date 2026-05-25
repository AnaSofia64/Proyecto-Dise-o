describe('Admin - ParkFlow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[placeholder="Ingresa tu usuario"]').type('admin');
    cy.get('input[type="password"]').type('admin123');
    cy.get('form').submit();
    cy.url().should('include', '/admin/panel');
  });

  it('Panel admin carga correctamente', () => {
    cy.get('.main-content').should('exist');
    cy.get('.card').should('exist');
  });

  it('Sidebar muestra opciones de admin', () => {
    cy.get('.nav-item').should('contain', 'Panel Admin');
    cy.get('.nav-item').should('contain', 'Trabajadores');
  });

  it('Navega a gestión de trabajadores', () => {
    cy.get('.nav-item').contains('Trabajadores').click();
    cy.url().should('include', '/admin/workers');
    cy.get('.card').should('exist');
  });

  it('Admin no puede acceder a rutas de usuario', () => {
    cy.visit('/user/dashboard');
    cy.url().should('not.include', '/user/dashboard');
  });

  it('Cierra sesión correctamente', () => {
    cy.get('.btn-logout').click();
    cy.url().should('include', '/login');
  });
});