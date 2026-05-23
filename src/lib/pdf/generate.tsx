import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'

export interface ProposalData {
  coverLetter: string | null
  executiveSummary: string | null
  understandingOfRequirements: string | null
  proposedSolution: string | null
  technicalApproach: string | null
  caseStudies: string | null
  teamAndExpertise: string | null
  projectTimeline: string | null
  pricingStructure: string | null
  risksMitigation: string | null
  assumptionsDependencies: string | null
  whyUs: string | null
  version: number
}

export interface CompanyProfileData {
  companyName: string
  logoUrl: string | null
  brandColorPrimary: string | null
  brandColorSecondary: string | null
}

export interface ParsedRfpContext {
  budgetCeiling: string | null
  submissionDeadline: string | null
  projectTimeline: string | null
  evaluationCriteria: unknown
  complianceRequirements: unknown
  mandatoryRequirements: unknown
}

export interface ClientResearchContext {
  industry: string | null
  companySummary: string | null
  strategicPriorities: unknown
  keyChallenges: unknown
}

export interface CapabilityMatchItem {
  requirementText: string | null
  matchSummary: string | null
  confidenceScore: string | null
  isGap: boolean | null
}

interface ProposalPdfProps {
  proposal: ProposalData
  companyProfile: CompanyProfileData
  clientName: string
  parsedRfp: ParsedRfpContext | null
  clientResearch: ClientResearchContext | null
  capabilityMatchList: CapabilityMatchItem[]
}

/* ── Brand tokens ── */
const B = {
  FOREST_DEEP:  '#234539',
  FOREST:       '#2F5D50',
  GOLD:         '#D4A84F',
  GOLD_DEEP:    '#B88A2F',
  GOLD_LIGHT:   '#F5E6C0',
  IVORY:        '#FAF7F2',
  INK:          '#1A2E25',
  WHITE:        '#FFFFFF',
  GRAY:         '#888888',
  BODY:         '#2a2a2a',
  LINE:         '#E5E5E5',
}

