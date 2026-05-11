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
      {/* HIDDEN: System Overview */}
      {/*
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
      */}

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg font-bold text-sm bg-red-100 text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      {/* HIDDEN: Inventory Overview */}
      {/*
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
      */}

      {/* What We Offer Section */}
      <section className="mt-10 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-brand-navy via-[#1a1a3e] to-[#0d0d2b] shadow-2xl border border-brand-red/20 p-6 sm:p-10 relative overflow-hidden">
          {/* Glow orbs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              ضبط
              <span className="block text-sm font-normal text-gray-400 mt-1">Brandzo Hub — Quality Gate</span>
            </h2>
            <div className="w-16 h-1 bg-brand-red mx-auto mb-8 rounded-full" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-brand-red/40 transition-all">
                <div className="text-2xl mb-3">📋</div>
                <h3 className="font-bold text-brand-red mb-2">نماذج ذكية إجبارية</h3>
                <p className="text-sm text-gray-300">كل العمليات (إضافة مخزون، صرف، تحويل، ارتجاع، جرد) تمر أولاً عبر نماذجنا الذكية الإجبارية.</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-brand-yellow/40 transition-all">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-bold text-brand-yellow mb-2">تحقق منطقي آلي</h3>
                <p className="text-sm text-gray-300">النظام يتحقق من المنطق التشغيلي (الصلاحيات، الحدود، الكميات، تواريخ الانتهاء 75%، التوصيات التلقائية).</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-green-400/40 transition-all">
                <div className="text-2xl mb-3">✅</div>
                <h3 className="font-bold text-green-400 mb-2">وثيقة نظيفة موثقة</h3>
                <p className="text-sm text-gray-300">في حال المطابقة → يُصدر النظام وثيقة نظيفة وموثقة جاهزة وخالية من أي خطأ لتكون المرجع الوحيد للإدخال في الـ ERP.</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-brand-yellow/20 rounded-xl p-5">
              <h3 className="font-bold text-brand-yellow mb-3 flex items-center gap-2">
                <span>🔒</span> الميزة الحاسمة: تكاملي ومستقل — بوابة حماية للـ ERP
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Brandzo Hub لا يستبدل الـ ERP ولا يرتبط به برمجياً بشكل مباشر، بل يعمل كـ "بوابة عبور" وفلتر جودة صارم يسبقه.
                نعزل أخطاء التشغيل تماماً عن النظام المحاسبي؛ مُدخل البيانات يستلم بيانات دقيقة 100%.
                النظام يحتفظ بسجل تدقيق كامل ومستقل (Audit Trail) لضمان الامتثال.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* لوحة القوانين التشغيلية */}
      <section className="mt-8 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-[#0d0d2b] to-brand-navy shadow-2xl border border-white/10 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              القوانين التشغيلية
              <span className="block text-sm font-normal text-gray-400 mt-1">Operational Compliance Rules</span>
            </h2>
            <div className="w-16 h-1 bg-brand-yellow mx-auto mb-8 rounded-full" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '📌', color: 'text-brand-red', border: 'border-brand-red/30', title: 'إجبارية التوثيق', text: 'منع حركة المخزون نهائياً دون استيفاء كافة الحقول الإجبارية في نماذج الإدخال الذكية. لا حركة بدون توثيق رقمي كامل.' },
                { icon: '⏱️', color: 'text-orange-400', border: 'border-orange-400/30', title: 'عتبة الصلاحية', text: 'الرفض التلقائي عبر النظام لأي شحنة يقل عمرها الافتراضي المتبقي عن 75% عند الاستلام. امتثال صارم لا يقبل التفاوض.' },
                { icon: '🌡️', color: 'text-blue-400', border: 'border-blue-400/30', title: 'نقاط التحكم الحرجة (CCPs)', text: 'التحقق الآلي من درجات الحرارة المدخلة: 4°م للمبرد، -18°م للمجمد. منطق معتمد بمعايير HACCP.' },
                { icon: '🔄', color: 'text-green-400', border: 'border-green-400/30', title: 'أولوية الصرف — FEFO', text: 'توجيه عمليات الصرف آلياً بناءً على تواريخ الانتهاء الأقرب. تطبيق إلزامي لنظام FEFO — لا يمكن تجاوزه.' },
                { icon: '📊', color: 'text-purple-400', border: 'border-purple-400/30', title: 'دقة البيانات — ABC', text: 'توجيه مهام الجرد الدوري الذكي عبر تصنيف ABC لضمان تطابق الأرصدة. الهدف: دقة مخزون 98.5% فأكثر.' },
                { icon: '⚡', color: 'text-brand-yellow', border: 'border-brand-yellow/30', title: 'زمن الاستجابة', text: 'تسريع الدورة المستندية عبر أتمتة النماذج وتقليل وقت التدقيق اليدوي. وقت دورة تشغيلية يقل عن 4 ساعات.' },
              ].map((rule, i) => (
                <div key={i} className={`bg-white/5 backdrop-blur border ${rule.border} rounded-xl p-5 hover:bg-white/10 transition-all`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{rule.icon}</span>
                    <div>
                      <h3 className={`font-bold ${rule.color} mb-1`}>{rule.title}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">{rule.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section A: هيكل النظام والمسارات */}
      <section className="mt-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">
              هيكل النظام والمسارات
              <span className="block text-sm font-normal text-gray-400 mt-1">System Architecture & Routes</span>
            </h2>
            <button
              onClick={() => window.print()}
              className="bg-brand-red text-white rounded-xl font-bold px-4 py-2 hover:bg-brand-red-dark transition-colors"
            >
              طباعة
            </button>
          </div>

          {/* Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-brand-navy mb-3">طبقة الإدخال</h3>
              <p className="text-gray-600 text-sm">استقبال البيانات من المستخدمين والتحقق الأولي من المدخلات</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-brand-navy mb-3">طبقة التحقق</h3>
              <p className="text-gray-600 text-sm">التحقق من المنطق التشغيلي والقواعد والصلاحيات</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-brand-navy mb-3">طبقة الإخراج</h3>
              <p className="text-gray-600 text-sm">إصدار وثائق نظيفة وموثقة جاهزة للـ ERP</p>
            </div>
          </div>

          {/* Routes Table */}
          <h3 className="font-bold text-brand-navy mb-4 text-lg">مسارات النظام</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-right font-bold">المسار</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-bold">الرابط</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-bold">الوظيفة</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">الصفحة الرئيسية</td>
                  <td className="border border-gray-300 px-4 py-2">/</td>
                  <td className="border border-gray-300 px-4 py-2">بوابة الدخول — المقترح الشامل للإدارة</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">لوحة التحكم</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/</td>
                  <td className="border border-gray-300 px-4 py-2">نظرة عامة — قوانين تشغيلية — KPIs</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">مكتبة النماذج</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/forms</td>
                  <td className="border border-gray-300 px-4 py-2">21 نموذج تشغيلي قابل للطباعة</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">إدارة الأصناف</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/products</td>
                  <td className="border border-gray-300 px-4 py-2">بيانات الصنف الرئيسية — Item Master</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">المستودعات</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/warehouses</td>
                  <td className="border border-gray-300 px-4 py-2">إدارة مواقع التخزين</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">استلام البضاعة</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/grn</td>
                  <td className="border border-gray-300 px-4 py-2">دورة GRN — استلام وتوثيق الشحنات</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">إدارة المهام</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/tasks</td>
                  <td className="border border-gray-300 px-4 py-2">توزيع المهام اليومية وتتبعها</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">التدفق الوثائقي</td>
                  <td className="border border-gray-300 px-4 py-2">/dashboard/workflows</td>
                  <td className="border border-gray-300 px-4 py-2">خريطة الدورة المستندية — Document Flow</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">✅ مفعّل</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">الدليل التشغيلي</td>
                  <td className="border border-gray-300 px-4 py-2">/Brandzo_Operational_Guide.html</td>
                  <td className="border border-gray-300 px-4 py-2">المرجع الكامل — 11+ بابًا تشغيليًا</td>
                  <td className="border border-gray-300 px-4 py-2 text-red-600 font-bold">🔒 محمي بكلمة سر</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Document Cycle */}
          <h3 className="font-bold text-brand-navy mb-4 text-lg">الدورة المستندية (12 خطوة)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <ol className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">1.</span>
                <span>طلب شراء داخلي (PR) — طلب رسمي داخلي قبل أمر الشراء</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">2.</span>
                <span>أمر الشراء (PO) — لا استلام بدون PO مسبق</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">3.</span>
                <span>إشعار استلام البضاعة (GRN) — توثيق الشحنة وربطها بالـ PO</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">4.</span>
                <span>تقرير فحص الجودة (QC) — فحص العمر الافتراضي 75%، درجات الحرارة، HACCP</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">5.</span>
                <span>أمر التخزين (Putaway) — توجيه الأصناف لمواقع التخزين وفق FEFO</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">6.</span>
                <span>بطاقة مراقبة المخزون (Bin Card) — تسجيل حركة الصنف داخل الموقع</span>
              </li>
            </ol>
            <ol className="space-y-2 text-sm" start="7">
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">7.</span>
                <span>طلب صرف من المخزن (SR) — طلب رسمي يُفعّل عملية السحب</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">8.</span>
                <span>قائمة السحب (Picking) — توجيه عمال المستودع وفق FEFO</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">9.</span>
                <span>إذن التسليم (DN) + قائمة التعبئة — إثبات التسليم مع توقيع المستلم</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">10.</span>
                <span>تصريح الخروج (Gate Pass) — توثيق خروج المركبات عبر بوابة الأمن</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">11.</span>
                <span>الجرد الدوري (Cycle Count) — مطابقة الرصيد الفعلي مع الدفتري، هدف 98.5%+</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand-red ml-2">12.</span>
                <span>سند تسوية (SAV) — تصحيح الفروقات برمز سبب موثق مع اعتماد المشرف</span>
              </li>
            </ol>
          </div>

          {/* Golden Rules */}
          <h3 className="font-bold text-brand-navy mb-4 text-lg">القواعد الذهبية (8 قواعد)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>لا حركة مخزنية بدون مستند موثق إلزامياً</span>
              </div>
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>لا استلام بدون أمر شراء (PO) مسبق</span>
              </div>
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>لا صرف بدون طلب صرف معتمد (SR)</span>
              </div>
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>الرفض التلقائي لأي شحنة عمرها الافتراضي أقل من 75%</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>التطبيق الإلزامي لـ FEFO في جميع عمليات الصرف</span>
              </div>
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>التحقق من CCPs: 4°م للمبرد، 18°م- للمجمد (HACCP)</span>
              </div>
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>دقة مخزون مستهدفة: 98.5% أو أكثر</span>
              </div>
              <div className="flex items-start">
                <span className="text-brand-red font-bold ml-2">•</span>
                <span>وقت دورة تشغيلية: أقل من 4 ساعات</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
            Brandzo Hub © 2026 — إعداد: محمد إبراهيم البرشي — جميع الحقوق محفوظة
          </div>
        </div>
      </section>

      {/* Section B: نظام ERP المقترح — SAP */}
      <section className="mt-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border-t-4 border-[#0056b3] p-6 sm:p-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">
              نظام ERP المقترح — SAP
              <span className="block text-sm font-normal text-gray-400 mt-1">Proposed ERP System — SAP</span>
            </h2>
            <button
              onClick={() => window.print()}
              className="bg-brand-red text-white rounded-xl font-bold px-4 py-2 hover:bg-brand-red-dark transition-colors"
            >
              طباعة
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">التقرير الفني: مبررات اعتماد نظام SAP كمنظومة ERP شاملة</h3>
            <p className="text-sm text-gray-600 mb-2"><strong>الإعداد:</strong> محمد إبراهيم البرشي (المدير التقني) — موجه إلى: الإدارة التنفيذية (CEO)</p>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-bold mb-2">1. المقدمة والتحليل</h4>
              <p>بناءً على التحليل الشامل للعمليات الحالية ومتطلبات التوسع المستقبلية، يوصي هذا التقرير باعتماد نظام SAP كمنظومة ERP متكاملة لشركة Brandzo Franchise Partners.</p>
            </div>

            <div>
              <h4 className="font-bold mb-2">2. المواءمة مع العمليات الحالية</h4>
              <p>نظام SAP يوفر توافقًا كاملاً مع الإجراءات التشغيلية المطبقة حاليًا، مع إمكانية تخصيص وحدات الأعمال (Business Modules) حسب احتياجات كل قسم.</p>
            </div>

            <div>
              <h4 className="font-bold mb-2">3. الميزات التقنية</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>قاعدة بيانات مركزية متكاملة</li>
                <li>نظام تقارير متقدم وتحليل بيانات</li>
                <li>إدارة سلسلة الإمداد الكاملة (SCM)</li>
                <li>التكامل مع أنظمة الجهات الخارجية</li>
                <li>دعم متعدد اللغات والعملات</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-2">4. الجدول الزمني للتنفيذ</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>المرحلة الأولى: التحليل وتصميم العمليات (3 أشهر)</li>
                <li>المرحلة الثانية: تركيب النظام وإعداد البنية التحتية (4 أشهر)</li>
                <li>المرحلة الثالثة: تدريب المستخدمين وانتقال البيانات (2 أشهر)</li>
                <li>المرحلة الرابعة: التشغيل الكامل والدعم الفني (مستمر)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-2">5. التكلفة والعائد على الاستثمار</h4>
              <p>التكلفة الإجمالية المتوقعة للتنفيذ تشمل تراخيص البرمجيات، خدمات الاستشارة، التدريب، والبنية التحتية التقنية. العائد المتوقع على الاستثمار يتحقق خلال 18-24 شهرًا من خلال:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>تحسين كفاءة العمليات بنسبة 35%</li>
                <li>تقليل الأخطاء البشرية بنسبة 60%</li>
                <li>تسريع وقت اتخاذ القرار بنسبة 45%</li>
                <li>تحسين دقة البيانات المالية والتشغيلية</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-2">6. مخاطر التنفيذ وتوصيات التخفيف</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>مقاومة التغيير من الموظفين — التوصية: برنامج تدريب شامل وتواصل مستمر</li>
                <li>تحديات نقل البيانات — التوصية: استخدام فرق عمل متخصصة وأدوات التحقق من صحة البيانات</li>
                <li>التكامل مع الأنظمة الحالية — التوصية: تخطيط دقيق لواجهات البرمجيات والتكامل</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-2">7. الخلاصة والتوصيات النهائية</h4>
              <p>يعتبر نظام SAP الخيار الأمثل لشركة Brandzo Franchise Partners نظرًا لقدراته المتقدمة وموثوقيته في السوق. يوصى بالبدء الفوري في عملية التنفيذ مع التركيز على التخطيط الدقيق وإدارة التغيير لضمان نجاح المشروع.</p>
            </div>
          </div>

          {/* Contact Box */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
            <h4 className="font-bold mb-4">بيانات التواصل</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>الهاتف:</strong> +966 50 123 4567</p>
                <p><strong>الجوال:</strong> +966 55 987 6543</p>
                <p><strong>البريد الإلكتروني:</strong> mohammed.albarshi@brandzo.com</p>
              </div>
              <div>
                <p><strong>العنوان:</strong> الرياض، المملكة العربية السعودية</p>
                <p><strong>الموقع:</strong> www.brandzo.com</p>
                <p><strong>الفرع:</strong> بنغازي، ليبيا</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
            Brandzo Hub © 2026 — إعداد: محمد إبراهيم البرشي — جميع الحقوق محفوظة
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrandzoDashboard;
