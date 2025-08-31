import React from 'react';

export const DonutChart = ({ data, size = 120, strokeWidth = 18 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    if (totalValue === 0) {
        return (
             <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                />
            </svg>
        );
    }

    let accumulatedPercentage = 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {data.map((item, index) => {
                const percentage = item.value / totalValue;
                const offset = accumulatedPercentage * circumference;
                accumulatedPercentage += percentage;

                return (
                    <circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${percentage * circumference} ${circumference}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                    />
                );
            })}
        </svg>
    );
};