import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Define professional styling for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1e293b",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  contact: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    fontFamily: "Helvetica-Oblique",
    color: "#334155",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#334155",
  },
  experienceBlock: {
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  jobCompany: {
    fontSize: 11,
    fontFamily: "Helvetica-Oblique",
    color: "#475569",
  },
  jobDuration: {
    fontSize: 10,
    color: "#64748b",
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 10,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
    color: "#334155",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    color: "#334155",
  }
});

interface ResumePDFProps {
  data: any; // The structured CV JSON
}

export const ResumePDF = ({ data }: ResumePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.name || "Candidate Name"}</Text>
        <Text style={styles.headline}>{data.headline || "Professional Title"}</Text>
        <Text style={styles.contact}>
          {[data.email, data.phone, data.location].filter(Boolean).join("  |  ")}
        </Text>
      </View>

      {/* Summary */}
      {data.summary && (
        <View>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience.map((exp: any, index: number) => (
            <View key={index} style={styles.experienceBlock}>
              <View style={styles.jobHeader}>
                <View>
                  <Text style={styles.jobTitle}>{exp.role || "Role"}</Text>
                  <Text style={styles.jobCompany}>{exp.company || "Company"}</Text>
                </View>
                <Text style={styles.jobDuration}>{exp.duration || "Dates"}</Text>
              </View>
              {exp.description && (
                <View style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{exp.description}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Core Skills</Text>
          <View style={styles.skillsContainer}>
            {data.skills.map((skill: string, index: number) => (
              <Text key={index} style={styles.skillPill}>{skill}</Text>
            ))}
          </View>
        </View>
      )}
    </Page>
  </Document>
);