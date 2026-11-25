
const topics = [
    {
        title: 'Daily Conversations',
        description: 'Practice speaking English in everyday situations.',
        category: 'Speaking',
    },
    {
        title: 'Technology',
        description: 'Talk about technology and modern innovations.',
        category: 'Discussion',
    },
    {
        title: 'Personal Experiences',
        description: 'Improve fluency by sharing your experiences.',
        category: 'Storytelling',
    },
    {
        title: 'Career and Goals',
        description: 'Practice discussing your ambitions and career.',
        category: 'Speaking',
    },
    {
        title: 'Travel and Culture',
        description: 'Explore different cultures through conversation.',
        category: 'Discussion',
    },
];

export const todaysTopic = () => {
    const day = Math.floor(Date.now() / 86400000);
    return topics[day % topics.length].title;
};
