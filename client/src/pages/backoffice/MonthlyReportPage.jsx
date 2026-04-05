import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Sparkles, Printer, ChevronDown, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Simple Markdown renderer (no external library needed)
// Handles: # h1-3, **bold**, - list, blank-line paragraphs
// ---------------------------------------------------------------------------
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-3 ml-4 text-gray-700">
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const renderInline = (str) =>
    str
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (/^### /.test(line)) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-base font-bold text-gray-800 mt-5 mb-1">
          {line.slice(4)}
        </h3>
      );
      continue;
    }
    if (/^## /.test(line)) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-gray-900 mt-6 mb-2 border-b border-gray-200 pb-1">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (/^# /.test(line)) {
      flushList();
      elements.push(
        <h1 key={key++} className="text-2xl font-bold text-gray-900 mt-2 mb-4">
          {line.slice(2)}
        </h1>
      );
      continue;
    }

    // List items
    if (/^[-*] /.test(line)) {
      listBuffer.push(line.slice(2));
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={key++} className="my-2" />);
      continue;
    }

    // Numbered list (1. 2. ...)
    if (/^\d+\. /.test(line)) {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-gray-700 my-1 ml-4"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      );
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p
        key={key++}
        className="text-gray-700 my-1 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderInline(line) }}
      />
    );
  }
  flushList();
  return <div className="markdown-body">{elements}</div>;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_OPTIONS = [
  { value: 1,  label: 'มกราคม' },
  { value: 2,  label: 'กุมภาพันธ์' },
  { value: 3,  label: 'มีนาคม' },
  { value: 4,  label: 'เมษายน' },
  { value: 5,  label: 'พฤษภาคม' },
  { value: 6,  label: 'มิถุนายน' },
  { value: 7,  label: 'กรกฎาคม' },
  { value: 8,  label: 'สิงหาคม' },
  { value: 9,  label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' },
];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export function MonthlyReportPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [previewData, setPreviewData] = useState(null);   // incident list
  const [previewLoading, setPreviewLoading] = useState(false);

  const [summary, setSummary] = useState(null);           // generated markdown
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [cachedExists, setCachedExists] = useState(null); // true/false/null

  // ── Check if cached summary exists whenever year/month changes ──────────
  useEffect(() => {
    setCachedExists(null);
    setSummary(null);
    setPreviewData(null);
    setError('');

    api.get(`/api/reports/monthly-summary?year=${selectedYear}&month=${selectedMonth}`)
      .then((data) => {
        setCachedExists(true);
        if (data?.summary_markdown) setSummary(data.summary_markdown);
      })
      .catch(() => setCachedExists(false));
  }, [selectedYear, selectedMonth]);

  // ── Load incident preview ────────────────────────────────────────────────
  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      setPreviewData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // ── Generate / Regenerate ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSummary(null);
    try {
      const data = await api.post('/api/reports/monthly-summary', {
        year: selectedYear,
        month: selectedMonth,
      });
      setSummary(data.summary_markdown);
      setCachedExists(true);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setGenerating(false);
    }
  };

  // ── Print / Export PDF ────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? '';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* ── Print stylesheet ─────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #monthly-report-print-area,
          #monthly-report-print-area * { visibility: visible; }
          #monthly-report-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 32px;
          }
        }
      `}</style>

      {/* ── Page Header ──────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-100 p-2.5 rounded-xl">
          <FileText size={22} className="text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานสรุปรายเดือน</h1>
          <p className="text-sm text-gray-500 mt-0.5">สร้างรายงานสรุป Incident Report ด้วย AI อัตโนมัติ</p>
        </div>
      </div>

      {/* ── Form Card ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">เลือกช่วงเวลา</h2>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Month selector */}
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-xs font-medium text-gray-600">เดือน</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-9 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Year selector */}
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <label className="text-xs font-medium text-gray-600">ปี (ค.ศ.)</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-9 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Preview incidents button */}
          <button
            onClick={loadPreview}
            disabled={previewLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {previewLoading
              ? <Loader2 size={15} className="animate-spin" />
              : <FileText size={15} />}
            ดูข้อมูลเหตุการณ์
          </button>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
          >
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> กำลังสร้าง...</>
              : <><Sparkles size={15} />{cachedExists ? 'สร้างใหม่' : 'สร้างรายงาน'}</>}
          </button>
        </div>

        {/* Cached indicator */}
        {cachedExists === true && !summary && (
          <p className="mt-3 text-xs text-emerald-600 flex items-center gap-1.5">
            <RefreshCw size={12} />
            มีรายงานสรุปที่เคยสร้างไว้แล้วสำหรับเดือนนี้ — กด "ดูผลลัพธ์" ด้านบนหรือ "สร้างใหม่" เพื่ออัปเดต
          </p>
        )}
      </div>

      {/* ── Error ────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Preview: Incident List ────────────────── */}
      {previewData && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            ข้อมูลเหตุการณ์เดือน{monthLabel} {selectedYear}
            <span className="ml-2 text-sm font-normal text-gray-500">({previewData.count} รายการ)</span>
          </h2>

          {previewData.count === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">ไม่มีรายงานเหตุการณ์ในเดือนนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 pr-4 font-medium">วันที่</th>
                    <th className="pb-2 pr-4 font-medium">ชื่อเหตุการณ์</th>
                    <th className="pb-2 pr-4 font-medium">ประเภท</th>
                    <th className="pb-2 font-medium">พื้นที่</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.reports.map((r) => (
                    <tr key={r.incident_id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                        {r.created_at?.slice(0, 10) ?? '-'}
                      </td>
                      <td className="py-2 pr-4 text-gray-800">{r.incident_title}</td>
                      <td className="py-2 pr-4 text-gray-600">{r.incident_type || '-'}</td>
                      <td className="py-2 text-gray-600">{r.location_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Summary Result ─────────────────────────── */}
      {(summary || generating) && (
        <div id="monthly-report-print-area" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {/* Result header */}
          <div className="flex items-center justify-between mb-5 print:hidden">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-800">
                ผลลัพธ์: สรุปรายงานเดือน{monthLabel} {selectedYear}
              </h2>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer size={14} />
              Export PDF
            </button>
          </div>

          {/* Print header (visible only on print) */}
          <div className="hidden print:block mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              รายงานสรุปเดือน{monthLabel} {selectedYear}
            </h1>
            <p className="text-sm text-gray-500 mt-1">สร้างโดย Forest Shield — Forest Ranger Management System</p>
            <hr className="mt-3" />
          </div>

          {generating ? (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin text-emerald-500" />
              <p className="text-sm">AI กำลังวิเคราะห์และสรุปข้อมูล...</p>
            </div>
          ) : (
            <div className="prose-like">
              <MarkdownRenderer text={summary} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
