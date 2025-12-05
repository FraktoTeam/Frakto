import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementsCarousel, PREDEFINED_ACHIEVEMENTS } from '@/app/components/AchievementsCarousel';

jest.mock('lucide-react', () => ({
  __esModule: true,
  Award: (props: any) => <svg data-testid="icon-award" {...props} />,
  Trophy: (props: any) => <svg data-testid="icon-trophy" {...props} />,
  Star: (props: any) => <svg data-testid="icon-star" {...props} />,
  Medal: (props: any) => <svg data-testid="icon-medal" {...props} />,
  Crown: (props: any) => <svg data-testid="icon-crown" {...props} />,
  Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
  ChevronLeft: (props: any) => <svg data-testid="icon-left" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="icon-right" {...props} />,
}));

describe('AchievementsCarousel - Integration', () => {
  it('muestra el conteo de desbloqueados y renderiza tarjetas', () => {
    render(
      <AchievementsCarousel
        completedGoalsCount={1}
        totalSavingsInGoals={0}
        selectedAchievementId={null}
        onSelectAchievement={() => {}}
      />
    );

    // Debe mostrar "1 de 6 desbloqueados"
    expect(screen.getByText(/1 de 6 desbloqueados/)).toBeInTheDocument();

    // Debe mostrar el logro desbloqueado "Primer Paso"
    expect(screen.getByText(/Primer Paso/)).toBeInTheDocument();
  });

  it('llama a onSelectAchievement solo para logros desbloqueados', async () => {
    const onSelect = jest.fn();

    render(
      <AchievementsCarousel
        completedGoalsCount={1}
        totalSavingsInGoals={0}
        selectedAchievementId={null}
        onSelectAchievement={onSelect}
      />
    );

    // Click en logro desbloqueado (Primer Paso)
    const unlocked = screen.getByText('Primer Paso');
    await userEvent.click(unlocked);
    expect(onSelect).toHaveBeenCalledWith('goals_1');

    // Reset mock
    onSelect.mockClear();

    // Click en logro bloqueado (Perseverante)
    const locked = screen.getByText('Perseverante');
    await userEvent.click(locked);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('paginación: avanza y retrocede entre páginas', async () => {
    render(
      <AchievementsCarousel
        completedGoalsCount={0}
        totalSavingsInGoals={0}
        selectedAchievementId={null}
        onSelectAchievement={() => {}}
      />
    );

    // Indicador de página 1 / 2
    const pageIndicator = screen.getByText(/1 \/ 2/);
    expect(pageIndicator).toBeInTheDocument();

    // Obtener el contenedor de navegación (padre del indicador)
    const navContainer = pageIndicator.closest('div');
    expect(navContainer).toBeTruthy();

    // Los botones prev/next estarán como botones dentro del contenedor
    const navButtons = within(navContainer as HTMLElement).getAllByRole('button');
    // El segundo botón es Next
    await userEvent.click(navButtons[1]);

    // Ahora la página debe ser 2 / 2 y deberíamos ver elementos de la segunda página
    expect(screen.getByText(/2 \//)).toBeInTheDocument();
    // Verificar un logro de la segunda página
    expect(screen.getByText(/Ahorrador Novato/)).toBeInTheDocument();

    // Click en Previous
    await userEvent.click(navButtons[0]);
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
    expect(screen.getByText(/Primer Paso/)).toBeInTheDocument();
  });

  it('dispara onNewUnlock cuando aparece un nuevo logro desbloqueado', () => {
    const onNewUnlock = jest.fn();

    const { rerender } = render(
      <AchievementsCarousel
        completedGoalsCount={1}
        totalSavingsInGoals={0}
        selectedAchievementId={null}
        onSelectAchievement={() => {}}
        onNewUnlock={onNewUnlock}
      />
    );

    // Ahora incrementar a 10 (nuevo logro goals_10 debe notificarse)
    rerender(
      <AchievementsCarousel
        completedGoalsCount={10}
        totalSavingsInGoals={0}
        selectedAchievementId={null}
        onSelectAchievement={() => {}}
        onNewUnlock={onNewUnlock}
      />
    );

    // onNewUnlock debe haberse llamado al menos una vez con el logro "goals_10"
    expect(onNewUnlock).toHaveBeenCalled();
    const calledWith = onNewUnlock.mock.calls.map(c => c[0].id);
    expect(calledWith).toContain('goals_10');
  });
});
