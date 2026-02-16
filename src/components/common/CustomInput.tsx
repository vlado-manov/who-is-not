import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";

export type CustomInputHandle = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
};

interface Props extends Omit<TextInputProps, "onChange"> {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;

  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  containerClassName?: string;
  inputClassName?: string;

  borderColor?: string;
  focusBorderColor?: string;

  /** If true → no border, no shadow, no wrapper styling */
  unstyled?: boolean;
}

const DEFAULT_BORDER = "#FA8900";
const DEFAULT_BORDER_FOCUSED = "#FA3A00";

const CustomInput = forwardRef<CustomInputHandle | TextInput, Props>(
  (
    {
      value,
      onChangeText = () => {},
      placeholder,
      containerStyle,
      inputStyle,
      containerClassName,
      inputClassName,
      borderColor,
      focusBorderColor,
      unstyled = false,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => inputRef.current?.clear(),
      isFocused: () => !!inputRef.current?.isFocused(),
    }));

    // ---------- UNSTYLED MODE ----------
    if (unstyled) {
      return (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          autoCapitalize={rest.autoCapitalize ?? "none"}
          autoCorrect={rest.autoCorrect ?? false}
          className={inputClassName}
          style={[styles.unstyledInput, inputStyle, rest.style]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      );
    }

    // ---------- DEFAULT STYLED MODE ----------
    const dynamicContainer: StyleProp<ViewStyle> = [
      styles.container,
      {
        borderColor: focused
          ? (focusBorderColor ?? DEFAULT_BORDER_FOCUSED)
          : (borderColor ?? DEFAULT_BORDER),
      },
      containerStyle,
    ];

    return (
      <View className={containerClassName} style={dynamicContainer}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          autoCapitalize={rest.autoCapitalize ?? "none"}
          autoCorrect={rest.autoCorrect ?? false}
          className={inputClassName}
          style={[styles.input, inputStyle, rest.style]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 6,
    borderRadius: 16,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.5)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  input: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 72,
    fontSize: 32,
    textAlign: "center",
    color: "#000",
    borderRadius: 16,
  },

  /** Used when unstyled = true */
  unstyledInput: {
    width: "100%",
    paddingVertical: 4,
    paddingHorizontal: 0,
    fontSize: 28,
    textAlign: "center",
    color: "#592410",
    backgroundColor: "transparent",
  },
});

export default CustomInput;
