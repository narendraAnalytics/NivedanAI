'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

/* -------------------- DATA -------------------- */
const STEPS = [
  {
    id: 'trigger',
    chip: 'TRIGGER',
    num: '01',
    title: 'User Uploads RFP PDF',
    blurb: 'The starting point of the 6-agent proposal generation pipeline. A clean, intentional handoff from human to autonomous system.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779726259/step1_feaqt4.png',
    imageAlt: 'Dashboard upload screen showing RFP PDF being uploaded',
    model: 'UploadThing · Inngest event',
    role: 'Captures the brief and ignites the pipeline.',
    whatHappens: [
      ['User uploads RFP PDF via dashboard', '/dashboard endpoint'],
      ['Recipient email captured before upload', 'persisted with the job'],
      ['UploadThing stores PDF and returns a ufsUrl', 'CDN-backed'],
      ['onUploadComplete creates rfp_jobs row', 'status: pending'],
      ['Inngest event fires: nivedan/rfp.submitted', '6-agent pipeline begins'],
    ] as [string, string][],
    dataOut: ['jobId', 'userId', 'rfpDocumentUrl', 'companyProfileId', 'recipientEmail'],
    accent: '#D4A84F',
  },
  {
    id: 'orchestrator',
    chip: 'STEP 02',
    num: '02',
    title: 'Orchestrator Agent',
    blurb: 'The operational brain. Validates every input, opens the shared ADK session, and produces a PipelineDirective that steers every downstream agent.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779726260/step2_mhf7i7.png',
    imageAlt: 'Orchestrator agent diagram showing brain and pipeline directive output',
    model: 'gemini-3.1-pro-preview · temp 0.3',
    role: 'Plans the run before any writing begins.',
    whatHappens: [
      ['Sets job status to "running" in Neon DB', 'records runId + start time'],
      ['Validates company profile + RFP URL', 'HEAD request to confirm'],
      ['Calls Gemini for the PipelineDirective', 'full company context attached'],
      ['Creates ADK InMemorySession', 'sessionId = jobId'],
      ['Returns directive + companyName', 'cached by Inngest for all later steps'],
    ] as [string, string][],
    dataOut: ['sectorHint', 'complexityLevel', 'priorityFlags', 'focusAreas', 'proposalTone'],
    accent: '#D4A84F',
  },
  {
    id: 'rfp-parser',
    chip: 'STEP 03',
    num: '03',
    title: 'RFP Parser Agent',
    blurb: 'Document intelligence engine. Transforms the raw RFP PDF into structured, machine-readable procurement intelligence.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771462/step3_ek3qxx.png',
    imagePlaceholder: 'Add image of the parser agent extracting requirements from a PDF.',
    model: 'gemini-3.1-flash-lite · temp 0.1',
    role: "Reads the brief so the agents downstream don't have to.",
    whatHappens: [
      ['Fetches RFP PDF from UploadThing CDN', 'native PDF read via inlineData'],
      ['Extracts mandatory + optional requirements', 'with priority + confidence'],
      ['Pulls budget ceiling, deadline, timeline', 'and evaluation criteria'],
      ['Captures vendor qualifications', 'ISO, HIPAA, SOC2, years experience'],
      ['Writes parsed_rfp_data + updates rfp_jobs', 'clientName, rfpTitle locked in'],
    ] as [string, string][],
    dataOut: ['clientName', 'rfpTitle', 'mandatoryCount', 'budgetCeiling', 'submissionDeadline'],
    accent: '#D4A84F',
  },
  {
    id: 'client-research',
    chip: 'STEP 04',
    num: '04',
    title: 'Client Research Agent',
    blurb: 'Live intelligence gathering. Builds a current company profile of the RFP client using Tavily web search + Gemini synthesis.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771458/step4_tjeof2.png',
    imagePlaceholder: 'Add image of the research agent gathering live web signals.',
    model: 'gemini-3.5-flash · Tavily MCP',
    role: 'Brings the outside world into the proposal.',
    whatHappens: [
      ['Tavily MCP runs autonomous web searches', 'news, leadership, priorities, competitors'],
      ['Gemini synthesises a structured profile', 'with inline source URLs'],
      ['Assigns researchConfidence', 'high | medium | low'],
      ['Falls back gracefully to LLM knowledge', 'if web search is unavailable'],
      ['Writes client_research_data to Neon', 'tavilySearchUsed flag set'],
    ] as [string, string][],
    dataOut: ['companySummary', 'recentNews', 'strategicPriorities', 'leadership', 'sources'],
    accent: '#D4A84F',
  },
  {
    id: 'matcher',
    chip: 'STEP 05',
    num: '05',
    title: 'Requirements Matcher Agent',
    blurb: 'Capability alignment engine. Maps every mandatory RFP requirement to a Knowledge Base item and scores the match honestly.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771462/step5_hum58g.png',
    imagePlaceholder: 'Add image showing requirements being matched to KB items with confidence scores.',
    model: 'gemini-3.1-flash-lite · Tavily MCP',
    role: "Tells you exactly where you're strong and where you have gaps.",
    whatHappens: [
      ['Tavily gathers real-world evidence', 'per requirement, in parallel'],
      ['Each requirement scored 0.00–1.00', 'against all active KB items'],
      ['Marks isGap=true below 0.50', 'with a suggested remedy'],
      ['Bulk inserts capability_matches rows', 'one per mandatory requirement'],
      ['Returns coverage stats', 'used by Quality Review for floor / cap logic'],
    ] as [string, string][],
    dataOut: ['totalRequirements', 'matchedCount', 'gapCount', 'avgConfidence'],
    accent: '#D4A84F',
  },
  {
    id: 'writer',
    chip: 'STEP 06',
    num: '06',
    title: 'Proposal Writer Agent',
    blurb: 'Primary content generation. Writes a submission-ready 12-section proposal tailored to the specific client and their context.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771462/step6_j9gg4w.png',
    imagePlaceholder: 'Add image of the writer composing the 12-section proposal.',
    model: 'gemini-3.1-pro-preview · temp 0.7',
    role: 'Drafts the entire proposal in a single, coherent pass.',
    whatHappens: [
      ['Fetches all upstream data in parallel', 'RFP, research, capability matches'],
      ['Writes 12 sections of a real proposal', 'cover letter through "Why us"'],
      ['Cites matched KB items inline', 'handles gaps with credible approaches'],
      ['Stays inside budget + deadline', 'enforced as hard constraints'],
      ['Inserts version 1 into proposals table', 'ready for review'],
    ] as [string, string][],
    dataOut: ['proposalId', 'sectionsGenerated', 'wordCount', 'version'],
    accent: '#D4A84F',
  },
  {
    id: 'quality',
    chip: 'STEP 07',
    num: '07',
    title: 'Quality Review Agent',
    blurb: 'The final automated validation gate. Runs five quality checks, corrects failing sections, and scores the proposal before human review.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771473/step7_nztszc.png',
    imagePlaceholder: 'Add image showing a quality scorecard with corrections applied.',
    model: 'gemini-3.1-flash-lite · temp 0.1',
    role: 'No proposal reaches you unchecked.',
    whatHappens: [
      ['Validates all mandatory requirements covered', 'plus timeline, budget, consistency, specificity'],
      ['Applies coverage-driven floor + cap', '≥92% when matched, capped at 75% when gapped'],
      ['Corrects failing sections automatically', 'before parking for HITL'],
      ['Sets status to "awaiting_review"', 'pipeline pauses for human'],
      ['Score, notes + fixes saved to proposals', 'visible on the review page'],
    ] as [string, string][],
    dataOut: ['qualityScore', 'correctionsApplied', 'sectionsUpdated', 'validationPassed'],
    accent: '#D4A84F',
  },
  {
    id: 'hitl',
    chip: 'STEP 08 · HITL',
    num: '08',
    title: 'Human-In-The-Loop Review',
    blurb: 'The pipeline pauses for you. The proposal opens on /workflow/[jobId] with the quality score, review notes, and every auto-corrected section called out. Approve, request changes, or let it expire.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771476/step8_vjbzlu.png',
    imagePlaceholder: 'Add image of the HITL review screen — proposal sections, quality badge, approve / request changes buttons.',
    model: 'Inngest waitForEvent · 7-day timeout',
    role: 'You are the final gate, not the bottleneck.',
    whatHappens: [
      ['Pipeline pauses on nivedan/hitl.approved', 'correlated by jobId'],
      ['Reviewer reads all 12 sections', 'with quality score + review notes inline'],
      ['Approve → fires the event, pipeline resumes', 'PDF export begins immediately'],
      ['Request changes → rewrites flagged sections', 'handle-hitl-changes.ts re-runs the writer'],
      ['No action in 7 days → job expires gracefully', 'no orphaned jobs left running'],
    ] as [string, string][],
    dataOut: ['approvalDecision', 'sectionsFlagged', 'reviewerNotes', 'approvedAt'],
    accent: '#D4A84F',
  },
  {
    id: 'export',
    chip: 'STEP 09 · DELIVERY',
    num: '09',
    title: 'PDF Export & Email Delivery',
    blurb: 'A branded, submission-ready PDF is rendered, uploaded to a permanent CDN URL, and emailed to the recipient. Every export is logged — nothing gets lost.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771453/step9_zip7wf.png',
    imagePlaceholder: 'Add image of the final branded proposal PDF + delivery email side-by-side.',
    model: '@react-pdf/renderer · UploadThing · Resend',
    role: 'Closes the loop — from PDF in, to PDF out.',
    whatHappens: [
      ['Fetches all data in parallel', 'proposal, profile, RFP, research, matches'],
      ['Renders branded 12-section PDF', 'quality score badge + company branding'],
      ['Uploads PDF to UploadThing via UTApi', 'permanent .ufsUrl returned'],
      ['Sends branded email via Resend', '"Your proposal for <client> is ready — v1"'],
      ['Logs proposal_exports + marks job completed', 'fully traceable record'],
    ] as [string, string][],
    dataOut: ['pdfUrl', 'fileName', 'emailSentTo', 'emailSentAt', 'status:completed'],
    accent: '#D4A84F',
  },
  {
    id: 'problem-speed',
    chip: 'PROBLEM · SOLVED',
    num: '10',
    title: 'Days of work, done in minutes.',
    blurb: 'A typical RFP response takes a team 3–7 days — a business analyst to read the doc, SMEs to map capabilities, writers to draft, a reviewer to validate. Nivedan AI compresses that entire process into a single 15–20 minute run.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771453/problem1_fi1r9l.png',
    imagePlaceholder: 'Add image / chart comparing manual 3–7 day RFP response vs Nivedan AI\'s 15–20 min pipeline.',
    model: 'The 6-agent pipeline · end-to-end',
    role: 'Real-world problem #1, solved.',
    whatHappens: [
      ['Agent 2 reads the full PDF in seconds', 'native Gemini PDF intelligence — no parser libs'],
      ['Agents 3 + 4 run capability work in parallel', 'no human handoffs, no waiting'],
      ['Agent 5 drafts all 12 sections in one pass', 'coherent voice, no stitching'],
      ['Agent 6 validates + corrects automatically', 'no peer-review bottleneck'],
      ['Only human time required is the HITL approval', 'minutes, not days'],
    ] as [string, string][],
    dataOut: ['avgPipelineTime: 15–20 min', 'humanTouchpoints: 1', 'sectionsDrafted: 12', 'teamRequired: 0'],
    accent: '#D4A84F',
  },
  {
    id: 'problem-generic',
    chip: 'PROBLEM · SOLVED',
    num: '11',
    title: 'No more generic proposals.',
    blurb: "Most vendors submit cookie-cutter boilerplate with the client's name swapped in. Evaluation committees see straight through it. Nivedan AI writes proposals that read as if the author has lived inside the client's business for months.",
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771453/problem2_zbmzoy.png',
    imagePlaceholder: "Add image of a tailored proposal section referencing the client's real news, leadership, priorities.",
    model: 'Agent 3 · Tavily MCP + Gemini synthesis',
    role: 'Real-world problem #2, solved.',
    whatHappens: [
      ['Tavily live-searches the client on the web', 'recent news, leadership, strategic priorities'],
      ['Gemini synthesises into a structured profile', 'with sources + confidence rating'],
      ['Proposal Writer weaves it into every section', 'not just the cover letter'],
      ['Specificity check enforced by Quality Review', 'generic filler is flagged + corrected'],
      ["Reads like a vendor who deeply knows the client", 'not a templated cold pitch'],
    ] as [string, string][],
    dataOut: ['recentNews', 'leadership', 'strategicPriorities', 'researchConfidence', 'sources[]'],
    accent: '#D4A84F',
  },
  {
    id: 'problem-missed-reqs',
    chip: 'PROBLEM · SOLVED',
    num: '12',
    title: 'Nothing slips through.',
    blurb: 'RFPs are 50–150 pages of dense procurement language with requirements buried in appendices. Humans routinely miss them — and a single missed mandatory clause can disqualify the entire submission. Nivedan AI extracts every one.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771454/problem3_hc9ayr.png',
    imagePlaceholder: 'Add image of a requirements checklist with mandatory + optional items extracted and addressed.',
    model: 'Agent 2 + Agent 4 + Agent 6 · enforced chain',
    role: 'Real-world problem #3, solved.',
    whatHappens: [
      ['Agent 2 extracts every mandatory + optional req', 'with category, priority, confidence'],
      ['Agent 4 maps each to the Knowledge Base', 'with evidence + a scored gap analysis'],
      ['Agent 5 is given the full requirement list', 'explicitly instructed to address every one'],
      ['Agent 6 validates this as quality check #1', '"every mandatory requirement addressed"'],
      ['Gaps surfaced with proposed remedies', 'never silently dropped'],
    ] as [string, string][],
    dataOut: ['mandatoryCount', 'optionalCount', 'matchedCount', 'gapCount', 'coverageRatio'],
    accent: '#D4A84F',
  },
  {
    id: 'problem-capabilities',
    chip: 'PROBLEM · SOLVED',
    num: '13',
    title: 'Honest capability scoring.',
    blurb: "Most teams submit proposals without knowing if their capabilities actually match what was asked. They guess, inflate, and hope. Nivedan AI does a scored, evidence-backed assessment so you see exactly where you're strong — and where you're bluffing.",
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771453/problem4_likpzx.png',
    imagePlaceholder: 'Add image of the capability matrix — each requirement scored 0.00–1.00 against your KB.',
    model: 'Agent 4 · gemini-3.1-flash-lite + Tavily evidence',
    role: 'Real-world problem #4, solved.',
    whatHappens: [
      ['Every requirement scored 0.00–1.00', 'against your active Knowledge Base items'],
      ['Tavily gathers real-world evidence per req', 'public proof points strengthen matches'],
      ['confidenceScore < 0.50 → isGap=true', 'with a suggested remedy stored'],
      ['avgConfidence + coverageRatio computed', 'fed straight into Quality Review scoring'],
      ['Quality score reflects real coverage', '92%+ floor when matched, 75% cap when gapped'],
    ] as [string, string][],
    dataOut: ['confidenceScore', 'isGap', 'gapSuggestion', 'tavilyEvidence', 'avgConfidence'],
    accent: '#D4A84F',
  },
  {
    id: 'problem-constraints',
    chip: 'PROBLEM · SOLVED',
    num: '14',
    title: 'Inside the budget. Inside the deadline.',
    blurb: "It's surprisingly common for proposals to exceed the stated budget ceiling or propose a delivery timeline longer than the RFP deadline — an instant disqualification in most procurement. Nivedan AI treats them as hard constraints, then double-checks the result.",
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771463/problem5_w97e19.png',
    imagePlaceholder: 'Add image showing budget ceiling + deadline as hard guardrails on the pricing + timeline sections.',
    model: 'Agent 2 → Agent 5 → Agent 6 · enforced',
    role: 'Real-world problem #5, solved.',
    whatHappens: [
      ['Budget ceiling + deadline extracted by Agent 2', 'stored explicitly on the job'],
      ['Agent 5 receives both as hard prompt constraints', '"stay within RFP stated constraints"'],
      ['Quality check #2: timeline ≤ deadline', 'violations trigger an automatic rewrite'],
      ['Quality check #3: pricing ≤ budget ceiling', 'no proposal escapes over-budget'],
      ['Corrections applied before human review', 'reviewer never sees a non-compliant draft'],
    ] as [string, string][],
    dataOut: ['budgetCeiling', 'submissionDeadline', 'projectTimeline', 'pricingStructure', 'correctionsApplied'],
    accent: '#D4A84F',
  },
  {
    id: 'problem-quality',
    chip: 'PROBLEM · SOLVED',
    num: '15',
    title: 'A real quality gate, not a vibe-check.',
    blurb: 'Most proposal processes have informal peer review at best — someone reads it once and says "looks good." No contradiction-checking, no objective score, no record of what was actually corrected. Nivedan AI replaces that with a systematic 5-point validation.',
    image: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779771458/problem6_hx8m45.png',
    imagePlaceholder: 'Add image of the quality scorecard — 5 checks, score percentage, list of auto-corrections applied.',
    model: 'Agent 6 · gemini-3.1-flash-lite + coverage logic',
    role: 'Real-world problem #6, solved.',
    whatHappens: [
      ['Check 1: every mandatory requirement addressed', 'tied directly to Agent 4 coverage data'],
      ['Check 2 + 3: timeline + budget compliance', "against the RFP's own constraints"],
      ['Check 4: cross-section consistency', 'team size, timeline, scope all align'],
      ['Check 5: no generic filler, every para is client-specific', 'kills boilerplate at the gate'],
      ['Objective qualityScore + corrected sections saved', 'reviewer sees an informed decision point'],
    ] as [string, string][],
    dataOut: ['qualityScore', 'qualityReviewNotes', 'correctionsApplied', 'sectionsUpdated', 'validationPassed'],
    accent: '#D4A84F',
  },
]

