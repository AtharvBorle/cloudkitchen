export function getCategoryExpiries(activeSubs: any[]) {
    const foodSubs = activeSubs.filter((s: any) => s.plan?.category === 'FOOD' || s.plan?.category === 'BOTH');
    const propertySubs = activeSubs.filter((s: any) => s.plan?.category === 'PROPERTY' || s.plan?.category === 'BOTH');

    const getStackedSubs = (subsList: any[]) => {
        const sorted = [...subsList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const result = [];
        let currentEnd: Date | null = null;
        
        for (let i = 0; i < sorted.length; i++) {
            const sub = sorted[i];
            const duration = sub.plan?.durationMonths || 1;
            const created = new Date(sub.createdAt);
            
            let start: Date;
            if (currentEnd && currentEnd > created) {
                start = new Date(currentEnd);
            } else {
                start = created;
            }
            
            const end = new Date(start);
            end.setMonth(end.getMonth() + duration);
            
            result.push({
                ...sub,
                startDate: start,
                endDate: end
            });
            
            currentEnd = end;
        }
        return result;
    };

    const stackedFood = getStackedSubs(foodSubs);
    const foodExpiry = stackedFood.length > 0 ? stackedFood[stackedFood.length - 1].endDate : null;

    const stackedProperty = getStackedSubs(propertySubs);
    const propertyExpiry = stackedProperty.length > 0 ? stackedProperty[stackedProperty.length - 1].endDate : null;

    return { foodExpiry, propertyExpiry };
}
