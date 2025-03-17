import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Expect a JSON body with { fileName: string }
    const { fileName } = await request.json();
    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }

    // Build the file path (e.g., go_metadata/Leukemia.csv)
    const filePath = path.join(process.cwd(), 'go_metadata', `${fileName}.csv`);
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Split file content into lines and filter out empty ones
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File does not contain enough data.' }, { status: 400 });
    }

    // Use a regex to split by commas that are not inside quotes
    const splitCSV = (line: string) =>
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    // The first line is assumed to be a header.
    const headers = splitCSV(lines[0]);
    // Calculate the number of clusters (all columns except the first one)
    const numClusters = headers.length - 1;

    // Process each subsequent row.
    const results = lines.slice(1).map(line => {
      const cols = splitCSV(line);
      const algorithm = cols[0].trim();
      // For each cluster column, remove surrounding quotes and split the string by commas.
      const clusters = [];
      for (let i = 1; i < cols.length; i++) {
        // Remove surrounding quotes if they exist
        const cleaned = cols[i].trim().replace(/^"|"$/g, '');
        // Split the cleaned string by commas and trim each value.
        const clusterNodes = cleaned.split(',').map(n => n.trim()).filter(Boolean);
        clusters.push(clusterNodes);
      }
      return { algorithm, clusters };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in get-toden-e-visualization API:", error);
    return NextResponse.json({ error: 'Error processing file' }, { status: 500 });
  }
}