/* -------------------- TYPES -------------------- */
type Step = typeof STEPS[number]

/* -------------------- BACKGROUND -------------------- */
function Background() {
  return (
    <>
      <div className={styles.orbA} style={{
        position: 'fixed', top: '8%', right: '-180px', width: 520, height: 520,
        borderRadius: '50%', filter: 'blur(80px)',
        background: 'radial-gradient(circle, rgba(212,168,79,0.32), transparent 65%)',
        zIndex: 0, pointerEvents: 'none',
      }} />
      <div className={styles.orbB} style={{
        position: 'fixed', bottom: '-180px', left: '-160px', width: 560, height: 560,
        borderRadius: '50%', filter: 'blur(90px)',
        background: 'radial-gradient(circle, rgba(47,93,80,0.16), transparent 65%)',
        zIndex: 0, pointerEvents: 'none',
      }} />
      <svg style={{
        position: 'fixed', top: '30%', left: 0, width: '100%', height: '70%',
        opacity: 0.10, pointerEvents: 'none', zIndex: 0,
      }} viewBox="0 0 1500 700" preserveAspectRatio="none" fill="none">
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i}
            d={`M -50 ${i * 28 + 30} Q 400 ${i * 28 + 5}, 800 ${i * 28 + 50} T 1600 ${i * 28 + 20}`}
            stroke={i % 4 === 0 ? 'rgba(212,168,79,0.30)' : 'rgba(47,93,80,0.10)'}
            strokeWidth="1" fill="none" />
        ))}
      </svg>
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.035, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </>
  )
}

