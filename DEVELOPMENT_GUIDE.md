# Toden-E Development Guide

## Overview

This document provides implementation guidelines for the **Visualize** and **Summarize** features that are currently disabled in the Toden-E web application.

---

## Feature Status

### ✅ Implemented:
- **Predict Tab**: Fully functional clustering prediction
  - Takes gene list input (upload or select)
  - Parameters: alpha (topology vs density weight), number of clusters
  - Generates Super-PAG clusters using Toden-E algorithm
  - Outputs: cluster assignments, adjacency/concatenated matrices, visualizations

### ⚠️ Not Implemented (Marked "Not Available"):
- **Visualize Tab**: For visualizing existing clustering results
- **Summarize Tab**: For generating LLM-powered summaries of Super-PAGs

---

## 1. Visualize Feature

### Purpose
Load and display clustering results from previously generated prediction outputs without re-running the clustering algorithm.

### Current State
- **Frontend**: Tab exists in `components/FunctionTabs.tsx:276` but is disabled
- **Form Schema**: Already defined (`VisualizeFormSchema`)
- **Backend**: Not integrated with frontend

### Implementation Requirements

#### A. Frontend Changes (`components/FunctionTabs.tsx`)

1. **Enable the Tab**
   ```tsx
   // Line 276: Remove 'disabled' prop
   <TabsTrigger value="visualize">Visualize</TabsTrigger>
   ```

2. **Add TabsContent Component**
   After the Predict tab content, add:
   ```tsx
   <TabsContent value="visualize">
     <Card className="w-full">
       <CardHeader>
         <CardTitle>Visualization Function</CardTitle>
         <CardDescription>
           Load existing clustering results for visualization
         </CardDescription>
       </CardHeader>
       <CardContent>
         {/* File selection UI similar to Predict */}
         {/* Should load .csv files from tmp/toden_e_py_outputs/ */}
       </CardContent>
       <CardFooter>
         <Button onClick={handleVisualize}>Load Visualization</Button>
       </CardFooter>
     </Card>
   </TabsContent>
   ```

3. **State Management**
   Add state to store visualization data:
   ```tsx
   const [visualizationData, setVisualizationData] = useState(null);
   const [selectedResultId, setSelectedResultId] = useState("");
   ```

#### B. API Integration

**Expected Flow:**
1. User selects a result ID (from previous predictions)
2. Frontend calls existing endpoints:
   - `/api/get-toden-e-visualization?file={resultId}&id_type=custom`
   - `/api/get-matrix-information?file={resultId}&type=adj&id_type=custom`
   - `/api/get-matrix-information?file={resultId}&type=con&id_type=custom`
3. Display results using existing visualization components

**Key Files to Modify:**
- `components/FunctionTabs.tsx` - Add visualize tab content
- `components/DynamicGraph.tsx` - Already supports visualization
- `components/MatrixVisualization.tsx` - Already supports matrix display

#### C. Backend (Python)

The Python backend functionality already exists in `toden_e.py`:

```python
def visualize_clustering_results(clustering_results_path):
    # Line numbers ~1550-1650
    # Generates graph visualizations of Super-PAG clusters
    # Output: PNG/SVG files of network graphs
```

**Integration Path:**
- **Option 1**: Use existing Next.js API routes (recommended)
  - Files are already accessible via `/api/get-toden-e-visualization`
  - No backend changes needed

- **Option 2**: Add new Flask route (if more visualization types needed)
  ```python
  @app.route('/visualize', methods=['POST'])
  def visualize():
      # Already exists in app.py:39-72
      # Reads CSV and returns parsed clustering data
  ```

#### D. File Structure Expected

Visualize expects clustering result files in this format:

**Input CSV Structure** (`clusters_{resultId}.csv`):
```csv
ID,0,1,2,...
AlgorithmName,"GO:0001,GO:0002","GO:0003,GO:0004",...
```

**Output**: Graph visualization showing:
- Nodes: Individual genes/PAGs
- Edges: Similarity connections
- Colors: Cluster assignments
- Layout: Force-directed or hierarchical

#### E. UI/UX Considerations

1. **File Selector**: Dropdown to choose from:
   - Recent predictions (from session)
   - Saved results (from tmp/toden_e_py_outputs/)
   - Uploaded CSV files

