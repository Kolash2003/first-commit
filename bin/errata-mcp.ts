#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';


dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { matchError } from '../lib/matching';
import { logResolution } from '../lib/capture';
import { getStats } from '../lib/stats';
import { readVaultDoc } from '../lib/vault';
import { initNeo4jSchema, isConfigured, runCypher } from '../lib/neo4j';

const SERVER_INSTRUCTIONS = `
ERRATA ACTIVE LEARNING PROTOCOL:
You are an intelligent pair-programmer equipped with Errata, a knowledge engine connected to an online Neo4j graph database.
1. BEFORE fixing any compile, runtime, build, or test error:
   You MUST call 'check_error' with the error message and stack trace.
   If 'check_error' returns a match (seen before), you MUST present the 'interrupt_prompt' to the developer:
   "You've hit this error before. Root cause: <cause>. Want to try fixing it yourself first? (hint: <hint>)"
2. AFTER the error is solved and verified:
   You MUST call 'log_resolution' with:
   - root_cause: Clear summary of the fundamental issue.
   - fix: Concrete steps applied.
   - explanation: Educational explanation for the developer.
   - diagrams: Mermaid flowcharts ('root_cause_flow') and sequence diagrams ('fix_sequence').
   - technology: e.g. ["typescript", "nextjs", "neo4j"].
   - concepts: Core conceptual learning tags, e.g. ["port-binding", "race-condition"].
   - user_solved_unaided: true if the user fixed it without you generating the solution code.
`;

