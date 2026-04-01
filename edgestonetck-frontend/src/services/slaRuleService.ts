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
    targetType: 'vendor' | 'customer';
    targetId: string;
    conditions: SLARuleCondition[];
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/sla-rules`;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('edgestone_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    };
};

export const slaRuleService = {
    getAllSLARules: async (): Promise<SLARule[]> => {
        console.log('🔵 Fetching all SLA rules...');
        const response = await fetch(`${API_URL}`, {
            headers: getAuthHeaders(),
        });
        console.log('🔵 Fetch SLA rules response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (response.status === 404) {
                console.error('❌ 404 Error: SLA Rules API endpoint not found.');
                throw new Error('SLA Rules API not found - Please restart the backend server');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to fetch SLA rules' }));
            console.error('❌ Fetch SLA rules error:', error);
            throw new Error(error.message);
        }
        const result = await response.json();
        console.log(`✅ Successfully fetched ${result.length} SLA rules`);
        return result;
    },

    createSLARule: async (data: CreateSLARuleData): Promise<SLARule> => {
        console.log('🔵 Creating SLA rule:', data);
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        console.log('🔵 Create SLA rule response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (response.status === 404) {
                console.error('❌ 404 Error: SLA Rules API endpoint not found.');
                throw new Error('SLA Rules API not found - Please restart the backend server');
            }
            const error = await response.json().catch(() => ({ message: 'Failed to create SLA rule' }));
            console.error('❌ Create SLA rule error:', error);
            throw new Error(error.message);
        }
        const result = await response.json();
        console.log('✅ SLA rule created successfully:', result);
        return result;
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
    return 0; // No matching condition found
};
