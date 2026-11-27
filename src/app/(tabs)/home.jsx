import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

import { router } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { FontAwesome5 } from '@expo/vector-icons';

import { api } from '../../../convex/_generated/api';

import Orb from '../../components/Orb';
import LineChart from '../../components/LineChart';

import { colors } from '../../lib/theme';
import {
    greeting,
    longDate,
    minutesLabel,
    totalLabel,
    whenLabel,
} from '../../lib/format';

import { todaysTopic } from '../../lib/topics';
import styles from '../../styles/home.style';

export default function Home() {
    const { user } = useUser();

    const overview = useQuery(api.sessions.overview, { days: 14 });
    const recent = useQuery(api.sessions.listRecent, { limit: 3 });

    const topic = todaysTopic();

    const firstName =
        user?.firstName ||
        user?.fullName?.split(' ')[0] ||
        'there';

    const startSpeaking = () => {
        router.push({
            pathname: '/speaking',
            params: { topic },
        });
    };

    const hasSessions = (overview?.count ?? 0) > 0;

    const sparkline =
        overview && overview.series.length > 1
            ? overview.series.map((p, i) => ({
                x: i / (overview.series.length - 1),
                y: p.score,
            }))
            : [];

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.date}>
                        {longDate()}
                    </Text>

                    <Text style={styles.hello}>
                        {greeting()}, {firstName}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Ready to improve your speaking?
                    </Text>
                </View>

                {user?.imageUrl ? (
                    <Image
                        source={{ uri: user.imageUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarText}>
                            {firstName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            {/* Today's Topic */}
            <View style={styles.topicCard}>
                <View style={styles.orbContainer}>
                    <Orb size={105} glow={false} />
                </View>

                <View style={styles.topicBody}>
                    <Text style={styles.topicLabel}>
                        TODAY'S TOPIC
                    </Text>

                    <Text style={styles.topicTitle}>
                        {topic}
                    </Text>
                    <Text style={styles.topicDescription}>
                        Practice your English and build confidence.
                    </Text>
                    <Pressable
                        onPress={startSpeaking}
                        style={({ pressed }) => [
                            styles.startBtn,
                            pressed && styles.pressed,
                        ]}
                    >
                        <FontAwesome5
                            name="microphone"
                            size={12}
                            color={colors.white}
                        />

                        <Text style={styles.startText}>
                            Start speaking
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Improvement */}
            <View style={styles.card}>
                <View style={styles.rowBetween}>
                    <Text style={styles.cardLabel}>
                        Your improvement
                    </Text>

                    {hasSessions && overview.count > 1 && (
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>
                                {overview.delta >= 0 ? '▲' : '▼'}{' '}
                                {overview.delta >= 0 ? '+' : ''}
                                {overview.delta} pts
                            </Text>
                        </View>
                    )}
                </View>

                {overview === undefined || overview === null ? (
                    <ActivityIndicator
                        color={colors.accent}
                        style={styles.loader}
                    />
                ) : hasSessions ? (
                    <View style={styles.improveRow}>
                        <View>
                            <Text style={styles.tiny}>
                                First session
                            </Text>

                            <Text style={styles.oldNumber}>
                                {overview.first.score}
                            </Text>
                        </View>

                        <FontAwesome5
                            name="long-arrow-alt-right"
                            size={18}
                            color={colors.muted}
                            style={styles.improvementArrow}
                        />

                        <View>
                            <Text style={styles.tiny}>
                                Latest
                            </Text>

                            <Text style={styles.bigNumber}>
                                {overview.latest.score}
                            </Text>
                        </View>

                        <View style={styles.chartContainer}>
                            <LineChart
                                data={sparkline}
                                width={95}
                                height={44}
                            />
                        </View>
                    </View>
                ) : (
                    <Text style={styles.empty}>
                        Finish your first session and your score
                        will appear here.
                    </Text>
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={[styles.card, styles.stat]}>
                    <Text style={styles.statValue}>
                        {overview?.count ?? 0}
                    </Text>

                    <Text style={styles.statLabel}>
                        Sessions completed
                    </Text>
                </View>

                <View style={[styles.card, styles.stat]}>
                    <Text style={styles.statValue}>
                        {totalLabel(overview?.totalSec ?? 0)}
                    </Text>

                    <Text style={styles.statLabel}>
                        Total speaking time
                    </Text>
                </View>
            </View>

            {/* Recent Sessions */}
            <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>
                    Recent sessions
                </Text>

                <Pressable
                    onPress={() => router.push('/progress')}
                >
                    <Text style={styles.seeAll}>
                        See all
                    </Text>
                </Pressable>
            </View>

            {recent === undefined ? (
                <ActivityIndicator
                    color={colors.accent}
                    style={styles.loader}
                />
            ) : recent.length > 0 ? (
                recent.map((item) => (
                    <Pressable
                        key={item._id}
                        style={({ pressed }) => [
                            styles.card,
                            styles.sessionRow,
                            pressed && styles.pressed,
                        ]}
                        onPress={() =>
                            router.push(`/result/${item._id}`)
                        }
                    >
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreText}>
                                {item.score}
                            </Text>
                        </View>

                        <View style={styles.sessionInfo}>
                            <Text
                                style={styles.sessionTopic}
                                numberOfLines={1}
                            >
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
                                    item.delta < 0 && {
                                        color: colors.error,
                                    },
                                ]}
                            >
                                {item.delta >= 0 ? '+' : ''}
                                {item.delta}
                            </Text>
                        )}
                    </Pressable>
                ))
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.empty}>
                        No sessions yet. Tap "Start speaking"
                        to begin.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}