2. **Visualization Options**:
   - Graph layout algorithm (force, hierarchical, circular)
   - Node size (by degree, betweenness)
   - Edge filtering (similarity threshold)
   - Cluster coloring schemes

3. **Export Options**:
   - Download as PNG/SVG
   - Export coordinates as JSON
   - Save to session

---

## 2. Summarize Feature

### Purpose
Generate natural language summaries of Super-PAG clusters using Large Language Models (LLMs) to describe functional characteristics.

### Current State
- **Frontend**: Tab exists in `components/FunctionTabs.tsx:277` but is disabled
- **Form Schema**: Already defined (`SummarizeFormSchema`)
- **Backend**: Python function exists in `toden_e.py` but not connected

### Implementation Requirements

#### A. Frontend Changes (`components/FunctionTabs.tsx`)

1. **Enable the Tab**
   ```tsx
   // Line 277: Remove 'disabled' prop
   <TabsTrigger value="summarize">Summarize</TabsTrigger>
   ```

2. **Add TabsContent Component**
   ```tsx
   <TabsContent value="summarize">
     <Card className="w-full">
       <CardHeader>
         <CardTitle>Summarization Function</CardTitle>
         <CardDescription>
           Generate AI-powered summaries of Super-PAG functional characteristics
         </CardDescription>
       </CardHeader>
       <CardContent>
         {/* File selection for clustering results */}
         {/* Progress indicator for LLM processing */}
         {/* Display area for generated summaries */}
       </CardContent>
       <CardFooter>
         <Button onClick={handleSummarize}>Generate Summary</Button>
       </CardFooter>
     </Card>
   </TabsContent>
   ```

3. **State Management**
   ```tsx
   const [summaries, setSummaries] = useState<ClusterSummary[]>([]);
   const [isGenerating, setIsGenerating] = useState(false);
   const [progress, setProgress] = useState(0);

   interface ClusterSummary {
     cluster_id: number;
     size: number;
     key_terms: string[];
     summary: string;
     top_genes: string[];
   }
   ```

#### B. API Integration

**Create New API Route**: `/app/api/summarize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { resultId, clustersFilePath } = await request.json();

    // Call Python summarization script
    const pythonScript = path.join(process.cwd(), 'python_scripts', 'runner_summarize.py');
    const pythonProcess = spawn('python3', [pythonScript, clustersFilePath]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`Summarization failed with code ${code}`));
      });
    });

    const summaries = JSON.parse(output);
    return NextResponse.json({ success: true, summaries });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### C. Backend (Python)

**Create**: `python_scripts/runner_summarize.py`

```python
#!/usr/bin/env python3
import sys
import json
import os

