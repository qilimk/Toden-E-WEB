import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEMP_RESULTS_DIR = '/tmp/toden_e_final_results';
// TTL_MS is for reference; Vercel's /tmp cleanup is the primary mechanism.
// const TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resultId = params.id;

  if (!resultId) {
    return NextResponse.json({ error: 'Result ID is required.' }, { status: 400 });
  }

  // Sanitize resultId to prevent path traversal attacks, although uuidv4 is generally safe.
  // A simple check could be to ensure it matches UUID format or has no path characters.
  if (resultId.includes('/') || resultId.includes('..')) {
      return NextResponse.json({ error: 'Invalid Result ID format.' }, { status: 400 });
  }

  const resultFilePath = path.join(TEMP_RESULTS_DIR, `${resultId}.json`);

  try {
    // Check if file exists
    await fs.access(resultFilePath);

    // Optional: Check file age against TTL if desired, though /tmp is ephemeral
    // const fileStat = await fs.stat(resultFilePath);
    // if (Date.now() - fileStat.mtimeMs > TTL_MS) {
    //   // Consider attempting to fs.unlink(resultFilePath);
    //   return NextResponse.json({ error: 'Result has expired and been cleaned up.' }, { status: 404 });
    // }

    const jsonData = await fs.readFile(resultFilePath, 'utf-8');
    const resultData = JSON.parse(jsonData);

    // The resultData is the object you stored, including 'id', 'prediction', 'params', etc.
    return NextResponse.json(resultData, { status: 200 });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File not found
      return NextResponse.json({ error: 'Result not found. It may have expired or the ID is incorrect.' }, { status: 404 });
    }
    console.error(`Error fetching result (ID: ${resultId}):`, error);
    return NextResponse.json({ error: 'Failed to retrieve result due to a server error.' }, { status: 500 });
  }
}