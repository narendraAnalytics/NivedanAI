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
  executiveSummary: string | null
  understandingOfRequirements: string | null
  proposedSolution: string | null
  technicalApproach: string | null
  caseStudies: string | null
  teamAndExpertise: string | null
  projectTimeline: string | null
  pricingStructure: string | null
  version: number
}

export interface CompanyProfileData {
  companyName: string
  logoUrl: string | null
  brandColorPrimary: string | null
  brandColorSecondary: string | null
}

interface ProposalPdfProps {
  proposal: ProposalData
  companyProfile: CompanyProfileData
  clientName: string
}

const SECTIONS = [
  { key: 'executiveSummary' as keyof ProposalData, title: '1. Executive Summary' },
  { key: 'understandingOfRequirements' as keyof ProposalData, title: '2. Understanding of Requirements' },
  { key: 'proposedSolution' as keyof ProposalData, title: '3. Proposed Solution' },
  { key: 'technicalApproach' as keyof ProposalData, title: '4. Technical Approach' },
  { key: 'caseStudies' as keyof ProposalData, title: '5. Case Studies' },
  { key: 'teamAndExpertise' as keyof ProposalData, title: '6. Team & Expertise' },
  { key: 'projectTimeline' as keyof ProposalData, title: '7. Project Timeline' },
  { key: 'pricingStructure' as keyof ProposalData, title: '8. Pricing Structure' },
]

function buildStyles(primary: string, secondary: string) {
  return StyleSheet.create({
    coverPage: {
      padding: 60,
      backgroundColor: primary,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    coverLogo: {
      width: 80,
      height: 80,
      marginBottom: 40,
      objectFit: 'contain',
    },
    coverTitle: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    coverSubtitle: {
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#FFFFFFCC',
      marginBottom: 8,
    },
    coverMeta: {
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#FFFFFF99',
      marginTop: 4,
    },
    coverDivider: {
      borderBottomWidth: 1,
      borderBottomColor: '#FFFFFF33',
      marginVertical: 24,
    },
    page: {
      padding: 50,
      fontFamily: 'Helvetica',
      fontSize: 11,
      color: '#1a1a2e',
    },
    tocTitle: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: primary,
      marginBottom: 24,
    },
    tocItem: {
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#333333',
      marginBottom: 10,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: '#E5E5E5',
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: primary,
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1.5,
      borderBottomColor: secondary,
    },
    bodyText: {
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#2a2a2a',
      lineHeight: 1.7,
      marginBottom: 10,
    },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 50,
      right: 50,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: '#DDDDDD',
      paddingTop: 6,
    },
    footerText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#888888',
    },
  })
}

const Footer = ({ companyName, styles }: { companyName: string; styles: ReturnType<typeof buildStyles> }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>{companyName}</Text>
    <Text
      style={styles.footerText}
      render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  </View>
)

const ProposalDocument = ({ proposal, companyProfile, clientName }: ProposalPdfProps) => {
  const primary = companyProfile.brandColorPrimary ?? '#1a1a2e'
  const secondary = companyProfile.brandColorSecondary ?? '#16213e'
  const styles = buildStyles(primary, secondary)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document
      title={`Proposal for ${clientName}`}
      author={companyProfile.companyName}
      creator="Nivedan AI"
    >
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        {companyProfile.logoUrl && (
          <Image src={companyProfile.logoUrl} style={styles.coverLogo} />
        )}
        <Text style={styles.coverTitle}>Response to RFP</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverSubtitle}>Prepared for: {clientName}</Text>
        <Text style={styles.coverSubtitle}>Prepared by: {companyProfile.companyName}</Text>
        <Text style={styles.coverMeta}>{today}</Text>
        {proposal.version > 1 && (
          <Text style={styles.coverMeta}>Version {proposal.version}</Text>
        )}
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {SECTIONS.map((section) => (
          <Text key={section.key} style={styles.tocItem}>
            {section.title}
          </Text>
        ))}
        <Footer companyName={companyProfile.companyName} styles={styles} />
      </Page>

      {/* Proposal Sections */}
      {SECTIONS.map((section) => {
        const content = proposal[section.key] as string | null
        if (!content) return null
        return (
          <Page key={section.key} size="A4" style={styles.page}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.bodyText}>{content}</Text>
            <Footer companyName={companyProfile.companyName} styles={styles} />
          </Page>
        )
      })}
    </Document>
  )
}

export async function generateProposalPdf(params: {
  proposal: ProposalData
  companyProfile: CompanyProfileData
  clientName: string
}): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ProposalDocument
      proposal={params.proposal}
      companyProfile={params.companyProfile}
      clientName={params.clientName}
    />
  )
  return Buffer.from(buffer)
}
