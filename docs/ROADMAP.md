# ECHO Engineering Roadmap

This roadmap tracks the planned engineering scope for ECHO. Each item is a legitimate, independently reviewable unit of work. Items are grouped into phases and used to plan incremental commits; related items are consolidated where splitting would create trivial changes.

Target: 350+ planned engineering tasks, from which 300+ meaningful commits are produced.

## Phase 1 — Repository inspection and architecture (1–20)

1. Inspect repository state, branch, and remotes.
2. Verify GitHub push authentication with an initial documentation commit.
3. Define the project file and module structure.
4. Document architecture boundaries between UI, data, algorithms, rendering, and persistence.
5. Establish strict TypeScript compiler settings.
6. Configure Vite for a React TypeScript client application.
7. Configure Vitest for unit and component testing.
8. Configure React Testing Library and jsdom environment.
9. Configure Tailwind CSS with the ECHO design tokens.
10. Configure ESLint and TypeScript-aware lint rules.
11. Establish the Git commit and push workflow on `main`.
12. Document the import/export data contracts.
13. Define graph entity interfaces and discriminated unions.
14. Define workspace, snapshot, and collection interfaces.
15. Define analytics, search, and import/result interfaces.
16. Define UI state and settings interfaces.
17. Create the shared identifier and timestamp utilities.
18. Create the shared math and vector utilities.
19. Create the shared text-processing utilities.
20. Create the shared color utilities.

## Phase 2 — Foundation (21–50)

21. Build the application entry point and root provider tree.
22. Build the application shell with header, sidebar, canvas, and inspector regions.
23. Implement the premium dark visual theme and typography scale.
24. Implement reusable button primitives with variants.
25. Implement reusable icon buttons with accessible labels.
26. Implement reusable icon wrapper with consistent sizing.
27. Implement reusable panel container with collapsible header.
28. Implement reusable modal dialog with focus management.
29. Implement reusable context menu with keyboard navigation.
30. Implement reusable tooltip primitive.
31. Implement reusable toast notification system.
32. Implement reusable slider control with value readout.
33. Implement reusable select control.
34. Implement reusable text field and textarea controls.
35. Implement reusable toggle/switch control.
36. Implement reusable chip/tag control.
37. Implement reusable empty state component.
38. Implement reusable loading state component.
39. Implement reusable error state component.
40. Implement confirmation dialog flow.
41. Implement the top navigation bar with view switcher.
42. Implement the workspace selector in the header.
43. Implement the status bar with graph metrics.
44. Implement resizable panel dividers.
45. Implement panel visibility toggles.
46. Implement persistent UI layout state in the UI store.
47. Implement persistent user preferences in local storage.
48. Implement a responsive mobile navigation drawer.
49. Implement a reduced-motion aware animation wrapper.
50. Implement the application error boundary.

## Phase 3 — Graph core (51–85)

51. Implement the KnowledgeNode model factory and normalization.
52. Implement the KnowledgeEdge model factory and normalization.
53. Implement node type registry with visual metadata.
54. Implement relationship type registry with visual metadata.
55. Implement graph schema validation with actionable diagnostics.
56. Implement graph duplicate-ID detection and repair.
57. Implement dangling-edge detection and repair.
58. Implement graph mutation operations (add/update/remove node).
59. Implement graph mutation operations (add/update/remove edge).
60. Implement node duplication with relationship remapping option.
61. Implement node pinning and freeze state.
62. Implement node position updates with batching.
63. Implement tag registry operations.
64. Implement node tag assignment and removal.
65. Implement custom metadata validation and normalization.
66. Implement workspace creation, renaming, and deletion.
67. Implement workspace duplication.
68. Implement workspace import and export.
69. Implement collection creation, renaming, grouping, and deletion.
70. Implement collection membership operations.
71. Implement graph snapshot creation with metadata.
72. Implement graph snapshot restoration.
73. Implement graph snapshot comparison.
74. Implement graph history entries for mutations.
75. Implement undo with history cursors.
76. Implement redo with history cursors.
77. Implement bounded history and memory cleanup.
78. Implement the Zustand graph store with selectors.
79. Implement selection state and multi-selection.
80. Implement hover and focus state.
81. Implement graph filters state.
82. Implement graph state reset and safe defaults.
83. Implement graph state hydration validation.
84. Implement graph operation tests.
85. Implement history operation tests.

