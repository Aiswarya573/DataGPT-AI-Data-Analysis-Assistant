/**
 * Express Server for DataGPT – AI-Powered Data Analysis Assistant
 * Provides server-side Gemini AI integration, safe SQLite execution, and Vite integration.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import initSqlJs from 'sql.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Security: Verify SQL is safe SELECT / WITH only
function isSafeSQL(query: string): boolean {
  const cleaned = query.replace(/--.*?\n/g, '').replace(/\/\*.*?\*\//gs, '').trim();
  const forbidden = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|TRUNCATE|ATTACH|DETACH|REPLACE|CREATE|EXEC|GRANT|REVOKE)\b/i;
  if (forbidden.test(cleaned)) {
    return false;
  }
  const upper = cleaned.toUpperCase();
  return upper.startsWith('SELECT') || upper.startsWith('WITH');
}

// 1. Natural Language Intent & Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { question, columns, numericalColumns, categoricalColumns, dateColumns, history } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let intent: any = null;

    if (aiClient) {
      try {
        const historyText = Array.isArray(history)
          ? history.slice(-4).map((h: any) => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
          : '';

        const systemPrompt = `You are DataGPT's AI analytical brain.
The dataset schema has the following columns:
- All Columns: ${JSON.stringify(columns)}
- Numerical: ${JSON.stringify(numericalColumns)}
- Categorical: ${JSON.stringify(categoricalColumns)}
- Dates: ${JSON.stringify(dateColumns)}

${historyText ? `Conversation History:\n${historyText}\n` : ''}

Convert the user's question into a structured analytical plan.
Return ONLY a valid JSON object with:
{
  "operation": "top_n" | "bottom_n" | "total" | "groupby" | "trend" | "count" | "sql",
  "metric": "<exact matching numerical column or empty>",
  "dimension": "<exact matching categorical or date column or empty>",
  "top_n": <integer number, default 5>,
  "chart_type": "bar" | "line" | "pie" | "scatter" | "histogram" | "none",
  "sql_query": "<optional valid SQLite query on table 'dataset'>"
}`;

        const aiResponse = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: question,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        if (aiResponse.text) {
          intent = JSON.parse(aiResponse.text.trim());
        }
      } catch (err: any) {
        console.warn('Gemini chat intent fallback:', err.message);
      }
    }

    return res.json({ intent });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Synthesize Human Explanation Endpoint
app.post('/api/explain', async (req: Request, res: Response) => {
  try {
    const { question, resultSummary, calculationStep } = req.body;

    if (!aiClient) {
      return res.json({
        explanation: `${resultSummary}. Calculated via: ${calculationStep}`,
      });
    }

    const prompt = `You are DataGPT, an expert AI Data Analyst.
User Question: "${question}"
Calculated Result: "${resultSummary}"
Calculation Step: "${calculationStep}"

Write a concise, polished response in 1-2 friendly paragraphs. Keep the exact numerical figures intact.
Do NOT invent new numerical figures. Mention the key finding clearly.`;

    const aiResponse = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return res.json({
      explanation: aiResponse.text || resultSummary,
    });
  } catch (error: any) {
    return res.json({ explanation: req.body.resultSummary });
  }
});

// 3. Automated Executive Insights & Recommendations Endpoint
app.post('/api/insights', async (req: Request, res: Response) => {
  try {
    const { profile, quality, stats, sampleRows } = req.body;

    if (!aiClient) {
      return res.json({
        summary: 'Dataset successfully profiled. Review top metrics and anomaly distribution.',
        recommendations: [
          {
            category: 'Data Quality',
            finding: `${quality.duplicateCount || 0} duplicate rows and ${quality.missingCount || 0} missing cells detected.`,
            recommendation: 'Clean duplicate transactions and impute key metrics before board reporting.',
          },
        ],
      });
    }

    const prompt = `You are a Principal Data Analyst.
Analyze the following dataset profile and provide high-impact executive insights:
Profile: ${JSON.stringify(profile)}
Quality: ${JSON.stringify(quality)}
Key Stats: ${JSON.stringify(stats)}
Sample Rows: ${JSON.stringify(sampleRows?.slice(0, 5))}

Return ONLY a JSON object:
{
  "executive_summary": "2-3 sentences overview of dataset health and commercial significance",
  "key_findings": ["string finding 1", "string finding 2", "string finding 3"],
  "recommendations": [
    {
      "category": "string category",
      "finding": "strictly factual observation",
      "recommendation": "prudent business action"
    }
  ]
}`;

    const aiResponse = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(aiResponse.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate insights' });
  }
});

// 4. Safe SQLite Execution Endpoint
app.post('/api/sql', async (req: Request, res: Response) => {
  try {
    const { query, dataRows, columns } = req.body;

    if (!query || !isSafeSQL(query)) {
      return res.status(400).json({
        error: 'Security Alert: Only read-only analytical SELECT or WITH queries are allowed.',
      });
    }

    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create table 'dataset'
    if (Array.isArray(columns) && Array.isArray(dataRows)) {
      const sanitizedCols = columns.map((c: string) => `"${c.replace(/"/g, '""')}" TEXT`).join(', ');
      db.run(`CREATE TABLE dataset (${sanitizedCols});`);

      const placeholders = columns.map(() => '?').join(', ');
      const insertStmt = db.prepare(`INSERT INTO dataset VALUES (${placeholders})`);

      for (const row of dataRows) {
        const values = columns.map((col: string) => (row[col] !== undefined && row[col] !== null ? String(row[col]) : null));
        insertStmt.run(values);
      }
      insertStmt.free();
    }

    const startTime = Date.now();
    const results = db.exec(query);
    const elapsedMs = Date.now() - startTime;

    if (results.length === 0) {
      return res.json({ columns: [], rows: [], count: 0, executionTimeMs: elapsedMs });
    }

    const resultCols = results[0].columns;
    const resultRows = results[0].values.map((row) => {
      const obj: any = {};
      resultCols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    db.close();

    return res.json({
      columns: resultCols,
      rows: resultRows,
      count: resultRows.length,
      executionTimeMs: elapsedMs,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'SQL execution failed' });
  }
});

// Start Server with Vite or Static
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DataGPT Application running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
