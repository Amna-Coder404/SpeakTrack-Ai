import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../convex/_generated/api';
import { colors } from '../lib/theme';
import { minutesLabel, whenLabel } from '../lib/format';
import styles from '../styles/home.style';

export default function AllSessions() {
    const sessions = useQuery(api.sessions.listRecent, { limit: 200 });
    const deleteSessions = useMutation(api.sessions.deleteSessions);

    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState([]);

    const list = sessions ?? [];
    const allSelected = list.length > 0 && selected.length === list.length;

    const exitSelect = () => {
        setSelectMode(false);
        setSelected([]);
    };

    const toggle = (id) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const startSelect = (id) => {
        setSelectMode(true);
        setSelected([id]);
    };

    const toggleAll = () =>
        setSelected(allSelected ? [] : list.map((s) => s._id));

    const confirmDelete = (ids) =>
        Alert.alert(
            ids.length === 1 ? 'Delete this session?' : `Delete ${ids.length} sessions?`,
            'The chat, corrections and score will be deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () =>
                        deleteSessions({ sessionIds: ids })
                            .then(exitSelect)
                            .catch((e) =>
                                Alert.alert('Could not delete', e?.message || 'Please try again.')
                            ),
                },
            ]
        );

    return (
        <View style={local.screen}>
            {selectMode ? (
                <View style={local.header}>
                    <Pressable onPress={exitSelect} hitSlop={12}>
                        <Ionicons name="close" size={26} color={colors.text} />
                    </Pressable>
                    <Text style={[local.title, { flex: 1 }]}>{selected.length} selected</Text>
                    <Pressable onPress={toggleAll} hitSlop={10}>
                        <Text style={local.action}>{allSelected ? 'Clear' : 'Select all'}</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => confirmDelete(selected)}
                        disabled={selected.length === 0}
                        hitSlop={10}
                        style={[local.trash, selected.length === 0 && { opacity: 0.4 }]}
                    >
                        <Ionicons name="trash-outline" size={22} color={colors.error} />
                    </Pressable>
                </View>
            ) : (
                <View style={local.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Ionicons name="chevron-back" size={26} color={colors.text} />
                    </Pressable>
                    <Text style={local.title}>All sessions</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={local.content}
                showsVerticalScrollIndicator={false}
            >
                {sessions === undefined || sessions === null ? (
                    <ActivityIndicator color={colors.accent} style={styles.loader} />
                ) : list.length > 0 ? (
                    list.map((item) => {
                        const isSelected = selected.includes(item._id);
                        return (
                            <Pressable
                                key={item._id}
                                style={({ pressed }) => [
                                    styles.card,
                                    styles.sessionRow,
                                    pressed && styles.pressed,
                                    isSelected && local.selectedCard,
                                ]}
                                onPress={() =>
                                    selectMode ? toggle(item._id) : router.push(`/result/${item._id}`)
                                }
                                onLongPress={() => (selectMode ? toggle(item._id) : startSelect(item._id))}
                            >
                                {selectMode && (
                                    <Ionicons
                                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={24}
                                        color={isSelected ? colors.accent : colors.muted}
                                        style={{ marginRight: 10 }}
                                    />
                                )}

                                <View style={styles.scoreBox}>
                                    <Text style={styles.scoreText}>{item.score}</Text>
                                </View>

                                <View style={styles.sessionInfo}>
                                    <Text style={styles.sessionTopic} numberOfLines={1}>
                                        {item.topic}
                                    </Text>
                                    <Text style={styles.sessionMeta}>
                                        {whenLabel(item.startedAt)}
                                        {' · '}
                                        {minutesLabel(item.durationSec)}
                                    </Text>
                                </View>

                                {item.delta !== null && (
                                    <Text
                                        style={[
                                            styles.delta,
                                            item.delta < 0 && { color: colors.error },
                                        ]}
                                    >
                                        {item.delta >= 0 ? '+' : ''}
                                        {item.delta}
                                    </Text>
                                )}

                                {!selectMode && (
                                    <Pressable
                                        onPress={() => confirmDelete([item._id])}
                                        hitSlop={10}
                                        style={local.trash}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </Pressable>
                                )}
                            </Pressable>
                        );
                    })
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.empty}>No sessions yet.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const local = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingTop: 58,
        paddingBottom: 12,
    },
    title: { color: colors.text, fontSize: 22, fontWeight: '800' },
    action: { color: colors.accent, fontSize: 14, fontWeight: '700' },
    content: { paddingHorizontal: 18, paddingBottom: 30 },
    trash: { marginLeft: 10, padding: 4 },
    selectedCard: { borderColor: colors.accent, borderWidth: 1.5 },
});