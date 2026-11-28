import { StyleSheet } from "react-native";
import { colors } from "../lib/theme";

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 30 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 16 },
    card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
    userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
    avatar: { width: 54, height: 54, borderRadius: 27 },
    name: { color: colors.text, fontSize: 17, fontWeight: '800' },
    emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    email: { color: colors.muted, fontSize: 12.5, flexShrink: 1 },
    gBadge: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCE0', alignItems: 'center', justifyContent: 'center' },
    gText: { color: '#4285F4', fontWeight: '800', fontSize: 9 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowLabel: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    rowValue: { color: colors.muted, fontSize: 13.5 },
    hint: { color: colors.muted, fontSize: 11.5, marginTop: 6, marginBottom: 12, marginLeft: 4 },
    signOut: { marginTop: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, alignItems: 'center' },
    signOutText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
});