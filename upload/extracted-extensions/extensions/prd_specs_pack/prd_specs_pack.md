# 📦 PROTOCOLES DE SPÉCIFICATIONS PRD (GRADE DIAMOND)

═══ PRD_TEMPLATE_MANAGER ═══
MISSION: Manager templates PRD (sections, structure).
STYLE & DESIGN: Section list.
MAPPING VFS: PrdTemplateList.tsx, SectionEditor.tsx

═══ PRD_INSTANCE_VIEWER ═══
MISSION: Viewer d’un PRD structuré (sections, status).
STYLE & DESIGN: Outline + body.
MAPPING VFS: PrdViewer.tsx, PrdStatusBadge.tsx

═══ PRD_CHANGE_TRACKER ═══
MISSION: Suivi des changements sur un PRD (changelog).
STYLE & DESIGN: Changes timeline.
MAPPING VFS: PrdChangeLog.tsx, ChangeBadge.tsx

═══ PRD_COMMENT_LAYER ═══
MISSION: Commentaires inline dans PRD.
STYLE & DESIGN: Coment gutter.
MAPPING VFS: PrdCommentThread.tsx, CommentMarker.tsx

═══ PRD_TO_TASKS_EXPORTER ═══
MISSION: Export PRD → backlog (tickets).
STYLE & DESIGN: Mapping sections→tickets.
MAPPING VFS: PrdTaskMapping.tsx, ExportToBacklogButton.tsx

═══ PRD_AI_CONSISTENCY_AUDIT ═══
MISSION: Audit IA de cohérence PRD (scope, métriques).
STYLE & DESIGN: Warnings & suggestions.
MAPPING VFS: PrdAuditPanel.tsx, IssueList.tsx

═══ PRD_MULTI_LANGUAGE ═══
MISSION: PRD multi-langues (fr/en/…).
STYLE & DESIGN: Tabs langues.
MAPPING VFS: PrdLanguageTabs.tsx, TranslationEditor.tsx

═══ PRD_LINKED_ASSETS ═══
MISSION: Lier assets (images, docs, maquettes) à sections.
STYLE & DESIGN: Asset sidebar.
MAPPING VFS: LinkedAssetList.tsx, AttachAssetButton.tsx

═══ PRD_REVIEW_WORKFLOW ═══
MISSION: Workflow de review/approval PRD.
STYLE & DESIGN: Steps, approver list.
MAPPING VFS: PrdReviewPanel.tsx, ApprovalStep.tsx

═══ PRD_EXPORT_BUNDLE ═══
MISSION: Exporter PRD + assets en bundle (zip/pdf).
STYLE & DESIGN: Export wizard.
MAPPING VFS: PrdExportWizard.tsx, BundleSummary.tsx