## Phase 4 — Visualization (86–120)

86. Implement the 3D canvas with React Three Fiber.
87. Implement the procedural starfield background.
88. Implement ambient, directional, and point lighting.
89. Implement instanced node rendering for large graphs.
90. Implement type-specific procedural node geometry.
91. Implement node emissive and selection states.
92. Implement subtle node idle animation.
93. Implement edge geometry with curved lines.
94. Implement directional indicators on edges.
95. Implement animated flow along connections.
96. Implement edge strength and type visualization.
97. Implement edge labels with distance-based visibility.
98. Implement cluster hull/boundary visualization.
99. Implement interactive particle effects around hubs.
100. Implement hover raycasting and highlight synchronization.
101. Implement 3D node click and double-click interactions.
102. Implement 3D node dragging with plane projection.
103. Implement 3D right-click context menus.
104. Implement orbit, zoom, and pan camera controls.
105. Implement smooth camera focus transitions.
106. Implement camera presets (top, front, isometric, overview).
107. Implement camera focus on selection and clusters.
108. Implement adaptive rendering quality controls.
109. Implement frustum and distance culling options.
110. Implement GPU-friendly memoized geometry and materials.
111. Implement the 2D graph canvas with SVG/Canvas rendering.
112. Implement 2D node drag, zoom, pan, and selection.
113. Implement shared selection between 2D and 3D views.
114. Implement graph rendering tests for pure layout helpers.
115. Implement visualization settings controls.
116. Implement node size and label visibility settings.
117. Implement edge opacity and curve settings.
118. Implement graph background and grid settings.
119. Implement performance HUD for frame time and node count.
120. Implement canvas fallback for WebGL failures.

## Phase 5 — Layout engine (121–145)

121. Implement force-directed simulation with repulsion.
122. Implement edge attraction forces.
123. Implement center gravity and collision resolution.
124. Implement damping, velocity, and stability detection.
125. Implement configurable simulation strength and speed.
126. Implement simulation pause, resume, and reset.
127. Implement worker-ready pure simulation core.
128. Implement radial layout with concentric rings.
129. Implement circular layout.
130. Implement hierarchical layered layout.
131. Implement tree layout with subtree sizing.
132. Implement grid layout.
133. Implement cluster layout with component packing.
134. Implement organic layout with seeded variation.
135. Implement layout registry and dispatcher.
136. Implement layout transition interpolation.
137. Implement pin-aware layout computation.
138. Implement layout parameter controls in the UI.
139. Implement layout algorithm tests.
140. Implement layout stability tests.
141. Implement large-graph layout performance checks.

## Phase 6 — Knowledge tools (142–180)

142. Implement the node inspector shell.
143. Implement inspector identity and description editing.
144. Implement inspector type, importance, and color editing.
145. Implement inspector tag management.
146. Implement inspector reference and metadata editing.
147. Implement inspector connection list with navigation.
148. Implement inspector cluster and statistics display.
149. Implement the knowledge explorer panel.
150. Implement exploration mode selector.
151. Implement one-hop neighborhood exploration.
152. Implement two-hop and three-hop exploration.
153. Implement isolated-node exploration.
154. Implement highly-connected-node exploration.
155. Implement incremental neighborhood expansion.
156. Implement filter controls for type, tag, importance, and dates.
157. Implement the local search engine with field weighting.
158. Implement search result ranking and highlighting.
159. Implement search suggestions and history.
160. Implement the search results panel with keyboard navigation.
161. Implement the command palette with fuzzy commands.
162. Implement command palette node search and navigation actions.
163. Implement command palette layout and view switching.
164. Implement command palette panel and import/export actions.
165. Implement connected-components clustering.
166. Implement label propagation community detection.
167. Implement tag-based grouping.
168. Implement text-similarity grouping with local tokenization.
169. Implement graph-neighborhood grouping.
170. Implement cluster naming and recoloring.
171. Implement cluster collapse and expansion.
172. Implement cluster navigation and focus.
173. Implement cluster statistics.
174. Implement path finder with breadth-first search.
175. Implement shortest path and alternative path enumeration.
176. Implement path highlighting and path inspection UI.
177. Implement graph health analysis rules.
178. Implement actionable graph health UI with fixes.
179. Implement search engine tests.
180. Implement clustering and path finder tests.

