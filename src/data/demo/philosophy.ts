import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const philosophyDataset: DemoDataset = {
  id: 'philosophy',
  name: 'Philosophy',
  description:
    'A conversation across two millennia: classical metaphysics and virtue, the rationalist–empiricist divide, Kantian ethics, existential freedom, and the questions that connect them.',
  accent: '#e88fb8',
  topics: ['Metaphysics', 'Epistemology', 'Ethics', 'Existentialism'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'phil-field',
        title: 'Philosophy',
        description:
          'The critical study of fundamental questions about knowledge, reality, mind, and values. Its subfields are defined as much by recurring problems as by agreed-upon methods.',
        type: 'concept',
        tags: ['field'],
        importance: 1,
      }),
      createNode({
        ...stamp,
        id: 'phil-socrates',
        title: 'Socrates',
        description:
          'An Athenian philosopher known for the elenctic method: probing interlocutors until their claims contradict themselves. He wrote nothing himself and is known chiefly through Plato and Xenophon.',
        type: 'person',
        tags: ['person', 'antiquity'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'phil-plato',
        title: 'Plato',
        description:
          'A student of Socrates who founded the Academy and wrote dialogues on justice, knowledge, and the nature of reality. His early dialogues preserve Socratic questioning; later ones develop his own metaphysics.',
        type: 'person',
        tags: ['person', 'antiquity'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'phil-aristotle',
        title: 'Aristotle',
        description:
          'A student of Plato whose works range from logic and biology to ethics and politics. He grounded his analysis in observed substances and purposeful change rather than transcendent forms.',
        type: 'person',
        tags: ['person', 'antiquity'],
        importance: 0.92,
      }),
      createNode({
        ...stamp,
        id: 'phil-trial',
        title: 'Trial of Socrates (399 BCE)',
        description:
          'The Athenian trial that convicted Socrates of corrupting the youth and impiety. His defense and death became a founding story about philosophy’s relation to the city.',
        type: 'event',
        tags: ['event', 'history'],
        importance: 0.76,
        metadata: { year: -399, location: 'Athens' },
      }),
      createNode({
        ...stamp,
        id: 'phil-forms',
        title: 'Theory of Forms',
        description:
          'Plato’s claim that perfect, changeless Forms are the true objects of knowledge and that particular things participate in them. It remains one of the most debated doctrines in metaphysics.',
        type: 'research',
        tags: ['metaphysics', 'platonism'],
        importance: 0.84,
        references: ['Plato, Republic, Books V–VII'],
      }),
      createNode({
        ...stamp,
        id: 'phil-virtue',
        title: 'Virtue ethics',
        description:
          'An approach to ethics that takes the character and practical wisdom of a good person as primary. It asks what a virtuous agent would do rather than applying a single decision rule.',
        type: 'concept',
        tags: ['ethics'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'phil-nicomachean',
        title: 'Nicomachean Ethics',
        description:
          'Aristotle’s treatise on eudaimonia, habituated virtue, friendship, and the role of practical reason in living well. It is the foundational text of virtue ethics.',
        type: 'resource',
        tags: ['book', 'ethics'],
        importance: 0.82,
        references: ['Aristotle, Nicomachean Ethics'],
      }),
      createNode({
        ...stamp,
        id: 'phil-kant',
        title: 'Immanuel Kant',
        description:
          'An Enlightenment philosopher who sought the conditions of possible experience and a universal basis for morality. His critical project reshaped both epistemology and ethics.',
        type: 'person',
        tags: ['person', 'enlightenment'],
        importance: 0.92,
      }),
      createNode({
        ...stamp,
        id: 'phil-categorical',
        title: 'Categorical imperative',
        description:
          'Kant’s principle that one should act only on maxims that could be willed as universal law, treating rational beings always as ends in themselves. It is a deontological test of moral permissibility.',
        type: 'concept',
        tags: ['ethics', 'deontology'],
        importance: 0.84,
        references: ['Kant, Groundwork of the Metaphysics of Morals (1785)'],
        metadata: { year: 1785 },
      }),
      createNode({
        ...stamp,
        id: 'phil-critique',
        title: 'Critique of Pure Reason',
        description:
          'Kant’s 1781 examination of how experience and knowledge are possible, arguing that space, time, and categories are contributions of the understanding. It introduced the idea of attending to conditions of experience.',
        type: 'resource',
        tags: ['book', 'epistemology'],
        importance: 0.88,
        references: ['Kant, Critique of Pure Reason (1781; revised 1787)'],
        metadata: { year: 1781 },
      }),
      createNode({
        ...stamp,
        id: 'phil-hume',
        title: 'David Hume',
        description:
          'A Scottish empiricist who questioned causation, induction, and the reach of reason in morals. His skepticism about necessary connection challenged rationalist metaphysics.',
        type: 'person',
        tags: ['person', 'enlightenment'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'phil-empiricism',
        title: 'Empiricism',
        description:
          'The view that knowledge originates primarily in sensory experience. Empiricists typically deny that the mind begins with substantive innate ideas.',
        type: 'concept',
        tags: ['epistemology'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'phil-rationalism',
        title: 'Rationalism',
        description:
          'The view that reason, rather than sense experience alone, is a primary source of knowledge. Seventeenth-century rationalists often modeled philosophy on mathematics.',
        type: 'concept',
        tags: ['epistemology'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'phil-epistemology',
        title: 'Epistemology',
        description:
          'The branch of philosophy concerned with the nature, sources, limits, and justification of knowledge. It asks what it takes for a belief to count as knowledge rather than mere opinion.',
        type: 'concept',
        tags: ['field', 'epistemology'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'phil-skepticism',
        title: 'Pyrrhonian skepticism',
        description:
          'An ancient tradition that suspends judgment about non-evident matters in order to achieve tranquility. Its arguments about the unreliability of the senses were revived in early modern philosophy.',
        type: 'concept',
        tags: ['epistemology', 'history'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'phil-descartes',
        title: 'René Descartes',
        description:
          'A rationalist philosopher who introduced systematic methodic doubt and a sharp distinction between mind and body. His project sought indubitable foundations for knowledge.',
        type: 'person',
        tags: ['person', 'rationalism'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'phil-cogito',
        title: 'Cogito ergo sum',
        description:
          'Descartes’s first-person certainty that thinking implies existence. It serves as the starting point from which he attempts to rebuild knowledge after radical doubt.',
        type: 'research',
        tags: ['epistemology', 'rationalism'],
        importance: 0.82,
        references: ['Descartes, Discourse on Method (1637); Meditations on First Philosophy (1641)'],
      }),
      createNode({
        ...stamp,
        id: 'phil-existentialism',
        title: 'Existentialism',
        description:
          'A twentieth-century movement emphasizing concrete human existence, freedom, and the creation of meaning in a world without predetermined essence.',
        type: 'concept',
        tags: ['movement'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'phil-sartre',
        title: 'Jean-Paul Sartre',
        description:
          'A philosopher and novelist who argued that existence precedes essence and that people are condemned to be free. He connected existentialist ontology with political commitment.',
        type: 'person',
        tags: ['person', 'movement'],
        importance: 0.8,
        metadata: { year: 1943, work: 'Being and Nothingness' },
      }),
      createNode({
        ...stamp,
        id: 'phil-utilitarianism',
        title: 'Utilitarianism',
        description:
          'A consequentialist theory holding that actions are right insofar as they promote overall well-being. Jeremy Bentham founded the doctrine and John Stuart Mill gave it a famous defense.',
        type: 'concept',
        tags: ['ethics'],
        importance: 0.82,
        references: ['Mill, Utilitarianism (1861)'],
      }),
      createNode({
        ...stamp,
        id: 'phil-mill',
        title: 'John Stuart Mill',
        description:
          'A philosopher and economist who defended utilitarianism, liberty, and a broad conception of individuality. On Liberty argues for protecting freedom against both state and social coercion.',
        type: 'person',
        tags: ['person', 'ethics'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'phil-ethics',
        title: 'Ethics',
        description:
          'The study of moral value, obligation, and the good life. Its major traditions include virtue ethics, deontology, and consequentialism.',
        type: 'concept',
        tags: ['field', 'ethics'],
        importance: 0.92,
      }),
      createNode({
        ...stamp,
        id: 'phil-freewill',
        title: 'Problem of free will',
        description:
          'The question of how deliberate choice can be reconciled with causal determinism, divine foreknowledge, or scientific explanation. Positions range from compatibilism to hard determinism and libertarianism.',
        type: 'question',
        tags: ['metaphysics', 'ethics'],
        importance: 0.8,
      }),
    ],
    edges: [
      createEdge('phil-field', 'phil-epistemology', { ...stamp, id: 'phil-edge-01', type: 'contains', label: 'includes' }),
      createEdge('phil-field', 'phil-ethics', { ...stamp, id: 'phil-edge-02', type: 'contains', label: 'includes' }),
      createEdge('phil-field', 'phil-existentialism', { ...stamp, id: 'phil-edge-03', type: 'contains', label: 'includes the movement' }),
      createEdge('phil-socrates', 'phil-plato', { ...stamp, id: 'phil-edge-04', type: 'influences', label: 'shaped the method and concerns of', directed: true }),
      createEdge('phil-plato', 'phil-aristotle', { ...stamp, id: 'phil-edge-05', type: 'influences', label: 'taught and challenged', directed: true }),
      createEdge('phil-trial', 'phil-socrates', { ...stamp, id: 'phil-edge-06', type: 'causes', label: 'led to the execution of', directed: true }),
      createEdge('phil-plato', 'phil-trial', { ...stamp, id: 'phil-edge-07', type: 'references', label: 'recounted in the Apology', directed: true }),
      createEdge('phil-plato', 'phil-forms', { ...stamp, id: 'phil-edge-08', type: 'references', label: 'developed in the dialogues', directed: true }),
      createEdge('phil-aristotle', 'phil-forms', { ...stamp, id: 'phil-edge-09', type: 'contradicts', label: 'rejected as separate substances' }),
      createEdge('phil-aristotle', 'phil-nicomachean', { ...stamp, id: 'phil-edge-10', type: 'references', label: 'authored', directed: true }),
      createEdge('phil-nicomachean', 'phil-virtue', { ...stamp, id: 'phil-edge-11', type: 'supports', label: 'develops an account of', directed: true }),
      createEdge('phil-virtue', 'phil-utilitarianism', { ...stamp, id: 'phil-edge-12', type: 'related', label: 'rival framework in normative ethics' }),
      createEdge('phil-mill', 'phil-utilitarianism', { ...stamp, id: 'phil-edge-13', type: 'influences', label: 'gave its classic defense of', directed: true }),
      createEdge('phil-utilitarianism', 'phil-ethics', { ...stamp, id: 'phil-edge-14', type: 'influences', label: 'a major theory within', directed: true }),
      createEdge('phil-virtue', 'phil-ethics', { ...stamp, id: 'phil-edge-15', type: 'influences', label: 'a major approach to', directed: true }),
      createEdge('phil-kant', 'phil-critique', { ...stamp, id: 'phil-edge-16', type: 'references', label: 'authored', directed: true }),
      createEdge('phil-critique', 'phil-epistemology', { ...stamp, id: 'phil-edge-17', type: 'supports', label: 'reframes the conditions of knowledge in', directed: true }),
      createEdge('phil-hume', 'phil-kant', { ...stamp, id: 'phil-edge-18', type: 'influences', label: 'awakened from dogmatic slumber', directed: true }),
      createEdge('phil-empiricism', 'phil-hume', { ...stamp, id: 'phil-edge-19', type: 'influences', label: 'shapes the method of', directed: true }),
      createEdge('phil-rationalism', 'phil-descartes', { ...stamp, id: 'phil-edge-20', type: 'influences', label: 'shapes the method of', directed: true }),
      createEdge('phil-empiricism', 'phil-rationalism', { ...stamp, id: 'phil-edge-21', type: 'contradicts', label: 'disputes substantive innate ideas in' }),
      createEdge('phil-descartes', 'phil-cogito', { ...stamp, id: 'phil-edge-22', type: 'references', label: 'argued in his major works', directed: true }),
      createEdge('phil-cogito', 'phil-epistemology', { ...stamp, id: 'phil-edge-23', type: 'supports', label: 'offers a foundational starting point for', directed: true }),
      createEdge('phil-skepticism', 'phil-cogito', { ...stamp, id: 'phil-edge-24', type: 'contradicts', label: 'radical doubt is met by' }),
      createEdge('phil-hume', 'phil-skepticism', { ...stamp, id: 'phil-edge-25', type: 'supports', label: 'defends a mitigated form of', directed: true }),
      createEdge('phil-sartre', 'phil-existentialism', { ...stamp, id: 'phil-edge-26', type: 'influences', label: 'developed and popularized', directed: true }),
      createEdge('phil-existentialism', 'phil-freewill', { ...stamp, id: 'phil-edge-27', type: 'contains', label: 'takes up the problem of' }),
      createEdge('phil-categorical', 'phil-freewill', { ...stamp, id: 'phil-edge-28', type: 'depends', label: 'presupposes the reality of', directed: true }),
      createEdge('phil-kant', 'phil-ethics', { ...stamp, id: 'phil-edge-29', type: 'influences', label: 'offers a deontological alternative within', directed: true }),
    ],
    tags: [
      createTag('metaphysics', { id: 'phil-tag-metaphysics', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'The nature of reality' }),
      createTag('epistemology', { id: 'phil-tag-epistemology', color: '#5b8def', createdAt: Date.UTC(2025, 0, 1), description: 'Knowledge and justification' }),
      createTag('ethics', { id: 'phil-tag-ethics', color: '#58c9a0', createdAt: Date.UTC(2025, 0, 1), description: 'Moral value and the good life' }),
      createTag('history', { id: 'phil-tag-history', color: '#e3b35c', createdAt: Date.UTC(2025, 0, 1), description: 'Thinkers and movements across periods' }),
    ],
  }),
};
