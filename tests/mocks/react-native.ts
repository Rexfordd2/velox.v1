// Minimal React Native mock surface for Node/JSDOM tests
export const Platform = { OS: 'ios', select: (obj: any) => obj?.ios ?? obj?.default } as const;
export const StyleSheet = { create: (s: any) => s } as const;
export const View = 'View';
export const Text = 'Text';
export const Image = 'Image';
export const ScrollView = 'ScrollView';
export const TouchableOpacity = 'TouchableOpacity';
export const NativeModules: Record<string, unknown> = {};

export default {
  Platform,
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  NativeModules,
};


