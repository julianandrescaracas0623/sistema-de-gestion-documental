import "@testing-library/jest-dom";
import { vi } from "vitest";

// Env validation is skipped under Vitest (see src/shared/lib/env.ts), but code
// under test still reads these values — give them harmless placeholders.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";

vi.mock("next/font/google", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- matches Next.js font export name
  DM_Sans: (): { className: string } => ({ className: "font-dm-sans-test" }),
}));
