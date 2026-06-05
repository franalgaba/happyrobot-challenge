import { useCallback, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { CallRecord, LoadRecord } from "@happyrobot-challenge/shared";
import { buildLaneRoutes, collectRouteHubs, type LaneRoute } from "../lib/geo";
import { useElementSize } from "../lib/use-element-size";

type OperationsMapProps = {
  loads: LoadRecord[];
  calls: CallRecord[];
};

type MapPosition = {
  coordinates: [number, number];
  zoom: number;
};

const GEO_URL = "/geo/us-states-10m.json";
const DEFAULT_CENTER: [number, number] = [-97, 37];
const DEFAULT_POSITION: MapPosition = { coordinates: DEFAULT_CENTER, zoom: 1 };

const STATE_STYLE = {
  default: {
    fill: "var(--hr-subtle)",
    stroke: "var(--hr-line-strong)",
    strokeWidth: 0.6,
    outline: "none",
  },
  hover: {
    fill: "var(--hr-subtle-hover)",
    stroke: "var(--hr-line-strong)",
    strokeWidth: 0.75,
    outline: "none",
    cursor: "grab",
  },
  pressed: {
    fill: "var(--hr-subtle-hover)",
    outline: "none",
    cursor: "grabbing",
  },
} as const;

function routeMidpoint(route: LaneRoute): [number, number] {
  return [(route.from[0] + route.to[0]) / 2, (route.from[1] + route.to[1]) / 2];
}

function clampZoom(value: number): number {
  return Math.min(6, Math.max(0.85, value));
}

type RouteLayerProps = {
  route: LaneRoute;
  isBooked: boolean;
  isActive: boolean;
  onHover: (routeId: string) => void;
  onLeave: () => void;
  onSelect: (routeId: string) => void;
};

function RouteLayer({ route, isBooked, isActive, onHover, onLeave, onSelect }: RouteLayerProps) {
  const stroke = isBooked ? "var(--hr-accent-green)" : "var(--hr-accent-blue)";
  const width = isActive ? 3.5 : isBooked ? 2.75 : 2;
  const opacity = isActive ? 1 : isBooked ? 0.95 : 0.8;

  return (
    <g
      className="operations-map-route"
      data-active={isActive ? "true" : undefined}
      aria-hidden="true"
      onMouseEnter={() => onHover(route.id)}
      onMouseLeave={onLeave}
      onClick={() => onSelect(route.id)}
    >
      <Line
        from={route.from}
        to={route.to}
        stroke="transparent"
        strokeWidth={14}
        strokeLinecap="round"
        style={{ pointerEvents: "stroke" }}
      />
      <Line
        from={route.from}
        to={route.to}
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        strokeOpacity={opacity}
        className="operations-map-route-line"
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
}

export function OperationsMap({ loads, calls }: OperationsMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapSize = useElementSize(canvasRef, 5 / 3);
  const [position, setPosition] = useState<MapPosition>(DEFAULT_POSITION);
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const bookedLoadIds = useMemo(
    () =>
      new Set(
        calls.filter((call) => call.outcome === "booked" && call.loadId).map((call) => call.loadId as string),
      ),
    [calls],
  );

  const activeLoads = useMemo(() => loads.filter((load) => load.active), [loads]);

  const routes = useMemo(
    () => buildLaneRoutes({ loads: activeLoads, bookedLoadIds }),
    [activeLoads, bookedLoadIds],
  );

  const hubs = useMemo(() => collectRouteHubs(routes), [routes]);

  const activeRouteId = focusedRouteId ?? selectedRouteId;
  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? null;
  const bookedRouteCount = routes.filter((route) => bookedLoadIds.has(route.id)).length;

  const focusRoute = useCallback(
    (routeId: string) => {
      const route = routes.find((entry) => entry.id === routeId);
      if (!route) return;

      setSelectedRouteId(routeId);
      setFocusedRouteId(routeId);
      setPosition({
        coordinates: routeMidpoint(route),
        zoom: clampZoom(2.4),
      });
    },
    [routes],
  );

  const hoverRoute = useCallback((routeId: string) => {
    setFocusedRouteId(routeId);
  }, []);

  const resetView = useCallback(() => {
    setPosition(DEFAULT_POSITION);
    setSelectedRouteId(null);
    setFocusedRouteId(null);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setPosition((current) => ({
      ...current,
      zoom: clampZoom(current.zoom * factor),
    }));
  }, []);

  return (
    <section className="panel panel--contain operations-map hr-enter" aria-label="Lane coverage map">
      <header className="panel-head">
        <h2>Lane coverage</h2>
        <p>
          Active freight lanes across your network
          {routes.length > 0 ? (
            <>
              {" "}
              · {routes.length} lane{routes.length === 1 ? "" : "s"}
              {bookedRouteCount > 0 ? (
                <>
                  {" "}
                  · {bookedRouteCount} booked
                </>
              ) : null}
            </>
          ) : null}
        </p>
      </header>

      <div className="panel-body operations-map-body">
        {routes.length === 0 ? (
          <div className="operations-map-empty">
            <strong>No mappable lanes yet</strong>
            <p>Active loads with recognized US city pairs will appear here as routes.</p>
          </div>
        ) : (
          <>
            <div
              ref={canvasRef}
              className="operations-map-canvas"
              aria-label="Interactive United States lane map"
            >
              <div className="operations-map-toolbar" aria-label="Map controls">
                <button type="button" className="operations-map-control" onClick={() => zoomBy(1.35)} aria-label="Zoom in">
                  +
                </button>
                <button type="button" className="operations-map-control" onClick={() => zoomBy(1 / 1.35)} aria-label="Zoom out">
                  −
                </button>
                <button type="button" className="operations-map-control operations-map-control--text" onClick={resetView}>
                  Reset
                </button>
              </div>

              {activeRoute ? (
                <div className="operations-map-tooltip" role="status">
                  <strong>
                    {activeRoute.origin} → {activeRoute.destination}
                  </strong>
                  <span>
                    {activeRoute.equipmentType}
                    {activeRoute.miles != null ? ` · ${activeRoute.miles.toLocaleString()} mi` : ""}
                    {bookedLoadIds.has(activeRoute.id) ? " · Booked" : ""}
                  </span>
                </div>
              ) : null}

              <ComposableMap
                projection="geoAlbersUsa"
                width={mapSize.width}
                height={mapSize.height}
                className="operations-map-svg"
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup
                  center={position.coordinates}
                  zoom={position.zoom}
                  minZoom={0.85}
                  maxZoom={6}
                  onMoveEnd={({ coordinates, zoom }) => {
                    setPosition({ coordinates, zoom });
                  }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography key={geo.rsmKey} geography={geo} style={STATE_STYLE} />
                      ))
                    }
                  </Geographies>

                  {routes.map((route) => {
                    const isBooked = bookedLoadIds.has(route.id);
                    const isActive = activeRouteId === route.id;
                    return (
                      <RouteLayer
                        key={route.id}
                        route={route}
                        isBooked={isBooked}
                        isActive={isActive}
                        onHover={hoverRoute}
                        onLeave={() => setFocusedRouteId(null)}
                        onSelect={focusRoute}
                      />
                    );
                  })}

                  {hubs.map((hub) => {
                    const isHubActive =
                      activeRoute != null &&
                      (hub.label === activeRoute.origin || hub.label === activeRoute.destination);

                    return (
                      <Marker key={hub.id} coordinates={hub.coordinates}>
                        <circle
                          r={isHubActive ? 6 : 4.5}
                          className="operations-map-hub"
                          data-active={isHubActive ? "true" : undefined}
                        />
                        {isHubActive ? (
                          <text textAnchor="middle" y={-10} className="operations-map-hub-label">
                            {hub.label}
                          </text>
                        ) : null}
                      </Marker>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>

              <p className="operations-map-hint">Drag to pan · Scroll or pinch to zoom · Click a lane to focus</p>
            </div>

            <ul className="operations-map-legend" aria-label="Map legend">
              <li>
                <span className="operations-map-legend-swatch operations-map-legend-swatch--load" aria-hidden />
                Active load lane
              </li>
              <li>
                <span className="operations-map-legend-swatch operations-map-legend-swatch--booked" aria-hidden />
                Booked on call
              </li>
            </ul>

            <ol className="operations-map-lanes" aria-label="Active lanes">
              {routes.map((route) => {
                const isBooked = bookedLoadIds.has(route.id);
                const isSelected = selectedRouteId === route.id;
                return (
                  <li key={route.id}>
                    <button
                      type="button"
                      className="operations-map-lane-btn"
                      data-selected={isSelected ? "true" : undefined}
                      onClick={() => focusRoute(route.id)}
                    >
                      <span className="operations-map-lane-label">
                        {route.origin} → {route.destination}
                      </span>
                      <span className="operations-map-lane-meta">
                        {route.equipmentType}
                        {route.miles != null ? ` · ${route.miles.toLocaleString()} mi` : ""}
                        {isBooked ? " · Booked" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
