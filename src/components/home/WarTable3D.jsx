import React, { useRef, useEffect } from "react";
import * as THREE from "three";

// Live 3D dieselpunk war table — a smoldering hex battlefield rendered behind the main menu
export default function WarTable3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0d0a07, 9, 28);
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Hex terrain field
    const palette = [0x2a241c, 0x332b20, 0x3a3226, 0x262019, 0x403528];
    const R = 8;
    const SIZE = 0.58;
    for (let q = -R; q <= R; q++) {
      for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
        const h = 0.15 + Math.random() * 0.6;
        const isLit = Math.random() < 0.06;
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.52, 0.52, h, 6),
          new THREE.MeshStandardMaterial({
            color: palette[Math.floor(Math.random() * palette.length)],
            roughness: 0.9,
            metalness: 0.35,
            emissive: isLit ? 0xb07a28 : 0x000000,
            emissiveIntensity: isLit ? 0.55 : 0,
          })
        );
        const x = SIZE * Math.sqrt(3) * (q + r / 2);
        const z = SIZE * 1.5 * r;
        mesh.position.set(x, h / 2, z);
        scene.add(mesh);
      }
    }

    // Lighting — dim amber theater with a sweeping searchlight
    scene.add(new THREE.AmbientLight(0x8a7350, 0.35));
    const sun = new THREE.DirectionalLight(0xc99a4e, 0.9);
    sun.position.set(6, 10, 4);
    scene.add(sun);
    const searchlight = new THREE.PointLight(0xe8b858, 14, 11, 1.6);
    searchlight.position.set(0, 3, 0);
    scene.add(searchlight);

    // Drifting embers
    const emberCount = 180;
    const positions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const embers = new THREE.Points(
      emberGeo,
      new THREE.PointsMaterial({ color: 0xd69a3c, size: 0.05, transparent: true, opacity: 0.75 })
    );
    scene.add(embers);

    const clock = new THREE.Clock();
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      // Slow orbital drift over the table
      camera.position.set(Math.sin(t * 0.05) * 12, 6.5 + Math.sin(t * 0.11) * 0.6, Math.cos(t * 0.05) * 12);
      camera.lookAt(0, 0, 0);
      // Searchlight sweep
      searchlight.position.set(Math.sin(t * 0.4) * 5, 3, Math.cos(t * 0.27) * 5);
      // Embers rise and recycle
      const p = emberGeo.attributes.position.array;
      for (let i = 0; i < emberCount; i++) {
        p[i * 3 + 1] += 0.006 + (i % 5) * 0.0015;
        if (p[i * 3 + 1] > 6.5) p[i * 3 + 1] = 0;
      }
      emberGeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}