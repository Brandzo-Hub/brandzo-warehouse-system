import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWhqQVdhODZT0bdXnbyYzcmpnv11s9qoU",
    authDomain: "brandzo-erp-2026.firebaseapp.com",
      projectId: "brandzo-erp-2026",
        storageBucket: "brandzo-erp-2026.firebasestorage.app",
          messagingSenderId: "991460523040",
            appId: "1:991460523040:web:d3c6f76b1ff13a1ab8d045"
            };

            // 1. تأكد من تهيئة التطبيق مرة واحدة فقط
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

            // 2. تأكد من تهيئة قاعدة البيانات مرة واحدة فقط مع وضع الاتصال المستقر
            let db;
            if (getApps().length > 0) {
                try {
                        db = initializeFirestore(app, {
                                    experimentalForceLongPolling: true, // ضروري جداً لبيئة Codespaces
                                            });
                                                } catch (e) {
                                                        // إذا كان تم تهيئتها مسبقاً، استخدم النسخة الموجودة
                                                                db = getFirestore(app);
                                                                    }
                                                                    } else {
                                                                        db = getFirestore(app);
                                                                        }

                                                                        export { db };