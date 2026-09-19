import { NextResponse } from 'next/server';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export interface GraphNode {
  id: string;
  label: string;
  type: 'ErrorClass' | 'Occurrence' | 'RootCause' | 'Fix' | 'Technology' | 'Concept';
  val: number;
  color: string;
  details?: Record<string, any>;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export async function GET() {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  if (isConfigured()) {
    try {
      // 1. Fetch ErrorClasses
      const errorClasses = await runCypher<any>(`
        MATCH (e:ErrorClass)
        OPTIONAL MATCH (e)-[:CAUSED_BY]->(rc:RootCause)
        OPTIONAL MATCH (e)-[:FIXED_BY]->(fix:Fix)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        OPTIONAL MATCH (e)-[:TEACHES]->(c:Concept)
        RETURN e, rc, fix, collect(DISTINCT t) AS techs, collect(DISTINCT c) AS concepts
        LIMIT 50
      `);

      for (const row of errorClasses) {
        const e = row.e;
        const eId = `ec_${e.id}`;
        const occCount = e.occurrence_count || 1;

        nodesMap.set(eId, {
          id: eId,
          label: e.title || e.id,
          type: 'ErrorClass',
          val: Math.max(14, Math.min(30, 10 + occCount * 3)),
          color: '#f43f5e', // Vibrant Rose/Red
          details: {
            id: e.id,
            title: e.title,
            first_seen: e.first_seen,
            last_seen: e.last_seen,
            occurrence_count: occCount,
            self_solved_count: e.self_solved_count || 0,
            doc_path: e.doc_path,
            root_cause: e.root_cause || row.rc?.summary,
            past_fix_summary: e.past_fix_summary || row.fix?.summary,
          },
        });

        // Root Cause Node
        if (row.rc?.summary) {
          const rcId = `rc_${row.rc.id || e.id}`;
          if (!nodesMap.has(rcId)) {
            nodesMap.set(rcId, {
              id: rcId,
              label: row.rc.summary.length > 35 ? `${row.rc.summary.substring(0, 32)}...` : row.rc.summary,
              type: 'RootCause',
              val: 10,
              color: '#f59e0b', // Amber
              details: { summary: row.rc.summary },
            });
          }
          links.push({ source: eId, target: rcId, label: 'CAUSED_BY' });
        }

        // Fix Node
        if (row.fix?.summary) {
          const fixId = `fix_${row.fix.id || e.id}`;
          if (!nodesMap.has(fixId)) {
            nodesMap.set(fixId, {
              id: fixId,
              label: row.fix.summary.length > 35 ? `${row.fix.summary.substring(0, 32)}...` : row.fix.summary,
              type: 'Fix',
              val: 10,
              color: '#10b981', // Emerald
              details: { summary: row.fix.summary },
            });
          }
          links.push({ source: eId, target: fixId, label: 'FIXED_BY' });
        }

        // Tech Nodes
        if (Array.isArray(row.techs)) {
          for (const t of row.techs) {
            if (!t?.name) continue;
            const tId = `tech_${t.name.toLowerCase()}`;
            if (!nodesMap.has(tId)) {
              nodesMap.set(tId, {
                id: tId,
                label: t.name,
                type: 'Technology',
                val: 8,
                color: '#3b82f6', // Blue
              });
            }
            links.push({ source: eId, target: tId, label: 'TAGGED' });
          }
        }

        // Concept Nodes
        if (Array.isArray(row.concepts)) {
          for (const c of row.concepts) {
            if (!c?.name) continue;
            const cId = `concept_${c.name.toLowerCase()}`;
            if (!nodesMap.has(cId)) {
              nodesMap.set(cId, {
                id: cId,
                label: c.name,
                type: 'Concept',
                val: 9,
                color: '#06b6d4', // Cyan
              });
            }
            links.push({ source: eId, target: cId, label: 'TEACHES' });
          }
        }
      }

      // 2. Fetch recent occurrences
      const occs = await runCypher<any>(`
        MATCH (o:Occurrence)-[:INSTANCE_OF]->(e:ErrorClass)
        RETURN o, e.id AS error_class_id
        ORDER BY o.timestamp DESC
        LIMIT 30
      `);

      for (const row of occs) {
        const o = row.o;
        const oId = `occ_${o.id}`;
        const targetEId = `ec_${row.error_class_id}`;

        if (!nodesMap.has(oId)) {
          nodesMap.set(oId, {
            id: oId,
            label: `Occ: ${o.timestamp?.split('T')[0] || 'recent'}`,
            type: 'Occurrence',
            val: 6,
            color: '#a855f7', // Purple
            details: {
              timestamp: o.timestamp,
              project: o.project,
              user_solved: o.user_solved_unaided,
              raw_message: o.raw_message,
            },
          });
        }
        if (nodesMap.has(targetEId)) {
          links.push({ source: oId, target: targetEId, label: 'INSTANCE_OF' });
        }
      }
    } catch (err) {
      console.warn('Graph endpoint Cypher query failed:', err);
    }
  }

  // Fallback to in-memory store if DB is empty or unconfigured
  if (nodesMap.size === 0) {
    const memClasses = Array.from(inMemoryErrorClasses.values());
    if (memClasses.length > 0) {
      for (const e of memClasses) {
        const eId = `ec_${e.id}`;
        nodesMap.set(eId, {
          id: eId,
          label: e.title || e.id,
          type: 'ErrorClass',
          val: 18,
          color: '#f43f5e',
          details: e,
        });
        if (e.root_cause) {
          const rcId = `rc_${e.id}`;
          nodesMap.set(rcId, {
            id: rcId,
            label: e.root_cause,
            type: 'RootCause',
            val: 10,
            color: '#f59e0b',
          });
          links.push({ source: eId, target: rcId, label: 'CAUSED_BY' });
        }
        if (e.past_fix_summary) {
          const fixId = `fix_${e.id}`;
          nodesMap.set(fixId, {
            id: fixId,
            label: e.past_fix_summary,
            type: 'Fix',
            val: 10,
            color: '#10b981',
          });
          links.push({ source: eId, target: fixId, label: 'FIXED_BY' });
        }
      }
    } else {
      // Seed default demonstrative graph nodes for first impression
      const demoEc1 = 'ec_demo_port';
      const demoEc2 = 'ec_demo_null';

      nodesMap.set(demoEc1, {
        id: demoEc1,
        label: 'EADDRINUSE: port 3000 already in use',
        type: 'ErrorClass',
        val: 20,
        color: '#f43f5e',
        details: {
          id: 'ec_9f2a',
          title: 'EADDRINUSE: port already in use',
          first_seen: '2026-08-14T10:00:00Z',
          last_seen: '2026-09-19T14:30:00Z',
          occurrence_count: 4,
          self_solved_count: 2,
          root_cause: 'Another process is bound to the port (e.g., zombie dev server)',
          past_fix_summary: 'lsof -i :3000 | xargs kill -9 or switch PORT env',
        },
      });

      nodesMap.set('rc_port', {
        id: 'rc_port',
        label: 'Zombie dev process bound to port',
        type: 'RootCause',
        val: 10,
        color: '#f59e0b',
      });
      links.push({ source: demoEc1, target: 'rc_port', label: 'CAUSED_BY' });

      nodesMap.set('fix_kill', {
        id: 'fix_kill',
        label: 'Kill listener or change port',
        type: 'Fix',
        val: 10,
        color: '#10b981',
      });
      links.push({ source: demoEc1, target: 'fix_kill', label: 'FIXED_BY' });

      nodesMap.set('tech_node', {
        id: 'tech_node',
        label: 'Node.js',
        type: 'Technology',
        val: 8,
        color: '#3b82f6',
      });
      links.push({ source: demoEc1, target: 'tech_node', label: 'TAGGED' });

      nodesMap.set('concept_ports', {
        id: 'concept_ports',
        label: 'Network Ports',
        type: 'Concept',
        val: 9,
        color: '#06b6d4',
      });
      links.push({ source: demoEc1, target: 'concept_ports', label: 'TEACHES' });

      nodesMap.set(demoEc2, {
        id: demoEc2,
        label: 'TypeError: Cannot read properties of undefined (reading "map")',
        type: 'ErrorClass',
        val: 16,
        color: '#f43f5e',
        details: {
          id: 'ec_1b77',
          title: 'TypeError: undefined reading map',
          first_seen: '2026-09-01T09:00:00Z',
          last_seen: '2026-09-18T16:20:00Z',
          occurrence_count: 3,
          self_solved_count: 1,
          root_cause: 'Asynchronous fetch result accessed before promise resolved',
          past_fix_summary: 'Add optional chaining (items?.map) and fallback default []',
        },
      });

      nodesMap.set('tech_react', {
        id: 'tech_react',
        label: 'React',
        type: 'Technology',
        val: 8,
        color: '#3b82f6',
      });
      links.push({ source: demoEc2, target: 'tech_react', label: 'TAGGED' });

      nodesMap.set('concept_async', {
        id: 'concept_async',
        label: 'Async State',
        type: 'Concept',
        val: 9,
        color: '#06b6d4',
      });
      links.push({ source: demoEc2, target: 'concept_async', label: 'TEACHES' });

      links.push({ source: demoEc1, target: demoEc2, label: 'SIMILAR_TO' });
    }
  }

  return NextResponse.json({
    nodes: Array.from(nodesMap.values()),
    links,
  });
}
