// Timing for the hero scene. One "AI use" card goes through four stages in
// CYCLE_MS, then the next example's card takes over. Everything the scene
// shows is derived from the time into the current cycle.
import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';

export const CYCLE_MS = 12000;
export const STAGES = [
  { key: 'describe', label: 'Describe', start: 0 },
  { key: 'check', label: 'Check', start: 2600 },
  { key: 'scan', label: 'Scan', start: 5600 },
  { key: 'record', label: 'Record', start: 8600 },
];
export const TYPE_START = 300;
export const TYPE_MS = 22;
export const ITEMS_SHOWN = 4;

// The three examples with their real checklist and sample scan.
export const SCENE_EXAMPLES = DEMO_EXAMPLES.map((ex) => {
  const preview = landingData.examplePreviews[ex.key];
  const ordered = [...preview.items.filter((i) => i.highPriority), ...preview.items.filter((i) => !i.highPriority)];
  return {
    key: ex.key,
    title: ex.title,
    sentence: ex.sentence,
    useLabel: preview.useCaseLabel,
    tools: preview.tools,
    itemCount: preview.items.length,
    highPriorityCount: preview.items.filter((i) => i.highPriority).length,
    items: ordered.slice(0, ITEMS_SHOWN),
    scan: landingData.exampleScans[ex.key],
  };
});

export function stageIndexAt(t) {
  let index = 0;
  STAGES.forEach((s, i) => { if (t >= s.start) index = i; });
  return index;
}

/** 0 to 1: how far through its own stage the time is. */
export function stageProgress(t) {
  const i = stageIndexAt(t);
  const end = i + 1 < STAGES.length ? STAGES[i + 1].start : CYCLE_MS;
  return Math.min(1, (t - STAGES[i].start) / (end - STAGES[i].start));
}

export const typedCount = (t, length) => Math.max(0, Math.min(length, Math.floor((t - TYPE_START) / TYPE_MS)));
export const chipsAt = (length) => Math.min(TYPE_START + length * TYPE_MS + 150, STAGES[1].start - 200);
export const dropAt = (i) => STAGES[1].start + 250 + i * 330;
export const rowAt = (r) => STAGES[2].start + 500 + r * 380;
export const findingAt = (rows) => rowAt(rows) + 250;
export const tickAt = (i) => STAGES[3].start + 250 + i * 320;
export const FOLD_AT = STAGES[3].start + 1700;
export const STAMP_AT = STAGES[3].start + 2050;

// The sample files use made-up addresses; show only the part before @.
export function displayCell(value) {
  return value.includes('@') ? `${value.split('@')[0]}@…` : value;
}