# Add current directory to path
sys.path.append(os.path.dirname(__file__))
import toden_e

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: runner_summarize.py <clusters_csv_path>"}))
        sys.exit(1)

    clusters_path = sys.argv[1]

    try:
        # Call existing summarization function
        result = toden_e.summarize_cluster_results(clustering_results_path=clusters_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**Existing Python Function** (already in `toden_e.py`):

```python
def summarize_cluster_results(clustering_results_path="predict_results.csv"):
    """
    Generate LLM-powered summaries for each Super-PAG cluster

    Input: CSV with cluster assignments
    Output: Dictionary with cluster summaries

    Process:
    1. Load clustering results
    2. Extract gene members per cluster
    3. Fetch GO term descriptions
    4. Generate embeddings using sentence-transformers
    5. Summarize using LLM (HuggingFace transformers)
    6. Extract key functional terms

    Returns:
        {
            "cluster_0": {
                "size": 45,
                "top_genes": ["GO:0006413", "GO:0006614", ...],
                "key_terms": ["translation", "protein synthesis", ...],
                "summary": "This Super-PAG represents cellular translation..."
            },
            ...
        }
    """
    # Implementation at lines ~1750-1850 in toden_e.py
```

#### D. LLM Integration Options

**Current Implementation** (in toden_e.py):
- Uses HuggingFace `sentence-transformers` for embeddings
- Model: `all-MiniLM-L6-v2` or similar
- Generates semantic similarity-based summaries

**Enhancement Options**:

1. **OpenAI API** (if available):
   ```python
   import openai

   def generate_summary_openai(gene_list, descriptions):
       prompt = f"Summarize the biological function of these genes: {gene_list}..."
       response = openai.ChatCompletion.create(
           model="gpt-4",
           messages=[{"role": "user", "content": prompt}]
       )
       return response.choices[0].message.content
   ```

2. **Anthropic Claude** (recommended for accuracy):
   ```python
   import anthropic

   def generate_summary_claude(cluster_data):
       client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
       message = client.messages.create(
           model="claude-3-sonnet-20240229",
           max_tokens=500,
           messages=[{
               "role": "user",
               "content": f"Analyze these Gene Ontology terms: {cluster_data}..."
           }]
       )
       return message.content[0].text
   ```

3. **Local LLM** (Ollama - no API costs):
   ```python
   import requests

   def generate_summary_ollama(cluster_info):
       response = requests.post('http://localhost:11434/api/generate', json={
           'model': 'llama2',
           'prompt': f"Summarize these genes: {cluster_info}...",
           'stream': False
       })
       return response.json()['response']
   ```

#### E. Output Format

**Expected JSON Response**:
```json
{
  "success": true,
  "resultId": "uuid-here",
  "timestamp": "2025-12-22T10:30:00Z",
  "summaries": [
    {
      "cluster_id": 0,
      "size": 45,
      "top_genes": [
        {
          "goid": "GO:0006413",
          "name": "translational initiation",
          "relevance_score": 0.95
        }
      ],
      "key_terms": [
        "translation",
        "protein synthesis",
        "ribosome assembly"
      ],
      "summary": "This Super-PAG cluster primarily represents cellular processes involved in translational initiation and protein synthesis. The genes coordinate ribosome assembly and regulate the initiation phase of mRNA translation, playing crucial roles in gene expression control.",
      "functional_categories": [
        "Translation (85%)",
        "RNA processing (10%)",
        "Protein targeting (5%)"
      ],
      "enrichment_stats": {
        "avg_similarity": 0.78,
        "density": 0.65,
        "modularity": 0.72
      }
    }
  ]
}
```

#### F. UI/UX Components

**Summary Display Card**:
```tsx
function ClusterSummaryCard({ summary }: { summary: ClusterSummary }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Cluster {summary.cluster_id}</CardTitle>
        <CardDescription>{summary.size} genes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Key Terms */}
          <div>
            <h4 className="font-semibold mb-2">Key Functional Terms</h4>
            <div className="flex flex-wrap gap-2">
              {summary.key_terms.map(term => (
                <Badge key={term}>{term}</Badge>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <h4 className="font-semibold mb-2">Functional Summary</h4>
            <p className="text-sm text-muted-foreground">{summary.summary}</p>
          </div>

          {/* Top Genes */}
          <div>
            <h4 className="font-semibold mb-2">Representative Genes</h4>
            <ul className="text-sm">
              {summary.top_genes.slice(0, 5).map(gene => (
                <li key={gene.goid}>
                  <a href={`http://amigo.geneontology.org/amigo/term/${gene.goid}`}
                     className="text-blue-600 hover:underline">
                    {gene.goid}
                  </a> - {gene.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Export Summary</Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 3. Implementation Priority & Roadmap

### Phase 1: Visualize Feature (Easier)
**Estimated Effort**: 2-3 days

1. ✅ Enable visualize tab (30 min)
2. ✅ Add file selection UI (2 hours)
3. ✅ Connect to existing API endpoints (1 day)
4. ✅ Test with sample data (4 hours)
5. ✅ Polish UI/UX (4 hours)

### Phase 2: Summarize Feature (Complex)
**Estimated Effort**: 5-7 days

1. ✅ Enable summarize tab (30 min)
2. ✅ Create API route `/api/summarize` (4 hours)
3. ✅ Create Python wrapper script (2 hours)
4. ⚠️ Set up LLM integration (1-2 days)
   - Local: HuggingFace transformers (already in dependencies)
   - Cloud: OpenAI/Anthropic API setup
5. ✅ Test summarization pipeline (1 day)
6. ✅ Build summary display UI (1 day)
7. ✅ Add export functionality (4 hours)
8. ✅ Performance optimization (1 day)

---

## 4. Configuration Requirements

### Environment Variables

Add to `.env.local`:
```bash
# LLM Configuration (choose one)
OPENAI_API_KEY=sk-...           # For OpenAI GPT models
ANTHROPIC_API_KEY=sk-ant-...    # For Claude models
OLLAMA_HOST=http://localhost:11434  # For local Ollama

# Summarization Settings
SUMMARY_MODEL=sentence-transformers/all-MiniLM-L6-v2
SUMMARY_MAX_TOKENS=500
SUMMARY_TEMPERATURE=0.7

# Visualization Settings
VIS_DEFAULT_LAYOUT=force
VIS_MAX_NODES=500
```

### Dependencies to Add

**Python** (`requirements.txt`):
```txt
# Already included:
transformers==4.52.3
sentence-transformers==4.1.0
torch==2.7.0

# To add (optional):
openai==1.12.0              # If using OpenAI
anthropic==0.18.0           # If using Claude
ollama-python==0.1.6        # If using Ollama local
```

**Node.js** (`package.json`):
```json
{
  "dependencies": {
    "recharts": "^2.10.0",        // For summary charts
    "react-markdown": "^9.0.1"    // For rendering LLM output
  }
}
```

---

## 5. Testing Strategy

### Unit Tests

**Backend**:
```python
# tests/test_summarize.py
def test_summarize_cluster_results():
    result = toden_e.summarize_cluster_results("test_clusters.csv")
    assert "cluster_0" in result
    assert "summary" in result["cluster_0"]
    assert len(result["cluster_0"]["top_genes"]) > 0
```

**Frontend**:
```typescript
// __tests__/FunctionTabs.test.tsx
describe('Visualize Tab', () => {
  it('loads and displays clustering results', async () => {
    render(<FunctionTabs />);
    const tab = screen.getByText('Visualize');
    fireEvent.click(tab);
    // Assert visualization renders
  });
});
```

### Integration Tests

1. **End-to-End Flow**:
   - Run prediction → Save result ID
   - Open Visualize tab → Load result
   - Verify graph displays correctly
   - Open Summarize tab → Generate summary
   - Verify summary content

2. **Performance Tests**:
   - Test with large clusters (>1000 genes)
   - Measure LLM response time
   - Check memory usage during visualization

---

## 6. Known Issues & Limitations

### Visualize
- ⚠️ Large graphs (>500 nodes) may cause performance issues
- ⚠️ Layout algorithms can be slow on complex networks
- ⚠️ Need to implement pagination for edge display

### Summarize
- ⚠️ LLM API costs can be significant for large datasets
- ⚠️ Response time varies (5-30s per cluster)
- ⚠️ Quality depends on GO term descriptions available
- ⚠️ Need rate limiting for API-based LLMs

---

## 7. Security Considerations

1. **File Upload Validation**
   - Restrict to CSV files only
   - Validate file size (<10MB)
   - Sanitize file names

2. **API Key Management**
   - Store API keys in environment variables
   - Never commit keys to git
   - Use secret management service in production

3. **Rate Limiting**
   - Limit summarization requests (max 5/hour per user)
   - Queue long-running jobs
   - Add timeout for LLM calls (60s)

---

## 8. Future Enhancements

### Short-term
- Add export to PDF for summaries
- Interactive cluster filtering
- Real-time collaboration features

### Long-term
- Multi-modal summaries (text + graphs + tables)
- Comparative analysis between predictions
- Integration with external databases (KEGG, Reactome)
- Fine-tuned LLM specifically for GO term summarization

---

## 9. Resources & References

### Documentation
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [HuggingFace Transformers](https://huggingface.co/docs/transformers)
- [D3.js Force Layout](https://d3js.org/d3-force)
- [Gene Ontology Documentation](http://geneontology.org/docs/)

### Related Code
- `app/api/predict/route.ts` - Example of Python integration
- `components/DynamicGraph.tsx` - Graph visualization reference
- `python_scripts/toden_e.py` - Core algorithm implementation

### Contact
For questions about implementation, refer to:
- Original paper: [Link to paper]
- GitHub Issues: https://github.com/ai-pharm-AU/Toden-E/issues

---

## Quick Start Commands

```bash
# Enable Visualize tab
# 1. Edit toden-e-frontend/components/FunctionTabs.tsx line 276
# 2. Remove 'disabled' prop

# Enable Summarize tab
# 1. Edit toden-e-frontend/components/FunctionTabs.tsx line 277
# 2. Remove 'disabled' prop

# Test locally
npm run dev

# Check logs
tail -f /tmp/claude/-home-xias-zzz005-1-Toden-E-WEB/tasks/*.output
```

---

**Last Updated**: 2025-12-22
**Version**: 1.0
**Status**: Draft - Ready for Implementation
