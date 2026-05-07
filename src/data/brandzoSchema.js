/**
 * Brandzo ERP Data Schema Mockup - Phase 1
 * Core Tables: Items_Master, Inbound_Log
 */

export const Items_Master = [
  {
    sku: 'ITM-001',
    names: { ar: 'صنف تجريبي 1', en: 'Sample Item 1' },
    category: 'إلكترونيات',
    unit: 'قطعة',
    minStock: 10,
    defaultLocation: 'LOC-A1',
    branch: 'WH001',
    inbound: 50,
    outbound: 20,
    balance: 30,
    status: 'متاح',
  },
  {
    sku: 'ITM-002',
    names: { ar: 'صنف تجريبي 2', en: 'Sample Item 2' },
    category: 'أثاث ومفروشات',
    unit: 'قطعة',
    minStock: 5,
    defaultLocation: 'LOC-B2',
    branch: 'WH001',
    inbound: 10,
    outbound: 8,
    balance: 2,
    status: 'منخفض',
  },
];

export const Inbound_Log = [
  {
    grnNumber: 'GRN-001',
    date: '2024-05-20',
    itemCode: 'ITM-001',
    itemName: 'Sample Item 1',
    qty: 50,
    location: 'LOC-A1',
    supplierCode: 'SUP001',
    supplierName: 'دار الغذاء',
    invoiceNo: 'INV-1001',
    batch: 'B-2024-001',
    expiryDate: '2025-05-20',
    poReference: 'PO-001',
    branch: 'WH001',
    notes: 'الشحنة الأولى',
  },
];

export const brandzoSchema = {
  Items_Master,
  Inbound_Log,
};

export default brandzoSchema;