const styles = StyleSheet.create({
  /* ── Cover ── */
  coverPage: { backgroundColor: B.FOREST_DEEP, flexDirection: 'column', position: 'relative' },
  coverGoldBar: { height: 6, backgroundColor: B.GOLD, width: '100%' },
  coverBody: { flex: 1, padding: 60, flexDirection: 'column', justifyContent: 'center' },
  coverLogo: { width: 72, height: 72, marginBottom: 44, objectFit: 'contain', backgroundColor: B.WHITE, borderRadius: 8, padding: 6 },
  coverLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 2, marginBottom: 16 },
  coverTitle: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: B.WHITE, marginBottom: 6, lineHeight: 1.3 },
  coverDivider: { width: 48, height: 2, backgroundColor: B.GOLD, marginTop: 24, marginBottom: 28 },
  coverPrepLabel: { fontSize: 9, fontFamily: 'Helvetica', color: B.GOLD, letterSpacing: 1.5, marginBottom: 4 },
  coverPrepValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: B.WHITE, marginBottom: 16 },
  coverMeta: { fontSize: 10, fontFamily: 'Helvetica', color: `${B.WHITE}99`, marginTop: 4 },
  coverBottomBar: { borderTopWidth: 1, borderTopColor: `${B.GOLD}55`, paddingTop: 14, paddingBottom: 24, paddingHorizontal: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverConfidential: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 1.5 },
  coverVersion: { fontSize: 8, fontFamily: 'Helvetica', color: `${B.WHITE}66` },

  /* ── Cover Letter ── */
  letterPage: { backgroundColor: B.WHITE, fontFamily: 'Helvetica', fontSize: 11, color: B.BODY, position: 'relative' },
  letterAccentBar: { height: 4, backgroundColor: B.GOLD, width: '100%' },
  letterBody: { flex: 1, paddingHorizontal: 56, paddingTop: 40, paddingBottom: 64 },
  letterDate: { fontSize: 10, fontFamily: 'Helvetica', color: B.GRAY, marginBottom: 28 },
  letterHeading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 2, marginBottom: 8 },
  letterTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: B.FOREST_DEEP, marginBottom: 28 },
  letterText: { fontSize: 11, fontFamily: 'Helvetica', color: B.BODY, lineHeight: 1.8, marginBottom: 12 },

  /* ── TOC ── */
  tocPage: { backgroundColor: B.IVORY, padding: 0, fontFamily: 'Helvetica', fontSize: 11 },
  tocGoldBar: { height: 4, backgroundColor: B.GOLD, width: '100%' },
  tocBody: { flex: 1, paddingHorizontal: 56, paddingTop: 48, paddingBottom: 64 },
  tocHeading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 2, marginBottom: 8 },
  tocTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: B.FOREST_DEEP, marginBottom: 32 },
  tocItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 0, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: '#D8D0C4' },
  tocNum: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.GOLD, width: 28 },
  tocItemText: { fontSize: 12, fontFamily: 'Helvetica', color: B.INK, flex: 1 },
  tocTag: { fontSize: 8, fontFamily: 'Helvetica', color: B.GRAY, marginLeft: 8 },

  /* ── Client Context ── */
  ctxPage: { backgroundColor: B.IVORY, fontFamily: 'Helvetica', fontSize: 11, position: 'relative' },
  ctxAccentBar: { height: 4, backgroundColor: B.GOLD, width: '100%' },
  ctxBody: { flex: 1, paddingHorizontal: 56, paddingTop: 36, paddingBottom: 64 },
  ctxHeading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 2, marginBottom: 8 },
  ctxTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: B.FOREST_DEEP, marginBottom: 24 },
  ctxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  ctxCard: { width: '47%', backgroundColor: B.WHITE, borderRadius: 6, padding: 14, borderLeftWidth: 3, borderLeftColor: B.GOLD },
  ctxCardLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 1.5, marginBottom: 4 },
  ctxCardValue: { fontSize: 11, fontFamily: 'Helvetica', color: B.INK, lineHeight: 1.5 },
  ctxSectionLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.FOREST, letterSpacing: 1, marginTop: 16, marginBottom: 6 },
  ctxBullet: { fontSize: 11, fontFamily: 'Helvetica', color: B.BODY, lineHeight: 1.6, marginBottom: 3, paddingLeft: 8 },

  /* ── Standard section pages ── */
  page: { backgroundColor: B.WHITE, fontFamily: 'Helvetica', fontSize: 11, color: B.BODY, position: 'relative' },
  pageAccentBar: { height: 4, backgroundColor: B.GOLD, width: '100%' },
  pageBody: { flex: 1, paddingHorizontal: 52, paddingTop: 36, paddingBottom: 64 },
  sectionNumLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 2, marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: B.FOREST_DEEP, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: B.GOLD },
  bodyText: { fontSize: 11, fontFamily: 'Helvetica', color: B.BODY, lineHeight: 1.8, marginBottom: 10 },

  /* ── Traceability Matrix ── */
  matrixPage: { backgroundColor: B.WHITE, fontFamily: 'Helvetica', fontSize: 10, color: B.BODY, position: 'relative' },
  matrixBody: { flex: 1, paddingHorizontal: 40, paddingTop: 36, paddingBottom: 64 },
  matrixRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: B.LINE, paddingVertical: 7 },
  matrixHeader: { flexDirection: 'row', backgroundColor: B.FOREST_DEEP, paddingVertical: 9, paddingHorizontal: 0, marginBottom: 0 },
  matrixHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.WHITE, letterSpacing: 0.5 },
  matrixCellReq: { width: '28%', paddingRight: 8, fontSize: 9, fontFamily: 'Helvetica', color: B.BODY, lineHeight: 1.5 },
  matrixCellMatch: { width: '42%', paddingRight: 8, fontSize: 9, fontFamily: 'Helvetica', color: B.BODY, lineHeight: 1.5 },
  matrixCellScore: { width: '15%', paddingRight: 8, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  matrixCellStatus: { width: '15%', fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  matrixGapBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#C0392B' },
  matrixOkBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.FOREST },

  /* ── Compliance Appendix ── */
  compliancePage: { backgroundColor: B.IVORY, fontFamily: 'Helvetica', fontSize: 11, position: 'relative' },
  complianceBody: { flex: 1, paddingHorizontal: 52, paddingTop: 36, paddingBottom: 64 },
  complianceItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, backgroundColor: B.WHITE, borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: B.GOLD },
  complianceTick: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B.FOREST, marginRight: 10, width: 14 },
  complianceText: { fontSize: 11, fontFamily: 'Helvetica', color: B.INK, flex: 1, lineHeight: 1.5 },

  /* ── Footer ── */
  footer: { position: 'absolute', bottom: 20, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: B.GOLD, paddingTop: 7 },
  footerLeft: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.FOREST },
  footerCenter: { fontSize: 8, fontFamily: 'Helvetica', color: B.GRAY },
  footerRight: { fontSize: 8, fontFamily: 'Helvetica', color: B.GRAY },

  /* ── Thank You ── */
  thankPage: { backgroundColor: B.FOREST_DEEP, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 80 },
  thankLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.GOLD, letterSpacing: 3, marginBottom: 20 },
  thankTitle: { fontSize: 36, fontFamily: 'Helvetica-Bold', color: B.WHITE, marginBottom: 28, textAlign: 'center' },
  thankDivider: { width: 48, height: 2, backgroundColor: B.GOLD, marginBottom: 28 },
  thankBody: { fontSize: 14, fontFamily: 'Helvetica', color: `${B.WHITE}CC`, textAlign: 'center', lineHeight: 1.7, marginBottom: 8 },
  thankCompany: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B.WHITE, marginTop: 36, marginBottom: 4, textAlign: 'center' },
  thankSub: { fontSize: 9, fontFamily: 'Helvetica', color: `${B.GOLD}CC`, textAlign: 'center', letterSpacing: 1 },
  thankFooter: { position: 'absolute', bottom: 28, fontSize: 8, fontFamily: 'Helvetica', color: `${B.WHITE}55`, textAlign: 'center', letterSpacing: 1 },
})

