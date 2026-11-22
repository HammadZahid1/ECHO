import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const productDevelopmentDataset: DemoDataset = {
  id: 'product-development',
  name: 'Product Development',
  description:
    'From discovery and customer jobs to prototypes, experiments, roadmaps, and launches: a map of how product teams decide what to build and whether it worked.',
  accent: '#e3b35c',
  topics: ['Discovery', 'Lean methods', 'Design', 'Metrics', 'Delivery'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'pd-field',
        title: 'Product development',
        description:
          'The end-to-end process of identifying a need, shaping a solution, and delivering it to users. It combines discovery, design, delivery, and measurement rather than a single discipline.',
        type: 'concept',
        tags: ['field'],
        importance: 1,
      }),
      createNode({
        ...stamp,
        id: 'pd-discovery',
        title: 'Product discovery',
        description:
          'The early work of understanding users, problems, and viable solutions before committing to a build. Discovery reduces the risk of shipping something nobody needs.',
        type: 'concept',
        tags: ['discovery'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'pd-user',
        title: 'User research',
        description:
          'Systematic study of people’s goals, behaviors, and contexts through interviews, observation, and analysis. Good research distinguishes what people say from what they actually do.',
        type: 'research',
        tags: ['discovery', 'research'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'pd-jtbd',
        title: 'Jobs to be Done',
        description:
          'A framework treating a purchase or product use as the "hiring" of a solution to progress in a specific situation. It reframes competition around the underlying job rather than product category.',
        type: 'concept',
        tags: ['discovery', 'framework'],
        importance: 0.78,
        references: ['Christensen, The Innovator’s Dilemma (1997)'],
      }),
      createNode({
        ...stamp,
        id: 'pd-problem',
        title: 'Problem statement',
        description:
          'A concise, evidence-backed formulation of the user problem to be solved. A good statement defines the audience and the obstacle without smuggling in a particular solution.',
        type: 'concept',
        tags: ['discovery'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'pd-hypothesis',
        title: 'Product hypothesis',
        description:
          'A falsifiable claim that a given change will produce a measurable outcome for a defined group. Hypotheses make assumptions testable before large investments are made.',
        type: 'concept',
        tags: ['experimentation'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'pd-mvp',
        title: 'Minimum viable product',
        description:
          'The smallest version of a product that allows a team to collect validated learning from real users. It is a learning instrument, not merely a stripped-down release.',
        type: 'concept',
        tags: ['lean', 'delivery'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'pd-prototype',
        title: 'Prototype',
        description:
          'An incomplete but tangible representation of a design, ranging from paper sketches to interactive mockups. Prototypes expose misunderstandings cheaply before engineering begins.',
        type: 'resource',
        tags: ['design', 'artifact'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'pd-validation',
        title: 'Assumption testing',
        description:
          'Deliberately checking the riskiest beliefs behind a product idea with evidence. Teams order tests by uncertainty and by the cost of being wrong.',
        type: 'concept',
        tags: ['experimentation'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'pd-roadmap',
        title: 'Product roadmap',
        description:
          'A communicated plan of intended work and outcomes over time. Useful roadmaps explain the strategy behind sequencing rather than serving as a fixed contract of features.',
        type: 'resource',
        tags: ['strategy', 'artifact'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'pd-prioritization',
        title: 'RICE prioritization',
        description:
          'A scoring heuristic comparing initiatives by reach, impact, confidence, and effort. It makes trade-offs explicit, though its numbers depend on estimates.',
        type: 'concept',
        tags: ['strategy', 'framework'],
        importance: 0.7,
      }),
      createNode({
        ...stamp,
        id: 'pd-design',
        title: 'User experience design',
        description:
          'Shaping how people perceive and interact with a product across usability, accessibility, and emotional response. It draws on research, interaction patterns, and iterative testing.',
        type: 'concept',
        tags: ['design'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'pd-designsystem',
        title: 'Design system',
        description:
          'A shared library of components, patterns, tokens, and usage guidance that keeps a product coherent. It speeds delivery while reducing inconsistent interfaces.',
        type: 'resource',
        tags: ['design', 'artifact'],
        importance: 0.74,
      }),
      createNode({
        ...stamp,
        id: 'pd-feedback',
        title: 'Customer feedback loop',
        description:
          'The cycle of collecting reactions and behavior from users, interpreting them, and feeding the resulting insight into the next decision. Fast loops compound learning.',
        type: 'concept',
        tags: ['discovery', 'metrics'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'pd-northstar',
        title: 'North Star metric',
        description:
          'A single measure chosen to represent the core value a product delivers to users. It aligns teams but can be gamed if treated as the only thing that matters.',
        type: 'concept',
        tags: ['metrics', 'strategy'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'pd-experiment',
        title: 'A/B testing',
        description:
          'A controlled comparison of two product variants on a defined outcome metric. Random assignment and pre-registered success criteria help separate real effects from noise.',
        type: 'research',
        tags: ['experimentation', 'metrics'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'pd-lean',
        title: 'The Lean Startup',
        description:
          'Eric Ries’s 2011 book arguing that startups should operate as learning organizations through build–measure–learn cycles. It popularized the MVP and validated learning vocabulary.',
        type: 'resource',
        tags: ['book', 'lean'],
        importance: 0.8,
        references: ['Ries, The Lean Startup (2011)'],
        metadata: { year: 2011 },
      }),
      createNode({
        ...stamp,
        id: 'pd-ries',
        title: 'Eric Ries',
        description:
          'An entrepreneur and author who articulated the Lean Startup approach after working on IMVU. His writing connected startup practice to hypothesis testing and rapid iteration.',
        type: 'person',
        tags: ['person', 'lean'],
        importance: 0.7,
      }),
      createNode({
        ...stamp,
        id: 'pd-brown',
        title: 'Tim Brown',
        description:
          'A designer and former IDEO president who wrote extensively about design thinking as a human-centered approach to innovation. He emphasizes prototyping and multidisciplinary collaboration.',
        type: 'person',
        tags: ['person', 'design'],
        importance: 0.68,
      }),
      createNode({
        ...stamp,
        id: 'pd-designthinking',
        title: 'Design thinking',
        description:
          'A human-centered problem-solving approach that alternates divergent exploration with convergent selection. Its commonly taught phases are empathize, define, ideate, prototype, and test.',
        type: 'concept',
        tags: ['design', 'framework'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'pd-tradeoff',
        title: 'How minimal should an MVP be?',
        description:
          'An open judgment about the tension between learning speed and credibility with users. Too little product yields no signal; too much spends resources before assumptions are tested.',
        type: 'question',
        tags: ['lean', 'strategy'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'pd-launch',
        title: 'Product launch',
        description:
          'The moment a product or major change becomes available to its intended audience. A launch combines delivery readiness, communication, and early monitoring.',
        type: 'event',
        tags: ['event', 'delivery'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'pd-crossfunctional',
        title: 'Cross-functional product team',
        description:
          'A small group combining product, design, and engineering skills with shared ownership of an outcome. It reduces handoffs and allows decisions to be made close to the work.',
        type: 'project',
        tags: ['team', 'delivery'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'pd-retention',
        title: 'User retention',
        description:
          'The extent to which users return and continue using a product over time. Retention is often a stronger signal of durable value than initial sign-ups.',
        type: 'concept',
        tags: ['metrics'],
        importance: 0.8,
      }),
    ],
    edges: [
      createEdge('pd-field', 'pd-discovery', { ...stamp, id: 'pd-edge-01', type: 'contains', label: 'begins with' }),
      createEdge('pd-field', 'pd-design', { ...stamp, id: 'pd-edge-02', type: 'contains', label: 'includes' }),
      createEdge('pd-field', 'pd-launch', { ...stamp, id: 'pd-edge-03', type: 'contains', label: 'culminates in' }),
      createEdge('pd-discovery', 'pd-user', { ...stamp, id: 'pd-edge-04', type: 'contains', label: 'draws on' }),
      createEdge('pd-discovery', 'pd-jtbd', { ...stamp, id: 'pd-edge-05', type: 'contains', label: 'uses the lens of' }),
      createEdge('pd-user', 'pd-problem', { ...stamp, id: 'pd-edge-06', type: 'supports', label: 'reveals the needs behind', directed: true }),
      createEdge('pd-jtbd', 'pd-problem', { ...stamp, id: 'pd-edge-07', type: 'influences', label: 'frames as a job to be done', directed: true }),
      createEdge('pd-problem', 'pd-hypothesis', { ...stamp, id: 'pd-edge-08', type: 'causes', label: 'leads to testable', directed: true }),
      createEdge('pd-hypothesis', 'pd-validation', { ...stamp, id: 'pd-edge-09', type: 'depends', label: 'requires a plan for', directed: true }),
      createEdge('pd-lean', 'pd-mvp', { ...stamp, id: 'pd-edge-10', type: 'influences', label: 'popularized the idea of', directed: true }),
      createEdge('pd-ries', 'pd-lean', { ...stamp, id: 'pd-edge-11', type: 'references', label: 'authored', directed: true }),
      createEdge('pd-prototype', 'pd-mvp', { ...stamp, id: 'pd-edge-12', type: 'supports', label: 'explores solutions before committing to', directed: true }),
      createEdge('pd-validation', 'pd-experiment', { ...stamp, id: 'pd-edge-13', type: 'depends', label: 'often uses', directed: true }),
      createEdge('pd-experiment', 'pd-validation', { ...stamp, id: 'pd-edge-14', type: 'supports', label: 'produces evidence for', directed: true }),
      createEdge('pd-northstar', 'pd-experiment', { ...stamp, id: 'pd-edge-15', type: 'influences', label: 'defines what experiments should improve', directed: true }),
      createEdge('pd-feedback', 'pd-hypothesis', { ...stamp, id: 'pd-edge-16', type: 'causes', label: 'generates new', directed: true }),
      createEdge('pd-feedback', 'pd-roadmap', { ...stamp, id: 'pd-edge-17', type: 'supports', label: 'informs sequencing in', directed: true }),
      createEdge('pd-prioritization', 'pd-roadmap', { ...stamp, id: 'pd-edge-18', type: 'influences', label: 'determines the order of', directed: true }),
      createEdge('pd-northstar', 'pd-roadmap', { ...stamp, id: 'pd-edge-19', type: 'influences', label: 'aligns the goals across', directed: true }),
      createEdge('pd-designthinking', 'pd-design', { ...stamp, id: 'pd-edge-20', type: 'influences', label: 'provides the method for', directed: true }),
      createEdge('pd-brown', 'pd-designthinking', { ...stamp, id: 'pd-edge-21', type: 'influences', label: 'popularized at IDEO', directed: true }),
      createEdge('pd-designsystem', 'pd-design', { ...stamp, id: 'pd-edge-22', type: 'supports', label: 'supplies reusable building blocks for', directed: true }),
      createEdge('pd-designsystem', 'pd-design', { ...stamp, id: 'pd-edge-23', type: 'derived', label: 'crystallizes patterns from', directed: true }),
      createEdge('pd-crossfunctional', 'pd-design', { ...stamp, id: 'pd-edge-24', type: 'supports', label: 'brings complementary expertise to', directed: true }),
      createEdge('pd-crossfunctional', 'pd-launch', { ...stamp, id: 'pd-edge-25', type: 'influences', label: 'coordinates delivery of', directed: true }),
      createEdge('pd-launch', 'pd-validation', { ...stamp, id: 'pd-edge-26', type: 'depends', label: 'should follow key', directed: true }),
      createEdge('pd-tradeoff', 'pd-prioritization', { ...stamp, id: 'pd-edge-27', type: 'related', label: 'captures a central tension in' }),
      createEdge('pd-tradeoff', 'pd-mvp', { ...stamp, id: 'pd-edge-28', type: 'related', label: 'questions how minimal an MVP should be' }),
      createEdge('pd-northstar', 'pd-retention', { ...stamp, id: 'pd-edge-29', type: 'influences', label: 'is often expressed through', directed: true }),
      createEdge('pd-retention', 'pd-feedback', { ...stamp, id: 'pd-edge-30', type: 'supports', label: 'provides behavioral signals for', directed: true }),
      createEdge('pd-user', 'pd-design', { ...stamp, id: 'pd-edge-31', type: 'influences', label: 'grounds decisions in evidence about', directed: true }),
      createEdge('pd-lean', 'pd-validation', { ...stamp, id: 'pd-edge-32', type: 'influences', label: 'makes explicit the discipline of', directed: true }),
    ],
    tags: [
      createTag('discovery', { id: 'pd-tag-discovery', color: '#5b8def', createdAt: Date.UTC(2025, 0, 1), description: 'Understanding problems before solutions' }),
      createTag('experimentation', { id: 'pd-tag-experimentation', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'Testing assumptions with evidence' }),
      createTag('design', { id: 'pd-tag-design', color: '#e88fb8', createdAt: Date.UTC(2025, 0, 1), description: 'Shaping useful and usable interfaces' }),
      createTag('metrics', { id: 'pd-tag-metrics', color: '#4fd8e8', createdAt: Date.UTC(2025, 0, 1), description: 'Measuring value and behavior' }),
      createTag('strategy', { id: 'pd-tag-strategy', color: '#e3b35c', createdAt: Date.UTC(2025, 0, 1), description: 'Choosing what to pursue and why' }),
    ],
  }),
};
