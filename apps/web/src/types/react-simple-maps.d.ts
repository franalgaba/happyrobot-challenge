declare module "react-simple-maps" {
  import type { CSSProperties, ReactNode, SVGProps } from "react";

  export type ProjectionConfig = Record<string, unknown>;

  export type ComposableMapProps = {
    width?: number;
    height?: number;
    projection?: string | ((width: number, height: number) => unknown);
    projectionConfig?: ProjectionConfig;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  };

  export type GeographyStyle = {
    default?: CSSProperties;
    hover?: CSSProperties;
    pressed?: CSSProperties;
  };

  export type GeographyProps = {
    geography: unknown;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: GeographyStyle;
    className?: string;
  };

  export type GeographiesProps = {
    geography: string | Record<string, unknown>;
    children: (context: { geographies: Array<{ rsmKey: string; [key: string]: unknown }> }) => ReactNode;
  };

  export type ZoomableGroupProps = {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (event: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (event: {
      x: number;
      y: number;
      k: number;
      dragging: boolean;
      coordinates: [number, number];
      zoom: number;
    }) => void;
    onMoveEnd?: (event: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  };

  export type LineProps = Omit<SVGProps<SVGPathElement>, "from" | "to"> & {
    from?: [number, number];
    to?: [number, number];
    coordinates?: [number, number][];
  };

  export type MarkerProps = {
    coordinates: [number, number];
    children?: ReactNode;
  };

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function Line(props: LineProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
}
