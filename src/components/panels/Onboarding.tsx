import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Layers, Network, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';

interface TourStep {
  title: string;
  icon: ReactNode;
  body: string;
  points: string[];
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to ECHO',
    icon: <Sparkles size={18} />,
    body: 'Your local-first knowledge universe. Everything you create stays in this browser — nothing is uploaded.',
    points: [
      'Switch between workspaces from the header or Workspaces panel.',
      'Start from a curated demo universe or create a blank one.',
      'Changes auto-save locally as you work.',
    ],
  },
  {
    title: 'Build your graph',
    icon: <Layers size={18} />,
    body: 'Knowledge is made of nodes and the relationships between them. Capture ideas fast, then connect them.',
    points: [
      'Press N to create a node, or use the create tool in the toolbar.',
      'Press G to toggle connection mode and link two nodes.',
      'Use the inspector to add descriptions, tags and types.',
    ],
  },
  {
    title: 'Explore connections',
    icon: <Network size={18} />,
    body: 'ECHO offers several views for the same graph, plus analysis tools that run entirely on your device.',
    points: [
      'Switch views from the top navigation: 3D, 2D, radial, timeline and more.',
      'Path finder traces relationship chains between any two nodes.',
      'Analytics and Health surface structure, distributions and local heuristics.',
    ],
  },
  {
    title: 'Capture & share',
    icon: <Compass size={18} />,
    body: 'Snapshots mark moments in time; import and export keep your knowledge portable.',
    points: [
      'Save a named snapshot before a big change, then restore or compare it later.',
      'Import JSON, CSV, Markdown or plain text and preview before merging.',
      'Export graphs, workspaces and snapshots as open formats.',
    ],
  },
];

export function Onboarding() {
  const showOnboarding = useSettingsStore((state) => state.showOnboarding);
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const modal = useUIStore((state) => state.modal);
  const closeModal = useUIStore((state) => state.closeModal);
  const [step, setStep] = useState(0);

  const open = (showOnboarding && !onboardingComplete) || modal === 'onboarding';
  const current = STEPS[step] ?? STEPS[0];

  const finish = (): void => {
    completeOnboarding();
    closeModal();
    setStep(0);
  };

  const next = (): void => {
    if (step === STEPS.length - 1) { finish(); return; }
    setStep((value) => value + 1);
  };

  return (
    <Modal
      open={open}
      title={`${current.title} · ${step + 1} of ${STEPS.length}`}
      description="A quick tour of the essentials"
      onClose={finish}
      width="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={finish}>Skip tour</Button>
          {step > 0 && <Button variant="secondary" icon={<ArrowLeft size={12} />} onClick={() => setStep((value) => value - 1)}>Back</Button>}
          <Button variant="primary" icon={step === STEPS.length - 1 ? <Check size={12} /> : <ArrowRight size={12} />} onClick={next}>
            {step === STEPS.length - 1 ? 'Start exploring' : 'Next'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid h-28 place-items-center rounded-md border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-transparent to-violet-400/[0.08] text-cyan-200">
          <div className="flex flex-col items-center gap-2">
            {current.icon}
            <span className="text-sm font-medium tracking-wide text-zinc-200">{current.title}</span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">{current.body}</p>
        <ul className="space-y-2">
          {current.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
              <Check size={12} className="mt-0.5 shrink-0 text-cyan-400/70" />{point}
            </li>
          ))}
        </ul>
        <div className="flex justify-center gap-1.5 pt-1">
          {STEPS.map((tourStep, index) => (
            <button
              key={tourStep.title}
              type="button"
              aria-label={`Go to step ${index + 1}`}
              onClick={() => setStep(index)}
              className={`h-1.5 rounded-full transition-all ${index === step ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/15 hover:bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
