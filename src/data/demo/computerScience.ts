import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const computerScienceDataset: DemoDataset = {
  id: 'computer-science',
  name: 'Computer Science',
  description:
    'The theoretical and practical spine of computing: models of computation, undecidability and complexity, information theory, algorithms, machines, systems, databases, and cryptography.',
  accent: '#8ca3f7',
  topics: ['Theory of computation', 'Algorithms', 'Systems', 'Data', 'Cryptography'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'cs-field',
        title: 'Computer science',
        description:
          'The study of computation, information, and the systems that process them. It ranges from abstract models of what can be computed to the engineering of large-scale software and networks.',
        type: 'concept',
        tags: ['field'],
        importance: 1,
      }),
      createNode({
        ...stamp,
        id: 'cs-turing',
        title: 'Alan Turing',
        description:
          'A mathematician who formalized computation with Turing machines and proved that some questions are algorithmically undecidable. His work also shaped cryptography and early machine intelligence.',
        type: 'person',
        tags: ['person', 'theory'],
        importance: 0.92,
      }),
      createNode({
        ...stamp,
        id: 'cs-turing-machine',
        title: 'Turing machine',
        description:
          'An abstract machine that reads and writes symbols on an unbounded tape according to a finite table of rules. It provides a precise model of algorithmic computation.',
        type: 'research',
        tags: ['theory'],
        importance: 0.94,
        references: ['Turing, On Computable Numbers, with an Application to the Entscheidungsproblem (1936)'],
        metadata: { year: 1936 },
      }),
      createNode({
        ...stamp,
        id: 'cs-church',
        title: 'Alonzo Church',
        description:
          'A logician who developed lambda calculus and proved the undecidability of the Entscheidungsproblem independently of Turing. His work underlies functional programming and the theory of computation.',
        type: 'person',
        tags: ['person', 'theory'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'cs-lambda',
        title: 'Lambda calculus',
        description:
          'A formal system for expressing computation through function abstraction and application. It is equivalent in power to the Turing machine and is the conceptual basis of functional languages.',
        type: 'research',
        tags: ['theory', 'languages'],
        importance: 0.84,
        metadata: { year: 1932 },
      }),
      createNode({
        ...stamp,
        id: 'cs-halting',
        title: 'Halting problem',
        description:
          'The question of whether a general algorithm can decide if an arbitrary program will eventually stop on a given input. Turing proved that no such algorithm exists.',
        type: 'question',
        tags: ['theory'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'cs-complexity',
        title: 'Computational complexity theory',
        description:
          'The study of how much time, space, and other resources algorithms require as inputs grow. It classifies problems by inherent difficulty rather than by whether they are computable at all.',
        type: 'research',
        tags: ['theory'],
        importance: 0.92,
      }),
      createNode({
        ...stamp,
        id: 'cs-pnp',
        title: 'P versus NP',
        description:
          'The open question of whether every problem whose solution can be verified quickly can also be solved quickly. Its resolution would reshape optimization, cryptography, and our understanding of computation.',
        type: 'question',
        tags: ['theory', 'open-problem'],
        importance: 0.95,
      }),
      createNode({
        ...stamp,
        id: 'cs-cook',
        title: 'Stephen Cook',
        description:
          'A computer scientist who formalized NP-completeness and stated the P versus NP problem in 1971. His theorem showed that Boolean satisfiability captures a broad class of hard problems.',
        type: 'person',
        tags: ['person', 'theory'],
        importance: 0.8,
        metadata: { year: 1971 },
      }),
      createNode({
        ...stamp,
        id: 'cs-shannon',
        title: 'Claude Shannon',
        description:
          'A mathematician who founded information theory and showed how Boolean algebra could describe switching circuits. His 1948 work quantified information, channel capacity, and redundancy.',
        type: 'person',
        tags: ['person', 'information'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'cs-information',
        title: 'Information theory',
        description:
          'A mathematical framework for measuring information, entropy, and the limits of communication over noisy channels. It underpins compression, error correction, and modern cryptography.',
        type: 'research',
        tags: ['information'],
        importance: 0.9,
        references: ['Shannon, A Mathematical Theory of Communication (1948)'],
        metadata: { year: 1948 },
      }),
      createNode({
        ...stamp,
        id: 'cs-boolean',
        title: 'Boolean algebra',
        description:
          'An algebraic system of true and false values with operations such as AND, OR, and NOT. It is the logical foundation of digital circuits and query predicates.',
        type: 'research',
        tags: ['logic'],
        importance: 0.78,
        references: ['Boole, The Laws of Thought (1854)'],
      }),
      createNode({
        ...stamp,
        id: 'cs-algorithms',
        title: 'Algorithms and data structures',
        description:
          'Step-by-step procedures for transforming inputs into outputs, together with the representations that make them efficient. Their analysis relies on asymptotic reasoning about time and space.',
        type: 'concept',
        tags: ['algorithms'],
        importance: 0.94,
      }),
      createNode({
        ...stamp,
        id: 'cs-dijkstra',
        title: 'Edsger Dijkstra',
        description:
          'A computer scientist known for the shortest-path algorithm, structured programming, and reasoning about concurrent processes. He argued that programming should be treated as a mathematical activity.',
        type: 'person',
        tags: ['person', 'algorithms'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'cs-graph-theory',
        title: 'Graph theory',
        description:
          'The mathematics of vertices and edges used to model networks, dependencies, and relationships. It supplies both abstract problems and practical data structures for computer science.',
        type: 'research',
        tags: ['mathematics', 'algorithms'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'cs-databases',
        title: 'Relational databases',
        description:
          'Systems that store data in typed relations and manipulate them with declarative queries. The relational model separates logical structure from physical storage details.',
        type: 'research',
        tags: ['data'],
        importance: 0.86,
        references: ['Codd, A Relational Model of Data for Large Shared Data Banks (1970)'],
      }),
      createNode({
        ...stamp,
        id: 'cs-codd',
        title: 'Edgar F. Codd',
        description:
          'A computer scientist who proposed the relational model of data in 1970. His work defined normalization, relational algebra, and the criteria for relational database systems.',
        type: 'person',
        tags: ['person', 'data'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'cs-sql',
        title: 'SQL',
        description:
          'A declarative language for defining, querying, and updating relational data. Its optimizers translate high-level queries into efficient execution plans.',
        type: 'resource',
        tags: ['data', 'languages'],
        importance: 0.84,
        metadata: { year: 1974 },
      }),
      createNode({
        ...stamp,
        id: 'cs-compilers',
        title: 'Compilers',
        description:
          'Programs that translate source code into another language, typically machine code or bytecode. Parsing, semantic analysis, optimization, and code generation are their classic phases.',
        type: 'concept',
        tags: ['languages', 'systems'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'cs-vonarch',
        title: 'Von Neumann architecture',
        description:
          'A computer design storing both program instructions and data in the same addressable memory. The stored-program concept made general-purpose reprogrammable machines practical.',
        type: 'research',
        tags: ['architecture'],
        importance: 0.86,
        references: ['von Neumann, First Draft of a Report on the EDVAC (1945)'],
        metadata: { year: 1945 },
      }),
      createNode({
        ...stamp,
        id: 'cs-os',
        title: 'Operating systems',
        description:
          'Software that manages hardware resources and provides abstractions such as processes, files, and virtual memory. They arbitrate between competing programs and the physical machine.',
        type: 'concept',
        tags: ['systems'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'cs-distributed',
        title: 'Distributed systems',
        description:
          'Systems whose components run on multiple networked computers and coordinate through messages. They must reason about partial failure, concurrency, and consistency.',
        type: 'concept',
        tags: ['systems', 'networks'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'cs-cryptography',
        title: 'Cryptography',
        description:
          'The practice and theory of securing communication and computation against adversaries. Modern protocols rely on computational hardness assumptions and information-theoretic insights.',
        type: 'concept',
        tags: ['security'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'cs-quantum',
        title: 'Quantum computing',
        description:
          'A model of computation using quantum superposition and entanglement to process information. It offers dramatic speedups for particular problems while threatening classical public-key cryptography.',
        type: 'research',
        tags: ['theory', 'open-problem'],
        importance: 0.82,
      }),
    ],
    edges: [
      createEdge('cs-field', 'cs-algorithms', { ...stamp, id: 'cs-edge-01', type: 'contains', label: 'includes' }),
      createEdge('cs-field', 'cs-complexity', { ...stamp, id: 'cs-edge-02', type: 'contains', label: 'includes' }),
      createEdge('cs-field', 'cs-databases', { ...stamp, id: 'cs-edge-03', type: 'contains', label: 'includes' }),
      createEdge('cs-field', 'cs-distributed', { ...stamp, id: 'cs-edge-04', type: 'contains', label: 'includes' }),
      createEdge('cs-field', 'cs-cryptography', { ...stamp, id: 'cs-edge-05', type: 'contains', label: 'includes' }),
      createEdge('cs-turing', 'cs-turing-machine', { ...stamp, id: 'cs-edge-06', type: 'influences', label: 'defined', directed: true }),
      createEdge('cs-church', 'cs-lambda', { ...stamp, id: 'cs-edge-07', type: 'influences', label: 'invented', directed: true }),
      createEdge('cs-lambda', 'cs-turing-machine', { ...stamp, id: 'cs-edge-08', type: 'related', label: 'an equivalent model of computation' }),
      createEdge('cs-turing', 'cs-halting', { ...stamp, id: 'cs-edge-09', type: 'references', label: 'proved undecidable in 1936', directed: true }),
      createEdge('cs-halting', 'cs-turing-machine', { ...stamp, id: 'cs-edge-10', type: 'derived', label: 'asks about the behavior of', directed: true }),
      createEdge('cs-complexity', 'cs-turing-machine', { ...stamp, id: 'cs-edge-11', type: 'depends', label: 'measures resources on', directed: true }),
      createEdge('cs-pnp', 'cs-complexity', { ...stamp, id: 'cs-edge-12', type: 'derived', label: 'is the central open question in', directed: true }),
      createEdge('cs-cook', 'cs-pnp', { ...stamp, id: 'cs-edge-13', type: 'influences', label: 'formulated in 1971', directed: true }),
      createEdge('cs-shannon', 'cs-information', { ...stamp, id: 'cs-edge-14', type: 'influences', label: 'founded', directed: true }),
      createEdge('cs-boolean', 'cs-vonarch', { ...stamp, id: 'cs-edge-15', type: 'supports', label: 'provides the logical basis for', directed: true }),
      createEdge('cs-algorithms', 'cs-graph-theory', { ...stamp, id: 'cs-edge-16', type: 'depends', label: 'uses models and results from', directed: true }),
      createEdge('cs-dijkstra', 'cs-algorithms', { ...stamp, id: 'cs-edge-17', type: 'influences', label: 'contributed foundational algorithms to', directed: true }),
      createEdge('cs-dijkstra', 'cs-os', { ...stamp, id: 'cs-edge-18', type: 'influences', label: 'introduced semaphores for concurrency in', directed: true }),
      createEdge('cs-codd', 'cs-databases', { ...stamp, id: 'cs-edge-19', type: 'influences', label: 'proposed the relational model for', directed: true }),
      createEdge('cs-sql', 'cs-databases', { ...stamp, id: 'cs-edge-20', type: 'depends', label: 'queries data organized by', directed: true }),
      createEdge('cs-compilers', 'cs-algorithms', { ...stamp, id: 'cs-edge-21', type: 'depends', label: 'relies on parsing and optimization', directed: true }),
      createEdge('cs-vonarch', 'cs-os', { ...stamp, id: 'cs-edge-22', type: 'influences', label: 'provides the stored-program hardware model for', directed: true }),
      createEdge('cs-os', 'cs-vonarch', { ...stamp, id: 'cs-edge-23', type: 'depends', label: 'manages resources on', directed: true }),
      createEdge('cs-distributed', 'cs-os', { ...stamp, id: 'cs-edge-24', type: 'derived', label: 'extends resource abstractions from', directed: true }),
      createEdge('cs-information', 'cs-cryptography', { ...stamp, id: 'cs-edge-25', type: 'influences', label: 'provides foundations for secure', directed: true }),
      createEdge('cs-cryptography', 'cs-complexity', { ...stamp, id: 'cs-edge-26', type: 'depends', label: 'relies on hardness assumptions from', directed: true }),
      createEdge('cs-quantum', 'cs-information', { ...stamp, id: 'cs-edge-27', type: 'derived', label: 'extends information theory to quantum states', directed: true }),
      createEdge('cs-quantum', 'cs-cryptography', { ...stamp, id: 'cs-edge-28', type: 'contradicts', label: 'undermines widely used hardness assumptions in', directed: true }),
      createEdge('cs-graph-theory', 'cs-distributed', { ...stamp, id: 'cs-edge-29', type: 'supports', label: 'models network topologies for', directed: true }),
      createEdge('cs-halting', 'cs-pnp', { ...stamp, id: 'cs-edge-30', type: 'related', label: 'marks the boundary between decidable and tractable questions' }),
      createEdge('cs-algorithms', 'cs-complexity', { ...stamp, id: 'cs-edge-31', type: 'supports', label: 'provides upper bounds studied by', directed: true }),
    ],
    tags: [
      createTag('theory', { id: 'cs-tag-theory', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'Models, proofs, and limits of computation' }),
      createTag('algorithms', { id: 'cs-tag-algorithms', color: '#4fd8e8', createdAt: Date.UTC(2025, 0, 1), description: 'Procedures and their analysis' }),
      createTag('systems', { id: 'cs-tag-systems', color: '#5b8def', createdAt: Date.UTC(2025, 0, 1), description: 'Machines, operating systems, and networks' }),
      createTag('data', { id: 'cs-tag-data', color: '#58c9a0', createdAt: Date.UTC(2025, 0, 1), description: 'Representation and management of information' }),
      createTag('security', { id: 'cs-tag-security', color: '#e46d70', createdAt: Date.UTC(2025, 0, 1), description: 'Securing communication and computation' }),
    ],
  }),
};
