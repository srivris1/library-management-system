import { Router } from 'express';
import { exportCSV, exportExcel } from '../controllers/reportController.js';

const router = Router();

// GET /api/reports/export/csv
router.get('/export/csv', exportCSV);

// GET /api/reports/export/excel
router.get('/export/excel', exportExcel);

export default router;
