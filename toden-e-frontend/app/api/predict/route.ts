// app/api/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

const LOCAL_PROJECT_TMP_BASE = path.join(process.cwd(), 'tmp');
const IS_VERCEL_ENV = !!process.env.VERCEL_ENV;

const NODE_TEMP_STORAGE_BASE = IS_VERCEL_ENV
  ? '/tmpx' // On Vercel, use /tmp directly for Node's own temp files
  : LOCAL_PROJECT_TMP_BASE; // Locally, use project's ./tmp

// Python will create its own subdirectory structure under this base path.
const PYTHON_TARGET_TMP_BASE = IS_VERCEL_ENV
  ? '/tmp' // Python also uses the system /tmp as its base on Vercel
  : LOCAL_PROJECT_TMP_BASE; // Python uses project's ./tmp as its base locally

const TTL_MS = 30 * 60 * 1000;

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.warn(`Could not create directory: ${dirPath}`, error);
  }
}

async function ensureBaseTempDirectories() {
  await ensureDir(NODE_TEMP_STORAGE_BASE);
  if (PYTHON_TARGET_TMP_BASE !== NODE_TEMP_STORAGE_BASE) {
    await ensureDir(PYTHON_TARGET_TMP_BASE);
  }
}

function runPythonPredictScript(
  pagsTxtPath: string,
  alpha: string,
  clusters: string,
  resultId: string
  // baseTmpPathForPython is now PYTHON_TARGET_TMP_BASE
): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonExecutable = 'python3';
    const pythonScriptPath = path.join(process.cwd(), 'python_scripts', 'runner.py');
    // Python script receives the base path where it should create its 'toden_e_py_outputs/<resultId>' structure
    const scriptArgs = [pythonScriptPath, pagsTxtPath, alpha, clusters, resultId, PYTHON_TARGET_TMP_BASE];

    console.log(`Executing: ${pythonExecutable} ${scriptArgs.map(arg => `"${arg}"`).join(' ')}`);
    const pythonProcess = spawn(pythonExecutable, scriptArgs);
    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

    pythonProcess.on('close', (code) => {
      // console.log(`Python script stdout: ${stdoutData}`); // Logged by your original code
      if (stderrData) {
        console.error(`Python script stderr: ${stderrData}`); // Important for debugging Python prints
      }
      if (code !== 0 && !stdoutData.trim()) { // Check if stdout is actually empty
        return reject(new Error(`Python script exited with code ${code}. Stderr: ${stderrData.trim()}`));
      }
      try {
        // Attempt to parse ONLY the last line if multiple lines are present due to stderr misdirection
        const lines = stdoutData.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);

        if (result.error) {
          console.warn('Python script reported an error in JSON:', result);
          return reject(result);
        }
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse Python script output:', parseError, `Raw stdout: [${stdoutData}]`);
        reject(new Error(`Failed to parse Python script output. Ensure Python ONLY prints JSON to stdout. Output: ${stdoutData.trim()}`));
      }
    });
    pythonProcess.on('error', (err) => { /* ... */ });
  });
}

export async function POST(request: NextRequest) {
  await ensureBaseTempDirectories();

  let tempUploadedInputFilePath: string | null = null;
  const resultId = uuidv4();

  try {
    const formData = await request.formData();
    const fileUpload = formData.get('fileUpload') as File | null;
    const selectedFileBaseName = formData.get('file') as string | null;
    const alpha = formData.get('alpha') as string;
    const clusters = formData.get('clusters') as string;

    if (!alpha || !clusters) { /* ... error ... */ }
    if (Number.isNaN(parseFloat(alpha)) || Number.isNaN(parseInt(clusters))) { /* ... error ... */ }

    let pagsTxtPathForPython: string;
    let inputIdentifierForResults: string;

    if (fileUpload) {
      inputIdentifierForResults = fileUpload.name;
      // Save uploaded file directly into NODE_TEMP_STORAGE_BASE, prefixed for uniqueness
      const uniqueFilename = `${resultId}_input_${fileUpload.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      tempUploadedInputFilePath = path.join(NODE_TEMP_STORAGE_BASE, uniqueFilename);
      const fileBuffer = Buffer.from(await fileUpload.arrayBuffer());
      await fs.writeFile(tempUploadedInputFilePath, fileBuffer);
      pagsTxtPathForPython = tempUploadedInputFilePath;
      console.log(`Uploaded file "${fileUpload.name}" saved to: ${pagsTxtPathForPython}`);
    } 
    else if (selectedFileBaseName) {
      inputIdentifierForResults = `${selectedFileBaseName}.txt`;
      pagsTxtPathForPython = path.join(process.cwd(), 'python_scripts', 'data', `${selectedFileBaseName}.txt`);
      console.log(`Using predefined file: ${pagsTxtPathForPython}`);
      try { await fs.access(pagsTxtPathForPython); } catch (e) { /* ... error ... */ return NextResponse.json({ error: `Selected data file "${inputIdentifierForResults}" not found on server.` }, { status: 404 });}
    } 
    else {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    console.log(`Invoking Toden-E Python script with: path=${pagsTxtPathForPython}, alpha=${alpha}, clusters=${clusters}, resultId=${resultId}, python_base_tmp=${PYTHON_TARGET_TMP_BASE}`);
    const pythonOutput = await runPythonPredictScript(pagsTxtPathForPython, alpha, clusters, resultId);

    if (pythonOutput.error) { }

    const actualPredictionData = pythonOutput.result;
    const expiresAt = Date.now() + TTL_MS;
    const finalResultFilePath = path.join(NODE_TEMP_STORAGE_BASE, `${resultId}.json`);

    const responsePayloadToStoreAndSend = {
      id: resultId,
      requestedInput: inputIdentifierForResults,
      params: { alpha, clusters },
      prediction: actualPredictionData, // This contains paths relative to PYTHON_TARGET_TMP_BASE
      generatedAt: new Date().toISOString(),
      expiresAtIso: new Date(expiresAt).toISOString(),
    };

    await fs.writeFile(finalResultFilePath, JSON.stringify(responsePayloadToStoreAndSend, null, 2));
    console.log(`Main result metadata (ID: ${resultId}) stored at: ${finalResultFilePath}`);
    // Python's actual CSVs are in PYTHON_TARGET_TMP_BASE/toden_e_py_outputs/<resultId>/...

    return NextResponse.json({ success: true, resultId: resultId, result: actualPredictionData });

  } catch (error: any) { /* ... error handling ... */ }
  finally { /* ... cleanup tempUploadedInputFilePath ... */ }
}