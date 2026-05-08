import React, { useEffect, useMemo, useState } from 'react';
import { subscribeItems } from '../../services/itemService.js';
import { subscribeWarehouses } from '../../services/warehouseService.js';
import {
  subscribeInboundLog,
  subscribeOutboundLog,
  sumQuantities,
} from '../../services/logService.js';
import Icon from '../ui/Icon.jsx';

/**
 * Single KPI card. The `onClick` prop is optional — when provided, the
 * card behaves like a button (focusable, keyboard-activatable).
 */
function KpiCard({
  icon,
  badgeClass,
  valueClass,
  labelEn,
  labelAr,
  value,
  loading,
  active,
  onClick,
  neonColor,
}) {
  const isInteractive = typeof onClick === 'function';
  const Comp = isInteractive ? 'button' : 'div';

  const neonStyles = {
    red: 'hover:shadow-[0_0_20px_rgba(192,57,43,0.3)] border-brand-red/20',
    gold: 'hover:shadow-[0_0_20px_rgba(232,184,48,0.3)] border-brand-gold/20',
    blue: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-200',
    green: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] border-green-200',
    indigo: 'hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] border-indigo-200',
  };

  return (
    <Comp
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={isInteractive ? Boolean(active) : undefined}
      className={[
        'rounded-xl border p-6 text-right transition-all backdrop-blur-md bg-white/80',
        neonStyles[neonColor] || 'border-gray-200 shadow-sm',
        isInteractive
          ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-red'
          : '',
        active ? 'border-brand-red ring-2 ring-brand-red shadow-lg scale-[1.02]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${badgeClass}`}>
          <Icon name={icon} />
        </div>
        <span className="text-xs font-bold text-gray-400">{labelEn}</span>
      </div>
      <div className="text-sm font-medium text-gray-500">{labelAr}</div>
      <div className={`mt-1 text-3xl font-bold ${valueClass}`}>
        {loading ? (
          <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
    </Comp>
  );
}

/**
 * Status pill for the inventory table. Computed from `balance` vs
 * `minStock` so it stays in sync with live data even when items are
 * created/edited from `/dashboard/products`.
 */
function StatusPill({ balance, minStock }) {
  const low = (Number(balance) || 0) <= (Number(minStock) || 0);
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        low ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
      }`}
    >
      {low ? 'منخفض' : 'متاح'}
    </span>
  );
}

/**
 * Empty-state row for the inventory table.
 */
function EmptyRow({ message }) {
  return (
    <tr>
      <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">
        {message}
      </td>
    </tr>
  );
}

const BrandzoDashboard = () => {
  // ── Firestore subscriptions ─────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inbound, setInbound] = useState([]);
  const [outbound, setOutbound] = useState([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingInbound, setLoadingInbound] = useState(true);
  const [loadingOutbound, setLoadingOutbound] = useState(true);

  const [error, setError] = useState('');

  const [showLowOnly, setShowLowOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubItems = subscribeItems(
      (next) => {
        setItems(next);
        setLoadingItems(false);
      },
      (err) => {
        setError(err?.message ?? 'تعذر الاتصال بقاعدة البيانات');
        setLoadingItems(false);
      }
    );
    const unsubWarehouses = subscribeWarehouses(
      (next) => {
        setWarehouses(next);
        setLoadingWarehouses(false);
      },
      (err) => {
        setError(err?.message ?? 'تعذر الاتصال بقاعدة البيانات');
        setLoadingWarehouses(false);
      }
    );
    const unsubInbound = subscribeInboundLog(
      (next) => {
        setInbound(next);
        setLoadingInbound(false);
      },
      (err) => {
        // Inbound_Log may not exist yet on a fresh project — treat as empty.
        if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
          setError(err.message);
        }
        setLoadingInbound(false);
      }
    );
    const unsubOutbound = subscribeOutboundLog(
      (next) => {
        setOutbound(next);
        setLoadingOutbound(false);
      },
      () => {
        setLoadingOutbound(false);
      }
    );
    return () => {
      unsubItems();
      unsubWarehouses();
      unsubInbound();
      unsubOutbound();
    };
  }, []);

  // ── Derived KPIs ────────────────────────────────────────────────────
  const totalItems = items.length;
  const totalWarehouses = warehouses.length;
  const lowStockCount = useMemo(
    () => items.filter((it) => (Number(it.balance) || 0) <= (Number(it.minStock) || 0)).length,
    [items]
  );
  const totalInboundQty = useMemo(() => sumQuantities(inbound), [inbound]);
  const totalOutboundQty = useMemo(() => sumQuantities(outbound), [outbound]);

  const visibleItems = useMemo(() => {
    let filtered = items;
    if (showLowOnly) {
      filtered = filtered.filter((it) => (Number(it.balance) || 0) <= (Number(it.minStock) || 0));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (it) =>
          it.sku?.toLowerCase().includes(term) ||
          it.nameAr?.toLowerCase().includes(term) ||
          it.nameEn?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [items, showLowOnly, searchTerm]);

  const tableLoading = loadingItems;
  const tableEmpty = !tableLoading && visibleItems.length === 0;

  return (
    <div className="text-right" dir="rtl">
      <header className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy text-center md:text-right">نظرة عامة على النظام</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base text-center md:text-right">
            مؤشرات الأداء الرئيسية وحالة المخزون — تحديث لحظي عبر Firestore
          </p>
        </div>
        <a
          href={`${import.meta.env.BASE_URL ?? '/'}forms/`.replace(/\/{2,}/g, '/')}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 sm:px-6 font-bold text-white transition-all hover:bg-brand-red-dark shadow-md hover:shadow-lg active:scale-95"
        >
          <Icon name="fileUp" size={18} />
          النماذج التشغيلية
        </a>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg font-bold text-sm bg-red-100 text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          icon="package"
          badgeClass="bg-red-50 text-brand-red"
          valueClass="text-brand-red"
          labelEn="Total Items"
          labelAr="إجمالي الأصناف"
          value={totalItems}
          loading={loadingItems}
          neonColor="red"
        />
        <KpiCard
          icon="warehouse"
          badgeClass="bg-indigo-50 text-indigo-600"
          valueClass="text-indigo-600"
          labelEn="Warehouses"
          labelAr="المستودعات"
          value={totalWarehouses}
          loading={loadingWarehouses}
          neonColor="indigo"
        />
        <KpiCard
          icon="alertTriangle"
          badgeClass="bg-yellow-50 text-brand-yellow"
          valueClass="text-brand-yellow"
          labelEn="Low Stock"
          labelAr="تنبيهات نقص المخزون"
          value={lowStockCount}
          loading={loadingItems}
          active={showLowOnly}
          onClick={() => setShowLowOnly((prev) => !prev)}
          neonColor="gold"
        />
        <KpiCard
          icon="arrowDownTray"
          badgeClass="bg-green-50 text-green-600"
          valueClass="text-green-600"
          labelEn="Total Inbound"
          labelAr="إجمالي الوارد"
          value={totalInboundQty}
          loading={loadingInbound}
          neonColor="green"
        />
        <KpiCard
          icon="arrowUpTray"
          badgeClass="bg-blue-50 text-blue-600"
          valueClass="text-blue-600"
          labelEn="Total Outbound"
          labelAr="إجمالي الصادر"
          value={totalOutboundQty}
          loading={loadingOutbound}
          neonColor="blue"
        />
      </div>

      <main className="mt-10">
        <section className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 w-full">
              <h2 className="text-lg sm:text-xl font-bold text-brand-navy text-center md:text-right">
                نظرة عامة على المخزون
              </h2>
              <div className="mt-3 relative w-full md:max-w-md">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <Icon name="search" size={16} />
                </span>
                <input
                  type="text"
                  placeholder="البحث عبر SKU أو اسم الصنف..."
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-brand-red focus:border-brand-red text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {showLowOnly && (
                <p className="text-xs text-yellow-700 mt-2 font-semibold">
                  عرض الأصناف ذات المخزون المنخفض فقط
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showLowOnly && (
                <button
                  type="button"
                  onClick={() => setShowLowOnly(false)}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                >
                  عرض الكل
                </button>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                تحديث لحظي
              </span>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">SKU</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold">الاسم (AR)</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold hidden sm:table-cell">
                    الفئة
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">الرصيد</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableLoading && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <tr key={`skel-${i}`}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="px-4 sm:px-6 py-4">
                            <span className="block h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
                {!tableLoading && tableEmpty && (
                  <EmptyRow
                    message={
                      showLowOnly
                        ? 'لا توجد أصناف منخفضة المخزون حالياً.'
                        : 'لا توجد أصناف بعد. ابدأ بإضافة صنف من شاشة "إدارة الأصناف".'
                    }
                  />
                )}
                {!tableLoading &&
                  visibleItems.map((item) => (
                    <tr key={item.sku} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-brand-red font-bold whitespace-nowrap">
                        {item.sku}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium">
                        {item.nameAr || item.nameEn || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        {item.category || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-lg whitespace-nowrap">
                        {Number(item.balance) || 0}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        <StatusPill balance={item.balance} minStock={item.minStock} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BrandzoDashboard;
