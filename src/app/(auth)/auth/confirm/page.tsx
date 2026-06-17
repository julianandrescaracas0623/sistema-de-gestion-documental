import { AuthConfirmCard } from "@/features/auth/components/auth-confirm-card";

export default function AuthConfirmPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-sidebar px-4 py-10">
      <div className="relative z-[1] w-full max-w-[380px]">
        <AuthConfirmCard />
      </div>
    </main>
  );
}
