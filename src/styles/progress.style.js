import { StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 30 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 20 },

    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tiny: { color: colors.muted, fontSize: 11.5 },

    // First vs latest (flat, no card)
    compare: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    score: { marginVertical: 2 },
    scoreBig: { color: colors.text, fontSize: 38, fontWeight: '800' },
    outOf: { color: colors.muted, fontSize: 13 },
    gain: { backgroundColor: colors.greenSoft, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
    gainBig: { color: colors.green, fontSize: 20, fontWeight: '800' },
    gainSmall: { color: colors.green, fontSize: 11, fontWeight: '600' },

    // Totals: three columns split by thin lines
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 22,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    stat: { flex: 1, alignItems: 'center' },
    statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: colors.border },
    statValue: { color: colors.text, fontSize: 21, fontWeight: '800' },
    statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },

    // Sections
    section: { marginTop: 28 },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
    sectionHint: { color: colors.muted, fontSize: 12.5, marginTop: 4 },
    empty: { color: colors.muted, fontSize: 13.5, lineHeight: 20, marginTop: 12 },

    // Chart toggle
    toggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, padding: 3 },
    toggleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
    toggleOn: { backgroundColor: colors.cream },
    toggleText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    axisLabel: { color: colors.muted, fontSize: 10.5 },

    // Common mistakes: ranked list with trend chips
    mistakeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        marginTop: 2,
    },
    rank: { width: 20, color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center' },
    mistakeName: { color: colors.text, fontSize: 15, fontWeight: '700' },
    mistakeNums: { color: colors.muted, fontSize: 12.5, marginTop: 3 },
    chip: { borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10 },
    chipText: { fontSize: 12, fontWeight: '800' },
});