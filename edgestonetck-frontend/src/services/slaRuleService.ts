/**
 * SLA Rule Condition — stored as computable data for calculation.
 * 
 * Each condition defines a range for the availability factor:
 *   upperLimit [upperOperator] Av [lowerOperator] lowerLimit → compensation
 * 
 * Example: 99.5 > Av >= 99.4 → compensation = 5 (% of MRC)
 *   { upperLimit: 99.5, upperOperator: ">", lowerLimit: 99.4, lowerOperator: ">=", compensation: 5 }
 * 
 * Edge cases:
 *   - First row (no breach): Av >= 99.5 → compensation = 0
 *     { upperLimit: null, upperOperator: null, lowerLimit: 99.5, lowerOperator: ">=", compensation: 0 }
 *   - Last row (worst case): 99.0 > Av → compensation = 30
 *     { upperLimit: 99.0, upperOperator: ">", lowerLimit: null, lowerOperator: null, compensation: 30 }
 */
export interface SLARuleCondition {
    upperLimit: number | null;
    upperOperator: string | null;   // ">" | ">=" | "<" | "<="
    lowerLimit: number | null;
    lowerOperator: string | null;   // ">" | ">=" | "<" | "<="
    compensation: number;           // % of allocated MRC
}

export interface SLARule {
    id: string;
    circuitId: string;
    circuitDisplayId: string;
    targetType: 'vendor' | 'customer';
    targetId: string;
    targetName: string;
    conditions: SLARuleCondition[];
    createdAt: string;
}

export interface CreateSLARuleData {
    circuitId: string;
    circuitDisplayId?: string;  // for mock store display
    targetType: 'vendor' | 'customer';
    targetId: string;
    targetName?: string;        // for mock store display
    conditions: SLARuleCondition[];
}

// const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/sla-rules`;

// const getAuthHeaders = () => {
//     const userStr = localStorage.getItem('edgestone_user');
//     const user = userStr ? JSON.parse(userStr) : null;
//     return {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${user?.token || ''}`
//     };
// };

// ── Mock data for testing (remove when backend is ready) ──
const MOCK_SLA_RULES: SLARule[] = [
    // Circuit 1: BA/SNG-TY2/ESPL-003 — Vendor side (Airtel)
    {
        id: 'sla-001',
        circuitId: 'ckt-001',
        circuitDisplayId: 'BA/SNG-TY2/ESPL-003',
        targetType: 'vendor',
        targetId: 'v-001',
        targetName: 'Airtel',
        conditions: [
            { upperLimit: null, upperOperator: null, lowerLimit: 99.5, lowerOperator: '>=', compensation: 0 },
            { upperLimit: 99.5, upperOperator: '>', lowerLimit: 99.4, lowerOperator: '>=', compensation: 5 },
            { upperLimit: 99.4, upperOperator: '>', lowerLimit: 99.3, lowerOperator: '>=', compensation: 10 },
            { upperLimit: 99.3, upperOperator: '>', lowerLimit: 99.2, lowerOperator: '>=', compensation: 15 },
            { upperLimit: 99.2, upperOperator: '>', lowerLimit: 99.0, lowerOperator: '>=', compensation: 20 },
            { upperLimit: 99.0, upperOperator: '>', lowerLimit: null, lowerOperator: null, compensation: 30 },
        ],
        createdAt: '2026-01-15T10:30:00Z',
    },
    // Circuit 1: BA/SNG-TY2/ESPL-003 — Customer side (Tata Communications)
    {
        id: 'sla-002',
        circuitId: 'ckt-001',
        circuitDisplayId: 'BA/SNG-TY2/ESPL-003',
        targetType: 'customer',
        targetId: 'c-001',
        targetName: 'Tata Communications',
        conditions: [
            { upperLimit: null, upperOperator: null, lowerLimit: 99.9, lowerOperator: '>=', compensation: 0 },
            { upperLimit: 99.9, upperOperator: '>', lowerLimit: 99.8, lowerOperator: '>=', compensation: 5 },
            { upperLimit: 99.8, upperOperator: '>', lowerLimit: 99.7, lowerOperator: '>=', compensation: 10 },
            { upperLimit: 99.7, upperOperator: '>', lowerLimit: 99.6, lowerOperator: '>=', compensation: 15 },
            { upperLimit: 99.6, upperOperator: '>', lowerLimit: 99.5, lowerOperator: '>=', compensation: 20 },
            { upperLimit: 99.5, upperOperator: '>', lowerLimit: null, lowerOperator: null, compensation: 30 },
        ],
        createdAt: '2026-01-15T10:35:00Z',
    },
    // Circuit 1: BA/SNG-TY2/ESPL-003 — Customer side (Reliance Jio)
    {
        id: 'sla-003',
        circuitId: 'ckt-001',
        circuitDisplayId: 'BA/SNG-TY2/ESPL-003',
        targetType: 'customer',
        targetId: 'c-002',
        targetName: 'Reliance Jio',
        conditions: [
            { upperLimit: null, upperOperator: null, lowerLimit: 99.95, lowerOperator: '>=', compensation: 0 },
            { upperLimit: 99.95, upperOperator: '>', lowerLimit: 99.85, lowerOperator: '>=', compensation: 5 },
            { upperLimit: 99.85, upperOperator: '>', lowerLimit: 99.75, lowerOperator: '>=', compensation: 10 },
            { upperLimit: 99.75, upperOperator: '>', lowerLimit: 99.65, lowerOperator: '>=', compensation: 15 },
            { upperLimit: 99.65, upperOperator: '>', lowerLimit: 99.55, lowerOperator: '>=', compensation: 20 },
            { upperLimit: 99.55, upperOperator: '>', lowerLimit: null, lowerOperator: null, compensation: 30 },
        ],
        createdAt: '2026-01-16T09:00:00Z',
    },
    // Circuit 2: MU/DEL-BLR/ESPL-017 — Vendor side (Vodafone)
    {
        id: 'sla-004',
        circuitId: 'ckt-002',
        circuitDisplayId: 'MU/DEL-BLR/ESPL-017',
        targetType: 'vendor',
        targetId: 'v-002',
        targetName: 'Vodafone',
        conditions: [
            { upperLimit: null, upperOperator: null, lowerLimit: 99.5, lowerOperator: '>=', compensation: 0 },
            { upperLimit: 99.5, upperOperator: '>', lowerLimit: 99.4, lowerOperator: '>=', compensation: 4 },
            { upperLimit: 99.4, upperOperator: '>', lowerLimit: 99.3, lowerOperator: '>=', compensation: 8 },
            { upperLimit: 99.3, upperOperator: '>', lowerLimit: 99.2, lowerOperator: '>=', compensation: 12 },
            { upperLimit: 99.2, upperOperator: '>', lowerLimit: null, lowerOperator: null, compensation: 25 },
        ],
        createdAt: '2026-02-01T14:00:00Z',
    },
    // Circuit 2: MU/DEL-BLR/ESPL-017 — Customer side (BSNL)
    {
        id: 'sla-005',
        circuitId: 'ckt-002',
        circuitDisplayId: 'MU/DEL-BLR/ESPL-017',
        targetType: 'customer',
        targetId: 'c-003',
        targetName: 'BSNL',
        conditions: [
            { upperLimit: null, upperOperator: null, lowerLimit: 99.5, lowerOperator: '>=', compensation: 0 },
            { upperLimit: 99.5, upperOperator: '>', lowerLimit: 99.0, lowerOperator: '>=', compensation: 10 },
            { upperLimit: 99.0, upperOperator: '>', lowerLimit: 98.0, lowerOperator: '>=', compensation: 20 },
            { upperLimit: 98.0, upperOperator: '>', lowerLimit: null, lowerOperator: null, compensation: 30 },
        ],
        createdAt: '2026-02-01T14:10:00Z',
    },
];

