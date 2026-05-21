import packageJson from '../../../package.json';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] px-6 py-4">
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Pulse Web</h1>
      <span className="text-xs text-[var(--color-text-muted)]">v{packageJson.version}</span>
    </header>
  );
}
