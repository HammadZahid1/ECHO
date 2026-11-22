import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const learningSystemsDataset: DemoDataset = {
  id: 'learning-systems',
  name: 'Learning Systems',
  description:
    'How people learn and how instruction is designed around that: behaviorism, constructivism, memory research, feedback, scaffolding, assessment, and the tools that deliver them.',
  accent: '#7fd4a6',
  topics: ['Learning theory', 'Memory', 'Instruction', 'Assessment', 'Educational technology'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'ls-field',
        title: 'Learning sciences',
        description:
          'An interdisciplinary field studying how people learn and how environments can support it. It draws on psychology, education, cognitive science, and technology design.',
        type: 'concept',
        tags: ['field'],
        importance: 1,
      }),
      createNode({
        ...stamp,
        id: 'ls-behaviorism',
        title: 'Behaviorism',
        description:
          'A theory that explains learning through observable behavior and environmental consequences, largely bracketing internal mental states. It shaped early instructional design and programmed instruction.',
        type: 'research',
        tags: ['theory'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'ls-skinner',
        title: 'B. F. Skinner',
        description:
          'A psychologist who developed operant conditioning and argued that behavior is shaped by reinforcement histories. His ideas influenced teaching machines and classroom management.',
        type: 'person',
        tags: ['person', 'theory'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'ls-conditioning',
        title: 'Operant conditioning',
        description:
          'Learning in which the consequences of a behavior change how often it occurs. Reinforcement schedules explain why some learned behaviors persist long after rewards stop.',
        type: 'research',
        tags: ['theory', 'memory'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'ls-cognitivism',
        title: 'Cognitivism',
        description:
          'An approach that treats learning as the acquisition and reorganization of mental representations. It reintroduced attention, memory, and problem solving as legitimate objects of study.',
        type: 'research',
        tags: ['theory'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'ls-piaget',
        title: 'Jean Piaget',
        description:
          'A developmental psychologist who proposed that children construct understanding through stages of increasingly sophisticated reasoning. His work emphasized the learner’s active role.',
        type: 'person',
        tags: ['person', 'development'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'ls-constructivism',
        title: 'Constructivism',
        description:
          'The view that learners build knowledge through experience and reflection rather than simply receiving it. It underpins discovery learning, collaboration, and authentic tasks.',
        type: 'concept',
        tags: ['theory', 'instruction'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'ls-vygotsky',
        title: 'Lev Vygotsky',
        description:
          'A psychologist who argued that social interaction and language are central to cognitive development. His work shifted attention from solitary discovery to guided participation.',
        type: 'person',
        tags: ['person', 'development'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'ls-zpd',
        title: 'Zone of proximal development',
        description:
          'The gap between what a learner can do unaided and what they can accomplish with skilled guidance. Instruction aimed at this zone targets emerging rather than already-mastered abilities.',
        type: 'research',
        tags: ['development', 'instruction'],
        importance: 0.82,
        references: ['Vygotsky, Mind in Society (1978)'],
      }),
      createNode({
        ...stamp,
        id: 'ls-scaffolding',
        title: 'Instructional scaffolding',
        description:
          'Temporary support—prompts, models, or structured tools—that helps a learner complete a task beyond their independent ability. Effective scaffolding is gradually withdrawn as competence grows.',
        type: 'concept',
        tags: ['instruction'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'ls-ebbinghaus',
        title: 'Hermann Ebbinghaus',
        description:
          'A psychologist who pioneered experimental studies of memory using nonsense syllables and measured how retention declines over time.',
        type: 'person',
        tags: ['person', 'memory'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'ls-forgetting',
        title: 'Forgetting curve',
        description:
          'The observed decline in retention over time when no attempt is made to revisit learned material. The decline is steep at first and then flattens.',
        type: 'research',
        tags: ['memory'],
        importance: 0.78,
        references: ['Ebbinghaus, Memory: A Contribution to Experimental Psychology (1885)'],
        metadata: { year: 1885 },
      }),
      createNode({
        ...stamp,
        id: 'ls-spaced',
        title: 'Spaced repetition',
        description:
          'Reviewing material at increasing intervals to exploit the forgetting curve. Spacing typically produces more durable retention than massed practice for the same total study time.',
        type: 'research',
        tags: ['memory', 'instruction'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'ls-testing',
        title: 'Retrieval practice (testing effect)',
        description:
          'The finding that actively recalling information strengthens later memory more than rereading it. Low-stakes quizzes can therefore be learning events, not only measurements.',
        type: 'research',
        tags: ['memory', 'assessment'],
        importance: 0.88,
        references: ['Roediger & Karpicke, Test-enhanced learning (2006)'],
      }),
      createNode({
        ...stamp,
        id: 'ls-cognitive',
        title: 'Cognitive load theory',
        description:
          'A framework arguing that instructional design should respect limits on working memory. It distinguishes intrinsic difficulty, extraneous burden, and effort devoted to learning.',
        type: 'research',
        tags: ['instruction', 'memory'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'ls-sweller',
        title: 'John Sweller',
        description:
          'An educational psychologist who developed cognitive load theory in the 1980s. His work connected instructional formats to measurable demands on working memory.',
        type: 'person',
        tags: ['person', 'instruction'],
        importance: 0.7,
      }),
      createNode({
        ...stamp,
        id: 'ls-feedback',
        title: 'Formative feedback',
        description:
          'Information about performance given while learning is still in progress, so it can guide improvement. Effective feedback identifies the gap between current and desired performance.',
        type: 'concept',
        tags: ['instruction', 'assessment'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'ls-mastery',
        title: 'Mastery learning',
        description:
          'An approach in which learners progress after reaching a defined level of proficiency, receiving additional time and support as needed. It challenges fixed-time instruction with fixed outcomes.',
        type: 'concept',
        tags: ['instruction'],
        importance: 0.8,
        references: ['Bloom, Learning for Mastery (1968)'],
      }),
      createNode({
        ...stamp,
        id: 'ls-bloom',
        title: 'Benjamin Bloom',
        description:
          'An educational psychologist known for the taxonomy of educational objectives and for research on mastery learning. His framework shaped how courses specify learning goals.',
        type: 'person',
        tags: ['person', 'assessment'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'ls-assessment',
        title: 'Summative assessment',
        description:
          'Evaluation at the end of an instructional period to certify what has been learned. It is distinct from formative feedback, which is used during learning.',
        type: 'concept',
        tags: ['assessment'],
        importance: 0.74,
      }),
      createNode({
        ...stamp,
        id: 'ls-motivation',
        title: 'Intrinsic motivation',
        description:
          'Engagement driven by interest or the inherent satisfaction of an activity rather than external rewards. It influences persistence, attention, and the depth of processing.',
        type: 'concept',
        tags: ['motivation'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'ls-lms',
        title: 'Learning management system',
        description:
          'Software for delivering course material, collecting work, and recording progress. An LMS can support—but does not by itself guarantee—sound instructional design.',
        type: 'resource',
        tags: ['technology'],
        importance: 0.66,
      }),
      createNode({
        ...stamp,
        id: 'ls-question',
        title: 'How should we measure deep understanding?',
        description:
          'An open question about whether assessments capture transferable understanding or only recall of taught material. It links learning theory to the design of tasks and feedback.',
        type: 'question',
        tags: ['assessment', 'research'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'ls-projectbased',
        title: 'Project-based learning',
        description:
          'An approach in which students investigate extended, authentic questions and produce tangible artifacts. It aims to develop transferable skills alongside subject knowledge.',
        type: 'concept',
        tags: ['instruction'],
        importance: 0.76,
      }),
    ],
    edges: [
      createEdge('ls-field', 'ls-behaviorism', { ...stamp, id: 'ls-edge-01', type: 'contains', label: 'includes' }),
      createEdge('ls-field', 'ls-cognitivism', { ...stamp, id: 'ls-edge-02', type: 'contains', label: 'includes' }),
      createEdge('ls-field', 'ls-constructivism', { ...stamp, id: 'ls-edge-03', type: 'contains', label: 'includes' }),
      createEdge('ls-field', 'ls-question', { ...stamp, id: 'ls-edge-04', type: 'references', label: 'investigates', directed: true }),
      createEdge('ls-skinner', 'ls-conditioning', { ...stamp, id: 'ls-edge-05', type: 'influences', label: 'formulated', directed: true }),
      createEdge('ls-conditioning', 'ls-behaviorism', { ...stamp, id: 'ls-edge-06', type: 'derived', label: 'is a central mechanism within', directed: true }),
      createEdge('ls-behaviorism', 'ls-cognitivism', { ...stamp, id: 'ls-edge-07', type: 'contradicts', label: 'rejects appeal to unobservable mental states' }),
      createEdge('ls-piaget', 'ls-constructivism', { ...stamp, id: 'ls-edge-08', type: 'influences', label: 'provided a developmental account for', directed: true }),
      createEdge('ls-vygotsky', 'ls-constructivism', { ...stamp, id: 'ls-edge-09', type: 'influences', label: 'added the social dimension to', directed: true }),
      createEdge('ls-vygotsky', 'ls-zpd', { ...stamp, id: 'ls-edge-10', type: 'influences', label: 'introduced', directed: true }),
      createEdge('ls-zpd', 'ls-constructivism', { ...stamp, id: 'ls-edge-11', type: 'derived', label: 'applies the idea of readiness within', directed: true }),
      createEdge('ls-scaffolding', 'ls-zpd', { ...stamp, id: 'ls-edge-12', type: 'depends', label: 'is designed around', directed: true }),
      createEdge('ls-constructivism', 'ls-projectbased', { ...stamp, id: 'ls-edge-13', type: 'influences', label: 'underpins', directed: true }),
      createEdge('ls-projectbased', 'ls-scaffolding', { ...stamp, id: 'ls-edge-14', type: 'depends', label: 'relies on for complex tasks', directed: true }),
      createEdge('ls-ebbinghaus', 'ls-forgetting', { ...stamp, id: 'ls-edge-15', type: 'influences', label: 'first quantified', directed: true }),
      createEdge('ls-spaced', 'ls-forgetting', { ...stamp, id: 'ls-edge-16', type: 'derived', label: 'exploits the shape of', directed: true }),
      createEdge('ls-spaced', 'ls-mastery', { ...stamp, id: 'ls-edge-17', type: 'supports', label: 'helps learners reach', directed: true }),
      createEdge('ls-cognitivism', 'ls-testing', { ...stamp, id: 'ls-edge-18', type: 'influences', label: 'explains why retrieval strengthens memory', directed: true }),
      createEdge('ls-testing', 'ls-spaced', { ...stamp, id: 'ls-edge-19', type: 'related', label: 'often combined in study design' }),
      createEdge('ls-sweller', 'ls-cognitive', { ...stamp, id: 'ls-edge-20', type: 'influences', label: 'developed', directed: true }),
      createEdge('ls-cognitive', 'ls-scaffolding', { ...stamp, id: 'ls-edge-21', type: 'influences', label: 'guides the sequencing of', directed: true }),
      createEdge('ls-cognitive', 'ls-projectbased', { ...stamp, id: 'ls-edge-22', type: 'related', label: 'raises design constraints for' }),
      createEdge('ls-feedback', 'ls-mastery', { ...stamp, id: 'ls-edge-23', type: 'supports', label: 'enables corrective progress toward', directed: true }),
      createEdge('ls-mastery', 'ls-feedback', { ...stamp, id: 'ls-edge-24', type: 'depends', label: 'requires timely', directed: true }),
      createEdge('ls-bloom', 'ls-mastery', { ...stamp, id: 'ls-edge-25', type: 'influences', label: 'advocated', directed: true }),
      createEdge('ls-bloom', 'ls-assessment', { ...stamp, id: 'ls-edge-26', type: 'influences', label: 'taxonomy informs the design of', directed: true }),
      createEdge('ls-assessment', 'ls-question', { ...stamp, id: 'ls-edge-27', type: 'related', label: 'instantiates the measurement problem in' }),
      createEdge('ls-motivation', 'ls-mastery', { ...stamp, id: 'ls-edge-28', type: 'influences', label: 'sustains the effort needed for', directed: true }),
      createEdge('ls-lms', 'ls-assessment', { ...stamp, id: 'ls-edge-29', type: 'contains', label: 'hosts workflows for' }),
      createEdge('ls-lms', 'ls-spaced', { ...stamp, id: 'ls-edge-30', type: 'supports', label: 'can schedule review prompts for', directed: true }),
      createEdge('ls-conditioning', 'ls-mastery', { ...stamp, id: 'ls-edge-31', type: 'influences', label: 'informed early programmed instruction behind', directed: true }),
      createEdge('ls-testing', 'ls-question', { ...stamp, id: 'ls-edge-32', type: 'supports', label: 'offers evidence for measuring', directed: true }),
    ],
    tags: [
      createTag('theory', { id: 'ls-tag-theory', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'Accounts of how learning happens' }),
      createTag('memory', { id: 'ls-tag-memory', color: '#4fd8e8', createdAt: Date.UTC(2025, 0, 1), description: 'Retention and recall research' }),
      createTag('instruction', { id: 'ls-tag-instruction', color: '#58c9a0', createdAt: Date.UTC(2025, 0, 1), description: 'Design of learning experiences' }),
      createTag('assessment', { id: 'ls-tag-assessment', color: '#e3b35c', createdAt: Date.UTC(2025, 0, 1), description: 'Measuring learning' }),
      createTag('technology', { id: 'ls-tag-technology', color: '#8ca3f7', createdAt: Date.UTC(2025, 0, 1), description: 'Tools that support learning' }),
    ],
  }),
};
