import React from 'react';
import { Items_Master, Inbound_Log } from '../../data/brandzoSchema';

const BrandzoDashboard = () => {
  const totalItems = Items_Master.length;
  const lowStockAlerts = Items_Master.filter(item => item.status === 'منخفض' || item.balance <= item.minStock).length;
  const totalInbound = Inbound_Log.reduce((acc, curr) => acc + curr.qty, 0);
  const totalOutbound = Items_Master.reduce((acc, curr) => acc + curr.outbound, 0);

  return (
    <div className="text-right" dir="rtl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a2e]">نظرة عامة على النظام</h1>
          <p className="text-gray-500 mt-1">مؤشرات الأداء الرئيسية وحالة المخزون</p>
        </div>
        <button
          className="rounded-xl bg-[#c0392b] px-6 py-3 font-bold text-white transition-all hover:bg-[#8b1a1a] shadow-md hover:shadow-lg active:scale-95"
          onClick={() => alert('Barcode scanner coming soon!')}
        >
          فتح الماسح الضوئي (Barcode)
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Items Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-[#c0392b]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>
            </div>
            <span className="text-xs font-bold text-gray-400">Total Items</span>
          </div>
          <div className="text-sm font-medium text-gray-500">إجمالي الأصناف</div>
          <div className="mt-1 text-3xl font-bold text-[#c0392b]">{totalItems}</div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg text-[#e8b830]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span className="text-xs font-bold text-gray-400">Low Stock</span>
          </div>
          <div className="text-sm font-medium text-gray-500">تنبيهات نقص المخزون</div>
          <div className="mt-1 text-3xl font-bold text-[#e8b830]">{lowStockAlerts}</div>
        </div>

        {/* Total Inbound Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <span className="text-xs font-bold text-gray-400">Total Inbound</span>
          </div>
          <div className="text-sm font-medium text-gray-500">إجمالي الوارد</div>
          <div className="mt-1 text-3xl font-bold text-green-600">{totalInbound}</div>
        </div>

        {/* Total Outbound Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <span className="text-xs font-bold text-gray-400">Total Outbound</span>
          </div>
          <div className="text-sm font-medium text-gray-500">إجمالي الصادر</div>
          <div className="mt-1 text-3xl font-bold text-blue-600">{totalOutbound}</div>
        </div>
      </div>

      <main className="mt-10">
        <section className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1a1a2e]">نظرة عامة على المخزون</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">تحديث تلقائي</span>
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
                    <td className="px-6 py-4 font-mono text-[#c0392b] font-bold">{item.sku}</td>
                    <td className="px-6 py-4 font-medium">{item.names.ar}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4 font-bold text-lg">{item.balance}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.status === 'متاح' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
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
