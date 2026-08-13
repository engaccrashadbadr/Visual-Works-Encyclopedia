import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const linkingState = vi.hoisted(() => ({
  initialUrl: null as string | null,
  onUrl: null as ((event: { url: string }) => void) | null,
}));

vi.mock("react-native", () => {
  const React = require("react");
  const element =
    (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(tag, props, children as React.ReactNode);
  return {
    ActivityIndicator: element("span"),
    Linking: {
      getInitialURL: vi.fn(() => Promise.resolve(linkingState.initialUrl)),
      addEventListener: vi.fn(
        (_event: string, handler: (event: { url: string }) => void) => {
          linkingState.onUrl = handler;
          return { remove: vi.fn() };
        }
      ),
    },
    Pressable: element("button"),
    StyleSheet: { absoluteFillObject: {}, create: (styles: unknown) => styles },
    Text: element("span"),
    View: element("div"),
  };
});

vi.mock("expo-status-bar", () => ({ StatusBar: () => null }));
vi.mock("react-native-webview", () => ({
  WebView: ({ source }: { source: { uri: string } }) => (
    <div data-testid="webview" data-uri={source.uri} />
  ),
}));

import App from "./App";
import { PRODUCTION_URL } from "./deepLinks";

const getWebView = () => document.querySelector("[data-testid=webview]");

afterEach(() => cleanup());

beforeEach(() => {
  linkingState.initialUrl = null;
  linkingState.onUrl = null;
});

describe("mobile App deep-link restoration", () => {
  it("loads the shared view from the cold-start URL", async () => {
    linkingState.initialUrl = "visualworks://marvel-timeline?order=event";
    render(<App />);

    await waitFor(() => {
      expect(getWebView()?.getAttribute("data-uri")).toBe(
        `${PRODUCTION_URL}/marvel-timeline?order=event`
      );
    });
  });

  it("updates the WebView when a resumed-app URL arrives", async () => {
    render(<App />);
    await waitFor(() => expect(linkingState.onUrl).toBeTypeOf("function"));

    linkingState.onUrl?.({ url: "visualworks://character/456?universe=789" });

    await waitFor(() => {
      expect(getWebView()?.getAttribute("data-uri")).toBe(
        `${PRODUCTION_URL}/character/456?universe=789`
      );
    });
  });
});