/* -------------------- PAGE HEADER -------------------- */
function PageHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '28px 0', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 2,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
          display: 'grid', placeItems: 'center',
          border: '1px solid rgba(212,168,79,0.50)',
          boxShadow: '0 6px 18px rgba(212,168,79,0.30), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
            <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
            <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
            <circle cx="12" cy="11" r="1.6" fill="#D4A84F" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12 }}>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontStyle: 'normal', fontSize: 22, color: 'var(--forest-deep)' }}>
            Nivedan <span style={{ color: '#B88A2F' }}>AI</span>
          </span>
          <span style={{
            fontSize: 10, letterSpacing: '0.20em', fontWeight: 600,
            color: 'var(--ni-muted)', textTransform: 'uppercase', marginTop: 2,
            fontFamily: 'var(--f-mono)',
          }}>How It Works</span>
        </div>
      </Link>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', fontSize: 14, fontWeight: 500,
          color: 'var(--ink-soft)', background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(47,93,80,0.12)', borderRadius: 10,
          backdropFilter: 'blur(8px)', textDecoration: 'none',
          transition: 'color .2s',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3 L4 7 L9 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back home
        </Link>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', fontSize: 14, fontWeight: 600,
          color: '#2A1E08',
          background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
          border: '1px solid rgba(212,168,79,0.5)', borderRadius: 10,
          boxShadow: '0 4px 14px rgba(212,168,79,0.30)',
          textDecoration: 'none',
        }}>
          Try Nivedan
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 11 L11 3 M5 3 H11 V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

