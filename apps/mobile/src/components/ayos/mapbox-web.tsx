import { useEffect, useMemo, useRef, type ComponentType, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import type { AndroidWebViewProps } from 'react-native-webview/lib/WebViewTypes';

type WebViewHandle = { injectJavaScript: (script: string) => void };
// The package's combined iOS & Android & Windows props type collapses to `never` with this
// React version, so type it with the shared + Android props the map uses.
const WebView = RNWebView as unknown as ComponentType<
  AndroidWebViewProps & { ref?: Ref<WebViewHandle> }
>;

import { colors } from '../../constants/design';
import type { LatLng } from '../../lib/location';

/**
 * A Mapbox map drawn with Mapbox GL JS inside a WebView. Used where the Mapbox native SDK
 * isn't in the app binary (Expo Go), so the map still pans, zooms and shows place names.
 * The APK uses the native SDK instead (report-map-mapbox.tsx, place-preview-mapbox.tsx).
 */

const GL_VERSION = '3.9.4';
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

export type WebMarkerIcon = 'alert' | 'droplet' | 'bulb';

export type WebMarker = LatLng & {
  id: string;
  color: string;
  label: string;
  /** Shown instead of the icon when set (report count). */
  count?: number;
  icon: WebMarkerIcon;
};

type Props = {
  center: LatLng;
  zoom: number;
  interactive?: boolean;
  markers?: WebMarker[];
  /** Blue dot for the user. */
  user?: LatLng | null;
  /** Fly to the user the first time `user` is set. */
  followUserOnce?: boolean;
  /** A red drop pin (New report preview). */
  pin?: LatLng | null;
  bottomInset?: number;
  onMarkerPress?: (id: string) => void;
};

export function MapboxWeb({
  center,
  zoom,
  interactive = true,
  markers = [],
  user = null,
  followUserOnce = false,
  pin = null,
  bottomInset = 0,
  onMarkerPress,
}: Props) {
  const webRef = useRef<WebViewHandle>(null);
  const loaded = useRef(false);

  // Built once: later changes go through window.ayosUpdate so the map keeps its position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildHtml(center, zoom, interactive), []);

  const state = JSON.stringify({ markers, user, followUserOnce, pin, bottomInset });
  const push = () => {
    if (!loaded.current) return;
    webRef.current?.injectJavaScript(`window.ayosUpdate && window.ayosUpdate(${state}); true;`);
  };
  useEffect(push);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; id?: string };
      if (msg.type === 'ready') {
        loaded.current = true;
        push();
      } else if (msg.type === 'open' && msg.id) {
        onMarkerPress?.(msg.id);
      }
    } catch {
      // Ignore anything that isn't ours.
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        ref={webRef}
        style={styles.web}
        source={{ html, baseUrl: 'https://localhost/' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.map },
});

const ICONS: Record<WebMarkerIcon, string> = {
  alert:
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
};

function buildHtml(center: LatLng, zoom: number, interactive: boolean) {
  const config = JSON.stringify({
    token: TOKEN,
    center: [center.longitude, center.latitude],
    zoom,
    interactive,
    icons: ICONS,
    colors: { surface: colors.surface, user: colors.primary, pin: colors.danger },
  });
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link href="https://api.mapbox.com/mapbox-gl-js/v${GL_VERSION}/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v${GL_VERSION}/mapbox-gl.js"></script>
<style>
  html,body,#map{margin:0;padding:0;height:100%;width:100%;background:${colors.map}}
  .m{display:flex;align-items:center;justify-content:center;border-radius:50%;border:3px solid;box-sizing:border-box;
     color:#fff;font:700 14px system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.3)}
  .m svg{width:17px;height:17px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .u{width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 6px rgba(29,78,216,.2)}
  .p{width:26px;height:26px;border-radius:50% 50% 0 50%;transform:rotate(45deg);border:2px solid #fff;
     display:flex;align-items:center;justify-content:center;margin-bottom:4px}
  .p::after{content:"";width:8px;height:8px;border-radius:50%;background:#fff}
</style>
</head><body><div id="map"></div>
<script>
(function(){
  var C = ${config};
  var post = function(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  mapboxgl.accessToken = C.token;
  var map = new mapboxgl.Map({
    container: 'map', style: 'mapbox://styles/mapbox/streets-v12',
    center: C.center, zoom: C.zoom, interactive: C.interactive, attributionControl: true
  });
  var markers = [], userMarker = null, pinMarker = null, followed = false;
  window.ayosUpdate = function(s){
    markers.forEach(function(m){ m.remove(); }); markers = [];
    (s.markers || []).forEach(function(r){
      var el = document.createElement('div');
      var big = r.count && r.count > 1, size = big ? 40 : 34;
      el.className = 'm'; el.style.width = el.style.height = size + 'px';
      el.style.background = r.color; el.style.borderColor = C.colors.surface;
      el.setAttribute('aria-label', r.label);
      el.innerHTML = big ? String(r.count) : '<svg viewBox="0 0 24 24">' + C.icons[r.icon] + '</svg>';
      el.addEventListener('click', function(e){ e.stopPropagation(); post({ type: 'open', id: r.id }); });
      markers.push(new mapboxgl.Marker({ element: el }).setLngLat([r.longitude, r.latitude]).addTo(map));
    });
    if (s.user) {
      if (!userMarker) {
        var u = document.createElement('div'); u.className = 'u'; u.style.background = C.colors.user;
        userMarker = new mapboxgl.Marker({ element: u });
      }
      userMarker.setLngLat([s.user.longitude, s.user.latitude]).addTo(map);
      if (s.followUserOnce && !followed) {
        followed = true;
        map.flyTo({ center: [s.user.longitude, s.user.latitude], duration: 600 });
      }
    }
    if (s.pin) {
      if (!pinMarker) {
        var p = document.createElement('div'); p.className = 'p'; p.style.background = C.colors.pin;
        pinMarker = new mapboxgl.Marker({ element: p, anchor: 'bottom' });
      }
      pinMarker.setLngLat([s.pin.longitude, s.pin.latitude]).addTo(map);
      map.jumpTo({ center: [s.pin.longitude, s.pin.latitude] });
    }
    map.setPadding({ top: 0, left: 0, right: 0, bottom: s.bottomInset || 0 });
    var ctrl = document.querySelector('.mapboxgl-ctrl-bottom-left'), ctrr = document.querySelector('.mapboxgl-ctrl-bottom-right');
    if (ctrl) ctrl.style.bottom = (s.bottomInset || 0) + 'px';
    if (ctrr) ctrr.style.bottom = (s.bottomInset || 0) + 'px';
  };
  map.on('load', function(){ post({ type: 'ready' }); });
  map.on('error', function(e){ post({ type: 'error', message: String(e && e.error && e.error.message) }); });
})();
</script></body></html>`;
}
