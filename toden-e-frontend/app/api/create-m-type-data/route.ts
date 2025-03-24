import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function splitCSV(line: string): string[] {
  return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileName = formData.get('file')?.toString() || '';
    if (!fileName) {
      return NextResponse.json({ error: 'No file selection provided' }, { status: 400 });
    }
    
    const datasetFilePath = path.join(process.cwd(), 'go_metadata', 'data', `${fileName}.csv`);
    const cacheFilePath = path.join(process.cwd(), 'go_metadata', 'data', `${fileName}Data.csv`);
    const hugeFilePath = path.join(process.cwd(), 'go_metadata', 'm_type_biological_process.txt');

    let datasetContent;
    try {
      datasetContent = await fs.readFile(datasetFilePath, 'utf8');
    } catch (err) {
      return NextResponse.json({ error: 'Dataset file not found' }, { status: 404 });
    }
    const datasetLines = datasetContent.split('\n').filter(line => line.trim() !== '');
    const nodesSet = new Set<string>();
    for (let i = 1; i < datasetLines.length; i++) {
      const cols = splitCSV(datasetLines[i]);
      for (let j = 1; j < cols.length; j++) {
        const cleaned = cols[j].replace(/"/g, '');
        const tokens = cleaned.split(',').map(s => s.trim()).filter(Boolean);
        tokens.forEach(n => nodesSet.add(n));
      }
    }
    const allowedNodes = Array.from(nodesSet).sort();
    // console.log("Allowed nodes:", allowedNodes);

    let results = [];
    let cacheExists = false;
    try {
      await fs.access(cacheFilePath);
      cacheExists = true;
      const cacheContent = await fs.readFile(cacheFilePath, 'utf8');
      const cacheLines = cacheContent.split('\n').filter(line => line.trim() !== '');
      if (cacheLines.length > 0) {
        const header = cacheLines[0].split(',');
        results = cacheLines.slice(1).map(line => {
          const cols = line.split(',');
          let obj: any = {};
          header.forEach((key, idx) => {
            obj[key] = cols[idx];
          });
          return obj;
        });
      }
    } catch (err) {
      cacheExists = false;
    }
    
    if (results.length === 0) {
      const hugeContent = await fs.readFile(hugeFilePath, 'utf8');
      const hugeLines = hugeContent.split('\n').filter(line => line.trim() !== '');
      const newResults = [];
      for (let i = 1; i < hugeLines.length; i++) {
        const cols = hugeLines[i].split('\t');
        if (cols.length < 7) continue;
        if (allowedNodes.includes(cols[0]) && allowedNodes.includes(cols[1])) {
          newResults.push({
            GS_A_ID: cols[0],
            GS_B_ID: cols[1],
            SIMILARITY: cols[6]
          });
        }
      }
      results = newResults;
      // console.log("Filtered results length:", results.length);
      const headerLine = 'GS_A_ID,GS_B_ID,SIMILARITY\n';
      const csvLines = results.map(r => `${r.GS_A_ID},${r.GS_B_ID},${r.SIMILARITY}`).join('\n');
      await fs.writeFile(cacheFilePath, headerLine + csvLines, 'utf8');
    }
    
    const firstNode = allowedNodes[0] || '';
    
    return NextResponse.json({ 
      selectedNode: firstNode, 
      allowedNodes, 
    });
  } catch (error) {
    console.error("Error in create-m-type-data route:", error);
    return NextResponse.json({ error: 'Error processing dataset' }, { status: 500 });
  }
}