/* -------------------- STEP RAIL -------------------- */
function StepRail({ steps, active, onPick }: { steps: typeof STEPS; active: number; onPick: (i: number) => void }) {
  return (
    <div className={styles.stepRail} style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '14px 18px',
      background: 'rgba(255,255,255,0.65)',
      border: '1px solid rgba(255,255,255,0.8)',
      borderRadius: 999,
      backdropFilter: 'blur(14px) saturate(140%)',
      boxShadow: '0 14px 40px rgba(35,69,57,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
      overflowX: 'auto', position: 'relative', zIndex: 2,
    }}>
      {steps.map((s, i) => {
        const isActive = i === active
        const isPast = i < active
        return (
          <React.Fragment key={s.id}>
            <button
              onClick={() => onPick(i)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', borderRadius: 999,
                background: isActive
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(247,231,193,0.7) 100%)'
                  : 'transparent',
                border: isActive ? '1px solid rgba(212,168,79,0.5)' : '1px solid transparent',
                boxShadow: isActive ? '0 6px 16px rgba(212,168,79,0.25)' : 'none',
                transition: 'all .35s cubic-bezier(.2,.7,.2,1)',
                whiteSpace: 'nowrap', cursor: 'pointer',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700,
                background: isActive
                  ? 'linear-gradient(180deg, #E0B663, #B88A2F)'
                  : (isPast ? 'rgba(47,93,80,0.85)' : 'rgba(47,93,80,0.10)'),
                color: isActive ? '#2A1E08' : (isPast ? '#fff' : 'var(--forest-deep)'),
                boxShadow: isActive ? '0 3px 8px rgba(212,168,79,0.4)' : 'none',
              }}>
                {isPast ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : s.num}
              </span>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--forest-deep)' : 'var(--ink-soft)',
                fontFamily: 'var(--f-body)',
              }}>
                {s.title.replace(' Agent', '')}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span style={{
                flex: '0 0 18px', height: 1.5, margin: '0 2px',
                background: i < active
                  ? 'linear-gradient(90deg, rgba(47,93,80,0.5), rgba(47,93,80,0.5))'
                  : 'rgba(47,93,80,0.15)',
                borderRadius: 1,
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* -------------------- PLACEHOLDER -------------------- */
function Placeholder({ text }: { text?: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: `
        repeating-linear-gradient(135deg,
          rgba(47,93,80,0.04) 0 14px,
          rgba(47,93,80,0.07) 14px 28px),
        linear-gradient(180deg, #FBF7EE 0%, #F4EFE6 100%)`,
      display: 'grid', placeItems: 'center', padding: 36,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
          background: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(47,93,80,0.30)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.6">
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <path d="M3 16 L8 11 L13 16 L17 12 L21 16" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="1.4" fill="var(--forest)" />
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '.10em', color: 'var(--forest-deep)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
          Image placeholder
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{text}</p>
      </div>
    </div>
  )
}

/* -------------------- LIGHTBOX -------------------- */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.lbOverlay}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,20,16,0.82)',
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button
        className={styles.lbClose}
        onClick={onClose}
        aria-label="Close image"
        style={{
          position: 'fixed', top: 20, right: 24, zIndex: 201,
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
          border: '1px solid rgba(212,168,79,0.5)',
          boxShadow: '0 6px 20px rgba(212,168,79,0.35)',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          fontSize: 20, color: '#2A1E08', lineHeight: 1,
        }}
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={styles.lbImg}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  )
}

