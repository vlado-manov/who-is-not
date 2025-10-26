import type { StackCardStyleInterpolator } from "@react-navigation/stack";

export const forSlideFromTop: StackCardStyleInterpolator = ({
  current,
  layouts,
}) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-layouts.screen.height, 0],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  return { cardStyle: { transform: [{ translateY }], opacity } };
};

export const forSlideFromBottom: StackCardStyleInterpolator = ({
  current,
  layouts,
}) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.height, 0],
  });
  const overlayOpacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });
  return {
    cardStyle: { transform: [{ translateY }] },
    overlayStyle: { opacity: overlayOpacity },
  };
};

export const forSlideFromRight: StackCardStyleInterpolator = ({
  current,
  layouts,
}) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width, 0],
  });
  return { cardStyle: { transform: [{ translateX }] } };
};

export const forSlideFromLeft: StackCardStyleInterpolator = ({
  current,
  layouts,
}) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-layouts.screen.width, 0],
  });
  return { cardStyle: { transform: [{ translateX }] } };
};

export const forFade: StackCardStyleInterpolator = ({ current }) => ({
  cardStyle: { opacity: current.progress },
});

export const forFadeThrough: StackCardStyleInterpolator = ({
  current,
  next,
}) => {
  const entering = current.progress; // 0 -> 1
  const exiting = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
    : 1;
  const scale = entering.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  return {
    cardStyle: { opacity: entering, transform: [{ scale }] },
    containerStyle: { opacity: exiting as any },
  };
};

export const forScaleFromCenter: StackCardStyleInterpolator = ({ current }) => {
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  return { cardStyle: { transform: [{ scale }], opacity } };
};

export const forDepth: StackCardStyleInterpolator = ({ current, next }) => {
  const opacity = current.progress;
  const translateX = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -50] })
    : 0;
  const scale = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] })
    : 1;
  return { cardStyle: { opacity, transform: [{ translateX }, { scale }] } };
};

export const forParallax: StackCardStyleInterpolator = ({
  current,
  next,
  layouts,
}) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width, 0],
  });
  const prevTranslateX = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -layouts.screen.width * 0.3],
      })
    : 0;
  return {
    cardStyle: { transform: [{ translateX }] },
    containerStyle: { transform: [{ translateX: prevTranslateX as any }] },
  };
};

export const forInstantFade: StackCardStyleInterpolator = ({
  current,
  next,
}) => {
  // Текущият екран
  const opacityIn = current.progress.interpolate({
    inputRange: [0, 0.01, 1],
    outputRange: [0, 1, 1], // бързо се появява
  });

  // Излизащият екран (ако има)
  const opacityOut = next
    ? next.progress.interpolate({
        inputRange: [0, 0.01, 1],
        outputRange: [1, 0, 0], // почти веднага изчезва
      })
    : 1;

  return {
    cardStyle: {
      opacity: opacityIn,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    },
    containerStyle: { opacity: opacityOut as any },
  };
};

export const forOverlayFade: StackCardStyleInterpolator = ({ current }) => {
  const overlayOpacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });
  return {
    cardStyle: {
      transform: [{ translateY }, { scale }],
      opacity: current.progress,
    },
    overlayStyle: { opacity: overlayOpacity },
  };
};

export const forFlipHorizontal: StackCardStyleInterpolator = ({ current }) => {
  const rotateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["90deg", "0deg"],
  });
  return { cardStyle: { transform: [{ perspective: 1000 }, { rotateY }] } };
};

export const Transitions = {
  slideFromTop: forSlideFromTop,
  slideFromBottom: forSlideFromBottom,
  slideFromRight: forSlideFromRight,
  slideFromLeft: forSlideFromLeft,
  fade: forFade,
  fadeThrough: forFadeThrough,
  scaleFromCenter: forScaleFromCenter,
  depth: forDepth,
  parallax: forParallax,
  overlayFade: forOverlayFade,
  flipHorizontal: forFlipHorizontal,
  instantFade: forInstantFade,
};
export type TransitionName = keyof typeof Transitions;
