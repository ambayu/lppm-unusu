import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * PageHeader: Header banner publik baku ekosistem UNUSU (LPPM).
 * Latar belakang tema ungu/violet khas LPPM (#2e1065 / #3b0764 / bg-violet-950)
 * dengan aksen titik-titik radial grid pattern dan eyebrow bergaris kiri.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow = 'HALAMAN',
  title,
  description,
  badge,
  children,
}) => {
  return (
    <header className="relative overflow-hidden bg-violet-950 border-b border-violet-900/50 text-white">
      {/* Background Dot Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(#c4b5fd 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* Subtle Glow Orb di sudut kanan atas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {eyebrow && (
          <p className="inline-flex items-center gap-2 border-l-2 border-violet-400 pl-3 text-xs font-bold uppercase tracking-wider text-violet-300">
            {eyebrow}
          </p>
        )}

        <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm sm:text-base leading-relaxed text-violet-100/90">
                {description}
              </p>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
};

export default PageHeader;
