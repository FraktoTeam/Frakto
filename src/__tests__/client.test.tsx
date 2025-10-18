// src/__tests__/client.test.ts
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  })),
}));

import { createClient } from "@/utils/client";

describe("⚙️ Supabase client", () => {
  it("crea un cliente Supabase válido (mockeado)", () => {
    expect(createClient).toBeDefined();
    expect(typeof createClient.from).toBe("function");
  });
});