/* -------------------- IMAGE PANEL -------------------- */
function ImagePanel({ step, direction, onImageClick }: { step: Step; direction: string; onImageClick: (src: string, alt: string) => void }) {
  const animClass = direction === 'next' ? styles.slideInR : styles.slideInL
  return (
    <div className={animClass} style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: -30, borderRadius: 40,
        background: 'radial-gradient(60% 60% at 50% 50%, rgba(212,168,79,0.20) 0%, transparent 70%)',
        filter: 'blur(10px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -14, left: 18, zIndex: 3,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', borderRadius: 999,
        background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
        color: '#2A1E08', fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700,
        letterSpacing: '.14em', textTransform: 'uppercase',
        boxShadow: '0 8px 22px rgba(212,168,79,0.4), inset 0 1px 0 rgba(255,255,255,0.6)',
        border: '1px solid rgba(212,168,79,0.5)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2F5D50', boxShadow: '0 0 8px #2F5D50' }} />
        {step.chip}
      </div>

      <div className={`${styles.imgFrame} ${styles.imgFloat}`} style={{ background: '#fff', aspectRatio: '3 / 2' }}>
        {step.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={step.image} alt={step.title}
            className={styles.imgClickable}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            draggable={false}
            onClick={() => onImageClick(step.image!, step.imageAlt ?? step.title)}
          />
        ) : (
          <Placeholder text={'imagePlaceholder' in step ? (step as { imagePlaceholder?: string }).imagePlaceholder : undefined} />
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 18, padding: '12px 18px',
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.85)',
        borderRadius: 14, backdropFilter: 'blur(10px)',
      }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.12em', color: 'var(--ni-muted)', fontWeight: 600 }}>
          MODEL · CONFIG
        </span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--forest-deep)', fontWeight: 600 }}>
          {step.model}
        </span>
      </div>
    </div>
  )
}

