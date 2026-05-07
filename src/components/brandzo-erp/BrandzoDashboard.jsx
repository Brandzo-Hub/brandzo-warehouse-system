import React from 'react';
import { Items_Master, Inbound_Log } from '../../data/brandzoSchema';
import Icon from '../ui/Icon.jsx';

/**
 * Static KPI card. Picks the icon and accent colour by name so the four
 * cards on the dashboard share the same markup.
 */
function KpiCard({ icon, badgeClass, valueClass, labelEn, labelAr, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${badgeClass}`}>
          <Icon name={icon} />
        </div>
        <span className="text-xs font-bold text-gray-400">{labelEn}</span>
      </div>
      <div className="text-sm font-medium text-gray-500">{labelAr}</div>
      <div className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

const BrandzoDashboard = () => {
  const totalItems = Items_Master.length;
  const lowStockAlerts = Items_Master.filter(
    (item) => item.status === 'منخفض' || item.balance <= item.minStock
  ).length;
  const totalInbound = Inbound_Log.reduce((acc, curr) => acc + curr.qty, 0);
  const totalOutbound = Items_Master.reduce((acc, curr) => acc + curr.outbound, 0);

  return (
    <div className="text-right" dir="rtl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">نظرة عامة على النظام</h1>
          <p className="text-gray-500 mt-1">مؤشرات الأداء الرئيسية وحالة المخزون</p>
        </div>
        <button
          className="rounded-xl bg-brand-red px-6 py-3 font-bold text-white transition-all hover:bg-brand-red-dark shadow-md hover:shadow-lg active:scale-95"
          onClick={() => alert('Barcode scanner coming soon!')}
        >
          فتح الماسح الضوئي (Barcode)
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="package"
          badgeClass="bg-red-50 text-brand-red"
          valueClass="text-brand-red"
          labelEn="Total Items"
          labelAr="إجمالي الأصناف"
          value={totalItems}
        />
        <KpiCard
          icon="alertTriangle"
          badgeClass="bg-yellow-50 text-brand-yellow"
          valueClass="text-brand-yellow"
          labelEn="Low Stock"
          labelAr="تنبيهات نقص المخزون"
          value={lowStockAlerts}
        />
        <KpiCard
          icon="arrowDownTray"
          badgeClass="bg-green-50 text-green-600"
          valueClass="text-green-600"
          labelEn="Total Inbound"
          labelAr="إجمالي الوارد"
          value={totalInbound}
        />
        <KpiCard
          icon="arrowUpTray"
          badgeClass="bg-blue-50 text-blue-600"
          valueClass="text-blue-600"
          labelEn="Total Outbound"
          labelAr="إجمالي الصادر"
          value={totalOutbound}
        />
      </div>

      <main className="mt-10">
        <section className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-navy">نظرة عامة على المخزون</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
              تحديث تلقائي
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-bold">SKU</th>
                  <th className="px-6 py-4 font-bold">الاسم (AR)</th>
                  <th className="px-6 py-4 font-bold">الفئة</th>
                  <th className="px-6 py-4 font-bold">الرصيد</th>
                  <th className="px-6 py-4 font-bold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Items_Master.map((item) => (
                  <tr key={item.sku} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-brand-red font-bold">{item.sku}</td>
                    <td className="px-6 py-4 font-medium">{item.names.ar}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4 font-bold text-lg">{item.balance}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.status === 'متاح'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status}
                      </span>
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