## Phase 7 — Import and export (181–205)

181. Implement JSON graph import with schema validation.
182. Implement JSON import diagnostics for invalid fields.
183. Implement CSV node import with column mapping.
184. Implement CSV edge import.
185. Implement Markdown document import with heading parsing.
186. Implement Markdown link and tag extraction.
187. Implement plain-text structured import.
188. Implement import preview and conflict resolution.
189. Implement import result reporting and rollback.
190. Implement import error recovery guidance.
191. Implement JSON graph export with export options.
192. Implement filtered and selected-node JSON export.
193. Implement CSV node and edge export.
194. Implement Markdown knowledge-base export.
195. Implement SVG graph export.
196. Implement PNG graph export using canvas rendering.
197. Implement snapshot export and import.
198. Implement export documentation with examples.
199. Implement import/export round-trip tests.
200. Implement import validation tests.
201. Implement file download utilities.
202. Implement file upload and drag-drop handling.

## Phase 8 — Analytics (203–222)

203. Implement node and edge counts.
204. Implement node type distribution.
205. Implement tag distribution.
206. Implement degree statistics and distribution.
207. Implement graph density and components analytics.
208. Implement isolated-node and hub analytics.
209. Implement relationship type distribution.
210. Implement largest-cluster analytics.
211. Implement growth-over-time analytics.
212. Implement activity pattern analytics.
213. Implement reusable chart primitives (bar, donut, sparkline).
214. Implement the analytics panel with live data.
215. Implement analytics filtering by scope.
216. Implement analytics export.
217. Implement analytics tests against known graphs.

## Phase 9 — Workspaces, collections, snapshots (218–240)

218. Implement workspace switcher with confirmation for unsaved changes.
219. Implement workspace settings isolation.
220. Implement workspace layouts isolation.
221. Implement workspace snapshots isolation.
222. Implement workspace tags isolation.
223. Implement collection sidebar tree.
224. Implement collection membership visualization.
225. Implement collection filtering of graph views.
226. Implement snapshot creation dialog.
227. Implement snapshot timeline list.
228. Implement snapshot restore confirmation and undo.
229. Implement snapshot comparison view with diffs.
230. Implement snapshot statistics deltas.
231. Implement snapshot visual comparison mode.
232. Implement collection and snapshot tests.

## Phase 10 — Visualization modes (233–252)

233. Implement view registry and mode switching.
234. Implement 3D universe view wrapper.
235. Implement 2D graph view wrapper.
236. Implement radial explorer view.
237. Implement hierarchical explorer view.
238. Implement cluster explorer view.
239. Implement timeline view with activity tracks.
240. Implement table view with sorting and search.
241. Implement network overview view.
242. Implement view-specific toolbars.
243. Implement shared zoom/focus controls across views.
244. Implement view state persistence.
245. Implement view accessibility descriptions.
246. Implement view switching tests.

## Phase 11 — Advanced interaction (247–266)

