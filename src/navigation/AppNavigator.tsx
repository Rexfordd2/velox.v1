import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GameScreen from "../screens/LiftToBeat/GameScreen";
import FeedScreen from "../screens/Feed/FeedScreen";
import LeaderboardScreen from "../screens/Leaderboard/LeaderboardScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Feed" 
          component={FeedScreen} 
          options={{ title: "Activity Feed" }} 
        />
        <Stack.Screen 
          name="LiftGame" 
          component={GameScreen} 
          options={{ title: "Lift to the Beat" }} 
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen} 
          options={{ title: "Leaderboard" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 