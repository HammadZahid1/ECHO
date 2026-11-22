import { useEffect, useState } from 'react';
import { BarChart3, Compass, Menu, PanelRightClose, PanelRightOpen, Search, SlidersHorizontal, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { IconButton } from '@/components/ui/IconButton';
import { GraphViewport } from '@/components/graph/GraphViewport';
import { Inspector } from '@/components/panels/Inspector';
import { ExplorerPanel } from '@/components/panels/ExplorerPanel';
import { AnalyticsPanel } from '@/components/panels/AnalyticsPanel';
import { HealthPanel } from '@/components/panels/HealthPanel';
import { PathFinderPanel } from '@/components/panels/PathFinderPanel';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { Onboarding } from '@/components/panels/Onboarding';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { ModalHost } from './ModalHost';
import { ContextMenuHost } from './ContextMenuHost';
import { ToastHost } from './ToastHost';

type RightTab = 'inspector' | 'explorer' | 'analytics' | 'health' | 'paths' | 'timeline';

const TABS: { id: RightTab; label: string; icon: React.ReactNode }[] = [
  { id: 'inspector', label: 'Details', icon: <SlidersHorizontal size={12} /> },
  { id: 'explorer', label: 'Explore', icon: <Compass size={12} /> },
  { id: 'analytics', label: 'Metrics', icon: <BarChart3 size={12} /> },
  { id: 'health', label: 'Health', icon: <Search size={12} /> },
  { id: 'paths', label: 'Paths', icon: <PanelRightOpen size={12} /> },
  { id: 'timeline', label: 'Time', icon: <PanelRightClose size={12} /> },
];

export function AppShell() {
  useKeyboardShortcuts();
  const initialize = useGraphStore((state) => state.initialize);
  const initialized = useGraphStore((state) => state.initialized);
  const theme = useSettingsStore((state) => state.theme);
  const accent = useSettingsStore((state) => state.accent);
  const highContrast = useSettingsStore((state) => state.accessibility.highContrast);
  const largeText = useSettingsStore((state) => state.accessibility.largeText);
  const reduceMotion = useSettingsStore((state) => state.accessibility.reduceMotion);
  const panelsVisible = useUIStore((state) => state.panelVisibility);
  const mobileNavOpen = useUIStore((state) => state.mobileNavOpen);
  const setMobileNav = useUIStore((state) => state.setMobileNav);
  const togglePanel = useUIStore((state) => state.togglePanel);
  const [rightTab, setRightTab] = useState<RightTab>('inspector');
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => { if (!initialized) void initialize(); }, [initialize, initialized]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = accent;
    root.classList.toggle('echo-high-contrast', highContrast);
    root.classList.toggle('echo-large-text', largeText);
    root.classList.toggle('echo-reduce-motion', reduceMotion);
  }, [theme, accent, highContrast, largeText, reduceMotion]);

  const rightContent = (() => {
    switch (rightTab) {
      case 'explorer': return <ExplorerPanel />;
      case 'analytics': return <AnalyticsPanel />;
      case 'health': return <HealthPanel />;
      case 'paths': return <PathFinderPanel />;
      case 'timeline': return <TimelinePanel />;
      case 'inspector':
      default: return <Inspector />;
    }
  })();

  return (
    <div className="echo-app flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#08090b] text-zinc-300">
      <div className="relative flex h-12 shrink-0 items-center border-b border-[#1b1f24] bg-[#0b0d10] lg:hidden">
        <IconButton label="Toggle navigation" className="ml-2" onClick={() => setMobileNav(!mobileNavOpen)}><Menu size={15} /></IconButton>
        <span className="ml-2 text-[11px] font-semibold tracking-[0.3em] text-zinc-300">ECHO</span>
        <IconButton label="Close navigation" className="ml-auto mr-2" onClick={() => useUIStore.getState().setSearchOpen(true)}><Search size={14} /></IconButton>
      </div>

      <div className="hidden lg:block"><TopBar /></div>

      <div className="flex min-h-0 flex-1">
        {panelsVisible.sidebar && (
          <div className="echo-sidebar-wrap hidden w-[232px] shrink-0 lg:block 2xl:w-[260px]">
            <ErrorBoundary fallbackTitle="Library unavailable"><Sidebar /></ErrorBoundary>
          </div>
        )}

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/70" onClick={() => setMobileNav(false)} />
            <div className="relative h-full w-[min(300px,85vw)] border-r border-white/10 bg-[#0b0d10] shadow-2xl">
              <IconButton label="Close navigation" className="absolute right-2 top-2 z-10" onClick={() => setMobileNav(false)}><X size={14} /></IconButton>
              <ErrorBoundary fallbackTitle="Library unavailable"><Sidebar /></ErrorBoundary>
            </div>
          </div>
        )}

        <ErrorBoundary>
          <GraphViewport />
        </ErrorBoundary>

        {rightOpen && panelsVisible.inspector && (
          <aside className="echo-right-panel hidden w-[300px] shrink-0 flex-col border-l border-[#1b1f24] bg-[#0b0d10] xl:flex 2xl:w-[340px]">
            <div className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-[#1b1f24] px-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  title={tab.label}
                  aria-current={rightTab === tab.id ? 'page' : undefined}
                  className={`flex h-7 shrink-0 items-center gap-1 rounded px-2 text-[10px] ${rightTab === tab.id ? 'bg-white/[0.07] text-cyan-200' : 'text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300'}`}
                >
                  {tab.icon}<span className="hidden 2xl:inline">{tab.label}</span>
                </button>
              ))}
              <span className="ml-auto" />
              <IconButton label="Hide side panel" size="sm" onClick={() => setRightOpen(false)}><PanelRightClose size={13} /></IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <ErrorBoundary key={rightTab} fallbackTitle="Panel unavailable">{rightContent}</ErrorBoundary>
            </div>
          </aside>
        )}
        {!rightOpen && (
          <IconButton label="Show side panel" className="absolute right-2 top-14 z-30 hidden xl:inline-grid" onClick={() => setRightOpen(true)}><PanelRightOpen size={14} /></IconButton>
        )}
      </div>

      {panelsVisible.status && <StatusBar />}
      <ModalHost />
      <ContextMenuHost />
      <ToastHost />
      <Onboarding />
      {!panelsVisible.inspector && (
        <button type="button" onClick={() => togglePanel('inspector')} className="fixed bottom-9 right-3 z-40 hidden rounded border border-white/10 bg-[#12161b] px-2 py-1 text-[10px] text-zinc-400 xl:block">Show panel</button>
      )}
    </div>
  );
}
