import { useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobileFeed from "../../components/MobileFeed";
import { subscribeChallenges } from "../../lib/challenge";

export default function FeedScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const sub = subscribeChallenges(() =>
      Alert.alert(
        "New Challenge!", 
        "Someone just challenged you 💪", 
        [
          { text: "Ignore", style: "cancel" },
          { 
            text: "Accept", 
            onPress: () => navigation.navigate("LiftGame" as never)
          }
        ]
      ));
    return () => { sub?.unsubscribe(); };
  }, [navigation]);

  return <MobileFeed />;
} 