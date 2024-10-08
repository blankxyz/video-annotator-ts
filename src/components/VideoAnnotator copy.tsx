// src/components/VideoAnnotator.tsx
'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactPlayer from 'react-player';
import { Stage, Layer, Line, Circle } from 'react-konva';

const VideoAnnotator: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<number[][]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 640, height: 360 });

  const playerRef = useRef<ReactPlayer>(null);
  const stageRef = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 确认组件已挂载
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 处理视频文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
      setCurrentFrame(null);
      setPolygonPoints([]);
      setCurrentPolygon([]);
    }
  };

  // 获取视频播放器尺寸
  const updateVideoDimensions = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setVideoDimensions({ width: clientWidth, height: clientHeight });
    }
  };

  // 在窗口调整大小时更新视频尺寸
  useEffect(() => {
    window.addEventListener('resize', updateVideoDimensions);
    return () => {
      window.removeEventListener('resize', updateVideoDimensions);
    };
  }, []);

  // 初次加载和视频加载完成后获取尺寸
  useEffect(() => {
    updateVideoDimensions();
  }, [videoUrl]);

  // 捕获当前视频帧
  const captureFrame = () => {
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer instanceof HTMLVideoElement && internalPlayer.readyState >= 2) { // HAVE_CURRENT_DATA
        const canvas = document.createElement('canvas');
        canvas.width = internalPlayer.videoWidth;
        canvas.height = internalPlayer.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(internalPlayer, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL();
          setCurrentFrame(dataURL);
          setVideoDimensions({ width: canvas.width, height: canvas.height });
        }
      } else {
        console.warn("视频尚未准备好捕获帧");
      }
    } else {
      console.error("播放器引用为空");
    }
  };

  // 视频准备就绪的回调
  const handleVideoReady = () => {
    console.log("视频已准备好");
    captureFrame(); // 捕获第一帧
  };

  // 视频播放、暂停或跳转时捕获当前帧
  const handleVideoProgress = () => {
    captureFrame();
  };

  // 开始绘制多边形
  const startDrawing = () => {
    console.log("开始绘制");
    setIsDrawing(true);
    setCurrentPolygon([]);
  };

  // 处理画布点击事件
  const handleCanvasClick = (event: any) => {
    if (isDrawing) {
      const stage = event.target.getStage();
      const pointerPosition = stage?.getPointerPosition();
      if (pointerPosition) {
        console.log("指针位置:", pointerPosition);
        setCurrentPolygon([...currentPolygon, pointerPosition.x, pointerPosition.y]);
      }
    }
  };

  // 结束绘制多边形
  const endDrawing = () => {
    if (currentPolygon.length >= 6) {  // 至少 3 个点
      console.log("完成多边形坐标:", currentPolygon);
      setPolygonPoints([...polygonPoints, currentPolygon]);
    }
    setCurrentPolygon([]);
    setIsDrawing(false);
    console.log("完成绘制");
  };

  // 处理键盘按键（例如按下 Escape 键取消绘制）
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setCurrentPolygon([]);
      setIsDrawing(false);
      console.log("绘制已取消");
    }
  };

  // 获取图像的实际渲染尺寸
  useLayoutEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current.getBoundingClientRect();
      console.log("图像尺寸:", width, height);
      setVideoDimensions({ width, height });
    }
  }, [currentFrame]);

  // 如果组件未挂载，返回 null
  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* <h1 className="text-3xl font-bold mb-4">视频标注工具</h1> */}

      {/* 视频选择按钮和远程视频 URL 输入 */}
      <div className="mb-4">
        <input type="file" accept="video/*" onChange={handleFileChange} />
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="输入远程视频 URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* 视频播放器和绘制区域 */}
      {videoUrl && (
        <div
          className="relative"
          ref={containerRef}
          style={{ width: '100%', height: 'auto' }}
        >
          {/* 视频播放器 */}
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            controls
            width="100%"
            height="auto"
            onReady={handleVideoReady}
            onProgress={handleVideoProgress}
          />

          {/* 绘制多边形的 Konva 画布 */}
          <Stage
            width={videoDimensions.width}
            height={videoDimensions.height}
            onMouseDown={handleCanvasClick}
            className="absolute top-0 left-0"
            ref={stageRef}
            style={{
              pointerEvents: isDrawing ? 'auto' : 'none', // 仅在绘制时允许交互
            }}
          >
            <Layer>
              {/* 已绘制的多边形 */}
              {polygonPoints.map((points, index) => (
                <React.Fragment key={index}>
                  <Line
                    points={points}
                    stroke="blue"
                    strokeWidth={2}
                    closed={true}
                  />
                  {/* 绘制已标注的点 */}
                  {points.map((point, idx) => idx % 2 === 0 && (
                    <Circle
                      key={idx}
                      x={points[idx]}
                      y={points[idx + 1]}
                      radius={5}
                      fill="blue"
                    />
                  ))}
                </React.Fragment>
              ))}
              {/* 当前正在绘制的多边形 */}
              {currentPolygon.length > 0 && (
                <React.Fragment>
                  <Line
                    points={currentPolygon}
                    stroke="red"
                    strokeWidth={2}
                    closed={false}
                  />
                  {/* 绘制当前正在标注的点 */}
                  {currentPolygon.map((point, idx) => idx % 2 === 0 && (
                    <Circle
                      key={idx}
                      x={currentPolygon[idx]}
                      y={currentPolygon[idx + 1]}
                      radius={5}
                      fill="red"
                    />
                  ))}
                </React.Fragment>
              )}
            </Layer>
          </Stage>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="mt-4">
        <button
          onClick={startDrawing}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          disabled={isDrawing}
        >
          {isDrawing ? '正在绘制...' : '开始标注'}
        </button>
        <button
          onClick={endDrawing}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={!isDrawing}
        >
          完成多边形
        </button>
      </div>

      {/* 显示多边形坐标 */}
      <div className="mt-4">
        <h3 className="text-lg font-bold">多边形坐标:</h3>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(polygonPoints, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default VideoAnnotator;
