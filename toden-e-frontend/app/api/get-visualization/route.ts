import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Now expecting both the selected node and the allowedNodes array
    const { node, allowedNodes } = await request.json();
    if (!node) {
      return NextResponse.json({ error: 'No node provided' }, { status: 400 });
    }
    if (!allowedNodes || !Array.isArray(allowedNodes)) {
      return NextResponse.json({ error: 'No allowed nodes provided or invalid' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'go_metadata', 'm_type_biological_process.txt');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    const results = [];
    // Skip header (index 0) and process remaining lines
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      // Filter: only include rows where GS_A_ID equals the selected node
      // and GS_B_ID is included in allowedNodes.
      if (cols[0] === node && allowedNodes.includes(cols[1])) {
        results.push({
          GS_A_ID: cols[0],
          GS_B_ID: cols[1],
          SIMILARITY: cols[6],
        });
      }
    }
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}
