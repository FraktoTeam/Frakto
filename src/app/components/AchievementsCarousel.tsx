import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Award,
  Trophy,
  Star,
  Medal,
  Crown,
  Sparkles,
} from "lucide-react";
import { Badge } from "./ui/badge";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: "award" | "trophy" | "star" | "medal" | "crown" | "sparkles";
  type: "goals_completed" | "savings_amount";
  requirement: number; // número de retos completados o cantidad ahorrada
  unlocked: boolean;
}

interface AchievementsCarouselProps {
  completedGoalsCount: number;
  totalSavingsInGoals: number;
  selectedAchievementId: string | null;
  onSelectAchievement: (achievementId: string) => void;
  onNewUnlock?: (achievement: Achievement) => void;
}

export const PREDEFINED_ACHIEVEMENTS: Omit<Achievement, "unlocked">[] = [
  {
    id: "goals_1",
    name: "Primer Paso",
    description: "Completa 1 reto",
    icon: "award",
    type: "goals_completed",
    requirement: 1,
  },
  {
    id: "goals_10",
    name: "Perseverante",
    description: "Completa 10 retos",
    icon: "medal",
    type: "goals_completed",
    requirement: 10,
  },
  {
    id: "goals_50",
    name: "Maestro del Ahorro",
    description: "Completa 50 retos",
    icon: "crown",
    type: "goals_completed",
    requirement: 50,
  },
  {
    id: "savings_10",
    name: "Ahorrador Novato",
    description: "Ahorra 10 € en metas",
    icon: "star",
    type: "savings_amount",
    requirement: 10,
  },
  {
    id: "savings_100",
    name: "Ahorrador Experto",
    description: "Ahorra 100 € en metas",
    icon: "trophy",
    type: "savings_amount",
    requirement: 100,
  },
  {
    id: "savings_1000",
    name: "Maestro de las Finanzas",
    description: "Ahorra 1.000 € en metas",
    icon: "sparkles",
    type: "savings_amount",
    requirement: 1000,
  },
];

export function AchievementsCarousel({
  completedGoalsCount,
  totalSavingsInGoals,
  selectedAchievementId,
  onSelectAchievement,
  onNewUnlock,
}: AchievementsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousUnlocked, setPreviousUnlocked] = useState<Set<string>>(
    new Set()
  );

  // Calcular qué logros están desbloqueados
  const achievements: Achievement[] = PREDEFINED_ACHIEVEMENTS.map(
    (achievement) => {
      let unlocked = false;

      if (achievement.type === "goals_completed") {
        unlocked = completedGoalsCount >= achievement.requirement;
      } else if (achievement.type === "savings_amount") {
        unlocked = totalSavingsInGoals >= achievement.requirement;
      }

      return {
        ...achievement,
        unlocked,
      };
    }
  );

  // Detectar nuevos desbloqueos
  useEffect(() => {
    const newUnlocked = new Set(
      achievements.filter((a) => a.unlocked).map((a) => a.id)
    );

    achievements.forEach((achievement) => {
      if (
        achievement.unlocked &&
        !previousUnlocked.has(achievement.id)
      ) {
        // Nuevo logro desbloqueado (solo notificar después de la primera carga)
        if (onNewUnlock) {
          onNewUnlock(achievement);
        }
      }
    });

    // Actualizar el set de previamente desbloqueados
    setPreviousUnlocked(newUnlocked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedGoalsCount, totalSavingsInGoals]);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(achievements.length / itemsPerPage);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalPages - 1;

  const visibleAchievements = achievements.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSelectAchievement = (achievement: Achievement) => {
    if (achievement.unlocked) {
      onSelectAchievement(achievement.id);
    }
  };

  const getIcon = (iconType: Achievement["icon"], unlocked: boolean) => {
    const className = `h-8 w-8 ${
      unlocked ? "text-green-600" : "text-gray-400"
    }`;

    switch (iconType) {
      case "award":
        return <Award className={className} />;
      case "trophy":
        return <Trophy className={className} />;
      case "star":
        return <Star className={className} />;
      case "medal":
        return <Medal className={className} />;
      case "crown":
        return <Crown className={className} />;
      case "sparkles":
        return <Sparkles className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-gray-900">
                <Trophy className="h-5 w-5 text-green-600" />
                Logros y Medallas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {achievements.filter((a) => a.unlocked).length} de{" "}
                {achievements.length} desbloqueados
              </p>
            </div>
          </div>

          {/* Carousel */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`cursor-pointer transition-all border-2 ${
                    !achievement.unlocked
                      ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300"
                      : selectedAchievementId === achievement.id
                      ? "border-green-600 bg-green-50 shadow-lg"
                      : "border-green-200 hover:border-green-400 hover:shadow-md bg-white"
                  }`}
                  onClick={() => handleSelectAchievement(achievement)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    {/* Icon */}
                    <div className="flex justify-center">
                      {getIcon(achievement.icon, achievement.unlocked)}
                    </div>

                    {/* Name */}
                    <h4
                      className={`text-sm ${
                        achievement.unlocked
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {achievement.name}
                    </h4>

                    {/* Description */}
                    <p
                      className={`text-xs ${
                        achievement.unlocked
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {achievement.description}
                    </p>

                    {/* Badge */}
                    {achievement.unlocked ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Desbloqueado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-gray-300 text-gray-500"
                      >
                        Bloqueado
                      </Badge>
                    )}

                    {/* Selected indicator */}
                    {selectedAchievementId === achievement.id && (
                      <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span>Seleccionado</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600">
                  {currentIndex + 1} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
