// app/api/get-matrix-information/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    // Parse query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const type = searchParams.get('type') || 'adj'; // defaults to "adj" matrix

    if (!file) {
      return NextResponse.json(
        { error: "Missing 'file' parameter" },
        { status: 400 }
      );
    }
    
    const filePath = path.join(
      process.cwd(),
      'go_metadata',
      'matrix',
      `${file}_${type}.csv`
    );

    // Read the CSV file
    const content = await fs.readFile(filePath, 'utf8');

    // Split the file content into rows (filter out any empty lines)
    const rows = content.split('\n').filter(row => row.trim() !== '');

    // Parse each row by splitting at commas.
    // You can adjust this if your CSV uses quotes or a different separator.
    const matrix = rows.map(row => row.split(','));
    const dims = [matrix.length, matrix[0].length]

    // Return the matrix as JSON
    return NextResponse.json({ matrix, dims });
  } catch (error) {
    console.error('Error reading matrix file:', error);
    return NextResponse.json(
      { error: 'Error processing matrix file' },
      { status: 500 }
    );
  }
}