async function main() {
  const server = new Server(
    {
      name: 'errata-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );


  if (isConfigured()) {
    initNeo4jSchema().catch((err) => {
      console.error('[Errata MCP] Background schema initialization notice:', err.message);
    });
  }


  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'errata_workflow',
          description: 'Guidelines on when and how to call Errata tools during debugging sessions.',
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === 'errata_workflow') {
      return {
        description: 'Errata Workflow Instructions',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: SERVER_INSTRUCTIONS,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${request.params.name}`);
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'check_error',
          description:
            'MANDATORY BEFORE FIXING: Check if this error or error class has occurred before in the online Neo4j knowledge graph. Returns occurrence count, past root cause, previous fix, and interrupt prompt.',
          inputSchema: {
            type: 'object',
            properties: {
              error_message: {
                type: 'string',
                description: 'The raw or formatted error message text.',
              },
              stack_trace: {
                type: 'string',
                description: 'Stack trace or error trace output (optional).',
              },
              context: {
                type: 'string',
                description: 'Code snippet or shell command that produced the error.',
              },
              project: {
                type: 'string',
                description: 'Project name or repository identifier.',
              },
              technology: {
                type: 'array',
                items: { type: 'string' },
                description: 'Technologies involved, e.g. ["node", "react", "neo4j"].',
              },
            },
            required: ['error_message'],
          },
        },
        {
          name: 'log_resolution',
          description:
            'MANDATORY AFTER FIXING: Persist the verified resolution into the online Neo4j graph database and generate an Obsidian-compatible Markdown doc with Mermaid diagrams in the local vault.',
          inputSchema: {
            type: 'object',
            properties: {
              error_message: {
                type: 'string',
                description: 'The error message that was resolved.',
              },
              stack_trace: {
                type: 'string',
                description: 'The stack trace (optional).',
              },
              root_cause: {
                type: 'string',
                description: 'The fundamental root cause explanation.',
              },
              fix: {
                type: 'string',
                description: 'The verified steps/code changes that fixed the error.',
              },
              explanation: {
                type: 'string',
                description: 'Educational plain-English breakdown of why this occurred.',
              },
              diagrams: {
                type: 'array',
                description: 'Mermaid diagrams authored to explain the cause and fix.',
                items: {
                  type: 'object',
                  properties: {
                    kind: {
                      type: 'string',
                      enum: ['root_cause_flow', 'fix_sequence'],
                    },
                    mermaid: {
                      type: 'string',
                      description: 'Mermaid code (flowchart TD ... or sequenceDiagram ...)',
                    },
                  },
                  required: ['kind', 'mermaid'],
                },
              },
              technology: {
                type: 'array',
                items: { type: 'string' },
                description: 'Associated languages, frameworks, or tools.',
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Paths to files modified or inspected.',
              },
              project: {
                type: 'string',
                description: 'Project name.',
              },
              concepts: {
                type: 'array',
                items: { type: 'string' },
                description: 'Learning concept tags, e.g. ["ports", "concurrency"].',
              },
              matched_error_class_id: {
                type: 'string',
                description: 'The error_class_id returned by check_error if matched.',
              },
              user_solved_unaided: {
                type: 'boolean',
                description: 'Whether the human developer solved this error on their own.',
              },
            },
            required: ['error_message', 'root_cause', 'fix', 'explanation'],
          },
        },
        {
          name: 'get_error_doc',
          description:
            'Retrieve the generated Markdown documentation and Mermaid diagrams for an error class.',
          inputSchema: {
            type: 'object',
            properties: {
              doc_path: {
                type: 'string',
                description: 'Relative path to the markdown document (e.g. errors/2026-09-19-ec_1234.md).',
              },
            },
            required: ['doc_path'],
          },
        },
        {
          name: 'get_stats',
          description:
            'Fetch developer learning statistics: error recurrence counts, recidivism rate, self-solve rate, and top recurring errors.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'search_errors',
          description:
            'Search recorded error classes and resolutions by keyword or concept in Neo4j.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search keywords or error description.',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 5).',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_review_queue',
          description:
            'Spaced-repetition cards due for review (v2). Returns ErrorClasses with review_due_date due, ordered by recurrence.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of cards to return (default: 10).',
              },
            },
          },
        },
        {
          name: 'submit_review_result',
          description:
            'Record recall outcome for a review card (feeds SM-2 scheduling).',
          inputSchema: {
            type: 'object',
            properties: {
              error_class_id: {
                type: 'string',
                description: 'The ErrorClass id that was reviewed.',
              },
              rating: {
                type: 'string',
                enum: ['again', 'hard', 'good', 'easy'],
                description: 'Recall quality rating.',
              },
            },
            required: ['error_class_id', 'rating'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'check_error') {
        const result = await matchError({
          error_message: String(args?.error_message || ''),
          stack_trace: args?.stack_trace ? String(args.stack_trace) : undefined,
          context: args?.context ? String(args.context) : undefined,
          project: args?.project ? String(args.project) : undefined,
          technology: Array.isArray(args?.technology) ? args.technology.map(String) : undefined,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === 'log_resolution') {
        const result = await logResolution({
          error_message: String(args?.error_message || ''),
          stack_trace: args?.stack_trace ? String(args.stack_trace) : undefined,
          root_cause: String(args?.root_cause || ''),
          fix: String(args?.fix || ''),
          explanation: String(args?.explanation || ''),
          diagrams: Array.isArray(args?.diagrams) ? (args.diagrams as any) : undefined,
          technology: Array.isArray(args?.technology) ? args.technology.map(String) : undefined,
          files: Array.isArray(args?.files) ? args.files.map(String) : undefined,
          project: args?.project ? String(args.project) : undefined,
          concepts: Array.isArray(args?.concepts) ? args.concepts.map(String) : undefined,
          matched_error_class_id: args?.matched_error_class_id
            ? String(args.matched_error_class_id)
            : undefined,
          user_solved_unaided: Boolean(args?.user_solved_unaided),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === 'get_error_doc') {
        const docPath = String(args?.doc_path || '');
        const content = readVaultDoc(docPath);
        if (!content) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Document not found at path: ${docPath}` }],
          };
        }
        return {
          content: [{ type: 'text', text: content }],
        };
      }

      if (name === 'get_stats') {
        const stats = await getStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      if (name === 'search_errors') {
        const queryStr = String(args?.query || '').toLowerCase();
        const limitNum = Number(args?.limit || 5);

        if (isConfigured()) {
          const cypher = `
            MATCH (e:ErrorClass)
            WHERE toLower(e.title) CONTAINS $query
               OR toLower(coalesce(e.root_cause, '')) CONTAINS $query
               OR toLower(coalesce(e.past_fix_summary, '')) CONTAINS $query
            OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
            RETURN e, collect(t.name) AS tags
            LIMIT $limit
          `;
          const records = await runCypher<any>(cypher, { query: queryStr, limit: limitNum });
          const items = records.map((r) => ({
            id: r.e.id,
            title: r.e.title,
            occurrence_count: r.e.occurrence_count,
            root_cause: r.e.root_cause,
            past_fix: r.e.past_fix_summary,
            doc_path: r.e.doc_path,
            tags: r.tags || [],
          }));
          return {
            content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify([], null, 2) }],
        };
      }

      if (name === 'get_review_queue') {
        const limitNum = Math.min(100, Math.max(1, Number(args?.limit || 10)));
        const today = new Date().toISOString().split('T')[0];
        if (isConfigured()) {
          const rows = await runCypher<any>(
            `MATCH (e:ErrorClass)
             WHERE e.review_due_date IS NULL OR e.review_due_date <= $today
             OPTIONAL MATCH (e)-[:CAUSED_BY]->(rc:RootCause)
             OPTIONAL MATCH (e)-[:FIXED_BY]->(fx:Fix)
             RETURN e.id AS id, e.title AS title,
                    coalesce(rc.summary, e.root_cause, '') AS rootCause,
                    coalesce(fx.summary, e.past_fix_summary, '') AS pastFix,
                    e.occurrence_count AS occurrences
             ORDER BY e.occurrence_count DESC LIMIT $limit`,
            { today, limit: limitNum }
          );
          return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify([], null, 2) }] };
      }

      if (name === 'submit_review_result') {
        const errorClassId = String(args?.error_class_id || '');
        const rating = String(args?.rating || '');
        if (!errorClassId || !['again', 'hard', 'good', 'easy'].includes(rating)) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'error_class_id and rating (again/hard/good/easy) required.' }],
          };
        }
        if (!isConfigured()) {
          return { content: [{ type: 'text', text: JSON.stringify({ ok: true, offline: true }, null, 2) }] };
        }
        const existing = await runCypher<any>(
          `MATCH (e:ErrorClass { id: $id }) RETURN e.ease_factor AS ef, e.current_interval AS iv LIMIT 1`,
          { id: errorClassId }
        );
        let ef = existing[0]?.ef ?? 2.5;
        let iv = existing[0]?.iv ?? 1;
        if (rating === 'again') { iv = 1; ef = Math.max(1.3, ef - 0.2); }
        else if (rating === 'hard') { iv = Math.ceil(iv * 1.2); ef = Math.max(1.3, ef - 0.15); }
        else if (rating === 'good') { iv = Math.ceil(iv * ef); }
        else { iv = Math.ceil(iv * ef * 1.3); ef = Math.min(2.5, ef + 0.1); }
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + Math.max(1, iv));
        const dueStr = nextDue.toISOString().split('T')[0];
        await runCypher(
          `MATCH (e:ErrorClass { id: $id })
           SET e.ease_factor = $ef, e.current_interval = $iv,
               e.review_due_date = $due, e.last_reviewed = $today`,
          { id: errorClassId, ef: Number(ef.toFixed(2)), iv: Math.max(1, iv), due: dueStr, today: new Date().toISOString().split('T')[0] }
        );
        return {
          content: [{ type: 'text', text: JSON.stringify({ ok: true, nextDue: dueStr, interval: iv, easeFactor: ef }, null, 2) }],
        };
      }

      throw new Error(`Tool '${name}' not implemented.`);
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${err?.message || String(err)}`,
          },
        ],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Errata MCP Server] Running on stdio transport connected to Neo4j.');
}

main().catch((err) => {
  console.error('[Errata MCP Server Fatal Error]:', err);
  process.exit(1);
});
