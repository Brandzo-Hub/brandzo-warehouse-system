import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase.js';

const WarehouseManager = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState({ code: '', name: '', manager: '' });
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' }); // منطقة الرسائل الجديدة

  useEffect(() => {
    try {
      const q = query(collection(db, "warehouses"), orderBy("code"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setWarehouses(docs);
        setLoading(false);
      }, (err) => {
        setStatusMsg({ type: 'error', text: "خطأ في الاتصال الحي: " + err.message });
      });
      return () => unsubscribe();
    } catch (e) {
      setStatusMsg({ type: 'error', text: "فشل تحميل البيانات: " + e.message });
    }
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: 'info', text: "جاري محاولة الحفظ..." });

    if (!newWarehouse.code || !newWarehouse.name) {
      return setStatusMsg({ type: 'error', text: "يرجى ملء الكود والاسم" });
    }

    try {
      const formData = {
        ...newWarehouse,
        status: "نشط",
        createdAt: new Date()
      };
      
      console.log("Sending data to Firebase:", formData);
      await addDoc(collection(db, "warehouses"), formData);
      
      setStatusMsg({ type: 'success', text: "✅ تم الحفظ في السحابة بنجاح!" });
      setNewWarehouse({ code: '', name: '', manager: '' }); 
      
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: "❌ فشل الحفظ: " + error.message });
    }
  };

  return (
    <div className="p-6 font-['Cairo'] text-right" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-[#1a1a2e]">إدارة المستودعات (Warehouses)</h2>

      {/* منطقة رسائل النظام - ستخبرنا بالحقيقة فوراً */}
      {statusMsg.text && (
        <div className={`mb-4 p-4 rounded-lg font-bold text-center ${
          statusMsg.type === 'success' ? 'bg-green-100 text-green-800' : 
          statusMsg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Add Warehouse Form */}
      <form onSubmit={handleAdd} className="mb-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#c0392b]">
        <h3 className="text-lg font-bold mb-4 text-[#c0392b]">إضافة مستودع جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="كود المستودع"
            className="border p-2 rounded"
            value={newWarehouse.code}
            onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="اسم المستودع"
            className="border p-2 rounded"
            value={newWarehouse.name}
            onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="المدير"
            className="border p-2 rounded"
            value={newWarehouse.manager}
            onChange={(e) => setNewWarehouse({ ...newWarehouse, manager: e.target.value })}
          />
          <button type="submit" className="bg-[#c0392b] text-white px-4 py-2 rounded font-bold">
            إضافة مستودع
          </button>
        </div>
      </form>

      {/* Warehouse List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">الكود</th><th className="p-4">الاسم</th><th className="p-4">المدير</th><th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
            ) : warehouses.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">لا توجد مستودعات مسجلة</td></tr>
            ) : (
              warehouses.map((wh) => (
                <tr key={wh.id} className="border-b">
                  <td className="p-4 font-mono text-[#c0392b] font-bold">{wh.code}</td>
                  <td className="p-4">{wh.name}</td>
                  <td className="p-4">{wh.manager || '—'}</td>
                  <td className="p-4"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">{wh.status}</span></td>
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