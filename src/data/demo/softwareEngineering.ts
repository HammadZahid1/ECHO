import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

// Fixed timestamps keep generated graphs reproducible between calls.
const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const softwareEngineeringDataset: DemoDataset = {
  id: 'software-engineering',
  name: 'Software Engineering',
  description:
    'How teams turn requirements into maintainable systems: lifecycle models, architecture, design practices, quality gates, and the literature that shaped them.',
  accent: '#4fd8e8',
  topics: ['Architecture', 'Process', 'Quality', 'Tooling', 'Project management'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'se-graph',
        title: 'Software engineering',
        description:
          'The systematic application of engineering approaches to designing, building, and maintaining software. It balances functional requirements with qualities such as reliability, maintainability, and cost.',
        type: 'concept',
        tags: ['systems', 'discipline'],
        importance: 1,
        references: ['Sommerville, Software Engineering (10th ed.)'],
      }),
      createNode({
        ...stamp,
        id: 'se-lifecycle',
        title: 'Software development lifecycle',
        description:
          'A staged view of software work from requirements and design through implementation, testing, deployment, and maintenance. Different process models organize and overlap these stages in distinct ways.',
        type: 'concept',
        tags: ['process'],
        importance: 0.86,
        metadata: { typicalStages: 6 },
      }),
      createNode({
        ...stamp,
        id: 'se-requirements',
        title: 'Requirements engineering',
        description:
          'Eliciting, analyzing, specifying, and validating what stakeholders actually need from a system. Ambiguous or unstable requirements are a common source of late, expensive changes.',
        type: 'concept',
        tags: ['process', 'quality'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'se-architecture',
        title: 'Software architecture',
        description:
          'The high-level structure of a system: its components, interactions, and the decisions that constrain them. Architectural choices govern how easily software can scale, change, and be operated.',
        type: 'concept',
        tags: ['architecture'],
        importance: 0.92,
      }),
      createNode({
        ...stamp,
        id: 'se-design-patterns',
        title: 'Design patterns',
        description:
          'Reusable solutions to recurring design problems, popularized by Gamma, Helm, Johnson, and Vlissides in 1994. Patterns name trade-offs and relationships rather than prescribing literal code.',
        type: 'resource',
        tags: ['design', 'book'],
        importance: 0.78,
        references: ['Gamma et al., Design Patterns: Elements of Reusable Object-Oriented Software (1994)'],
        metadata: { year: 1994, authors: 4 },
      }),
      createNode({
        ...stamp,
        id: 'se-solid',
        title: 'SOLID principles',
        description:
          'Five object-oriented design guidelines covering single responsibility, open–closed behavior, substitution, interface segregation, and dependency inversion. They aim to let modules change independently.',
        type: 'concept',
        tags: ['design'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'se-tdd',
        title: 'Test-driven development',
        description:
          'A red–green–refactor cycle in which a failing test is written before the production code that satisfies it. The test acts as an executable specification and a safety net for later changes.',
        type: 'concept',
        tags: ['practice', 'quality'],
        importance: 0.78,
        references: ['Beck, Test-Driven Development by Example (2002)'],
      }),
      createNode({
        ...stamp,
        id: 'se-refactoring',
        title: 'Refactoring',
        description:
          'Restructuring code to improve its internal structure while preserving observable behavior. Small behavior-preserving steps make deeper design changes safer.',
        type: 'concept',
        tags: ['practice', 'quality'],
        importance: 0.8,
        references: ['Fowler, Refactoring: Improving the Design of Existing Code (1999)'],
      }),
      createNode({
        ...stamp,
        id: 'se-vcs',
        title: 'Version control',
        description:
          'Systems that record file changes over time and support branching, merging, and collaboration. A repository becomes the shared history and provenance of a codebase.',
        type: 'resource',
        tags: ['tooling'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'se-git',
        title: 'Git',
        description:
          'A distributed version control system created by Linus Torvalds in 2005 to manage the Linux kernel source. Its content-addressed object model and inexpensive branches reshaped team workflows.',
        type: 'project',
        tags: ['tooling', 'open-source'],
        importance: 0.88,
        metadata: { year: 2005, creator: 'Linus Torvalds' },
      }),
      createNode({
        ...stamp,
        id: 'se-agile',
        title: 'Agile Manifesto',
        description:
          'A 2001 meeting of practitioners that published four values and twelve principles favoring individuals, working software, customer collaboration, and responding to change.',
        type: 'event',
        tags: ['process', 'event'],
        importance: 0.9,
        references: ['agilemanifesto.org'],
        metadata: { year: 2001, signatories: 17 },
      }),
      createNode({
        ...stamp,
        id: 'se-scrum',
        title: 'Scrum',
        description:
          'An agile framework built around fixed-length sprints and defined roles, events, and artifacts. A value-ordered product backlog drives iterative delivery.',
        type: 'concept',
        tags: ['process'],
        importance: 0.74,
      }),
      createNode({
        ...stamp,
        id: 'se-kanban',
        title: 'Kanban',
        description:
          'A flow-based method that visualizes work on a board and limits work in progress to expose bottlenecks. It originated in lean manufacturing before moving into software teams.',
        type: 'concept',
        tags: ['process'],
        importance: 0.7,
        references: ['Toyota production system'],
      }),
      createNode({
        ...stamp,
        id: 'se-cicd',
        title: 'Continuous integration and delivery',
        description:
          'Practices that merge changes frequently and automate building, testing, and releasing software. Short feedback cycles reduce the risk of painful integration at release time.',
        type: 'concept',
        tags: ['practice', 'tooling'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'se-devops',
        title: 'DevOps',
        description:
          'A culture and set of practices that unite development and operations around shared ownership of the whole service lifecycle. Automation, measurement, and observability are its main mechanisms.',
        type: 'concept',
        tags: ['culture', 'operations'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'se-review',
        title: 'Code review',
        description:
          'Peer examination of proposed changes before they are merged. Reviews surface defects, spread contextual knowledge, and enforce a shared quality bar.',
        type: 'concept',
        tags: ['quality', 'practice'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'se-static-analysis',
        title: 'Static analysis',
        description:
          'Checking source code for defects, style violations, or security risks without executing it. Linters and type checkers are common forms embedded in build pipelines.',
        type: 'concept',
        tags: ['quality', 'tooling'],
        importance: 0.68,
      }),
      createNode({
        ...stamp,
        id: 'se-ddd',
        title: 'Domain-driven design',
        description:
          'An approach that organizes software around a domain model, a ubiquitous language, and bounded contexts. Eric Evans formalized the terminology in 2003.',
        type: 'concept',
        tags: ['architecture', 'design'],
        importance: 0.78,
        references: ['Evans, Domain-Driven Design: Tackling Complexity in the Heart of Software (2003)'],
        metadata: { year: 2003 },
      }),
      createNode({
        ...stamp,
        id: 'se-microservices',
        title: 'Microservices architecture',
        description:
          'A style that composes a system from small, independently deployable services with bounded responsibilities. It trades distributed-system complexity for deployment and organizational flexibility.',
        type: 'concept',
        tags: ['architecture'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'se-technical-debt',
        title: 'Technical debt',
        description:
          'The future cost incurred by expedient choices that favor short-term speed over long-term maintainability. The metaphor frames deferred cleanup as accruing interest.',
        type: 'concept',
        tags: ['quality'],
        importance: 0.74,
        references: ['Cunningham, OOPSLA experience report (1992)'],
      }),
      createNode({
        ...stamp,
        id: 'se-fowler',
        title: 'Martin Fowler',
        description:
          'A software engineer and author known for work on refactoring, patterns, and enterprise architecture. His writing helped popularize the vocabulary of contemporary agile practice.',
        type: 'person',
        tags: ['person'],
        importance: 0.64,
      }),
      createNode({
        ...stamp,
        id: 'se-brooks',
        title: 'Fred Brooks',
        description:
          'A computer scientist who managed the OS/360 project and wrote The Mythical Man-Month. His observation that adding people to a late project makes it later remains widely cited.',
        type: 'person',
        tags: ['person', 'management'],
        importance: 0.66,
      }),
      createNode({
        ...stamp,
        id: 'se-mythical',
        title: 'The Mythical Man-Month',
        description:
          'A 1975 collection of essays on software project management, including Brooks’s law and the argument for conceptual integrity in system design.',
        type: 'resource',
        tags: ['book', 'management'],
        importance: 0.74,
        references: ['Brooks, The Mythical Man-Month (1975)'],
        metadata: { year: 1975 },
      }),
      createNode({
        ...stamp,
        id: 'se-waterfall',
        title: 'Waterfall model',
        description:
          'A sequential development model in which requirements, design, implementation, and testing follow one another. Critics argue that delayed feedback makes change expensive.',
        type: 'concept',
        tags: ['process'],
        importance: 0.68,
      }),
    ],
    edges: [
      createEdge('se-graph', 'se-lifecycle', { ...stamp, id: 'se-edge-01', type: 'contains', label: 'frames work as a lifecycle' }),
      createEdge('se-graph', 'se-architecture', { ...stamp, id: 'se-edge-02', type: 'contains', label: 'includes structural design' }),
      createEdge('se-lifecycle', 'se-requirements', { ...stamp, id: 'se-edge-03', type: 'contains', label: 'opens with' }),
      createEdge('se-lifecycle', 'se-cicd', { ...stamp, id: 'se-edge-04', type: 'contains', label: 'includes build and release' }),
      createEdge('se-requirements', 'se-architecture', { ...stamp, id: 'se-edge-05', type: 'influences', label: 'constrains the structure of', directed: true }),
      createEdge('se-architecture', 'se-microservices', { ...stamp, id: 'se-edge-06', type: 'contains', label: 'encompasses the style' }),
      createEdge('se-waterfall', 'se-requirements', { ...stamp, id: 'se-edge-07', type: 'contains', label: 'treats as an early phase' }),
      createEdge('se-agile', 'se-waterfall', { ...stamp, id: 'se-edge-08', type: 'contradicts', label: 'rejects sequential big-bang delivery' }),
      createEdge('se-agile', 'se-scrum', { ...stamp, id: 'se-edge-09', type: 'influences', label: 'gave rise to', directed: true }),
      createEdge('se-agile', 'se-kanban', { ...stamp, id: 'se-edge-10', type: 'related', label: 'shares iterative values with' }),
      createEdge('se-scrum', 'se-requirements', { ...stamp, id: 'se-edge-11', type: 'depends', label: 'needs a refined backlog of', directed: true }),
      createEdge('se-kanban', 'se-cicd', { ...stamp, id: 'se-edge-12', type: 'influences', label: 'encourages continuous flow in', directed: true }),
      createEdge('se-ddd', 'se-architecture', { ...stamp, id: 'se-edge-13', type: 'influences', label: 'shapes boundaries and language of', directed: true }),
      createEdge('se-design-patterns', 'se-solid', { ...stamp, id: 'se-edge-14', type: 'supports', label: 'embody in concrete solutions' }),
      createEdge('se-tdd', 'se-refactoring', { ...stamp, id: 'se-edge-15', type: 'depends', label: 'relies on the refactor step', directed: true }),
      createEdge('se-tdd', 'se-design-patterns', { ...stamp, id: 'se-edge-16', type: 'influences', label: 'steers emergent design toward', directed: true }),
      createEdge('se-refactoring', 'se-fowler', { ...stamp, id: 'se-edge-17', type: 'references', label: 'documented in the classic text by', directed: true }),
      createEdge('se-refactoring', 'se-technical-debt', { ...stamp, id: 'se-edge-18', type: 'supports', label: 'is the main means of repaying', directed: true }),
      createEdge('se-review', 'se-technical-debt', { ...stamp, id: 'se-edge-19', type: 'supports', label: 'keeps shortcuts visible and bounded', directed: true }),
      createEdge('se-static-analysis', 'se-review', { ...stamp, id: 'se-edge-20', type: 'supports', label: 'automates routine checks for', directed: true }),
      createEdge('se-static-analysis', 'se-cicd', { ...stamp, id: 'se-edge-21', type: 'supports', label: 'runs as a quality gate in', directed: true }),
      createEdge('se-vcs', 'se-git', { ...stamp, id: 'se-edge-22', type: 'contains', label: 'includes the distributed system' }),
      createEdge('se-git', 'se-cicd', { ...stamp, id: 'se-edge-23', type: 'supports', label: 'supplies shared history for', directed: true }),
      createEdge('se-devops', 'se-cicd', { ...stamp, id: 'se-edge-24', type: 'contains', label: 'treats automated delivery as core of' }),
      createEdge('se-microservices', 'se-devops', { ...stamp, id: 'se-edge-25', type: 'influences', label: 'drives automation and operations needs', directed: true }),
      createEdge('se-microservices', 'se-cicd', { ...stamp, id: 'se-edge-26', type: 'depends', label: 'requires automated delivery', directed: true }),
      createEdge('se-technical-debt', 'se-architecture', { ...stamp, id: 'se-edge-27', type: 'influences', label: 'can erode structural integrity of', directed: true }),
      createEdge('se-brooks', 'se-mythical', { ...stamp, id: 'se-edge-28', type: 'references', label: 'authored', directed: true, metadata: { relationNote: 'author-to-book' } }),
      createEdge('se-mythical', 'se-agile', { ...stamp, id: 'se-edge-29', type: 'influences', label: 'highlighted coordination costs later addressed by', directed: true }),
      createEdge('se-scrum', 'se-kanban', { ...stamp, id: 'se-edge-30', type: 'related', label: 'often combined on teams' }),
    ],
    tags: [
      createTag('process', { id: 'se-tag-process', color: '#e3b35c', createdAt: Date.UTC(2025, 0, 1), description: 'Ways of organizing software work' }),
      createTag('architecture', { id: 'se-tag-architecture', color: '#5b8def', createdAt: Date.UTC(2025, 0, 1), description: 'Structure and high-level design' }),
      createTag('quality', { id: 'se-tag-quality', color: '#58c9a0', createdAt: Date.UTC(2025, 0, 1), description: 'Practices that keep software trustworthy' }),
      createTag('tooling', { id: 'se-tag-tooling', color: '#8ca3f7', createdAt: Date.UTC(2025, 0, 1), description: 'Tools and infrastructure' }),
      createTag('design', { id: 'se-tag-design', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'Design principles and patterns' }),
    ],
  }),
};
