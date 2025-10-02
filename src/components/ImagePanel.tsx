import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  ClipPath,
  Polygon,
  Image as SvgImage,
  Rect,
} from "react-native-svg";

type Props = {
  sources: (string | number)[];
  width?: number;
  aspect?: number;
};

export default function SixPanelMosaic({
  sources,
  width = 360,
  aspect = 3 / 4,
}: Props) {
  const imgs = [...sources];
  while (imgs.length < 6) imgs.push(imgs[imgs.length - 1] ?? imgs[0]);

  const w = width;
  const h = Math.round(width / aspect);

  const P1 = "0,0  160,0  140,160  0,140";
  const P2 = "160,0  360,0  360,180  140,160";
  const P3 = "360,0  360,240  300,300  360,360  360,0";
  const P4 = "0,140  140,160  120,360  0,360";
  const P5 = "140,160  300,300  260,360  120,360";
  const P6 = "300,300  360,240  360,360  260,360";

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* фон (по желание) */}
        <Rect x={0} y={0} width={w} height={h} fill="#0b0f14" />

        <Defs>
          <ClipPath id="slot1">
            <Polygon points={P1} />
          </ClipPath>
          <ClipPath id="slot2">
            <Polygon points={P2} />
          </ClipPath>
          <ClipPath id="slot3">
            <Polygon points={P3} />
          </ClipPath>
          <ClipPath id="slot4">
            <Polygon points={P4} />
          </ClipPath>
          <ClipPath id="slot5">
            <Polygon points={P5} />
          </ClipPath>
          <ClipPath id="slot6">
            <Polygon points={P6} />
          </ClipPath>
        </Defs>

        <SvgImage
          href={imgs[0] as any}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#slot1)"
        />
        <SvgImage
          href={imgs[1] as any}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#slot2)"
        />
        <SvgImage
          href={imgs[2] as any}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#slot3)"
        />
        <SvgImage
          href={imgs[3] as any}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#slot4)"
        />
        <SvgImage
          href={imgs[4] as any}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#slot5)"
        />
        <SvgImage
          href={imgs[5] as any}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#slot6)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
