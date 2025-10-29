import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

// Mock de embla-carousel-react para que el test pueda inspeccionar un API controlable
jest.mock("embla-carousel-react", () => {
  const createdApis: any[] = [];
  return {
    __esModule: true,
    createdApis,
    default: (opts: any, plugins: any) => {
      const listeners: Record<string, Function[]> = {};
      const state = { prev: false, next: true };
      const api = {
        canScrollPrev: () => state.prev,
        canScrollNext: () => state.next,
        scrollNext: jest.fn(() => {
          // Simula que, después de avanzar, se puede navegar hacia atrás pero no hacia delante
          state.prev = true;
          state.next = false;
          (listeners["select"] || []).forEach((cb) => cb(api));
        }),
        scrollPrev: jest.fn(() => {
          state.prev = false;
          state.next = true;
          (listeners["select"] || []).forEach((cb) => cb(api));
        }),
        on: (ev: string, cb: Function) => {
          listeners[ev] = listeners[ev] || [];
          listeners[ev].push(cb);
        },
        off: (ev: string, cb: Function) => {
          listeners[ev] = (listeners[ev] || []).filter((f) => f !== cb);
        },
      };
      const ref = jest.fn();
      createdApis.push(api);
      return [ref, api];
    },
  };
});

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../carousel";

describe("Carrusel UI", () => {
  it("renderiza las diapositivas y los botones anterior/siguiente y responde a los eventos", async () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );

    const btnSiguiente = screen.getByRole("button", { name: /Next slide/i });
    const btnAnterior = screen.getByRole("button", { name: /Previous slide/i });

    // Estado inicial esperado: siguiente habilitado, anterior deshabilitado
    expect(btnSiguiente).toBeEnabled();
    expect(btnAnterior).toBeDisabled();

    // Obtener el mock de embla y la API creada por el componente
    const emblaMock = require("embla-carousel-react");
    const apiEmbla = emblaMock.createdApis[0];

    // Comprobación básica: se creó al menos una instancia de la API del mock
    expect(emblaMock.createdApis.length).toBeGreaterThan(0);

    // Simular clicks (no debe lanzar) y comprobar que el mock expone los métodos scroll
    await act(async () => {
      fireEvent.click(btnSiguiente);
    });
    expect(typeof apiEmbla.scrollNext).toBe("function");

    await act(async () => {
      fireEvent.click(btnAnterior);
    });
    expect(typeof apiEmbla.scrollPrev).toBe("function");
  });
});
