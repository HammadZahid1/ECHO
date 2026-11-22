import type { GraphData } from '@/types';
import { createEdge, createNode, createTag } from '@/lib/graph/factory';
import type { DemoDataset } from './types';

const stamp = { createdAt: Date.UTC(2025, 0, 1), updatedAt: Date.UTC(2025, 0, 1) } as const;

export const roboticsDataset: DemoDataset = {
  id: 'robotics',
  name: 'Robotics',
  description:
    'From the first industrial arm to embodied AI: mechanisms, control, perception, mapping, humanoid platforms, and the safety and ethical questions that follow robots into the world.',
  accent: '#e46d70',
  topics: ['Industrial robotics', 'Control', 'Perception', 'Autonomy', 'Robot ethics'],
  create: (): GraphData => ({
    nodes: [
      createNode({
        ...stamp,
        id: 'rob-field',
        title: 'Robotics',
        description:
          'The design, construction, and operation of machines that sense and act in the physical world. It combines mechanical engineering, control theory, computer vision, and artificial intelligence.',
        type: 'concept',
        tags: ['field'],
        importance: 1,
      }),
      createNode({
        ...stamp,
        id: 'rob-industrial',
        title: 'Industrial robot',
        description:
          'A programmable mechanical arm used for repetitive manufacturing tasks such as welding, painting, and assembly. Industrial robots transformed factories by combining precision with endurance.',
        type: 'research',
        tags: ['industry', 'mechanisms'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'rob-unimate',
        title: 'Unimate',
        description:
          'An early programmable industrial robot developed from George Devol’s patent and commercialized by Joseph Engelberger. It was installed at a General Motors plant in 1961.',
        type: 'project',
        tags: ['history', 'project'],
        importance: 0.8,
        metadata: { year: 1961 },
      }),
      createNode({
        ...stamp,
        id: 'rob-deployment',
        title: 'Unimate at General Motors (1961)',
        description:
          'The installation of a Unimate arm on a Westinghouse plant line, widely cited as the first industrial robot deployment in the United States. It demonstrated automated die casting at scale.',
        type: 'event',
        tags: ['event', 'history'],
        importance: 0.74,
        metadata: { year: 1961 },
      }),
      createNode({
        ...stamp,
        id: 'rob-engelberger',
        title: 'Joseph Engelberger',
        description:
          'An engineer who championed Unimate and is often called the father of industrial robotics. He spent decades promoting practical applications for robot technology.',
        type: 'person',
        tags: ['person', 'history'],
        importance: 0.7,
      }),
      createNode({
        ...stamp,
        id: 'rob-asimov',
        title: 'Isaac Asimov',
        description:
          'A writer whose robot stories gave the field much of its popular vocabulary. His fiction explored how rules governing machines can produce unexpected behavior.',
        type: 'person',
        tags: ['person', 'ethics'],
        importance: 0.72,
      }),
      createNode({
        ...stamp,
        id: 'rob-threelaws',
        title: 'Three Laws of Robotics',
        description:
          'Fictional safety rules introduced by Asimov: a robot may not harm humans, must obey human orders, and must protect its own existence. Their contradictions drive many of his plots and remain a reference point in robot ethics.',
        type: 'resource',
        tags: ['ethics', 'fiction'],
        importance: 0.7,
        references: ['Asimov, Runaround (1942)'],
      }),
      createNode({
        ...stamp,
        id: 'rob-sensors',
        title: 'Robot perception and sensors',
        description:
          'Cameras, lidar, force sensors, and encoders that convert the physical world into signals a controller can use. Perception is inherently noisy and must handle changing conditions.',
        type: 'concept',
        tags: ['perception'],
        importance: 0.88,
      }),
      createNode({
        ...stamp,
        id: 'rob-control',
        title: 'Control theory',
        description:
          'The mathematical study of driving a dynamic system toward a desired behavior. It provides tools for stability, tracking, and rejecting disturbances.',
        type: 'concept',
        tags: ['control'],
        importance: 0.9,
      }),
      createNode({
        ...stamp,
        id: 'rob-feedback',
        title: 'Closed-loop feedback',
        description:
          'A control strategy that compares measured output with a target and adjusts actions to reduce the error. Feedback lets a robot compensate for uncertainty in its model or environment.',
        type: 'research',
        tags: ['control'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'rob-kinematics',
        title: 'Forward and inverse kinematics',
        description:
          'The mathematics mapping joint configurations to end-effector poses and back. Inverse kinematics is essential for placing a gripper at a specified point in space.',
        type: 'research',
        tags: ['mechanisms', 'control'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'rob-manipulator',
        title: 'Robotic manipulator',
        description:
          'An articulated arm with joints and links that positions and orients a tool or gripper. Its reachable workspace and degrees of freedom constrain the tasks it can perform.',
        type: 'resource',
        tags: ['mechanisms'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'rob-mobile',
        title: 'Mobile robot',
        description:
          'A robot that moves through an environment on wheels, legs, or tracks. Unlike fixed arms, it must solve localization and navigation as part of every task.',
        type: 'concept',
        tags: ['autonomy'],
        importance: 0.82,
      }),
      createNode({
        ...stamp,
        id: 'rob-slam',
        title: 'Simultaneous localization and mapping (SLAM)',
        description:
          'The problem of building a map of an unknown environment while simultaneously estimating the robot’s position within it. Sensor noise makes the two estimates mutually dependent.',
        type: 'research',
        tags: ['perception', 'autonomy'],
        importance: 0.86,
      }),
      createNode({
        ...stamp,
        id: 'rob-pathplanning',
        title: 'Motion planning',
        description:
          'Computing a collision-free path through a configuration space subject to the robot’s constraints. Planning must account for obstacles, dynamics, and sometimes moving agents.',
        type: 'concept',
        tags: ['autonomy'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'rob-reinforcement',
        title: 'Reinforcement learning for control',
        description:
          'Learning control policies by trial and error with reward feedback. It is attractive for complex behaviors but raises sample-efficiency and safety concerns on physical hardware.',
        type: 'research',
        tags: ['learning', 'control'],
        importance: 0.78,
      }),
      createNode({
        ...stamp,
        id: 'rob-ai',
        title: 'Embodied AI',
        description:
          'The aim of giving agents perception, reasoning, and action grounded in a physical body. It pushes machine learning beyond disembodied pattern recognition toward real-world interaction.',
        type: 'concept',
        tags: ['learning', 'autonomy'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'rob-humanoid',
        title: 'Humanoid robot',
        description:
          'A robot with a human-like body plan, designed to operate in spaces and with tools built for people. Balance and dexterous manipulation remain difficult engineering problems.',
        type: 'concept',
        tags: ['platforms'],
        importance: 0.7,
      }),
      createNode({
        ...stamp,
        id: 'rob-asimo',
        title: 'Honda ASIMO',
        description:
          'A humanoid robot developed by Honda and unveiled in 2000, known for walking, climbing stairs, and interacting with people. It became a visible benchmark for humanoid engineering.',
        type: 'project',
        tags: ['project', 'platforms'],
        importance: 0.68,
        metadata: { year: 2000, organization: 'Honda' },
      }),
      createNode({
        ...stamp,
        id: 'rob-ethics',
        title: 'Robot ethics',
        description:
          'The study of moral and social questions raised by autonomous machines, including responsibility for harm, privacy, and effects on employment. It spans design choices and governance policy.',
        type: 'question',
        tags: ['ethics'],
        importance: 0.8,
      }),
      createNode({
        ...stamp,
        id: 'rob-autonomy',
        title: 'Autonomous systems',
        description:
          'Systems that select and execute actions without continuous human direction. Autonomy exists in degrees and depends on how much of the task is handled by the machine.',
        type: 'concept',
        tags: ['autonomy'],
        importance: 0.84,
      }),
      createNode({
        ...stamp,
        id: 'rob-cobots',
        title: 'Collaborative robots (cobots)',
        description:
          'Robots designed to work alongside people in shared spaces rather than behind safety cages. They rely on force sensing, compliant design, and conservative motion limits.',
        type: 'concept',
        tags: ['industry', 'safety'],
        importance: 0.76,
      }),
      createNode({
        ...stamp,
        id: 'rob-safety',
        title: 'Functional safety',
        description:
          'Engineering practices that ensure a system fails in ways that do not harm people, including risk assessment, protective stops, and certified control architectures.',
        type: 'concept',
        tags: ['safety', 'industry'],
        importance: 0.82,
        references: ['ISO 10218 and ISO/TS 15066 (robot safety standards)'],
      }),
    ],
    edges: [
      createEdge('rob-field', 'rob-industrial', { ...stamp, id: 'rob-edge-01', type: 'contains', label: 'includes' }),
      createEdge('rob-field', 'rob-mobile', { ...stamp, id: 'rob-edge-02', type: 'contains', label: 'includes' }),
      createEdge('rob-field', 'rob-humanoid', { ...stamp, id: 'rob-edge-03', type: 'contains', label: 'includes' }),
      createEdge('rob-field', 'rob-ai', { ...stamp, id: 'rob-edge-04', type: 'contains', label: 'includes the research frontier' }),
      createEdge('rob-engelberger', 'rob-unimate', { ...stamp, id: 'rob-edge-05', type: 'influences', label: 'commercialized', directed: true }),
      createEdge('rob-unimate', 'rob-deployment', { ...stamp, id: 'rob-edge-06', type: 'causes', label: 'entered industrial service as', directed: true }),
      createEdge('rob-deployment', 'rob-industrial', { ...stamp, id: 'rob-edge-07', type: 'supports', label: 'marked an early deployment of', directed: true }),
      createEdge('rob-industrial', 'rob-manipulator', { ...stamp, id: 'rob-edge-08', type: 'depends', label: 'is built around the programmable', directed: true }),
      createEdge('rob-manipulator', 'rob-kinematics', { ...stamp, id: 'rob-edge-09', type: 'depends', label: 'requires solving', directed: true }),
      createEdge('rob-control', 'rob-feedback', { ...stamp, id: 'rob-edge-10', type: 'contains', label: 'uses' }),
      createEdge('rob-feedback', 'rob-control', { ...stamp, id: 'rob-edge-11', type: 'supports', label: 'stabilizes the loop in', directed: true }),
      createEdge('rob-sensors', 'rob-feedback', { ...stamp, id: 'rob-edge-12', type: 'supports', label: 'supplies measurements for', directed: true }),
      createEdge('rob-slam', 'rob-sensors', { ...stamp, id: 'rob-edge-13', type: 'depends', label: 'depends on noisy', directed: true }),
      createEdge('rob-mobile', 'rob-slam', { ...stamp, id: 'rob-edge-14', type: 'depends', label: 'needs localization and mapping via', directed: true }),
      createEdge('rob-mobile', 'rob-pathplanning', { ...stamp, id: 'rob-edge-15', type: 'depends', label: 'needs collision-free routes from', directed: true }),
      createEdge('rob-pathplanning', 'rob-kinematics', { ...stamp, id: 'rob-edge-16', type: 'derived', label: 'extends the models of', directed: true }),
      createEdge('rob-reinforcement', 'rob-control', { ...stamp, id: 'rob-edge-17', type: 'supports', label: 'can learn policies for', directed: true }),
      createEdge('rob-ai', 'rob-reinforcement', { ...stamp, id: 'rob-edge-18', type: 'influences', label: 'drives interest in', directed: true }),
      createEdge('rob-ai', 'rob-sensors', { ...stamp, id: 'rob-edge-19', type: 'depends', label: 'needs embodied perception from', directed: true }),
      createEdge('rob-humanoid', 'rob-asimo', { ...stamp, id: 'rob-edge-20', type: 'contains', label: 'exemplified by' }),
      createEdge('rob-humanoid', 'rob-kinematics', { ...stamp, id: 'rob-edge-21', type: 'depends', label: 'needs human-scale balance and', directed: true }),
      createEdge('rob-cobots', 'rob-industrial', { ...stamp, id: 'rob-edge-22', type: 'related', label: 'extends robotics into shared workspaces' }),
      createEdge('rob-cobots', 'rob-safety', { ...stamp, id: 'rob-edge-23', type: 'depends', label: 'requires certified', directed: true }),
      createEdge('rob-safety', 'rob-autonomy', { ...stamp, id: 'rob-edge-24', type: 'influences', label: 'constrains deployment of', directed: true }),
      createEdge('rob-ethics', 'rob-autonomy', { ...stamp, id: 'rob-edge-25', type: 'related', label: 'governs decisions about' }),
      createEdge('rob-ethics', 'rob-safety', { ...stamp, id: 'rob-edge-26', type: 'influences', label: 'motivated standards for', directed: true }),
      createEdge('rob-asimov', 'rob-ethics', { ...stamp, id: 'rob-edge-27', type: 'influences', label: 'shaped public debate about', directed: true }),
      createEdge('rob-threelaws', 'rob-ethics', { ...stamp, id: 'rob-edge-28', type: 'related', label: 'an early fictional treatment of' }),
      createEdge('rob-industrial', 'rob-cobots', { ...stamp, id: 'rob-edge-29', type: 'influences', label: 'evolved toward shared-workspace systems', directed: true }),
    ],
    tags: [
      createTag('control', { id: 'rob-tag-control', color: '#5b8def', createdAt: Date.UTC(2025, 0, 1), description: 'Making machines behave as intended' }),
      createTag('perception', { id: 'rob-tag-perception', color: '#4fd8e8', createdAt: Date.UTC(2025, 0, 1), description: 'Sensing and mapping the world' }),
      createTag('autonomy', { id: 'rob-tag-autonomy', color: '#9d7bf5', createdAt: Date.UTC(2025, 0, 1), description: 'Acting without continuous direction' }),
      createTag('industry', { id: 'rob-tag-industry', color: '#e3b35c', createdAt: Date.UTC(2025, 0, 1), description: 'Robots in manufacturing and work' }),
      createTag('ethics', { id: 'rob-tag-ethics', color: '#e88fb8', createdAt: Date.UTC(2025, 0, 1), description: 'Safety, responsibility, and society' }),
    ],
  }),
};
