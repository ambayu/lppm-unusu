import React from 'react';

interface DashboardPageTemplateProps {
  title: string;
  description: string;
  badge: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardPageTemplate({ title, description, badge, actions, children }: DashboardPageTemplateProps) {
  return (
    <div className="space-y-6">
      <section aria-label="Sambutan panel LPPM" className="relative overflow-hidden rounded-[16px] border border-violet-950 bg-gradient-to-br from-violet-900 via-violet-800 to-violet-700 text-white">
        <div className="px-5 py-6 sm:px-7 sm:py-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">{badge}</span>
            <h1 className="mt-2.5 text-xl sm:text-2xl font-bold leading-snug">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-violet-50/90 leading-relaxed">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      </section>
      {children}
    </div>
  );
}