const SectionFooter = ({ companyName }: { companyName: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerLeft}>{companyName}</Text>
    <Text style={styles.footerCenter}>CONFIDENTIAL</Text>
    <Text
      style={styles.footerRight}
      render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  </View>
)

/* ── TOC entries ── */
const TOC_ENTRIES = [
  { num: '01', title: 'Cover Letter' },
  { num: '02', title: 'Client Context Summary', tag: 'Computed' },
  { num: '03', title: 'Executive Summary' },
  { num: '04', title: 'Understanding of Requirements' },
  { num: '05', title: 'Proposed Solution' },
  { num: '06', title: 'Technical Approach' },
  { num: '07', title: 'Requirement Traceability Matrix', tag: 'Computed' },
  { num: '08', title: 'Case Studies' },
  { num: '09', title: 'Team & Expertise' },
  { num: '10', title: 'Project Timeline' },
  { num: '11', title: 'Pricing Structure' },
  { num: '12', title: 'Risks & Mitigation' },
  { num: '13', title: 'Assumptions & Dependencies' },
  { num: '14', title: 'Why Us' },
  { num: '15', title: 'Compliance Appendix', tag: 'Computed' },
]

/* ── Standard text section ── */
const SectionPage = ({ num, title, content, companyName }: { num: string; title: string; content: string | null; companyName: string }) => {
  if (!content) return null
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageAccentBar} />
      <View style={styles.pageBody}>
        <Text style={styles.sectionNumLabel}>{num}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.bodyText}>{content}</Text>
      </View>
      <SectionFooter companyName={companyName} />
    </Page>
  )
}

