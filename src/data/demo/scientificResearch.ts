import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const scientificResearchDataset: DemoDataset = {
  id: 'scientific-research',
  name: 'Scientific Research',
  description:
    'How science claims to know: hypotheses and experiments, competing accounts of scientific method, statistical tools, peer review, reproducibility, and landmark research programs.',
  accent: '#58c9a0',
  topics: ['Scientific method', 'Philosophy of science', 'Statistics', 'Reproducibility', 'Big science'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'sr-method',
        title: 'Scientific method',
        description:
          'A family of practices for building and testing claims through observation, hypothesis formation, experiment, and critical scrutiny. There is no single universal recipe that all sciences follow.',
        type: 'concept',
        tags: ['method'],
        importance: 1,
      }),
      createNode({
        ...stamp,
        id: 'sr-hypothesis',
        title: 'Hypothesis',
        description:
          'A provisional, testable proposal about how the world works. A useful hypothesis generates predictions that could turn out to be false.',
        type: 'concept',
        tags: ['method'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'sr-experiment',
        title: 'Controlled experiment',
        description:
          'An investigation that manipulates one or more variables while holding others fixed, often with randomization and a control group. Controls help isolate the effect of interest.',
        type: 'concept',
        tags: ['method'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'sr-observation',
        title: 'Observation and measurement',
        description:
          'The systematic recording of phenomena using senses or instruments. Measurements acquire scientific force when their procedures, uncertainties, and limitations are made explicit.',
        type: 'concept',
        tags: ['method', 'data'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'sr-popper',
        title: 'Karl Popper',
        description:
          'A philosopher of science who proposed falsification as the demarcation criterion between science and non-science. He argued that theories can only be corroborated, never finally verified.',
        type: 'person',
        tags: ['person', 'philosophy'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'sr-falsification',
        title: 'Falsificationism',
        description:
          'The view that scientific theories are distinguished by making risky predictions that experience could refute. Confronting predictions with evidence is central to Popper’s account of rational inquiry.',
        type: 'research',
        tags: ['philosophy', 'method'],
        importance: 0.86,
        references: ['Popper, The Logic of Scientific Discovery (1934)'],
      }),
      createNode({
        ...stamp,
        id: 'sr-kuhn',
        title: 'Thomas Kuhn',
        description:
          'A historian and philosopher who argued that science alternates between periods of normal science and revolutionary change. His work emphasized the role of shared frameworks in research practice.',
        type: 'person',
        tags: ['person', 'philosophy'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'sr-paradigms',
        title: 'The Structure of Scientific Revolutions',
        description:
          'Kuhn’s 1962 book introducing "paradigm" and "normal science." Its argument that scientific change is partly social and historical influenced fields far beyond philosophy.',
        type: 'resource',
        tags: ['book', 'philosophy'],
        importance: 0.82,
        references: ['Kuhn, The Structure of Scientific Revolutions (1962)'],
        metadata: { year: 1962 },
      }),
      createNode({
        ...stamp,
        id: 'sr-paradigm',
        title: 'Paradigm shift',
        description:
          'A change in the fundamental assumptions, methods, and exemplars that guide a scientific community. Such shifts can alter what counts as a legitimate question or solution.',
        type: 'research',
        tags: ['philosophy'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'sr-feyerabend',
        title: 'Paul Feyerabend',
        description:
          'A philosopher who rejected fixed methodological rules and argued for "anything goes" as a description of actual scientific practice. He criticized Popperian rationalism and Kuhnian conservatism alike.',
        type: 'person',
        tags: ['person', 'philosophy'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'sr-against',
        title: 'Against Method',
        description:
          'Feyerabend’s 1975 polemic against methodological monism, illustrated with episodes from the history of physics. It argues that methodological rules often obstruct discovery.',
        type: 'resource',
        tags: ['book', 'philosophy'],
        importance: 0.7,
        references: ['Feyerabend, Against Method (1975)'],
        metadata: { year: 1975 },
      }),
      createNode({
        ...stamp,
        id: 'sr-peerreview',
        title: 'Peer review',
        description:
          'Evaluation of a manuscript or proposal by experts before publication or funding. It filters obvious errors and improves clarity, though it is neither infallible nor uniformly reliable.',
        type: 'concept',
        tags: ['institutions'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'sr-replication',
        title: 'Replication crisis',
        description:
          'The discovery that many published findings in psychology, medicine, and other fields fail to reproduce. It prompted changes to study design, reporting, and incentives.',
        type: 'research',
        tags: ['reproducibility', 'institutions'],
        importance: 0.86,
        references: ['Open Science Collaboration, Estimating the reproducibility of psychological science (2015)'],
        metadata: { year: 2015 },
      }),
      createNode({
        ...stamp,
        id: 'sr-statistics',
        title: 'Statistical inference',
        description:
          'Drawing conclusions about populations or processes from finite, noisy data. It supplies tools for estimation, uncertainty quantification, and testing competing explanations.',
        type: 'concept',
        tags: ['statistics'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'sr-pvalue',
        title: 'p-value',
        description:
          'The probability, under a specified null hypothesis, of obtaining a result at least as extreme as the observed one. It is frequently misread as the probability that the hypothesis is true.',
        type: 'concept',
        tags: ['statistics'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'sr-bayes',
        title: 'Bayesian inference',
        description:
          'Updating beliefs about hypotheses by combining prior probabilities with the likelihood of observed data. It treats uncertainty as degree of belief and makes assumptions explicit.',
        type: 'concept',
        tags: ['statistics'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'sr-causal',
        title: 'Causal inference',
        description:
          'Reasoning about whether one factor produces changes in another, rather than merely co-occurring with it. Randomized experiments, natural experiments, and causal graphs are major tools.',
        type: 'concept',
        tags: ['method', 'statistics'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'sr-pubmed',
        title: 'PubMed',
        description:
          'A freely searchable index of biomedical literature maintained by the U.S. National Library of Medicine. It is a primary route for locating primary studies and systematic reviews.',
        type: 'resource',
        tags: ['data', 'literature'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'sr-cern',
        title: 'CERN',
        description:
          'The European Organization for Nuclear Research, founded in 1954 to operate particle accelerators. Large collaborations there pushed the organizational scale of experimental physics.',
        type: 'project',
        tags: ['big-science', 'institution'],
        importance: 0.8,
        metadata: { year: 1954, location: 'Geneva' },
      }),
      createNode({
        ...stamp,
        id: 'sr-higgs',
        title: 'Discovery of the Higgs boson (2012)',
        description:
          'The announcement by the ATLAS and CMS collaborations of a new particle consistent with the Higgs boson. It completed the particle content of the Standard Model and capped decades of accelerator work.',
        type: 'event',
        tags: ['event', 'big-science'],
        importance: 0.82,
        metadata: { year: 2012 },
      }),
      createNode({
        ...stamp,
        id: 'sr-genome',
        title: 'Human Genome Project',
        description:
          'An international effort completed in 2003 that produced a reference sequence of the human genome. It also pioneered norms for rapid, large-scale public release of biological data.',
        type: 'project',
        tags: ['big-science', 'data'],
        importance: 0.84,
        metadata: { year: 2003 },
      }),
      createNode({
        ...stamp,
        id: 'sr-data',
        title: 'Open research data',
        description:
          'Data made available for reuse with clear licensing, documentation, and persistent identifiers. Sharing data allows others to check analyses and ask questions beyond the original study.',
        type: 'concept',
        tags: ['data', 'reproducibility'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'sr-fraud',
        title: 'Research misconduct',
        description:
          'Fabrication, falsification, or misrepresentation of research data or findings. It is distinct from honest error, though both can be difficult to detect after publication.',
        type: 'concept',
        tags: ['institutions', 'ethics'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'sr-question',
        title: 'Can observation settle causal claims?',
        description:
          'An open methodological question about what evidence licenses a causal conclusion. It connects the classical problem of induction with modern design-based and graphical approaches.',
        type: 'question',
        tags: ['philosophy', 'method'],
        importance: 0.78,
      }),
    ],
    edges: [
      createEdge('sr-method', 'sr-hypothesis', { ...stamp, id: 'sr-edge-01', type: 'contains', label: 'includes forming' }),
      createEdge('sr-method', 'sr-experiment', { ...stamp, id: 'sr-edge-02', type: 'contains', label: 'includes designing' }),
      createEdge('sr-method', 'sr-observation', { ...stamp, id: 'sr-edge-03', type: 'contains', label: 'depends on careful' }),
      createEdge('sr-popper', 'sr-falsification', { ...stamp, id: 'sr-edge-04', type: 'influences', label: 'formulated', directed: true }),
      createEdge('sr-falsification', 'sr-method', { ...stamp, id: 'sr-edge-05', type: 'influences', label: 'offers a criterion for', directed: true }),
      createEdge('sr-feyerabend', 'sr-against', { ...stamp, id: 'sr-edge-06', type: 'references', label: 'authored', directed: true }),
      createEdge('sr-against', 'sr-falsification', { ...stamp, id: 'sr-edge-07', type: 'contradicts', label: 'rejects a single universal method in favor of' }),
      createEdge('sr-kuhn', 'sr-paradigms', { ...stamp, id: 'sr-edge-08', type: 'references', label: 'authored', directed: true }),
      createEdge('sr-paradigms', 'sr-paradigm', { ...stamp, id: 'sr-edge-09', type: 'supports', label: 'introduced the concept of', directed: true }),
      createEdge('sr-paradigm', 'sr-falsification', { ...stamp, id: 'sr-edge-10', type: 'contradicts', label: 'challenges a purely falsificationist account of' }),
      createEdge('sr-hypothesis', 'sr-experiment', { ...stamp, id: 'sr-edge-11', type: 'causes', label: 'motivates the design of', directed: true }),
      createEdge('sr-experiment', 'sr-observation', { ...stamp, id: 'sr-edge-12', type: 'depends', label: 'requires systematic', directed: true }),
      createEdge('sr-experiment', 'sr-hypothesis', { ...stamp, id: 'sr-edge-13', type: 'supports', label: 'puts to an empirical test', directed: true }),
      createEdge('sr-statistics', 'sr-experiment', { ...stamp, id: 'sr-edge-14', type: 'supports', label: 'quantifies uncertainty in', directed: true }),
      createEdge('sr-pvalue', 'sr-statistics', { ...stamp, id: 'sr-edge-15', type: 'derived', label: 'is a tool within', directed: true }),
      createEdge('sr-bayes', 'sr-pvalue', { ...stamp, id: 'sr-edge-16', type: 'contradicts', label: 'offers an alternative to significance testing' }),
      createEdge('sr-bayes', 'sr-causal', { ...stamp, id: 'sr-edge-17', type: 'supports', label: 'provides graphical tools for', directed: true }),
      createEdge('sr-causal', 'sr-question', { ...stamp, id: 'sr-edge-18', type: 'related', label: 'addresses the core of' }),
      createEdge('sr-peerreview', 'sr-method', { ...stamp, id: 'sr-edge-19', type: 'supports', label: 'provides social quality control for', directed: true }),
      createEdge('sr-replication', 'sr-peerreview', { ...stamp, id: 'sr-edge-20', type: 'supports', label: 'extends scrutiny beyond', directed: true }),
      createEdge('sr-pvalue', 'sr-replication', { ...stamp, id: 'sr-edge-21', type: 'causes', label: 'misuse of thresholds contributed to', directed: true, metadata: { nuance: 'misuse, not the statistic itself' } }),
      createEdge('sr-fraud', 'sr-replication', { ...stamp, id: 'sr-edge-22', type: 'related', label: 'is sometimes exposed by' }),
      createEdge('sr-data', 'sr-replication', { ...stamp, id: 'sr-edge-23', type: 'supports', label: 'enables independent checking in', directed: true }),
      createEdge('sr-data', 'sr-fraud', { ...stamp, id: 'sr-edge-24', type: 'related', label: 'transparency deters' }),
      createEdge('sr-pubmed', 'sr-peerreview', { ...stamp, id: 'sr-edge-25', type: 'references', label: 'indexes much work that passed', directed: true }),
      createEdge('sr-cern', 'sr-higgs', { ...stamp, id: 'sr-edge-26', type: 'contains', label: 'hosted the discovery of' }),
      createEdge('sr-higgs', 'sr-experiment', { ...stamp, id: 'sr-edge-27', type: 'supports', label: 'demonstrates large-team experimental science', directed: true }),
      createEdge('sr-cern', 'sr-experiment', { ...stamp, id: 'sr-edge-28', type: 'influences', label: 'pushed the collaborative scale of', directed: true }),
      createEdge('sr-genome', 'sr-data', { ...stamp, id: 'sr-edge-29', type: 'influences', label: 'accelerated open-data norms for', directed: true }),
      createEdge('sr-question', 'sr-method', { ...stamp, id: 'sr-edge-30', type: 'references', label: 'probes the limits of', directed: true }),
    ],
    tags: [
      createTag('method', { id: 'sr-tag-method', color: '#e3b35c', createdAt: Date.UTC(2025, 0, 1), description: 'Ways of generating evidence' }),
      createTag('philosophy', { id: 'sr-tag-philosophy', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'Accounts of scientific reasoning' }),
      createTag('statistics', { id: 'sr-tag-statistics', color: '#5b8def', createdAt: Date.UTC(2025, 0, 1), description: 'Inference from data' }),
      createTag('reproducibility', { id: 'sr-tag-repro', color: '#58c9a0', createdAt: Date.UTC(2025, 0, 1), description: 'Reliability and openness' }),
      createTag('big-science', { id: 'sr-tag-big', color: '#e46d70', createdAt: Date.UTC(2025, 0, 1), description: 'Large collaborative research programs' }),
    ],
  }),
};
