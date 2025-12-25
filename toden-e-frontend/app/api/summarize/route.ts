import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

type ClusterRecord = {
  label: string;
  goids: string[];
  algorithm: string;
};

type Summary = {
  cluster_id: number;
  cluster_label?: string;
  algorithm?: string;
  size: number;
  key_terms: string[];
  summary: string;
  top_terms: { goid: string; name: string }[];
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'are', 'from', 'this', 'into', 'such', 'via', 'upon', 'within', 'between',
  'into', 'during', 'without', 'other', 'these', 'those', 'their', 'while', 'where', 'when', 'whose', 'which',
  'have', 'has', 'had', 'been', 'being', 'were', 'was', 'can', 'could', 'should', 'would', 'may', 'might'
]);

function splitCSV(line: string): string[] {
  return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
}

function parseClusterFile(fileContent: string): ClusterRecord[] {
  const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('Cluster file does not contain enough data.');
  }

  const headers = splitCSV(lines[0]).slice(1); // skip ID column
  const clusters: ClusterRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSV(lines[i]);
    if (cols.length < 2) continue;
    const algorithm = cols[0].trim();

    for (let j = 1; j < cols.length; j++) {
      const cleaned = cols[j].trim().replace(/^"|"$/g, '');
      const goids = cleaned
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const label = headers[j - 1] ?? `${j - 1}`;
      clusters.push({ label, goids, algorithm });
    }
  }

  return clusters;
}

function extractKeyTerms(texts: string[], maxTerms = 6): string[] {
  const counts: Record<string, number> = {};

  texts.forEach((text) => {
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .forEach((token) => {
        if (token.length < 3) return;
        if (STOP_WORDS.has(token)) return;
        counts[token] = (counts[token] || 0) + 1;
      });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term]) => term);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file')?.toString() ?? '';
    const idType = (formData.get('id_type')?.toString() ?? 'standard') as 'standard' | 'custom';
    const customResultId = formData.get('customResultId')?.toString() ?? '';
    const uploadFile = formData.get('fileUpload') as File | null;

    let clusterCsv = '';
    let fileIdentifier = file;
    const treatAsCustom = idType === 'custom' || file === 'custom';

    if (treatAsCustom && customResultId) {
      fileIdentifier = customResultId;
    }

    if (uploadFile) {
      clusterCsv = await uploadFile.text();
    } else {
      if (!fileIdentifier) {
        return NextResponse.json({ error: 'No file identifier provided for summarization.' }, { status: 400 });
      }

      const clusterPath = treatAsCustom
        ? path.join(process.cwd(), 'tmp', 'toden_e_py_outputs', `${fileIdentifier}`, `clusters_${fileIdentifier}.csv`)
        : path.join(process.cwd(), 'go_metadata', 'data', `${fileIdentifier}.csv`);

      try {
        clusterCsv = await fs.readFile(clusterPath, 'utf8');
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          return NextResponse.json({ error: 'Cluster file not found for summarization.' }, { status: 404 });
        }
        throw err;
      }
    }

    const clusters = parseClusterFile(clusterCsv);
    if (clusters.length === 0) {
      return NextResponse.json({ error: 'No clusters found to summarize.' }, { status: 400 });
    }

    const metadataPath = path.join(process.cwd(), 'go_metadata', 'filterpaginf2024.csv');
    let metadataCsv = '';
    try {
      metadataCsv = await fs.readFile(metadataPath, 'utf8');
    } catch (err: any) {
      console.error('Metadata file missing for summaries:', err?.message || err);
      return NextResponse.json({ error: 'GO metadata file not found.' }, { status: 500 });
    }
    const metadataRecords = parse(metadataCsv, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    });
    const metadataMap = new Map<string, { NAME?: string; DESCRIPTION?: string }>();
    metadataRecords.forEach((record: any) => {
      if (record.GOID) {
        metadataMap.set(record.GOID.trim(), record);
      }
    });

    const summaries: Summary[] = clusters.map((cluster, idx) => {
      const terms = cluster.goids.map((goid) => {
        const metadata = metadataMap.get(goid) || {};
        return {
          goid,
          name: metadata.NAME || goid,
          description: metadata.DESCRIPTION || '',
        };
      });

      const keyTerms = extractKeyTerms(
        terms.map((t) => `${t.name}. ${t.description}`),
        6
      );

      const representative = terms.slice(0, 5);
      const summaryText =
        keyTerms.length > 0
          ? `Cluster ${cluster.label} highlights ${keyTerms.join(', ')} across ${cluster.goids.length} GO terms. Representative terms include ${representative
              .map((t) => t.name)
              .join(', ')}.`
          : `Cluster ${cluster.label} contains ${cluster.goids.length} GO terms.`;

      return {
        cluster_id: idx,
        cluster_label: cluster.label,
        algorithm: cluster.algorithm,
        size: cluster.goids.length,
        key_terms: keyTerms,
        summary: summaryText,
        top_terms: representative.map((t) => ({ goid: t.goid, name: t.name })),
      };
    });

    const allNodes = Array.from(new Set(clusters.flatMap((c) => c.goids))).sort();

    return NextResponse.json({ summaries, all_nodes: allNodes });
  } catch (error: any) {
    console.error('Error in /api/summarize:', error?.message || error);
    return NextResponse.json({ error: 'Failed to generate summaries.' }, { status: 500 });
  }
}
