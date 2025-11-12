// src/__tests__/page.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import App from "@/app/page";

// Mock Home so we can simulate selecting a portfolio via the provided prop
jest.mock("@/app/components/Home", () => ({ __esModule: true, Home: ({ onSelectPortfolio }: any) => (
  <div>
    <div>Home Mock</div>
    <button onClick={() => Promise.resolve().then(() => onSelectPortfolio?.(7))}>Select Portfolio</button>
  </div>
)}));

// Mock Portfolio so we can receive props and allow navigating back
jest.mock("@/app/components/Portfolio", () => ({ __esModule: true, Portfolio: ({ selectedId, previousView, onNavigateBack }: any) => (
  <div>
    <div>Portfolio Mock</div>
    <div>selected:{String(selectedId)}</div>
    <div>previous:{String(previousView)}</div>
    <button onClick={() => onNavigateBack?.("home")}>Back</button>
  </div>
)}));

// Mock other heavy components used in the page so tests are focused
jest.mock("@/app/components/Reports", () => ({ __esModule: true, Reports: ({ userId }: any) => <div>Reports Mock {userId}</div> }));
jest.mock("@/app/components/FixedExpenses", () => ({ __esModule: true, FixedExpenses: () => <div>FixedExpenses Mock</div> }));
jest.mock("@/app/components/Inbox", () => ({ __esModule: true, default: ({ userId }: any) => <div>Inbox Mock {userId}</div> }));
jest.mock("@/app/components/Calendar", () => ({ __esModule: true, Calendar: () => <div>Calendar Mock</div> }));
jest.mock("@/app/components/AlertBanner", () => ({ __esModule: true, default: ({ userId }: any) => <div>AlertMock {userId}</div> }));

// Mock lucide-react icons used by the layout to simple functional components
jest.mock('lucide-react', () => ({ __esModule: true, Home: () => <svg />, Briefcase: () => <svg />, BarChart3: () => <svg />, Settings: () => <svg />, Repeat: () => <svg />, Mail: () => <svg />, FileText: () => <svg />, CalendarIcon: () => <svg /> }));

describe("🧭 App Page", () => {
  it("renderiza la vista inicial Home por defecto", () => {
    render(<App />);
    expect(screen.getByText("Home Mock")).toBeInTheDocument();
  });

  it('navega a Portfolio al seleccionar una cartera desde Home y permite volver', async () => {
    render(<App />);

  // Home mock has a button to select a portfolio
  const selectBtn = screen.getByRole('button', { name: /Select Portfolio/i });
  await userEvent.click(selectBtn);

    // Portfolio mock should be rendered with the selected id
    expect(await screen.findByText('Portfolio Mock')).toBeInTheDocument();
    // the DOM shows 'selected:' and the id separated into nodes, so
    // match with a function that checks text content across the element
    await waitFor(() => {
      const nodes = Array.from(document.querySelectorAll('div'));
      if (!nodes.some(n => /selected:\s*7/.test(n.textContent || ''))) {
        throw new Error('selected id not found yet');
      }
    });
    expect(screen.getByText(/previous:home/)).toBeInTheDocument();

  // Click the back button in Portfolio mock and expect Home again
  const back = screen.getByRole('button', { name: /Back/i });
  await userEvent.click(back);
  expect(await screen.findByText('Home Mock')).toBeInTheDocument();
  });

  it('navega entre vistas del sidebar (Reportes, Análisis, Buzón, Calendario)', async () => {
    render(<App />);

    // Click Reportes
    const reportLabel = screen.getByText('Reportes');
  await userEvent.click(reportLabel.closest('button')!);
  expect(await screen.findByText(/Reports Mock/)).toBeInTheDocument();

    // Click Análisis (inline view)
    const analytics = screen.getByText('Análisis');
  await userEvent.click(analytics.closest('button')!);
  expect(await screen.findByText(/Próximamente disponible/)).toBeInTheDocument();

    // Click Buzón via title attribute button
  const buzBtn = screen.getByTitle('Buzón');
  await userEvent.click(buzBtn);
  expect(await screen.findByText(/Inbox Mock/)).toBeInTheDocument();

    // Click Calendario
    const cal = screen.getByText('Calendario');
  await userEvent.click(cal.closest('button')!);
  expect(await screen.findByText(/Calendar Mock/)).toBeInTheDocument();
  });
});
