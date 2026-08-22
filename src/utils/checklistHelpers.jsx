import React from 'react';
import { format } from "date-fns";

export const MonthInput = React.forwardRef(function MonthInput({ value, onClick }, ref) {
    return (
        <input
            ref={ref}
            value={value || ""}
            readOnly
            onClick={onClick}
            style={{
                padding: "7px",
                borderRadius: 5,
                border: "1px solid #444",
                background: "#2d3748",
                color: "white",
                height: "38px",
                cursor: "pointer",
                fontFamily: "sans-serif",
                minWidth: 140,
            }}
        />
    );
});

export function ymToDate(ym) {
    if (!ym) return null;
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1);
}

export function dateToYm(date) {
    if (!date) return "";
    return format(date, "yyyy-MM");
}

export function getLocalTodayString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #8B5CF6' : 'none',
        '&:hover': { borderColor: '#8B5CF6' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#8B5CF6' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' }),
};
