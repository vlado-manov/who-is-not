import { View, Text } from "react-native";
import { usePreventBack } from "../../hooks/usePreventBack";

const VoteResultsScreen = () => {
  usePreventBack();
  return (
    <View>
      <Text>VoteResultsScreen</Text>
    </View>
  );
};

export default VoteResultsScreen;
