import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('lucide-react', () => ({
  Eye: () => React.createElement('span', { 'data-testid': 'icon-eye' }, 'Eye'),
  EyeOff: () => React.createElement('span', { 'data-testid': 'icon-eyeoff' }, 'EyeOff'),
  Check: () => React.createElement('span', { 'data-testid': 'icon-check' }, 'Check'),
  X: () => React.createElement('span', { 'data-testid': 'icon-x' }, 'X'),
  ArrowLeft: () => React.createElement('span', { 'data-testid': 'icon-arrow' }, 'Arrow'),
}));

let mockInsertResponse: any = null;
let mockInsertError: any = null;
let mockInsertThrows = false;

// exponer un mock `from` espiable para que las pruebas puedan comprobar si se intentó un insert en la BD
export let createFromMock: jest.Mock;
createFromMock = jest.fn((_table: string) => ({
  insert: jest.fn((_arr: any[]) => ({
    select: jest.fn((_sel: string) => ({
      single: async () => {
        if (mockInsertThrows) throw new Error('boom');
        return { data: mockInsertResponse, error: mockInsertError };
      },
    })),
  })),
}));

jest.mock('@/utils/client', () => ({
  createClient: {
    from: (...args: any[]) => createFromMock(...args),
  },
}));

import { Register } from '../Register';

describe('Registro - Integración', () => {
  beforeEach(() => {
    mockInsertResponse = null;
    mockInsertError = null;
    mockInsertThrows = false;
    if (createFromMock && createFromMock.mock) createFromMock.mockClear();
    sessionStorage.clear();
  });

  it('renderiza el formulario y alterna la visibilidad de la contraseña', async () => {
    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);

    // Campos básicos presentes
    expect(screen.getByLabelText(/Nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    const pwd = screen.getByLabelText(/^Contraseña$/i) as HTMLInputElement;
    expect(pwd).toBeInTheDocument();
    expect(pwd.type).toBe('password');

    // Alternar visibilidad de contraseña
    const toggleBtn = pwd.parentElement!.querySelector('button') as HTMLElement;
    expect(toggleBtn).toBeTruthy();
    await userEvent.click(toggleBtn);
    expect(pwd.type).toBe('text');
    await userEvent.click(toggleBtn);
    expect(pwd.type).toBe('password');
  });

  it('muestra errores de validación al enviar formulario vacío', async () => {
    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    expect(await screen.findByText(/El nombre de usuario es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/El correo electrónico es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/La contraseña es obligatoria/i)).toBeInTheDocument();
    expect(await screen.findByText(/Debes confirmar tu contraseña/i)).toBeInTheDocument();
  });

  it('muestra error de validación de email para email inválido', async () => {
    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Nombre de usuario/i), 'Sam');
    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.type(screen.getByLabelText(/Confirmar contraseña/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    // Asegurar que no intentamos insertar en la BD cuando la validación falla
    expect(createFromMock).not.toHaveBeenCalled();
  });

  it('muestra requisitos de contraseña y previene el envío hasta cumplirlos', async () => {
    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'short');

    expect(screen.getByText(/Mínimo 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/Al menos 1 mayúscula/i)).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: /Crear Cuenta/i }) as HTMLButtonElement;
    expect(submit).toBeDisabled();
  });

  it('envía correctamente y guarda en sessionStorage', async () => {
    const newUser = { id_usuario: 42, nombre_usuario: 'Sam', correo: 'sam@example.com' };
    mockInsertResponse = newUser;
    mockInsertError = null;

    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Nombre de usuario/i), 'Sam');
    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'sam@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.type(screen.getByLabelText(/Confirmar contraseña/i), 'Abcdef1!');

    const submit = screen.getByRole('button', { name: /Crear Cuenta/i });
    await userEvent.click(submit);

    // Should show loading text then success message
    await waitFor(() => expect(screen.getByText(/Cuenta creada correctamente/i)).toBeInTheDocument());

    const stored = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    expect(stored).toEqual(newUser);
  });

  it('muestra error por email duplicado (23505) cuando insert devuelve ese código', async () => {
    mockInsertResponse = null;
    mockInsertError = { code: '23505' };

    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Nombre de usuario/i), 'Sam');
    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'sam@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.type(screen.getByLabelText(/Confirmar contraseña/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    expect(await screen.findByText(/Correo electrónico no válido/i)).toBeInTheDocument();
  });

  it('muestra error genérico al insertar si el error no es 23505', async () => {
    mockInsertResponse = null;
    mockInsertError = { code: 'OTHER' };

    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Nombre de usuario/i), 'Sam');
    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'sam@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.type(screen.getByLabelText(/Confirmar contraseña/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    expect(await screen.findByText(/No se ha podido crear la cuenta/i)).toBeInTheDocument();
  });

  it('maneja excepciones inesperadas y muestra error global', async () => {
    // Simular excepción lanzada activando la bandera del mock
    mockInsertThrows = true;

    render(<Register onSwitchToLogin={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Nombre de usuario/i), 'Sam');
    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'sam@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.type(screen.getByLabelText(/Confirmar contraseña/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    expect(await screen.findByText(/Ha ocurrido un error inesperado/i)).toBeInTheDocument();
  });
});
