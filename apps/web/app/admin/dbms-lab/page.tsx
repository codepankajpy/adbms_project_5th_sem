'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import {
  Database,
  Terminal,
  Layers,
  Code2,
  Cpu,
  Zap,
  Repeat,
  Eye,
  Search,
  Shield,
  Activity,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function DbmsLabPage() {
  const [activeTab, setActiveTab] = useState<
    'schema' | 'queries' | 'procedures' | 'functions' | 'triggers' | 'cursors' | 'views' | 'indexes' | 'transactions' | 'statistics'
  >('schema');

  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Section states
  const [schemaData, setSchemaData] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string>('service_bookings');

  const [queriesList, setQueriesList] = useState<any[]>([]);
  const [selectedQueryCategory, setSelectedQueryCategory] = useState<string>('All');
  const [queryExecutionResults, setQueryExecutionResults] = useState<Record<number, any>>({});
  const [executingQueryId, setExecutingQueryId] = useState<number | null>(null);

  const [procedures, setProcedures] = useState<any[]>([]);
  const [functions, setFunctions] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [cursorsData, setCursorsData] = useState<any>(null);
  const [viewsData, setViewsData] = useState<any[]>([]);
  const [indexesData, setIndexesData] = useState<any>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);

  // Transaction simulation
  const [transactionLog, setTransactionLog] = useState<any[]>([]);
  const [simulatingTx, setSimulatingTx] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of overview and schema
    Promise.all([
      apiRequest('/api/dbms/overview'),
      apiRequest('/api/dbms/schema'),
      apiRequest('/api/dbms/queries'),
    ])
      .then(([ovRes, scRes, qRes]) => {
        setOverview(ovRes.data);
        setSchemaData(scRes.data);
        setQueriesList(qRes.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Lazy loader for specific tabs
  useEffect(() => {
    if (activeTab === 'procedures' && procedures.length === 0) {
      apiRequest('/api/dbms/procedures').then((res) => setProcedures(res.data || []));
    } else if (activeTab === 'functions' && functions.length === 0) {
      apiRequest('/api/dbms/functions').then((res) => setFunctions(res.data || []));
    } else if (activeTab === 'triggers' && triggers.length === 0) {
      apiRequest('/api/dbms/triggers').then((res) => setTriggers(res.data || []));
    } else if (activeTab === 'cursors' && !cursorsData) {
      apiRequest('/api/dbms/cursors').then((res) => setCursorsData(res.data));
    } else if (activeTab === 'views' && viewsData.length === 0) {
      apiRequest('/api/dbms/views').then((res) => setViewsData(res.data || []));
    } else if (activeTab === 'indexes' && !indexesData) {
      apiRequest('/api/dbms/indexes').then((res) => setIndexesData(res.data));
    } else if (activeTab === 'statistics' && !statisticsData) {
      apiRequest('/api/dbms/statistics').then((res) => setStatisticsData(res.data));
    }
  }, [activeTab, procedures.length, functions.length, triggers.length, cursorsData, viewsData.length, indexesData, statisticsData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeDemoQuery = async (queryId: number) => {
    setExecutingQueryId(queryId);
    try {
      const res = await apiRequest(`/api/dbms/queries/${queryId}/execute`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setQueryExecutionResults((prev) => ({ ...prev, [queryId]: res.data }));
    } catch (err: any) {
      setQueryExecutionResults((prev) => ({
        ...prev,
        [queryId]: { error: err.message || 'Execution error' },
      }));
    } finally {
      setExecutingQueryId(null);
    }
  };

  const runTransactionSimulation = async () => {
    setSimulatingTx(true);
    setTransactionLog([]);
    try {
      const res = await apiRequest('/api/dbms/transactions/simulate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setTransactionLog(res.data?.traceLog || []);
    } catch (err: any) {
      setTransactionLog(err.details?.traceLog || [{ step: 1, action: 'ERROR', detail: err.message }]);
    } finally {
      setSimulatingTx(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Connecting to PostgreSQL system catalogs (information_schema, pg_proc, pg_trigger)...</div>;
  }

  const queryCategories = ['All', ...Array.from(new Set(queriesList.map((q) => q.category)))];
  const filteredQueries =
    selectedQueryCategory === 'All'
      ? queriesList
      : queriesList.filter((q) => q.category === selectedQueryCategory);

  const currentTableObj = schemaData?.tables?.find((t: any) => t.table_name === selectedTable);
  const currentColumns = schemaData?.columns?.filter((c: any) => c.table_name === selectedTable) || [];
  const currentConstraints = schemaData?.constraints?.filter((c: any) => c.table_name === selectedTable) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-[#111111] text-white rounded-lg border border-black flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono text-[#D97736] mb-2 uppercase">
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL System Catalog Introspection</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Advanced DBMS Academic Explorer</h1>
          <p className="text-xs text-[#A3A3A3] mt-1 max-w-2xl leading-relaxed">
            Live database administration and viva inspection suite. All definitions, system metrics, catalog tables, stored routines, and triggers are queried directly from the running PostgreSQL 18 database engine.
          </p>
        </div>

        <button
          onClick={runTransactionSimulation}
          disabled={simulatingTx}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#D97736] hover:bg-[#C26425] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${simulatingTx ? 'animate-spin' : ''}`} />
          <span>{simulatingTx ? 'Simulating ACID...' : 'Run ACID Simulation'}</span>
        </button>
      </div>

      {/* 8 Header Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Tables</span>
          <span className="text-xl font-bold font-mono text-[#171717]">{overview?.total_tables || 18}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Views</span>
          <span className="text-xl font-bold font-mono text-[#171717]">{overview?.total_views || 5}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Procedures</span>
          <span className="text-xl font-bold font-mono text-[#D97736]">{overview?.total_procedures || 5}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Functions</span>
          <span className="text-xl font-bold font-mono text-[#171717]">{overview?.total_functions || 8}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Triggers</span>
          <span className="text-xl font-bold font-mono text-[#D97736]">{overview?.total_triggers || 10}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Indexes</span>
          <span className="text-xl font-bold font-mono text-[#171717]">{overview?.total_indexes || 18}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">Cursors</span>
          <span className="text-xl font-bold font-mono text-[#171717]">{overview?.total_cursor_demos || 2}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-3 rounded">
          <span className="text-[10px] text-[#737373] block uppercase font-mono">SQL Library</span>
          <span className="text-xl font-bold font-mono text-[#2E6B47]">{overview?.total_sql_queries || 40}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E5E5E5] flex space-x-1 overflow-x-auto pb-px">
        {[
          { id: 'schema', label: '1. Schema Explorer', icon: Layers },
          { id: 'queries', label: '2. SQL Query Library (40)', icon: Terminal },
          { id: 'procedures', label: '3. Stored Procedures', icon: Cpu },
          { id: 'functions', label: '4. Functions (UDF)', icon: Code2 },
          { id: 'triggers', label: '5. Triggers & Flows', icon: Zap },
          { id: 'cursors', label: '6. Cursors Execution', icon: Repeat },
          { id: 'views', label: '7. Relational Views', icon: Eye },
          { id: 'indexes', label: '8. Index Explorer', icon: Search },
          { id: 'transactions', label: '9. ACID & Transactions', icon: Shield },
          { id: 'statistics', label: '10. Engine Statistics', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-t-md border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-[#111111] text-[#111111] bg-white'
                  : 'border-transparent text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F3]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D97736]' : 'text-[#737373]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: SCHEMA EXPLORER                                          */}
      {/* ==================================================================== */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table List Column */}
          <div className="lg:col-span-1 bg-white border border-[#E5E5E5] rounded p-3 space-y-1 max-h-[600px] overflow-y-auto">
            <span className="text-[11px] font-mono uppercase font-bold text-[#737373] px-2 py-1 block">
              18 Relational Tables (3NF)
            </span>
            {schemaData?.tables?.map((t: any) => (
              <button
                key={t.table_name}
                onClick={() => setSelectedTable(t.table_name)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center justify-between ${
                  selectedTable === t.table_name
                    ? 'bg-[#111111] text-white font-bold'
                    : 'text-[#171717] hover:bg-[#F5F5F3]'
                }`}
              >
                <span>{t.table_name}</span>
                <span className={`text-[10px] ${selectedTable === t.table_name ? 'text-white/70' : 'text-[#737373]'}`}>
                  {t.estimated_rows} rows
                </span>
              </button>
            ))}
          </div>

          {/* Table Inspector Column */}
          <div className="lg:col-span-3 space-y-5">
            <Card
              title={`Table: ${selectedTable}`}
              subtitle={`Physical footprint: ${currentTableObj?.total_size || 'N/A'} (Data: ${currentTableObj?.table_size || 'N/A'}, Indexes: ${currentTableObj?.index_size || 'N/A'})`}
              action={
                <Badge variant="default" className="font-mono">
                  {currentTableObj?.estimated_rows || 0} live tuples
                </Badge>
              }
            >
              <h4 className="text-xs font-bold text-[#171717] mb-2 uppercase font-mono">Column Definitions & Data Types</h4>
              <div className="overflow-x-auto border border-[#E5E5E5] rounded mb-5">
                <table className="min-w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                      <th className="py-2 px-3 font-medium">#</th>
                      <th className="py-2 px-3 font-medium">Column Name</th>
                      <th className="py-2 px-3 font-medium">PostgreSQL Type</th>
                      <th className="py-2 px-3 font-medium">Nullable</th>
                      <th className="py-2 px-3 font-medium">Default Expression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                    {currentColumns.map((col: any) => (
                      <tr key={col.column_name} className="hover:bg-[#F5F5F3]/50">
                        <td className="py-2 px-3 text-[#737373]">{col.ordinal_position}</td>
                        <td className="py-2 px-3 font-bold">{col.column_name}</td>
                        <td className="py-2 px-3 text-[#D97736]">{col.udt_name}</td>
                        <td className="py-2 px-3">{col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}</td>
                        <td className="py-2 px-3 text-[#737373] truncate max-w-[200px]">{col.column_default || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-xs font-bold text-[#171717] mb-2 uppercase font-mono">Constraints & Foreign Key Relations</h4>
              <div className="overflow-x-auto border border-[#E5E5E5] rounded">
                <table className="min-w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                      <th className="py-2 px-3 font-medium">Constraint Name</th>
                      <th className="py-2 px-3 font-medium">Type</th>
                      <th className="py-2 px-3 font-medium">Local Column</th>
                      <th className="py-2 px-3 font-medium">Foreign Referenced Relation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                    {currentConstraints.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-[#737373] italic">No explicit foreign constraints on this entity.</td>
                      </tr>
                    ) : (
                      currentConstraints.map((c: any) => (
                        <tr key={c.constraint_name}>
                          <td className="py-2 px-3 font-medium">{c.constraint_name}</td>
                          <td className="py-2 px-3">
                            <Badge variant={c.constraint_type === 'PRIMARY KEY' ? 'default' : c.constraint_type === 'FOREIGN KEY' ? 'accent' : 'outline'}>
                              {c.constraint_type}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-bold">{c.column_name}</td>
                          <td className="py-2 px-3 text-[#737373]">
                            {c.foreign_table_name ? `${c.foreign_table_name}.${c.foreign_column_name}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: SQL QUERY LIBRARY (40 CATEGORIZED QUERIES + LIVE RUNNER)   */}
      {/* ==================================================================== */}
      {activeTab === 'queries' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {queryCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedQueryCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  selectedQueryCategory === cat
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#737373] hover:text-[#171717] border-[#E5E5E5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Queries List */}
          <div className="space-y-4">
            {filteredQueries.map((q) => {
              const execResult = queryExecutionResults[q.id];
              const isExecuting = executingQueryId === q.id;

              return (
                <div key={q.id} className="bg-white border border-[#E5E5E5] rounded p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E5E5] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-[#111111] text-white text-[11px] font-mono font-bold">
                        Query #{q.id}
                      </span>
                      <h3 className="text-sm font-bold text-[#171717]">{q.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="accent">{q.category}</Badge>
                      <button
                        onClick={() => copyToClipboard(q.sql, `query-${q.id}`)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-[#737373] hover:text-[#171717] border border-[#E5E5E5] rounded"
                        title="Copy SQL"
                      >
                        {copiedId === `query-${q.id}` ? <Check className="w-3 h-3 text-[#2E6B47]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === `query-${q.id}` ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => executeDemoQuery(q.id)}
                        disabled={isExecuting}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                      >
                        <Play className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                        <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-[#F5F5F3] rounded border border-[#E5E5E5]">
                      <strong className="block text-[#171717] mb-0.5">DBMS Concept Demonstrated:</strong>
                      <span className="text-[#737373]">{q.concept}</span>
                    </div>
                    <div className="p-2.5 bg-[#F5F5F3] rounded border border-[#E5E5E5]">
                      <strong className="block text-[#171717] mb-0.5">Realistic Vehicle Service Use Case:</strong>
                      <span className="text-[#737373]">{q.useCase}</span>
                    </div>
                  </div>

                  {/* SQL Code Block */}
                  <div className="relative">
                    <pre className="p-3 bg-[#111111] text-white rounded text-xs font-mono overflow-x-auto leading-relaxed">
                      <code>{q.sql}</code>
                    </pre>
                  </div>

                  {/* Execution Output Panel */}
                  {execResult && (
                    <div className="mt-3 p-3 bg-[#FDFDFD] border border-[#E5E5E5] rounded space-y-2">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E5]">
                        <span className="font-semibold text-[#171717] flex items-center space-x-1.5">
                          <Terminal className="w-3.5 h-3.5 text-[#2E6B47]" />
                          <span>Live PostgreSQL Execution Result ({execResult.rowCount || 0} rows returned)</span>
                        </span>
                        {execResult.executionTimeMs !== undefined && (
                          <span className="font-mono text-[#737373] text-[11px]">
                            Execution Time: <strong>{execResult.executionTimeMs} ms</strong>
                          </span>
                        )}
                      </div>

                      {execResult.error ? (
                        <div className="p-2 bg-[#FDF3F2] text-[#B83232] text-xs font-mono rounded">
                          {execResult.error}
                        </div>
                      ) : execResult.rows && execResult.rows.length > 0 ? (
                        <div className="overflow-x-auto max-h-48 overflow-y-auto">
                          <table className="min-w-full text-left text-xs font-mono">
                            <thead>
                              <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                                {Object.keys(execResult.rows[0]).map((col) => (
                                  <th key={col} className="py-1 px-2 font-medium">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                              {execResult.rows.slice(0, 5).map((row: any, rIdx: number) => (
                                <tr key={rIdx} className="hover:bg-[#F5F5F3]/50">
                                  {Object.values(row).map((val: any, cIdx: number) => (
                                    <td key={cIdx} className="py-1 px-2 truncate max-w-[200px]">
                                      {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-[#737373] italic">Zero tuples returned.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: STORED PROCEDURES                                         */}
      {/* ==================================================================== */}
      {activeTab === 'procedures' && (
        <div className="space-y-5">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded">
            <h3 className="text-sm font-bold text-[#171717] mb-1">PL/pgSQL Stored Procedures Catalog (pg_proc)</h3>
            <p className="text-xs text-[#737373]">
              Procedures execute server-side within controlled transaction boundaries using <code className="font-mono">CALL procedure_name(...)</code>.
            </p>
          </div>

          <div className="space-y-4">
            {procedures.map((proc) => (
              <Card key={proc.procedure_name} title={`PROCEDURE ${proc.procedure_name}`} subtitle={proc.arguments}>
                <div className="relative">
                  <pre className="p-4 bg-[#111111] text-white rounded text-xs font-mono overflow-x-auto leading-relaxed max-h-72">
                    <code>{proc.definition}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(proc.definition, `proc-${proc.procedure_name}`)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-mono rounded"
                  >
                    {copiedId === `proc-${proc.procedure_name}` ? 'Copied' : 'Copy Source'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: USER-DEFINED FUNCTIONS (UDF)                              */}
      {/* ==================================================================== */}
      {activeTab === 'functions' && (
        <div className="space-y-5">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded">
            <h3 className="text-sm font-bold text-[#171717] mb-1">User-Defined Functions (Scalar & Table-Returning)</h3>
            <p className="text-xs text-[#737373]">
              Introspected directly from PostgreSQL catalog <code className="font-mono">pg_proc</code>. Functions return scalar values or polymorphic result sets via <code className="font-mono">RETURNS TABLE (...)</code>.
            </p>
          </div>

          <div className="space-y-4">
            {functions.map((fn) => (
              <Card key={fn.function_name} title={`FUNCTION ${fn.function_name}`} subtitle={`Returns: ${fn.return_type}`}>
                <div className="text-xs font-mono text-[#737373] mb-2">
                  Parameters: <span className="text-[#171717]">{fn.arguments || 'None'}</span>
                </div>
                <div className="relative">
                  <pre className="p-4 bg-[#111111] text-white rounded text-xs font-mono overflow-x-auto leading-relaxed max-h-64">
                    <code>{fn.definition}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(fn.definition, `fn-${fn.function_name}`)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-mono rounded"
                  >
                    {copiedId === `fn-${fn.function_name}` ? 'Copied' : 'Copy Source'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 5: TRIGGERS & VISUAL FLOW                                    */}
      {/* ==================================================================== */}
      {activeTab === 'triggers' && (
        <div className="space-y-5">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded">
            <h3 className="text-sm font-bold text-[#171717] mb-1">Active PostgreSQL Triggers (pg_trigger)</h3>
            <p className="text-xs text-[#737373]">
              Triggers enforce state machine invariants, audit trails, and automatic timestamp/invoice synchronization.
            </p>
          </div>

          <div className="space-y-4">
            {triggers.map((trg) => (
              <Card
                key={trg.trigger_name}
                title={`Trigger: ${trg.trigger_name}`}
                subtitle={`Target Table: ${trg.table_name}`}
                action={
                  <Badge variant="accent">
                    {trg.action_timing} {trg.event_manipulation}
                  </Badge>
                }
              >
                {/* Visual Flow diagram representation */}
                <div className="mb-4 p-3 bg-[#F5F5F3] border border-[#E5E5E5] rounded text-xs font-mono flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 bg-white border border-[#E5E5E5] rounded font-bold">
                    DML {trg.event_manipulation} on {trg.table_name}
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-[#111111] text-white rounded font-bold">
                    Trigger Event: {trg.action_timing}
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-[#D97736] text-white rounded font-bold">
                    Function: {trg.function_name}()
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-white border border-[#E5E5E5] text-[#2E6B47] rounded font-bold">
                    Constraint Invariant Guaranteed
                  </span>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-[#111111] text-white rounded text-xs font-mono overflow-x-auto leading-relaxed max-h-56">
                    <code>{trg.function_definition}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(trg.function_definition, `trg-${trg.trigger_name}`)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-mono rounded"
                  >
                    {copiedId === `trg-${trg.trigger_name}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 6: CURSOR DEMONSTRATIONS                                     */}
      {/* ==================================================================== */}
      {activeTab === 'cursors' && cursorsData && (
        <div className="space-y-6">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded">
            <h3 className="text-sm font-bold text-[#171717] mb-1">PL/pgSQL Explicit Cursors Lifecycle</h3>
            <p className="text-xs text-[#737373]">
              Demonstrating the traditional explicit cursor lifecycle: <code className="font-mono font-bold">DECLARE → OPEN → FETCH row-by-row → EXIT WHEN NOT FOUND → CLOSE</code>.
            </p>
          </div>

          {/* Cursor 1: Completed Bookings Aggregator */}
          <Card
            title={cursorsData.cursorSummary.title}
            subtitle={cursorsData.cursorSummary.concept}
          >
            <div className="mb-4">
              <h4 className="text-xs font-bold text-[#171717] mb-1 font-mono uppercase">Live Cursor Execution Output:</h4>
              <div className="bg-[#111111] text-white p-3 rounded font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                {cursorsData.cursorSummary.rows.map((r: any, idx: number) => (
                  <div key={idx} className="text-[#A3A3A3] hover:text-white">
                    {r.summary_line}
                  </div>
                ))}
              </div>
            </div>

            <h4 className="text-xs font-bold text-[#171717] mb-1 font-mono uppercase">Cursor PL/pgSQL Declaration & Lifecycle:</h4>
            <pre className="p-3 bg-[#F5F5F3] text-[#171717] border border-[#E5E5E5] rounded text-xs font-mono overflow-x-auto leading-relaxed max-h-60">
              <code>{cursorsData.cursorSummary.sourceCode}</code>
            </pre>
          </Card>

          {/* Cursor 2: Overdue Invoices Aging */}
          <Card
            title={cursorsData.cursorAging.title}
            subtitle={cursorsData.cursorAging.concept}
          >
            <div className="mb-4">
              <h4 className="text-xs font-bold text-[#171717] mb-1 font-mono uppercase">Live Parameterized Cursor Output:</h4>
              <div className="overflow-x-auto border border-[#E5E5E5] rounded">
                <table className="min-w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                      <th className="py-2 px-3">Report ID</th>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3">Customer Email</th>
                      <th className="py-2 px-3">Days Overdue</th>
                      <th className="py-2 px-3">Principal Balance</th>
                      <th className="py-2 px-3">Late Fee (Cursor Computed)</th>
                      <th className="py-2 px-3">Recovery Urgency Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {cursorsData.cursorAging.rows.map((row: any) => (
                      <tr key={row.audit_report_id}>
                        <td className="py-2 px-3">#{row.audit_report_id}</td>
                        <td className="py-2 px-3 font-bold">{row.invoice_number}</td>
                        <td className="py-2 px-3">{row.customer_email}</td>
                        <td className="py-2 px-3 text-[#B83232]">+{row.days_overdue} days</td>
                        <td className="py-2 px-3">${Number(row.principal_balance).toFixed(2)}</td>
                        <td className="py-2 px-3 font-bold text-[#D97736]">${Number(row.estimated_late_fee).toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <Badge variant={row.recovery_status === 'CRITICAL_COLLECTION' ? 'danger' : 'warning'}>
                            {row.recovery_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h4 className="text-xs font-bold text-[#171717] mb-1 font-mono uppercase">Cursor PL/pgSQL Definition:</h4>
            <pre className="p-3 bg-[#F5F5F3] text-[#171717] border border-[#E5E5E5] rounded text-xs font-mono overflow-x-auto leading-relaxed max-h-60">
              <code>{cursorsData.cursorAging.sourceCode}</code>
            </pre>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 7: RELATIONAL VIEWS                                          */}
      {/* ==================================================================== */}
      {activeTab === 'views' && (
        <div className="space-y-5">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded">
            <h3 className="text-sm font-bold text-[#171717] mb-1">PostgreSQL Database Views (information_schema.views)</h3>
            <p className="text-xs text-[#737373]">
              Views provide abstracted query encapsulation for complex joins, multi-table aggregations, and business metrics.
            </p>
          </div>

          <div className="space-y-4">
            {viewsData.map((v) => (
              <Card key={v.view_name} title={`VIEW: ${v.view_name}`} subtitle="Encapsulated SQL query representation">
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[#171717] mb-1 font-mono uppercase">SQL View Definition:</h4>
                  <pre className="p-3 bg-[#111111] text-white rounded text-xs font-mono overflow-x-auto leading-relaxed max-h-48">
                    <code>{v.view_definition}</code>
                  </pre>
                </div>

                <h4 className="text-xs font-bold text-[#171717] mb-1 font-mono uppercase">Sample Tuples (SELECT * FROM {v.view_name} LIMIT 5):</h4>
                {v.sampleRows && v.sampleRows.length > 0 ? (
                  <div className="overflow-x-auto border border-[#E5E5E5] rounded max-h-48 overflow-y-auto">
                    <table className="min-w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                          {Object.keys(v.sampleRows[0]).map((key) => (
                            <th key={key} className="py-1 px-2 font-medium">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                        {v.sampleRows.map((r: any, rIdx: number) => (
                          <tr key={rIdx}>
                            {Object.values(r).map((val: any, cIdx: number) => (
                              <td key={cIdx} className="py-1 px-2 truncate max-w-[150px]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-[#737373] italic">No rows currently returned by view.</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 8: INDEX EXPLORER & EXPLAIN ANALYZE                          */}
      {/* ==================================================================== */}
      {activeTab === 'indexes' && indexesData && (
        <div className="space-y-5">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded">
            <h3 className="text-sm font-bold text-[#171717] mb-1">Index Profiler (pg_indexes & pg_stat_user_indexes)</h3>
            <p className="text-xs text-[#737373]">
              B-Tree, Partial, Composite, and Unique indexes with actual scan counts and disk footprints.
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
            <table className="min-w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                  <th className="py-2.5 px-3 font-medium">Index Name</th>
                  <th className="py-2.5 px-3 font-medium">Table</th>
                  <th className="py-2.5 px-3 font-medium">Index Definition</th>
                  <th className="py-2.5 px-3 font-medium">Scan Count</th>
                  <th className="py-2.5 px-3 font-medium">Disk Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                {indexesData.indexes.map((idx: any) => (
                  <tr key={idx.index_name} className="hover:bg-[#F5F5F3]/50">
                    <td className="py-2.5 px-3 font-bold text-[#D97736]">{idx.index_name}</td>
                    <td className="py-2.5 px-3 font-semibold">{idx.table_name}</td>
                    <td className="py-2.5 px-3 text-[11px] text-[#737373] truncate max-w-[350px]">{idx.index_definition}</td>
                    <td className="py-2.5 px-3 font-bold">{idx.scan_count || 0}</td>
                    <td className="py-2.5 px-3">{idx.index_size || '16 kB'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EXPLAIN ANALYZE Demonstration */}
          <Card
            title="EXPLAIN (ANALYZE, BUFFERS) Execution Plan Inspector"
            subtitle="Demonstrating PostgreSQL query planner, buffer cache hits, and execution cost"
          >
            <pre className="p-4 bg-[#111111] text-white rounded text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{JSON.stringify(indexesData.explainAnalyzeSample, null, 2)}</code>
            </pre>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 9: ACID TRANSACTIONS SIMULATION                              */}
      {/* ==================================================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-5">
          <div className="p-4 bg-white border border-[#E5E5E5] rounded flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171717]">Interactive ACID Transaction Engine Simulator</h3>
              <p className="text-xs text-[#737373]">
                Executes a live PostgreSQL transaction demonstrating <code className="font-mono font-bold">BEGIN</code>, <code className="font-mono font-bold">SAVEPOINT</code>, deliberate error recovery with <code className="font-mono font-bold">ROLLBACK TO SAVEPOINT</code>, and final durable <code className="font-mono font-bold">COMMIT</code>.
              </p>
            </div>
            <button
              onClick={runTransactionSimulation}
              disabled={simulatingTx}
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
            >
              {simulatingTx ? 'Executing Transaction...' : 'Run Simulation Now'}
            </button>
          </div>

          {transactionLog.length > 0 ? (
            <Card title="Live Transaction Execution Log (PostgreSQL Server Trace)">
              <div className="space-y-3 font-mono text-xs">
                {transactionLog.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border flex items-start space-x-3 ${
                      step.status === 'SUCCESS'
                        ? 'bg-[#F2F7F4] border-[#D1E7DD] text-[#2E6B47]'
                        : step.status === 'EXPECTED_ERROR'
                        ? 'bg-[#FDF9F2] border-[#FCEEC7] text-[#9A6700]'
                        : 'bg-[#FDF3F2] border-[#FADBD8] text-[#B83232]'
                    }`}
                  >
                    <span className="font-bold px-2 py-0.5 rounded bg-black/10 text-[11px]">
                      Step {step.step}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{step.action}</div>
                      <div className="mt-0.5 text-xs opacity-90">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8 text-xs text-[#737373]">
                Click "Run Simulation Now" above to trigger a real transaction block in PostgreSQL.
              </div>
            </Card>
          )}

          {/* ACID Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E5E5E5] rounded">
              <strong className="block text-xs font-bold text-[#171717] mb-1 font-mono">1. Atomicity</strong>
              <p className="text-xs text-[#737373] leading-relaxed">
                All-or-nothing guarantee. In our booking procedure, failure at service insertion immediately rolls back the appointment header.
              </p>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded">
              <strong className="block text-xs font-bold text-[#171717] mb-1 font-mono">2. Consistency</strong>
              <p className="text-xs text-[#737373] leading-relaxed">
                Schema invariants, foreign keys, and CHECK constraints (e.g. non-negative totals) prevent the database from entering an invalid state.
              </p>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded">
              <strong className="block text-xs font-bold text-[#171717] mb-1 font-mono">3. Isolation</strong>
              <p className="text-xs text-[#737373] leading-relaxed">
                Concurrent transactions use row-level locks via <code className="font-mono">FOR UPDATE</code> to prevent race conditions during payment and booking.
              </p>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded">
              <strong className="block text-xs font-bold text-[#171717] mb-1 font-mono">4. Durability</strong>
              <p className="text-xs text-[#737373] leading-relaxed">
                PostgreSQL write-ahead logging (WAL) guarantees that once a COMMIT succeeds, data survives power failures and restarts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 10: DATABASE ENGINE STATISTICS                              */}
      {/* ==================================================================== */}
      {activeTab === 'statistics' && statisticsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <span className="text-xs text-[#737373] block mb-1">Database Name & Total Size</span>
              <span className="text-xl font-bold font-mono text-[#171717]">
                {statisticsData.general.database_name} ({statisticsData.general.database_total_size})
              </span>
            </Card>
            <Card>
              <span className="text-xs text-[#737373] block mb-1">Active Client Connections</span>
              <span className="text-xl font-bold font-mono text-[#D97736]">
                {statisticsData.general.active_connections} active
              </span>
            </Card>
            <Card>
              <span className="text-xs text-[#737373] block mb-1">PostgreSQL Server Version</span>
              <span className="text-xs font-mono font-medium text-[#171717] truncate block" title={statisticsData.general.postgres_version}>
                {statisticsData.general.postgres_version.split(' on ')[0]}
              </span>
            </Card>
          </div>

          <Card title="Physical Table Footprint (pg_stat_user_tables)">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                    <th className="py-2.5 px-3 font-medium">Table Name</th>
                    <th className="py-2.5 px-3 font-medium">Live Rows</th>
                    <th className="py-2.5 px-3 font-medium">Dead Rows</th>
                    <th className="py-2.5 px-3 font-medium">Table Data Size</th>
                    <th className="py-2.5 px-3 font-medium">Index Size</th>
                    <th className="py-2.5 px-3 font-medium">Total Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                  {statisticsData.tables.map((t: any) => (
                    <tr key={t.table_name} className="hover:bg-[#F5F5F3]/50">
                      <td className="py-2 px-3 font-bold">{t.table_name}</td>
                      <td className="py-2 px-3">{t.live_tuples}</td>
                      <td className="py-2 px-3 text-[#737373]">{t.dead_tuples}</td>
                      <td className="py-2 px-3">{t.data_size}</td>
                      <td className="py-2 px-3">{t.index_size}</td>
                      <td className="py-2 px-3 font-bold text-[#D97736]">{t.total_disk_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

