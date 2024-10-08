// src/components/SimpleKonva.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 react-konva 组件
const Stage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Stage })), { ssr: false });
const Layer = dynamic(() => import('react-konva').then(mod => ({ default: mod.Layer })), { ssr: false });
const Line = dynamic(() => import('react-konva').then(mod => ({ default: mod.Line })), { ssr: false });

const SimpleKonva: React.FC = () => {
  return (
    <Stage width={500} height={500}>
      <Layer>
        <Line
          points={[50, 50, 100, 100, 150, 50]}
          stroke="blue"
          strokeWidth={2}
          closed
        />
      </Layer>
    </Stage>
  );
};

export default SimpleKonva;
