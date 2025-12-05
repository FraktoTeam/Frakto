import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Popover, PopoverTrigger, PopoverContent } from '../popover';

describe('Popover UI', () => {
  it('muestra el contenido al hacer click en el trigger y lo oculta al volver a hacer click', async () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Abrir</button>
        </PopoverTrigger>
        <PopoverContent>Contenido del popover</PopoverContent>
      </Popover>,
    );

    // Al inicio no debe mostrarse el contenido
    expect(screen.queryByText(/Contenido del popover/i)).toBeNull();

    // Abrir (usamos getByText para evitar botones anidados de Radix)
    await userEvent.click(screen.getByText(/Abrir/i));
    expect(screen.getByText(/Contenido del popover/i)).toBeInTheDocument();

    // Cerrar volviendo a clickar el trigger
    await userEvent.click(screen.getByText(/Abrir/i));
    expect(screen.queryByText(/Contenido del popover/i)).toBeNull();
  });

  it('cierra el popover al pulsar Escape', async () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Toggle</button>
        </PopoverTrigger>
        <PopoverContent>Escape content</PopoverContent>
      </Popover>,
    );

    await userEvent.click(screen.getByText(/Toggle/i));
    expect(screen.getByText(/Escape content/i)).toBeInTheDocument();

    // Pulsar Escape para cerrar
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText(/Escape content/i)).toBeNull();
  });
});
