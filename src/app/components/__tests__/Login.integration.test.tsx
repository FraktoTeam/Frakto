import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mocks para los iconos (evita dependencias de DOM/SSR)
jest.mock('lucide-react', () => ({
  Eye: () => React.createElement('span', { 'data-testid': 'icon-eye' }, 'Eye'),
  EyeOff: () => React.createElement('span', { 'data-testid': 'icon-eyeoff' }, 'EyeOff'),
  ArrowLeft: () => React.createElement('span', { 'data-testid': 'icon-arrow' }, 'Arrow'),
}));

// Estado controlado del mock del cliente
let mockUserResponse: any = null;
let mockClientError: any = null;
let mockClientThrows = false;

export const createFromMock: jest.Mock = jest.fn((_table: string) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      maybeSingle: async () => {
        if (mockClientThrows) throw new Error('boom');
        return { data: mockUserResponse, error: mockClientError };
      },
    })),
  })),
}));

jest.mock('@/utils/client', () => ({
  createClient: {
    from: (...args: any[]) => createFromMock(...args),
  },
}));

// Mock de bcrypt para controlar el resultado de la comparación
const mockCompareSync = jest.fn();
jest.mock('bcryptjs', () => ({
  compareSync: (...args: any[]) => mockCompareSync(...args),
}));

import { Login } from '../Login';

describe('Login - Integración', () => {
  beforeEach(() => {
    mockUserResponse = null;
    mockClientError = null;
    mockClientThrows = false;
    mockCompareSync.mockReset();
    if (createFromMock && createFromMock.mock) createFromMock.mockClear();
    sessionStorage.clear();
  });

  it('renderiza el formulario y alterna la visibilidad de la contraseña', async () => {
    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);

    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    const pwd = screen.getByLabelText(/^Contraseña$/i) as HTMLInputElement;
    expect(pwd).toBeInTheDocument();
    expect(pwd.type).toBe('password');

    const toggle = pwd.parentElement!.querySelector('button') as HTMLElement;
    expect(toggle).toBeTruthy();
    await userEvent.click(toggle);
    expect(pwd.type).toBe('text');
    await userEvent.click(toggle);
    expect(pwd.type).toBe('password');
  });

  it('muestra errores de validación al enviar vacío', async () => {
    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/El correo electrónico es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/La contraseña es obligatoria/i)).toBeInTheDocument();
  });

  it('no llama al cliente cuando el email es inválido', async () => {
    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(createFromMock).not.toHaveBeenCalled();
  });

  it('muestra error global si el cliente devuelve error', async () => {
    mockClientError = { message: 'db down' };
    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);

    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'sam@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/No se ha podido iniciar sesión/i)).toBeInTheDocument();
  });

  it('muestra error cuando no existe el usuario', async () => {
    mockUserResponse = null;
    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);

    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'noone@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'Abcdef1!');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/Correo o contraseña incorrectos/i)).toBeInTheDocument();
  });

  it('muestra error cuando la contraseña no coincide', async () => {
    mockUserResponse = { id_usuario: 1, nombre_usuario: 'Sam', correo: 'sam@example.com', contrasena: '$2b$10$hash' };
    mockCompareSync.mockReturnValue(false);

    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);

    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'sam@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/Correo o contraseña incorrectos/i)).toBeInTheDocument();
  });

  it('inicia sesión correctamente y llama a onLogin y guarda en sessionStorage', async () => {
    const userSafe = { id_usuario: 2, nombre_usuario: 'Ana', correo: 'ana@example.com' };
    mockUserResponse = { ...userSafe, contrasena: '$2b$10$hash' };
    mockCompareSync.mockReturnValue(true);

    const onLogin = jest.fn();
    render(<Login onLogin={onLogin} onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);

    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'ana@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'rightpass');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('ana@example.com', 'rightpass'));

    const stored = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    expect(stored).toEqual(userSafe);
  });

  it('maneja excepciones lanzadas y muestra error global', async () => {
    mockClientThrows = true;
    render(<Login onSwitchToRegister={() => {}} onBackToLanding={() => {}} />);

    await userEvent.type(screen.getByLabelText(/Correo electrónico/i), 'ana@example.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/i), 'rightpass');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/Ha ocurrido un error inesperado/i)).toBeInTheDocument();
  });
});
