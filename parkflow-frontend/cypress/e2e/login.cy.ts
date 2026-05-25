describe('Login - ParkFlow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Login exitoso como celador redirige a dashboard', () => {
    cy.get('input[placeholder="Ingresa tu usuario"]').type('celador');
    cy.get('input[type="password"]').type('1234');
    cy.get('form').submit();
    cy.url().should('include', '/attendant/dashboard');
  });

  it('Login exitoso como admin redirige a panel admin', () => {
    cy.get('input[placeholder="Ingresa tu usuario"]').type('admin');
    cy.get('input[type="password"]').type('admin123');
    cy.get('form').submit();
    cy.url().should('include', '/admin/panel');
  });

  it('Login exitoso como usuario redirige a dashboard usuario', () => {
    cy.get('input[placeholder="Ingresa tu usuario"]').type('usuario');
    cy.get('input[type="password"]').type('user123');
    cy.get('form').submit();
    cy.url().should('include', '/user/dashboard');
  });

  it('Login fallido muestra mensaje de error', () => {
    cy.get('input[placeholder="Ingresa tu usuario"]').type('usuariofalso');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('form').submit();
    cy.get('#login-error').should('be.visible');
    cy.url().should('include', '/login');
  });
});