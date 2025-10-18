// src/__tests__/page.test.tsx
import { render, screen } from "@testing-library/react";
import App from "@/app/page";

jest.mock("@/app/components/Home", () => ({
  Home: () => <div>Home Mock</div>,
}));
jest.mock("@/app/components/Portfolio", () => ({
  Portfolio: () => <div>Portfolio Mock</div>,
}));

describe("🧭 App Page", () => {
  it("renderiza la vista inicial Home por defecto", () => {
    render(<App />);
    expect(screen.getByText("Home Mock")).toBeInTheDocument();
  });
});