/* -------------------- TEXT PANEL -------------------- */
function TextPanel({ step }: { step: Step }) {
  const words = step.title.split(' ')
  const lastWord = words.slice(-1)[0]
  const restWords = words.slice(0, -1).join(' ')
  return (
    <div className={styles.stagger} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className={styles.tagChip} style={{ alignSelf: 'flex-start' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: step.accent, boxShadow: `0 0 8px ${step.accent}` }} />
        {step.role}
      </div>

      <h2 style={{
        fontFamily: 'var(--f-display)', fontSize: 'clamp(34px, 4vw, 52px)',
        lineHeight: 1.04, letterSpacing: '-0.025em', color: 'var(--ink)', margin: 0,
      }}>
        {restWords}{' '}
        <span style={{ fontFamily: 'var(--f-display-serif)', fontStyle: 'italic', fontWeight: 500, color: 'var(--forest)' }}>{lastWord}</span>
      </h2>

      <p style={{ fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
        {step.blurb}
      </p>

      <div style={{
        padding: '22px 24px', borderRadius: 18,
        background: 'rgba(255,255,255,0.65)',
        border: '1px solid rgba(255,255,255,0.85)',
        backdropFilter: 'blur(14px) saturate(140%)',
        boxShadow: '0 10px 30px rgba(35,69,57,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700,
          color: 'var(--forest-deep)', letterSpacing: '.14em', marginBottom: 8,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6 L5 9 L10 3" stroke="#B88A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          WHAT HAPPENS
        </div>
        <div>
          {step.whatHappens.map(([label, detail], i) => (
            <div className={styles.whItem} key={i}>
              <div className={styles.whNum}>{i + 1}</div>
              <div className={styles.whText}>
                <b>{label}</b>
                {detail && <span style={{ color: 'var(--ni-muted)' }}> — {detail}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
        padding: '14px 16px', borderRadius: 14,
        background: 'linear-gradient(180deg, rgba(47,93,80,0.06) 0%, rgba(47,93,80,0.03) 100%)',
        border: '1px solid rgba(47,93,80,0.10)',
      }}>
        <span style={{
          fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.14em',
          color: 'var(--forest-deep)', fontWeight: 700, marginRight: 4,
        }}>
          HANDS OFF →
        </span>
        {step.dataOut.map(k => (
          <span key={k} style={{
            fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 600,
            padding: '5px 10px', borderRadius: 8,
            background: '#fff', border: '1px solid rgba(47,93,80,0.12)',
            color: 'var(--forest-deep)',
          }}>{k}</span>
        ))}
      </div>
    </div>
  )
}

/* -------------------- NAV ARROW -------------------- */
function NavArrow({ dir, onClick, disabled }: { dir: 'prev' | 'next'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      className={styles.navArrow}
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous step' : 'Next step'}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [dir === 'prev' ? 'left' : 'right']: -28,
        width: 56, height: 56, borderRadius: '50%',
        display: 'grid', placeItems: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 14px 36px rgba(35,69,57,0.18), 0 2px 6px rgba(35,69,57,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        zIndex: 5, cursor: 'pointer',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        {dir === 'prev'
          ? <path d="M11.5 3.5 L5.5 9 L11.5 14.5" stroke="var(--forest-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M6.5 3.5 L12.5 9 L6.5 14.5" stroke="var(--forest-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </button>
  )
}

/* -------------------- DOT INDICATORS -------------------- */
function Dots({ count, active, onPick }: { count: number; active: number; onPick: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 36 }}>
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === active
        return (
          <button key={i} onClick={() => onPick(i)} aria-label={`Go to step ${i + 1}`}
            className={isActive ? styles.dotActive : ''}
            style={{
              width: isActive ? 36 : 10, height: 10, borderRadius: 999,
              background: isActive
                ? 'linear-gradient(90deg, #E0B663, #B88A2F)'
                : 'rgba(47,93,80,0.18)',
              border: 'none', cursor: 'pointer',
              transition: 'width .4s cubic-bezier(.16,1,.3,1), background .3s',
              padding: 0,
            }}
          />
        )
      })}
    </div>
  )
}

/* -------------------- KEYBOARD HINT -------------------- */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-grid', placeItems: 'center', minWidth: 22, height: 22, padding: '0 6px',
      background: '#fff', border: '1px solid rgba(47,93,80,0.18)',
      borderBottomWidth: 2, borderRadius: 6,
      fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--forest-deep)', fontWeight: 700,
    }}>{children}</span>
  )
}
function KeyboardHint() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.06em',
      color: 'var(--ni-muted)', fontWeight: 600,
    }}>
      <Kbd>←</Kbd> <Kbd>→</Kbd>
      <span>or drag to navigate</span>
    </div>
  )
}

