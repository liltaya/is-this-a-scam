import { Piezas, createReportProblemRoute } from '@piezas/sdk';

// Added by Piezas: saves "Report a problem" reports in this app's own records.
// Keep it: whether the button shows is the owner's answer at each deploy.
const piezas = new Piezas({ apiKey: process.env.PIEZAS_API_KEY! });
export const { GET, POST } = createReportProblemRoute({ piezas });
