import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SubmitButton({ disabled, children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button disabled={disabled} {...props}>
      {disabled ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}
