import { View, Text } from "react-native";
import { usePreventBack } from "../../hooks/usePreventBack";
import { useGameplayMusic } from "../../hooks/useScreenMusic";

const VoteResultsScreen = () => {
  usePreventBack();
  useGameplayMusic();
  return (
    <View>
      <Text>VoteResultsScreen</Text>
    </View>
  );
};

export default VoteResultsScreen;
