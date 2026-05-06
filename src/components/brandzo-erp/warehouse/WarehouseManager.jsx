import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase.js';

const WarehouseManager = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({ code: '', name: '', manager: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "warehouses"), orderBy("code"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setWarehouses(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return alert("يرجى ملء البيانات الأساسية");

    try {
      await addDoc(collection(db, "warehouses"), {
        ...formData,
        status: "نشط",
        createdAt: new Date()
      });

      alert("✅ تم الحفظ في قاعدة البيانات بنجاح!");
      setFormData({ code: '', name: '', manager: '' });

    } catch (error) {
      // التقاط الخطأ وعرضه على الشاشة فوراً
      alert("❌ حدث خطأ يمنع الحفظ: " + error.message);
    }
  };

  return (
    <div className="p-6 font-['Cairo'] text-right" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-[#1a1a2e]">إدارة المستودعات (Warehouses)</h2>

      {/* Add Warehouse Form */}
      <form onSubmit={handleAdd} className="mb-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#c0392b]">
        <h3 className="text-lg font-bold mb-4 text-[#c0392b]">إضافة مستودع جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="كود المستودع (مثلاً WH001)"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#c0392b]"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="اسم المستودع"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#c0392b]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="المدير المسئول"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#c0392b]"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
          />
          <button type="submit" className="bg-[#c0392b] text-white px-4 py-2 rounded font-bold hover:bg-[#8b1a1a] transition-colors shadow">
            إضافة مستودع
          </button>
        </div>
      </form>

      {/* Warehouse List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 font-bold text-gray-700">الكود</th>
              <th className="p-4 font-bold text-gray-700">الاسم</th>
              <th className="p-4 font-bold text-gray-700">المدير</th>
              <th className="p-4 font-bold text-gray-700">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
            ) : warehouses.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">لا توجد مستودعات مسجلة</td></tr>
            ) : (
              warehouses.map((wh) => (
                <tr key={wh.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-[#c0392b] font-bold">{wh.code}</td>
                  <td className="p-4 font-medium">{wh.name}</td>
                  <td className="p-4">{wh.manager || '—'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      wh.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {wh.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseManager;
