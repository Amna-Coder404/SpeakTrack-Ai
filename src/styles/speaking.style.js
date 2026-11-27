
import { StyleSheet } from 'react-native';
import { colors } from '../lib/theme';


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 55,
        paddingHorizontal: 22,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    title: {
        color: colors.primary,
        fontSize: 25,
        fontWeight: '700',
    },

    subtitle: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 4,
    },
    thinkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: '#F4F1EC',
        marginTop: 8,
    },
    thinkingText: {
        fontSize: 14,
        color: '#6B665F',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 7,
    },

    timerDot: {
        width: 7,
        height: 7,
        borderRadius: 5,
        backgroundColor: colors.accent,
    },

    timer: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    statusContainer: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FCE9E2',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
        marginTop: 32,
        gap: 8,
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 5,
        backgroundColor: colors.accent,
    },

    status: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },

    chat: {
        flex: 1,
        marginTop: 28,
    },

    chatContent: {
        gap: 14,
        paddingBottom: 20,
        flexGrow: 1,
    },

    message: {
        padding: 15,
        borderRadius: 18,
        maxWidth: '85%',
    },

    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: colors.card,
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: colors.border,
    },

    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.secondary,
        borderBottomRightRadius: 5,
    },

    messageText: {
        color: colors.primary,
        fontSize: 15,
        lineHeight: 22,
    },

    liveContainer: {
        backgroundColor: '#FCE9E2',
        padding: 15,
        borderRadius: 16,
        marginTop: 8,
    },

    liveLabel: {
        color: colors.accent,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 7,
    },

    liveText: {
        color: colors.primary,
        fontSize: 15,
        lineHeight: 22,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        minHeight: 200,
    },

    emptyTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: colors.primary,
    },

    emptyText: {
        fontSize: 13,
        color: colors.muted,
    },

    error: {
        color: colors.error,
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 13,
    },

    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 22,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    secondaryButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 15,
        paddingVertical: 13,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    secondaryButtonText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },

    micButton: {
        backgroundColor: colors.accent,
        width: 66,
        height: 66,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: colors.accent,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },

    endButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 17,
        paddingVertical: 13,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    endButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 13,
    },
});

export default styles;
