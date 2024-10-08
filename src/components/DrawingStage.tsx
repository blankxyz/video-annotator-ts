'use client';

import React from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

interface DrawingStageProps {
  videoDimensions: { width: number; height: number };
  polygonPoints: number[][];
  currentPolygon: number[];
  handleCanvasClick: (event: KonvaEventObject<MouseEvent>) => void;
  endDrawing: () => void;
}

const DrawingStage: React.FC<DrawingStageProps> = ({
  videoDimensions,
  polygonPoints,
  currentPolygon,
  handleCanvasClick,
  endDrawing,
}) => {
  return (
    <Stage
      width={videoDimensions.width}
      height={videoDimensions.height}
      onMouseDown={handleCanvasClick}
      onMouseUp={endDrawing}
      className="absolute top-0 left-0"
    //   ref={stageRef}
    >
      <Layer>
        {/* 已绘制的多边形 */}
        {polygonPoints.map((points, index) => (
          <Line
            key={index}
            points={points}
            stroke="blue"
            strokeWidth={2}
            closed={true}
          />
        ))}
        {/* 当前正在绘制的多边形 */}
        <Line
          points={currentPolygon}
          stroke="red"
          strokeWidth={2}
          closed={false}
        />
      </Layer>
    </Stage>
  );
};

export default DrawingStage;
