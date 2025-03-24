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

    // Build the file path (e.g., go_metadata/data/Leukemia_2_0.5.csv)
    const filePath = path.join(process.cwd(), 'go_metadata', 'data', `${fileName}.csv`);
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Split file content into lines and filter out empty ones
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File does not contain enough data.' }, { status: 400 });
    }

    // Function to split CSV line by commas not within quotes.
    const splitCSV = (line: string) =>
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    // The first line is assumed to be a header, e.g., "ID,0,1"
    const headers = splitCSV(lines[0]).map(h => h.trim());
    // All columns except the first represent clusters
    const numClusters = headers.length - 1;

    // Process the data row (assume only one row for cluster info)
    const dataRow = splitCSV(lines[1]);
    const algorithm = dataRow[0].trim();

    // Parse each cluster column
    const clusters: string[][] = [];
    for (let i = 1; i < dataRow.length; i++) {
      // Remove surrounding quotes if they exist
      const cleaned = dataRow[i].trim().replace(/^"|"$/g, '');
      // Split by commas and remove extra whitespace
      const clusterNodes = cleaned.split(',').map(node => node.trim()).filter(Boolean);
      clusters.push(clusterNodes);
    }

    // Build the union of all nodes from all clusters and sort them.
    const allNodesSet = new Set<string>();
    clusters.forEach(cluster => {
      cluster.forEach(node => allNodesSet.add(node));
    });
    const sortedNodes = Array.from(allNodesSet).sort();

    return NextResponse.json({
      algorithm,
      clusters,
      sortedNodes,
      numClusters
    });
  } catch (error) {
    console.error("Error in get-toden-e-visualization API:", error);
    return NextResponse.json({ error: 'Error processing file' }, { status: 500 });
  }
}
