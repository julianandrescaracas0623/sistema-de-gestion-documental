import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/font/google", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- matches Next.js font export name
  DM_Sans: (): { className: string } => ({ className: "font-dm-sans-test" }),
}));
