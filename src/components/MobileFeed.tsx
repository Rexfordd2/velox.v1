import { FlatList, RefreshControl, View, Text, ActivityIndicator, Button } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "../lib/trpc-native";
import type { RouterOutputs } from "@velox/types";
import { createChallenge } from "../lib/challenge";

type PostItem = RouterOutputs["posts"]["getInfiniteFeed"]["items"][number];

const PAGE = 10;

export default function MobileFeed() {
  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) =>
      trpc.posts.getInfiniteFeed.query({ limit: PAGE, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: null,
  });

  return (
    <FlatList
      data={feed.data?.pages.flatMap((p) => p.items) ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }: { item: PostItem }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
          <Text style={{ fontWeight: "600" }}>{item.user.username}</Text>
          <Text style={{ marginTop: 4 }}>{item.content}</Text>
          <Button 
            title="Challenge"
            onPress={() => createChallenge(item.user_id)
              .then(() => alert("Challenge sent!"))
              .catch(e => alert(e.message))} 
          />
        </View>
      )}
      onEndReached={() => feed.fetchNextPage()}
      refreshControl={
        <RefreshControl refreshing={feed.isFetching} onRefresh={() => feed.refetch()} />
      }
      ListFooterComponent={feed.hasNextPage ? <ActivityIndicator /> : null}
    />
  );
} 