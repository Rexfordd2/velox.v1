import { useState } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import SegmentedControl from "react-native-segmented-control";
import { useLeaderboard } from "../../hooks/useLeaderboard";

export default function LeaderboardScreen() {
  const [movement] = useState("squat"); // you can make this a picker later
  const lb = useLeaderboard(movement);

  const ranges = ["week", "month"] as const;
  const scopes = ["global", "friends"] as const;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.h1}>{movement.toUpperCase()} Leaderboard</Text>

      <SegmentedControl
        values={["Global", "Friends"]}
        selectedIndex={scopes.indexOf(lb.scope)}
        onChange={(i) => lb.setScope(scopes[i.nativeEvent.selectedSegmentIndex])}
      />
      <SegmentedControl
        values={["Week", "Month"]}
        selectedIndex={ranges.indexOf(lb.range)}
        onChange={(i) => lb.setRange(ranges[i.nativeEvent.selectedSegmentIndex])}
        style={{ marginTop: 8 }}
      />

      <FlatList
        data={lb.data ?? []}
        keyExtractor={(item) => item.user_id}
        refreshControl={
          <RefreshControl refreshing={lb.isFetching} onRefresh={() => lb.refetch()} />
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            <Text style={styles.name}>{item.username}</Text>
            <Text style={styles.score}>{item.bestScore.toFixed(2)} m/s</Text>
          </View>
        )}
        ListEmptyComponent={!lb.isFetching ? <Text style={{ marginTop: 32 }}>No scores yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" },
  rank: { width: 32, fontSize: 16, fontWeight: "700" },
  name: { flex: 1, fontSize: 16 },
  score: { width: 90, textAlign: "right", fontWeight: "600" },
}); 