// src/__tests__/page.test.tsx (archivo de pruebas)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import App from "@/app/page";

// Mock de Home para simular la selección de una cartera vía la prop proporcionada
jest.mock("@/app/components/Home", () => ({ __esModule: true, Home: ({ onSelectPortfolio }: any) => (
  <div>
    <div>Home Mock</div>
    <button onClick={() => Promise.resolve().then(() => onSelectPortfolio?.(7))}>Select Portfolio</button>
  </div>
)}));

// Mock de Portfolio para recibir props y permitir navegar de vuelta
jest.mock("@/app/components/Portfolio", () => ({ __esModule: true, Portfolio: ({ selectedId, previousView, onNavigateBack }: any) => (
  <div>
    <div>Portfolio Mock</div>
    <div>selected:{String(selectedId)}</div>
    <div>previous:{String(previousView)}</div>
    <button onClick={() => onNavigateBack?.("home")}>Back</button>
  </div>
)}));

// Mocks de otros componentes pesados usados en la página para centrar las pruebas
jest.mock("@/app/components/Reports", () => ({ __esModule: true, Reports: ({ userId }: any) => <div>Reports Mock {userId}</div> }));
jest.mock("@/app/components/FixedExpenses", () => ({ __esModule: true, FixedExpenses: () => <div>FixedExpenses Mock</div> }));
jest.mock("@/app/components/Inbox", () => ({ __esModule: true, default: ({ userId }: any) => <div>Inbox Mock {userId}</div> }));
jest.mock("@/app/components/Calendar", () => ({ __esModule: true, Calendar: () => <div>Calendar Mock</div> }));
jest.mock("@/app/components/AlertBanner", () => ({ __esModule: true, default: ({ userId }: any) => <div>AlertMock {userId}</div> }));

// Mock de iconos de lucide-react usados por el layout como componentes funcionales simples
jest.mock('lucide-react', () => ({ __esModule: true, Home: () => <svg />, Briefcase: () => <svg />, BarChart3: () => <svg />, Settings: () => <svg />, Repeat: () => <svg />, Mail: () => <svg />, FileText: () => <svg />, CalendarIcon: () => <svg /> }));

describe("🧭 App Page", () => {
  it("renderiza la vista inicial Home por defecto", () => {
    render(<App />);
    expect(screen.getByText("Home Mock")).toBeInTheDocument();
  });

  it('navega a Portfolio al seleccionar una cartera desde Home y permite volver', async () => {
    render(<App />);

  // El mock de Home tiene un botón para seleccionar una cartera
  const selectBtn = screen.getByRole('button', { name: /Select Portfolio/i });
  await userEvent.click(selectBtn);

    // El mock de Portfolio debería renderizarse con el id seleccionado
    expect(await screen.findByText('Portfolio Mock')).toBeInTheDocument();
    // El DOM muestra 'selected:' y el id en nodos separados, por lo que
    // comprobamos con una función que revisa el contenido de texto en los elementos
    await waitFor(() => {
      const nodes = Array.from(document.querySelectorAll('div'));
      if (!nodes.some(n => /selected:\s*7/.test(n.textContent || ''))) {
        throw new Error('selected id not found yet');
      }
    });
    expect(screen.getByText(/previous:home/)).toBeInTheDocument();

  // Hacer clic en el botón de volver en el mock de Portfolio y esperar Home otra vez
  const back = screen.getByRole('button', { name: /Back/i });
  await userEvent.click(back);
  expect(await screen.findByText('Home Mock')).toBeInTheDocument();
  });

  it('navega entre vistas del sidebar (Reportes, Análisis, Buzón, Calendario)', async () => {
    render(<App />);

    // Clicar en Reportes
    const reportLabel = screen.getByText('Reportes');
  await userEvent.click(reportLabel.closest('button')!);
  expect(await screen.findByText(/Reports Mock/)).toBeInTheDocument();

    // Clicar en Análisis (vista inline)
    const analytics = screen.getByText('Análisis');
  await userEvent.click(analytics.closest('button')!);
  expect(await screen.findByText(/Próximamente disponible/)).toBeInTheDocument();

    // Clicar en Buzón mediante el botón con atributo title
  const buzBtn = screen.getByTitle('Buzón');
  await userEvent.click(buzBtn);
  expect(await screen.findByText(/Inbox Mock/)).toBeInTheDocument();

    // Clicar en Calendario
    const cal = screen.getByText('Calendario');
  await userEvent.click(cal.closest('button')!);
  expect(await screen.findByText(/Calendar Mock/)).toBeInTheDocument();
  });
});
