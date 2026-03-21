// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">NextFlow</span>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorBackground: "#111111",
              colorText: "#e5e5e5",
              colorPrimary: "#7c3aed",
              colorInputBackground: "#1a1a1a",
              colorInputText: "#e5e5e5",
              borderRadius: "8px",
            },
          }}
        />
      </div>
    </div>
  );
}