// In-memory store for newly added rules during testing
let mockRulesStore = [...MOCK_SLA_RULES];

export const slaRuleService = {
    getAllSLARules: async (): Promise<SLARule[]> => {
        console.log('🔵 Fetching all SLA rules (DUMMY MODE)...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockRulesStore;
    },

    createSLARule: async (data: CreateSLARuleData): Promise<SLARule> => {
        console.log('🔵 Creating SLA rule (DUMMY MODE):', data);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const newRule: SLARule = {
            id: `sla-mock-${Date.now()}`,
            circuitId: data.circuitId,
            circuitDisplayId: data.circuitDisplayId || data.circuitId,
            targetType: data.targetType,
            targetId: data.targetId,
            targetName: data.targetName || data.targetId,
            conditions: data.conditions,
            createdAt: new Date().toISOString(),
        };
        
        mockRulesStore = [...mockRulesStore, newRule];
        console.log('✅ SLA rule saved to mock store:', newRule);
        return newRule;
    }
};

/**
 * Utility: Evaluate a single condition against an availability factor.
 * Returns true if the availability factor falls within this condition's range.
 */
export const evaluateCondition = (availabilityFactor: number, condition: SLARuleCondition): boolean => {
    let upperOk = true;
    let lowerOk = true;

    if (condition.upperLimit !== null && condition.upperOperator !== null) {
        switch (condition.upperOperator) {
            case '>':  upperOk = condition.upperLimit > availabilityFactor; break;
            case '>=': upperOk = condition.upperLimit >= availabilityFactor; break;
            case '<':  upperOk = condition.upperLimit < availabilityFactor; break;
            case '<=': upperOk = condition.upperLimit <= availabilityFactor; break;
        }
    }

    if (condition.lowerLimit !== null && condition.lowerOperator !== null) {
        switch (condition.lowerOperator) {
            case '>':  lowerOk = availabilityFactor > condition.lowerLimit; break;
            case '>=': lowerOk = availabilityFactor >= condition.lowerLimit; break;
            case '<':  lowerOk = availabilityFactor < condition.lowerLimit; break;
            case '<=': lowerOk = availabilityFactor <= condition.lowerLimit; break;
        }
    }

    return upperOk && lowerOk;
};

/**
 * Utility: Find the matching compensation for a given availability factor.
 * Iterates through conditions and returns the compensation % for the first match.
 */
export const calculateCompensation = (availabilityFactor: number, conditions: SLARuleCondition[]): number => {
    for (const condition of conditions) {
        if (evaluateCondition(availabilityFactor, condition)) {
            return condition.compensation;
        }
    }
    return 0;
};
