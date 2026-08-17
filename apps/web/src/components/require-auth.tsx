import { useEffect, type ComponentType } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-auth";
import { LoadingState } from "@/components/status";

export function RequireAuth({ component: Component }: { component: ComponentType }) {
  const { data, isLoading, isError } = useCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (isError || !data)) {
      setLocation("/login");
    }
  }, [isLoading, isError, data, setLocation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <LoadingState label="Checking your session" />
        </div>
      </div>
    );
  }

  if (isError || !data) return null;

  return <Component />;
}
