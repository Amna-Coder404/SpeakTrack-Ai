import { StyleSheet } from 'react-native';
import { colors, fonts } from '../lib/theme';

const styles = StyleSheet.create({

    // Screen
    screen: {
        flex: 1,
        backgroundColor: colors.cream,
    },

    content: {
        paddingHorizontal: 18,
        paddingTop: 58,
        paddingBottom: 30,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    date: {
        color: colors.muted,
        fontSize: 12.5,
        fontWeight: '500',
    }, topicDescription: {
        color: colors.muted,
        fontSize: 11.5,
        lineHeight: 17,
        marginTop: 5,
    },

    headerText: {
        flex: 1,
    },
    headerSubtitle: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 4,
    },
    date: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '400',
        marginBottom: 5,
    },

    hello: {
        color: colors.dark,
        fontSize: 23,
        fontWeight: '800',
        letterSpacing: -0.7,
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },

    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    // Today's topic
    topicCard: {
        backgroundColor: colors.dark,
        borderRadius: 24,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        minHeight: 150,
        overflow: 'hidden',
    },

    orbContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    topicBody: {
        flex: 1,
    },

    topicLabel: {
        color: '#A8A49D',
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: '500',
    },

    topicTitle: {
        fontFamily: fonts.serif,
        color: colors.white,
        fontSize: 24,
        lineHeight: 27,
        marginTop: 6,
    },

    startBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
        backgroundColor: colors.accent,
        borderRadius: 30,
        paddingVertical: 9,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    startText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },

    pressed: {
        opacity: 0.75,
    },

    // General card
    card: {
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
    },

    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    cardLabel: {
        color: colors.dark,
        fontSize: 12,
        fontWeight: '600',
    },

    // Improvement
    pill: {
        backgroundColor: colors.greenSoft,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 9,
    },

    pillText: {
        color: colors.green,
        fontSize: 10,
        fontWeight: '700',
    },

    improveRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginTop: 14,
    },

    tiny: {
        color: colors.muted,
        fontSize: 10,
        marginBottom: 2,
    },

    oldNumber: {
        color: '#A6A39D',
        fontSize: 34,
        fontWeight: '800',
        lineHeight: 40,
    },

    bigNumber: {
        color: colors.dark,
        fontSize: 34,
        fontWeight: '800',
        lineHeight: 40,
    },

    improvementArrow: {
        marginBottom: 10,
    },

    chartContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 5,
    },

    loader: {
        marginVertical: 20,
    },

    empty: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 19,
        marginTop: 12,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },

    stat: {
        flex: 1,
        minHeight: 82,
        justifyContent: 'center',
    },

    statValue: {
        color: colors.dark,
        fontSize: 22,
        fontWeight: '800',
    },

    statLabel: {
        color: colors.muted,
        fontSize: 10,
        marginTop: 5,
    },

    // Recent sessions
    recentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 22,
        marginBottom: 10,
    },

    sectionTitle: {
        color: colors.dark,
        fontSize: 14,
        fontWeight: '800',
    },

    seeAll: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: '600',
    },

    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 9,
        padding: 12,
        minHeight: 62,
    },

    scoreBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },

    scoreText: {
        color: colors.dark,
        fontSize: 14,
        fontWeight: '800',
    },

    sessionInfo: {
        flex: 1,
    },

    sessionTopic: {
        color: colors.dark,
        fontSize: 12,
        fontWeight: '700',
    },

    sessionMeta: {
        color: colors.muted,
        fontSize: 10,
        marginTop: 4,
    },

    delta: {
        color: colors.green,
        fontSize: 12,
        fontWeight: '800',
    },

    emptyCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        alignItems: 'center',
    },
});

export default styles;