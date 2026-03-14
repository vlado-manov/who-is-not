import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { captureCrashNow } from "../utils/crashMonitor";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class CrashBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureCrashNow("react_render_error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Something went wrong</Text>
        <Pressable
          onPress={() => this.setState({ hasError: false })}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
  },
  btn: {
    marginTop: 18,
    backgroundColor: "#2f7cff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