/* -------------------- PROGRESS BAR -------------------- */
function ProgressBar({ active, total }: { active: number; total: number }) {
  const pct = ((active + 1) / total) * 100
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 50,
      background: 'rgba(47,93,80,0.06)', pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, #E0B663, #B88A2F)',
        boxShadow: '0 0 10px rgba(212,168,79,0.6)',
        transition: 'width .6s cubic-bezier(.16,1,.3,1)',
      }} />
    </div>
  )
}

/* -------------------- BOTTOM CTA -------------------- */
function BottomCTA() {
  return (
    <div style={{
      margin: '80px 0 60px', padding: '44px 48px', borderRadius: 28,
      background: 'linear-gradient(135deg, rgba(47,93,80,0.92) 0%, rgba(35,69,57,0.95) 100%)',
      border: '1px solid rgba(212,168,79,0.25)',
      boxShadow: '0 30px 80px rgba(35,69,57,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
      color: '#fff', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -100, right: -60, width: 280, height: 280,
        borderRadius: '50%', filter: 'blur(70px)',
        background: 'radial-gradient(circle, rgba(212,168,79,0.45), transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -60, width: 240, height: 240,
        borderRadius: '50%', filter: 'blur(80px)',
        background: 'radial-gradient(circle, rgba(247,231,193,0.30), transparent 70%)',
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 540 }}>
          <h3 style={{
            fontFamily: 'var(--f-display)', fontSize: 'clamp(28px, 3vw, 38px)',
            lineHeight: 1.1, margin: 0, color: '#fff', letterSpacing: '-0.02em',
          }}>
            See the pipeline run on{' '}
            <span style={{ fontFamily: 'var(--f-display-serif)', fontStyle: 'italic', color: '#F0DBA6' }}>your own RFP.</span>
          </h3>
          <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.55 }}>
            Upload a PDF, point us at a recipient, and watch the six agents work in 15–20 minutes.
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 22px', borderRadius: 12,
            background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
            color: '#2A1E08', fontWeight: 600, fontSize: 15,
            border: '1px solid rgba(212,168,79,0.5)',
            boxShadow: '0 4px 14px rgba(212,168,79,0.3)',
            textDecoration: 'none',
          }}>
            Try Nivedan AI
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11 L11 3 M5 3 H11 V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 22px', borderRadius: 14,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', fontWeight: 600, fontSize: 15,
            backdropFilter: 'blur(10px)', textDecoration: 'none',
          }}>
            See a live run
          </Link>
        </div>
      </div>
    </div>
  )
}

