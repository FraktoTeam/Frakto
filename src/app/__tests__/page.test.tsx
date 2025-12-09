// src/__tests__/page.test.tsx (archivo de pruebas)
import { render, screen, waitFor, within } from "@testing-library/react";
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
jest.mock('lucide-react', () => ({
  __esModule: true,
  Home: () => <svg />,
  Briefcase: () => <svg />,
  BarChart3: () => <svg />,
  Settings: () => <svg />,
  Repeat: () => <svg />,
  Mail: () => <svg />,
  FileText: () => <svg />,
  CalendarIcon: () => <svg />,
  User: () => <svg />,
  Target: () => <svg />,
  LogOut: () => <svg />,
  Award: () => <svg />,
  Trophy: () => <svg />,
  Star: () => <svg />,
  Medal: () => <svg />,
  Crown: () => <svg />,
  Sparkles: () => <svg />,
  CheckCircle: () => <svg />,
  TrendingUp: () => <svg />,
  PieChart: () => <svg />,
  Shield: () => <svg />,
  Clock: () => <svg />,
  Calendar: () => <svg />,
  Bell: () => <svg />,
}));

// Mock Analytics so clicking 'Análisis' renders predictable content
jest.mock("@/app/components/Analytics", () => ({ __esModule: true, Analytics: ({ userId }: any) => <div>Analytics Mock {userId}</div> }));
// Mock Goals to allow switching to the goals view easily
jest.mock("@/app/components/Goals", () => ({ __esModule: true, Goals: ({ userId, selectedAchievementId, onSelectAchievement, onActiveGoalsChange }: any) => (
  <div>
    <div>Goals Mock</div>
    <div>selectedAchievement:{String(selectedAchievementId)}</div>
    <button onClick={() => onSelectAchievement?.('award')}>SelectAchievement</button>
    <button onClick={() => onActiveGoalsChange?.(3)}>SetActiveGoals</button>
  </div>
)}));

// Mock Popover primitives to always render trigger and content so tests can access PopoverContent
jest.mock('@/app/components/ui/popover', () => ({
  __esModule: true,
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/app/components/ui/alert-dialog', () => ({
  __esModule: true,
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div role="dialog">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe("🧭 App Page", () => {
  beforeEach(() => {
    // Simular usuario en sessionStorage para que la app muestre la UI autenticada
    sessionStorage.setItem("usuario", JSON.stringify({ id_usuario: 1, correo: "test@local" }));
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renderiza la vista inicial Home por defecto", () => {
    render(<App />);
    return expect(screen.findByText("Home Mock")).resolves.toBeInTheDocument();
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
    const reportLabel = await screen.findByText('Reportes');
    await userEvent.click(reportLabel.closest('button')!);
    expect(await screen.findByText(/Reports Mock/)).toBeInTheDocument();

    // Clicar en Análisis (vista inline) - usamos mock de Analytics
    const analytics = screen.getByText('Análisis');
    await userEvent.click(analytics.closest('button')!);
    expect(await screen.findByText(/Analytics Mock/)).toBeInTheDocument();

    // Clicar en Buzón buscando por texto y no por title
    const buzBtn = screen.getByText('Buzón');
    await userEvent.click(buzBtn.closest('button')!);
    expect(await screen.findByText(/Inbox Mock/)).toBeInTheDocument();

    // Clicar en Calendario
    const cal = screen.getByText('Calendario');
    await userEvent.click(cal.closest('button')!);
    expect(await screen.findByText(/Calendar Mock/)).toBeInTheDocument();
  });

  it('muestra diálogo de cerrar sesión y permite cancelar o confirmar (vuelve a Landing)', async () => {
    render(<App />);

    // Abrir el diálogo de logout desde el PopoverContent (elegir el botón dentro del aside)
    const logoutCandidates = await screen.findAllByText('Cerrar Sesión');
    const logoutBtn = logoutCandidates.find(el => el.closest('aside')) || logoutCandidates[0];
    await userEvent.click(logoutBtn);

    // Debe aparecer el diálogo de confirmación
    expect(await screen.findByText('¿Cerrar sesión?')).toBeInTheDocument();

    // Cancelar mantiene al usuario logueado
    const cancel = screen.getByText('Cancelar');
    await userEvent.click(cancel);
    expect(await screen.findByText('Home Mock')).toBeInTheDocument();

    // Abrir de nuevo y confirmar logout (volver a usar el trigger en el aside)
    const logoutCandidates2 = await screen.findAllByText('Cerrar Sesión');
    const logoutTrigger = logoutCandidates2.find(el => el.closest('aside')) || logoutCandidates2[0];
    await userEvent.click(logoutTrigger);
    // Localizar el diálogo y buscar el botón de confirmación dentro de él
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Cerrar Sesión/ });
    await userEvent.click(confirm);

    // Tras confirmar se muestra la Landing Page (no autenticada)
    expect(await screen.findByText(/Toma el control de tus/)).toBeInTheDocument();
  });

  it('si existe usuario sin id_usuario el renderView devuelve null (no hay Home)', async () => {
    // Poner un usuario sin id_usuario
    sessionStorage.setItem('usuario', JSON.stringify({ id_usuario: null, correo: 'noid@local' }));
    render(<App />);

    // Home Mock no debe estar presente porque userId es null
    expect(screen.queryByText('Home Mock')).toBeNull();

    // El sidebar sigue presente (ej. Buzón)
    expect(await screen.findByText('Buzón')).toBeInTheDocument();
  });
});