247. Implement node context menu actions.
248. Implement graph context menu actions.
249. Implement cluster context menu actions.
250. Implement edge context menu actions.
251. Implement connection-creation interaction mode.
252. Implement add-related-node workflow.
253. Implement multi-select modifier interactions.
254. Implement select-connected and select-cluster actions.
255. Implement global keyboard shortcut handler.
256. Implement shortcut reference panel.
257. Implement focus, delete, undo, redo shortcuts.
258. Implement Escape overlay dismissal.
259. Implement keyboard graph navigation between nodes.
260. Implement screen-reader graph summary.
261. Implement accessible node list alternative.
262. Implement onboarding tour steps.
263. Implement onboarding completion persistence.
264. Implement contextual help hints.

## Phase 12 — Optimization (265–285)

265. Implement memoized graph adjacency maps.
266. Implement memoized statistics computation.
267. Implement throttled simulation updates.
268. Implement debounced search indexing.
269. Implement lazy-loaded view modules.
270. Implement code-split heavy 3D dependencies.
271. Implement IndexedDB storage abstraction.
272. Implement batched persistence writes.
273. Implement storage migration framework.
274. Implement storage quota error handling.
275. Implement storage usage indicator.
276. Implement corrupt-data recovery path.
277. Implement synthetic graph generator for performance tests.
278. Implement 500-node performance scenario.
279. Implement 1,000-node performance scenario.
280. Implement 2,000-node stress scenario.
281. Implement rendering quality presets.
282. Implement graph operation benchmarks.

## Phase 13 — Testing (283–307)

283. Implement Vitest configuration and scripts.
284. Implement test setup utilities.
285. Implement graph algorithm unit tests.
286. Implement layout unit tests.
287. Implement search unit tests.
288. Implement import/export unit tests.
289. Implement validation unit tests.
290. Implement persistence unit tests.
291. Implement history unit tests.
292. Implement statistics and health unit tests.
293. Implement clustering and path unit tests.
294. Implement component tests for shell navigation.
295. Implement component tests for inspector editing.
296. Implement component tests for command palette.
297. Implement component tests for filters.
298. Implement Playwright configuration.
299. Implement Playwright navigation smoke test.
300. Implement Playwright node CRUD test.
301. Implement Playwright search test.
302. Implement Playwright import/export test.
303. Implement Playwright workspace switching test.
304. Implement Playwright layout switching test.
305. Implement continuous test verification workflow.

## Phase 14 — Accessibility (306–322)

306. Audit interactive controls for keyboard access.
307. Add ARIA labels and roles across controls.
308. Add visible focus indicators.
309. Implement dialog focus trapping and restoration.
310. Implement live-region announcements for toasts.
311. Implement reduced-motion simulation and animation behavior.
312. Implement contrast-conscious token adjustments.
313. Implement semantic heading hierarchy.
314. Implement accessible color pickers.
315. Implement accessible chart descriptions.
316. Implement touch-friendly hit targets.
317. Implement mobile inspector bottom sheet.
318. Implement mobile graph controls.
319. Implement accessible graph summary table.

## Phase 15 — Final refinement (320–350)

320. Refine header density and spacing.
321. Refine panel typography and hierarchy.
322. Refine 3D node materials and lighting.
323. Refine edge curves and flow animation.
324. Refine inspector layout.
325. Refine explorer controls.
326. Refine analytics charts.
327. Refine empty and loading states.
328. Refine error messages.
329. Refine toast feedback.
330. Refine onboarding copy.
331. Refine documentation with screenshots descriptions.
332. Document keyboard shortcuts.
333. Document graph concepts and terminology.
334. Document demo datasets.
335. Document troubleshooting guidance.
336. Document performance characteristics honestly.
337. Verify production build.
338. Verify unit and component tests.
339. Verify end-to-end tests where available.
340. Verify browser rendering and interactions.
341. Verify responsive layouts.
342. Verify persistence across reloads.
343. Verify import/export in browser.
344. Verify accessibility basics.
345. Verify no console errors in key flows.
346. Verify all commits are local.
347. Verify all commits are pushed.
348. Verify repository cleanliness.
349. Produce the final completion report.
350. Address any remaining limitations transparently.
