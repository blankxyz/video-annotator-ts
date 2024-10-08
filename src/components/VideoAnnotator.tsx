'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Stage, Layer, Line, Circle, Image as KonvaImage } from 'react-konva';

const VideoAnnotator: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [firstFrameImage, setFirstFrameImage] = useState<HTMLImageElement | null>(null);
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [polygonPoints, setPolygonPoints] = useState<number[][]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [originalVideoSize, setOriginalVideoSize] = useState<{ width: number; height: number }>({
    width: 800, // 初始默认值
    height: 600, // 初始默认值
  });

  const playerRef = useRef<ReactPlayer>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fixedWidth = 800;
  const fixedHeight = 600;

  // 处理视频文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
      setVideoReady(false);
      setPolygonPoints([]);
      setCurrentPolygon([]);
      setFirstFrameImage(null);
    }
  };

  // 捕获视频的第一帧
  const captureFirstFrame = () => {
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      // 确保获取的是 HTMLVideoElement
      if (internalPlayer instanceof HTMLVideoElement) {
        const videoElement = internalPlayer as HTMLVideoElement;
        const canvas = canvasRef.current;

        if (canvas && videoElement && videoElement.videoWidth && videoElement.videoHeight) {
          // 获取原视频尺寸
          const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;
          setOriginalVideoSize({ width: videoWidth, height: videoHeight });

          // 绘制第一帧到 Canvas
          canvas.width = fixedWidth;
          canvas.height = fixedHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(videoElement, 0, 0, fixedWidth, fixedHeight);

          const img = new window.Image();
          img.src = canvas.toDataURL('image/png');
          img.onload = () => setFirstFrameImage(img);
        }
      }
    }
  };

  // 当视频准备好时，捕获第一帧
  const handleVideoReady = () => {
    setVideoReady(true);
    captureFirstFrame();
  };

  // 开始绘制多边形
  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
    setPolygonPoints([]); // 清除之前的绘制
  };

  // 计算两点之间的距离
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  };

  // 处理画布点击事件
  const handleCanvasClick = (event: any) => {
    if (isDrawing) {
      const stage = event.target.getStage();
      const pointerPosition = stage?.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;

        // 如果当前多边形为空，记录起始点
        if (currentPolygon.length === 0) {
          setCurrentPolygon([x, y]);
        } else {
          // 检查新点是否接近起始点
          const firstX = currentPolygon[0];
          const firstY = currentPolygon[1];
          const distance = calculateDistance(x, y, firstX, firstY);
          const threshold = 10; // 间距阈值，单位像素

          if (distance < threshold && currentPolygon.length >= 4) { // 至少 2 个点
            // 自动闭合多边形
            setPolygonPoints([...polygonPoints, [...currentPolygon, firstX, firstY]]);
            setCurrentPolygon([]);
            setIsDrawing(false);
          } else {
            // 添加新点
            setCurrentPolygon([...currentPolygon, x, y]);
          }
        }
      }
    }
  };

  // 完成绘制多边形
  const endDrawing = () => {
    if (isDrawing && currentPolygon.length >= 6) {  // 至少3个点
      setPolygonPoints([...polygonPoints, currentPolygon]);
      setCurrentPolygon([]);
      setIsDrawing(false);
    }
  };

  // 导出多边形坐标为 JSON 文件（转换为原视频尺寸）
  const exportToJson = () => {
    const { width: originalWidth, height: originalHeight } = originalVideoSize;

    // 将 Konva 坐标点转换为原始视频尺寸的坐标点
    const scaledPoints = polygonPoints.map((polygon) =>
      polygon.map((point, index) => {
        const scaleFactor = index % 2 === 0 ? originalWidth / fixedWidth : originalHeight / fixedHeight;
        return point * scaleFactor;
      })
    );

    // 将坐标点保存为 JSON 文件
    const data = JSON.stringify(scaledPoints, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 创建隐藏的下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polygon_points_scaled.json'; // 设置下载文件的名称
    document.body.appendChild(a);
    a.click();

    // 移除链接
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // 释放内存中的 URL 对象
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">视频标注工具</h1>

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

      {/* 视频播放器 */}
      {videoUrl && (
        <div
          className="relative"
          style={{ width: `${fixedWidth}px`, height: `${fixedHeight}px` }}
        >
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            controls
            width={`${fixedWidth}px`}
            height={`${fixedHeight}px`}
            onReady={handleVideoReady}
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Canvas 用于捕获第一帧（隐藏的） */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 显示第一帧和标注功能 */}
      {videoReady && firstFrameImage && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">第一帧标注</h3>
          <Stage
            width={fixedWidth}
            height={fixedHeight}
            onMouseDown={handleCanvasClick}
            style={{ border: '1px solid black' }}
          >
            <Layer>
              {/* 显示第一帧图像 */}
              <KonvaImage
                image={firstFrameImage}
                width={fixedWidth}
                height={fixedHeight}
              />
              {/* 已绘制的多边形 */}
              {polygonPoints.map((points, index) => (
                <React.Fragment key={index}>
                  <Line
                    points={points}
                    stroke="blue"
                    strokeWidth={2}
                    closed={true}
                  />
                  {/* 显示多边形的点 */}
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
          disabled={!isDrawing || currentPolygon.length < 6}
        >
          完成多边形
        </button>
        {/* 导出按钮 */}
        <button
          onClick={exportToJson}
          className="px-4 py-2 bg-yellow-500 text-white rounded ml-2"
        >
          导出为JSON
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
