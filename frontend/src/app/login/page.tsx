"use client";

import { login, post } from "@/api/common";
import Logo from "@/components/app/logo";
import SubmitButton from "@/components/common/submit";
import { Input } from "@/components/ui/input";
import { useForm } from "@/hooks/form";
import { sleep } from "@/lib/utils";

interface LoginResponse {
  refresh: string;
  access: string;
}

export default function LoginPage() {
  const { useField, error, working, reset, submit } = useForm();

  const [id, setId] = useField("");

  const handleSubmit = submit(async () => {
    const { access, refresh } = await post<LoginResponse>("/api/auth/login", { uwa_id: id });
    login(access, refresh);
    await sleep(60 * 1000); // keep button display working state until redirection
  });

  return (
    <div className="bg-primary relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="bg-background text-foreground z-1 flex max-w-96 flex-col gap-4 rounded-lg p-8">
        <div>
          <Logo variant="dark" />
        </div>
        <div className="text-muted-foreground text-sm">
          This is a placeholder login screen to be replaced by UWA SSO.
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm">UWA ID</label>
          <Input placeholder="e.g. 12345678" value={id} onValueChange={setId} />
          <div className="text-destructive text-sm empty:hidden">{error}</div>
        </div>

        <SubmitButton disabled={working} onClick={handleSubmit}>
          Log In
        </SubmitButton>
      </div>
    </div>
  );
}
