// src/__tests__/layout.test.tsx
import Layout from "@/app/layout";

describe("🌐 Layout (sin renderizar <html>)", () => {
  it("devuelve un árbol React válido", () => {
    const tree = Layout({ children: <div>Contenido</div> });
    expect(tree).toBeTruthy();
  });
});
