import { Link } from 'wouter';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/app-shell';
import { Button } from '@/components/primitives';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <Logo />
      <div>
        <Compass className="mx-auto text-accent" size={28} />
        <h1 className="mt-4 font-display text-4xl tracking-[-.04em]">Off the ledger.</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          This page doesn't exist. Let's get you back to something real.
        </p>
      </div>
      <Link href="/">
        <Button>Back to Fiscal Insights</Button>
      </Link>
    </div>
  );
}
