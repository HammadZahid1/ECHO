import { Keyboard } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { KeyCap } from '@/components/ui/KeyCap';
import { Divider } from '@/components/ui/Divider';

interface ShortcutRow {
  keys: string[];
  label: string;
}

const GROUPS: { name: string; rows: ShortcutRow[] }[] = [
  {
    name: 'General',
    rows: [
      { keys: ['Ctrl', 'K'], label: 'Open command palette' },
      { keys: ['Esc'], label: 'Close overlays and clear selection' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
    ],
  },
  {
    name: 'Editing',
    rows: [
      { keys: ['N'], label: 'Create a new node' },
      { keys: ['Del'], label: 'Delete selected node or relationship' },
      { keys: ['Ctrl', 'Z'], label: 'Undo last change' },
      { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo last change' },
      { keys: ['Ctrl', 'Y'], label: 'Redo (alternative)' },
    ],
  },
  {
    name: 'Navigation',
    rows: [
      { keys: ['F'], label: 'Focus the selected node' },
      { keys: ['G'], label: 'Toggle connection mode' },
      { keys: ['H'], label: 'Toggle the inspector panel' },
    ],
  },
];

export function ShortcutsPanel() {
  return (
    <Panel title="Keyboard shortcuts" subtitle="Work at the speed of thought">
      <div className="space-y-3 p-3">
        {GROUPS.map((group, index) => (
          <div key={group.name}>
            {index > 0 && <Divider label={group.name} />}
            {index === 0 && <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{group.name}</h3>}
            <div className="overflow-hidden rounded border border-white/[0.06]">
              <table className="w-full border-collapse text-left">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">Action</th>
                    <th className="px-2.5 py-1.5 text-right text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">Keys</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-white/[0.05]">
                      <td className="px-2.5 py-2 text-[11px] text-zinc-400">{row.label}</td>
                      <td className="px-2.5 py-2 text-right">
                        <span className="inline-flex items-center gap-1">
                          {row.keys.map((key, keyIndex) => (
                            <span key={`${key}-${keyIndex}`} className="inline-flex items-center gap-1">
                              {keyIndex > 0 && <span className="text-[9px] text-zinc-700">+</span>}
                              <KeyCap>{key}</KeyCap>
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="flex items-start gap-1.5 text-[9px] leading-relaxed text-zinc-700"><Keyboard size={10} className="mt-0.5 shrink-0" />On macOS, use ⌘ in place of Ctrl. Shortcuts are ignored while typing in a text field.</p>
      </div>
    </Panel>
  );
}
