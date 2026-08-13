import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

const PRODUCTION_URL = "https://visualworks-cnmtcefg.manus.space";

export default function App() {
  const [sourceUrl, setSourceUrl] = useState(PRODUCTION_URL);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    Linking.getInitialURL().then((url) => {
      if (!active || !url) return;
      if (url.startsWith("visualworks://")) {
        const path = url.replace("visualworks://", "");
        setSourceUrl(`${PRODUCTION_URL}/${path}`);
      } else if (url.startsWith(PRODUCTION_URL)) {
        setSourceUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const webSource = useMemo(() => ({ uri: sourceUrl }), [sourceUrl]);

  if (failed) {
    return (
      <View style={styles.errorScreen}>
        <StatusBar style="light" />
        <Text style={styles.title}>تعذر تحميل موسوعة Visual Works</Text>
        <Text style={styles.message}>تحقق من اتصال الإنترنت ثم أعد المحاولة.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFailed(false);
            setReloadKey((value) => value + 1);
          }}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>إعادة المحاولة</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        key={reloadKey}
        source={webSource}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text style={styles.loadingText}>جاري تحميل الموسوعة...</Text>
          </View>
        )}
        onError={() => setFailed(true)}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500) setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1020" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0b1020",
  },
  loadingText: { color: "#e2e8f0", fontSize: 16 },
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
    backgroundColor: "#0b1020",
  },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "700", textAlign: "center" },
  message: { color: "#cbd5e1", fontSize: 15, textAlign: "center" },
  retry: { backgroundColor: "#9333ea", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
