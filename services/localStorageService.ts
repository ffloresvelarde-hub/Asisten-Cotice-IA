import type { HistoryEntry } from '../types';

const HISTORY_KEY = 'quotation_history';

export const getHistory = (): HistoryEntry[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            return JSON.parse(historyJson) as HistoryEntry[];
        }
    } catch (error) {
        console.error("Error reading history from localStorage", error);
        return [];
    }
    return [];
};

export const addHistoryEntry = (entry: HistoryEntry): HistoryEntry[] => {
    const currentHistory = getHistory();
    // Add to the beginning and limit history size to 20 entries
    const newHistory = [entry, ...currentHistory].slice(0, 20);
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error("Error saving history to localStorage", error);
    }
    return newHistory;
};

export const clearHistory = (): void => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error("Error clearing history from localStorage", error);
    }
};