/* ── Helper: safely parse jsonb to string array ── */
function toStringArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string') {
    try { return toStringArray(JSON.parse(val)) } catch { return [val] }
  }
  return []
}

const ProposalDocument = ({ proposal, companyProfile, clientName, parsedRfp, clientResearch, capabilityMatchList }: ProposalPdfProps) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const companyName = companyProfile.companyName

  const complianceItems = toStringArray(parsedRfp?.complianceRequirements)
  const strategicPriorities = toStringArray(clientResearch?.strategicPriorities)
  const keyChallenges = toStringArray(clientResearch?.keyChallenges)

  return (
    <Document title={`Proposal for ${clientName}`} author={companyName} creator="Nivedan AI">

      {/* ── 1. Cover Page ── */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverGoldBar} />
        <View style={styles.coverBody}>
          {companyProfile.logoUrl && <Image src={companyProfile.logoUrl} style={styles.coverLogo} />}
          <Text style={styles.coverLabel}>RESPONSE TO REQUEST FOR PROPOSAL</Text>
          <Text style={styles.coverTitle}>{clientName}</Text>
          <View style={styles.coverDivider} />
          <Text style={styles.coverPrepLabel}>PREPARED FOR</Text>
          <Text style={styles.coverPrepValue}>{clientName}</Text>
          <Text style={styles.coverPrepLabel}>PREPARED BY</Text>
          <Text style={styles.coverPrepValue}>{companyName}</Text>
          <Text style={styles.coverMeta}>{today}</Text>
        </View>
        <View style={styles.coverBottomBar}>
          <Text style={styles.coverConfidential}>CONFIDENTIAL &amp; PROPRIETARY</Text>
          <Text style={styles.coverVersion}>Version {proposal.version}</Text>
        </View>
      </Page>

      {/* ── 2. Cover Letter ── */}
      {proposal.coverLetter && (
        <Page size="A4" style={styles.letterPage}>
          <View style={styles.letterAccentBar} />
          <View style={styles.letterBody}>
            <Text style={styles.letterDate}>{today}</Text>
            <Text style={styles.letterHeading}>COVER LETTER</Text>
            <Text style={styles.letterTitle}>Dear {clientName} Team,</Text>
            <Text style={styles.letterText}>{proposal.coverLetter}</Text>
            <Text style={[styles.letterText, { marginTop: 20 }]}>Sincerely,</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: B.FOREST_DEEP, marginTop: 8 }}>{companyName}</Text>
          </View>
          <SectionFooter companyName={companyName} />
        </Page>
      )}

      {/* ── 3. Client Context Summary ── */}
      {parsedRfp && (
        <Page size="A4" style={styles.ctxPage}>
          <View style={styles.ctxAccentBar} />
          <View style={styles.ctxBody}>
            <Text style={styles.ctxHeading}>CLIENT OVERVIEW</Text>
            <Text style={styles.ctxTitle}>Client Context Summary</Text>

            <View style={styles.ctxGrid}>
              {clientResearch?.industry && (
                <View style={styles.ctxCard}>
                  <Text style={styles.ctxCardLabel}>INDUSTRY</Text>
                  <Text style={styles.ctxCardValue}>{clientResearch.industry}</Text>
                </View>
              )}
              {parsedRfp.budgetCeiling && (
                <View style={styles.ctxCard}>
                  <Text style={styles.ctxCardLabel}>PROJECT BUDGET</Text>
                  <Text style={styles.ctxCardValue}>{parsedRfp.budgetCeiling}</Text>
                </View>
              )}
              {parsedRfp.submissionDeadline && (
                <View style={styles.ctxCard}>
                  <Text style={styles.ctxCardLabel}>SUBMISSION DEADLINE</Text>
                  <Text style={styles.ctxCardValue}>{parsedRfp.submissionDeadline}</Text>
                </View>
              )}
              {parsedRfp.projectTimeline && (
                <View style={styles.ctxCard}>
                  <Text style={styles.ctxCardLabel}>PROJECT TIMELINE</Text>
                  <Text style={styles.ctxCardValue}>{parsedRfp.projectTimeline}</Text>
                </View>
              )}
            </View>

            {strategicPriorities.length > 0 && (
              <>
                <Text style={styles.ctxSectionLabel}>KEY STRATEGIC PRIORITIES</Text>
                {strategicPriorities.slice(0, 5).map((p, i) => (
                  <Text key={i} style={styles.ctxBullet}>• {p}</Text>
                ))}
              </>
            )}

            {keyChallenges.length > 0 && (
              <>
                <Text style={styles.ctxSectionLabel}>KEY CHALLENGES</Text>
                {keyChallenges.slice(0, 4).map((c, i) => (
                  <Text key={i} style={styles.ctxBullet}>• {c}</Text>
                ))}
              </>
            )}

            {clientResearch?.companySummary && (
              <>
                <Text style={styles.ctxSectionLabel}>ORGANISATION OVERVIEW</Text>
                <Text style={[styles.ctxBullet, { fontSize: 10.5 }]}>{clientResearch.companySummary}</Text>
              </>
            )}
          </View>
          <SectionFooter companyName={companyName} />
        </Page>
      )}

      {/* ── 4. Table of Contents ── */}
      <Page size="A4" style={styles.tocPage}>
        <View style={styles.tocGoldBar} />
        <View style={styles.tocBody}>
          <Text style={styles.tocHeading}>CONTENTS</Text>
          <Text style={styles.tocTitle}>Table of Contents</Text>
          {TOC_ENTRIES.map((e) => (
            <View key={e.num} style={styles.tocItem}>
              <Text style={styles.tocNum}>{e.num}</Text>
              <Text style={styles.tocItemText}>{e.title}</Text>
              {e.tag && <Text style={styles.tocTag}>{e.tag}</Text>}
            </View>
          ))}
        </View>
        <SectionFooter companyName={companyName} />
      </Page>

      {/* ── 5–11. LLM text sections ── */}
      <SectionPage num="03" title="Executive Summary"             content={proposal.executiveSummary}            companyName={companyName} />
      <SectionPage num="04" title="Understanding of Requirements" content={proposal.understandingOfRequirements}  companyName={companyName} />
      <SectionPage num="05" title="Proposed Solution"             content={proposal.proposedSolution}            companyName={companyName} />
      <SectionPage num="06" title="Technical Approach"            content={proposal.technicalApproach}           companyName={companyName} />

      {/* ── 7. Requirement Traceability Matrix ── */}
      {capabilityMatchList.length > 0 && (
        <Page size="A4" style={styles.matrixPage}>
          <View style={styles.pageAccentBar} />
          <View style={styles.matrixBody}>
            <Text style={styles.sectionNumLabel}>07</Text>
            <Text style={styles.sectionTitle}>Requirement Traceability Matrix</Text>

            {/* Header row */}
            <View style={styles.matrixHeader}>
              <Text style={[styles.matrixHeaderCell, { width: '28%', paddingLeft: 6 }]}>REQUIREMENT</Text>
              <Text style={[styles.matrixHeaderCell, { width: '42%' }]}>CAPABILITY MATCH</Text>
              <Text style={[styles.matrixHeaderCell, { width: '15%', textAlign: 'center' }]}>SCORE</Text>
              <Text style={[styles.matrixHeaderCell, { width: '15%', textAlign: 'center' }]}>STATUS</Text>
            </View>

            {capabilityMatchList.slice(0, 20).map((m, i) => {
              const score = m.confidenceScore ? Math.round(Number(m.confidenceScore) * 100) : 0
              const isGap = m.isGap ?? false
              return (
                <View key={i} style={[styles.matrixRow, { backgroundColor: i % 2 === 0 ? '#FAFAFA' : B.WHITE }]}>
                  <Text style={[styles.matrixCellReq, { paddingLeft: 6 }]}>{m.requirementText ?? '—'}</Text>
                  <Text style={styles.matrixCellMatch}>{m.matchSummary ?? '—'}</Text>
                  <Text style={[styles.matrixCellScore, { color: score >= 80 ? B.FOREST : score >= 60 ? B.GOLD_DEEP : '#C0392B' }]}>
                    {score}%
                  </Text>
                  <Text style={[styles.matrixCellStatus, isGap ? styles.matrixGapBadge : styles.matrixOkBadge]}>
                    {isGap ? '⚠ Gap' : '✓ Met'}
                  </Text>
                </View>
              )
            })}
          </View>
          <SectionFooter companyName={companyName} />
        </Page>
      )}

      <SectionPage num="08" title="Case Studies"          content={proposal.caseStudies}            companyName={companyName} />
      <SectionPage num="09" title="Team & Expertise"      content={proposal.teamAndExpertise}       companyName={companyName} />
      <SectionPage num="10" title="Project Timeline"      content={proposal.projectTimeline}        companyName={companyName} />
      <SectionPage num="11" title="Pricing Structure"     content={proposal.pricingStructure}       companyName={companyName} />
      <SectionPage num="12" title="Risks & Mitigation"    content={proposal.risksMitigation}        companyName={companyName} />
      <SectionPage num="13" title="Assumptions & Dependencies" content={proposal.assumptionsDependencies} companyName={companyName} />
      <SectionPage num="14" title="Why Us"                content={proposal.whyUs}                  companyName={companyName} />

      {/* ── 15. Compliance Appendix ── */}
      {complianceItems.length > 0 && (
        <Page size="A4" style={styles.compliancePage}>
          <View style={styles.ctxAccentBar} />
          <View style={styles.complianceBody}>
            <Text style={styles.sectionNumLabel}>15</Text>
            <Text style={styles.sectionTitle}>Compliance Appendix</Text>
            {complianceItems.map((item, i) => (
              <View key={i} style={styles.complianceItem}>
                <Text style={styles.complianceTick}>✓</Text>
                <Text style={styles.complianceText}>{item}</Text>
              </View>
            ))}
          </View>
          <SectionFooter companyName={companyName} />
        </Page>
      )}

      {/* ── Thank You Page ── */}
      <Page size="A4" style={styles.thankPage}>
        <Text style={styles.thankLabel}>NIVEDAN AI</Text>
        <Text style={styles.thankTitle}>Thank You</Text>
        <View style={styles.thankDivider} />
        <Text style={styles.thankBody}>We appreciate the opportunity to respond to your Request for Proposal.</Text>
        <Text style={styles.thankBody}>We look forward to the possibility of partnering with you.</Text>
        <Text style={styles.thankCompany}>{companyName}</Text>
        <Text style={styles.thankSub}>AUTONOMOUS PROPOSAL INTELLIGENCE PLATFORM</Text>
        <Text style={styles.thankFooter}>Generated by Nivedan AI  ·  Confidential &amp; Proprietary</Text>
      </Page>
    </Document>
  )
}

export async function generateProposalPdf(params: {
  proposal: ProposalData
  companyProfile: CompanyProfileData
  clientName: string
  parsedRfp?: ParsedRfpContext | null
  clientResearch?: ClientResearchContext | null
  capabilityMatchList?: CapabilityMatchItem[]
}): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ProposalDocument
      proposal={params.proposal}
      companyProfile={params.companyProfile}
      clientName={params.clientName}
      parsedRfp={params.parsedRfp ?? null}
      clientResearch={params.clientResearch ?? null}
      capabilityMatchList={params.capabilityMatchList ?? []}
    />
  )
  return Buffer.from(buffer)
}