/* -------------------- CAROUSEL WITH TITLE -------------------- */
function CarouselWithTitle({ onImageClick }: { onImageClick: (src: string, alt: string) => void }) {
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const total = STEPS.length

  const go = (i: number, dir?: 'next' | 'prev') => {
    if (i < 0 || i >= total) return
    setDirection(dir ?? (i > active ? 'next' : 'prev'))
    setActive(i)
  }
  const next = () => go(active + 1, 'next')
  const prev = () => go(active - 1, 'prev')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const dragRef = useRef({ startX: 0, dragging: false })
  const onDown = (e: React.PointerEvent | React.TouchEvent) => {
    const x = 'clientX' in e ? e.clientX : e.touches[0].clientX
    dragRef.current = { startX: x, dragging: true }
  }
  const onUp = (e: React.PointerEvent | React.TouchEvent) => {
    if (!dragRef.current.dragging) return
    const x = 'clientX' in e ? e.clientX : (e as React.TouchEvent).changedTouches[0].clientX
    const dx = x - dragRef.current.startX
    dragRef.current.dragging = false
    if (Math.abs(dx) > 50) {
      if (dx < 0) next()
      else prev()
    }
  }

  const step = STEPS[active]
  const words = `${STEPS.length}`

  return (
    <>
      <ProgressBar active={active} total={total} />

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginTop: 4, marginBottom: 28 }}>
        <div style={{ maxWidth: 720 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--forest-deep)', marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)' }} />
            THE PIPELINE, STEP BY STEP
          </span>
          <h1 style={{
            fontFamily: 'var(--f-display)', fontSize: 'clamp(40px, 5.4vw, 64px)',
            lineHeight: 1.02, letterSpacing: '-0.025em', marginTop: 18, color: 'var(--ink)', margin: 0,
          }}>
            From an RFP PDF to a winning proposal,{' '}
            <span style={{ fontFamily: 'var(--f-display-serif)', fontStyle: 'italic', color: 'var(--forest)' }}>in {words} guided steps.</span>
          </h1>
          <p style={{ marginTop: 18, fontSize: 18, color: 'var(--ink-soft)', maxWidth: 640 }}>
            Glide horizontally through the pipeline. Each step shows what the agent does, the model behind it,
            and the data it hands off to the next.
          </p>
        </div>

        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end',
          gap: 6, padding: '14px 20px',
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.85)', borderRadius: 18,
          backdropFilter: 'blur(14px) saturate(140%)',
          boxShadow: '0 10px 30px rgba(35,69,57,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ni-muted)', fontWeight: 600 }}>
            VIEWING
          </span>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 30, fontWeight: 600, color: 'var(--forest-deep)', lineHeight: 1 }}>
            <span style={{ color: '#B88A2F' }}>{String(active + 1).padStart(2, '0')}</span>
            <span style={{ opacity: 0.4, fontSize: 22, margin: '0 4px' }}>/</span>
            <span>{String(total).padStart(2, '0')}</span>
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <StepRail steps={STEPS} active={active} onPick={(i) => go(i)} />
      </div>

      <div
        className={styles.swipeStage}
        style={{ position: 'relative', padding: '0 6px' }}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onTouchStart={onDown}
        onTouchEnd={onUp}
      >
        <NavArrow dir="prev" onClick={prev} disabled={active === 0} />
        <NavArrow dir="next" onClick={next} disabled={active === total - 1} />

        <div key={active} style={{
          display: 'grid', gridTemplateColumns: '1.05fr 1fr',
          gap: 60, alignItems: 'center',
          padding: '40px 6px 24px',
          position: 'relative', zIndex: 1,
        }}>
          <ImagePanel step={step} direction={direction} onImageClick={onImageClick} />
          <TextPanel step={step} />
        </div>
      </div>

      <Dots count={total} active={active} onPick={(i) => go(i)} />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <KeyboardHint />
      </div>

      <BottomCTA />
    </>
  )
}

/* -------------------- PAGE -------------------- */
export default function HowItWorksPage() {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  return (
    <div style={{
      background: `
        radial-gradient(1100px 700px at 92% -10%, rgba(247,231,193,0.65) 0%, transparent 60%),
        radial-gradient(900px 600px at -10% 25%, rgba(221,231,216,0.45) 0%, transparent 60%),
        radial-gradient(800px 600px at 85% 105%, rgba(247,231,193,0.45) 0%, transparent 60%),
        linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)`,
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <Background />
      <div style={{
        maxWidth: 1440, margin: '0 auto', padding: '0 48px 40px',
        position: 'relative', zIndex: 1,
      }}>
        <PageHeader />
        <CarouselWithTitle onImageClick={(src, alt) => setLightbox({ src, alt })} />
      </div>
      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
