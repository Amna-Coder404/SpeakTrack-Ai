
export const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

export const longDate = (date = new Date()) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
};

export const fullDate = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
};

export const minutesLabel = (minutes = 0) => {
    return `${minutes} min`;
};

export const totalLabel = (total = 0) => {
    return `${total}`;
};

export const whenLabel = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};



export const timer = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};


export const dayLabel = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};
