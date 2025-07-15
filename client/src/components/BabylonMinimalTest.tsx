import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

const BabylonMinimalTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    const camera = new BABYLON.ArcRotateCamera('camera', 0, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    BABYLON.MeshBuilder.CreateBox('box', {}, scene);

    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
    return () => {
      engine.dispose();
      window.removeEventListener('resize', () => engine.resize());
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
    </div>
  );
};

export default BabylonMinimalTest; 