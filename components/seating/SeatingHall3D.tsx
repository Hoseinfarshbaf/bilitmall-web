"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { SeatCell, SeatSaleStatus, SeatingLayout } from "@/lib/seating/types";
import { buildHall3D, type Hall3DModel, type SeatWorldPose } from "@/lib/seating/to3d";
import { cn } from "@/lib/utils";

type SeatingHall3DProps = {
  layout: SeatingLayout;
  selectedIds: string[];
  onToggleSeat: (seatId: string, cell: SeatCell) => void;
  occupancy?: Record<string, Exclude<SeatSaleStatus, "available" | "selected">>;
  className?: string;
};

function resolveStatus(
  cell: SeatCell,
  selected: boolean,
  occupancy?: SeatingHall3DProps["occupancy"]
): SeatSaleStatus {
  if (selected) return "selected";
  const occ = occupancy?.[cell.id];
  if (occ) return occ;
  if (!cell.available || cell.type === "blocked") return "unavailable";
  return "available";
}

function seatColor(status: SeatSaleStatus, hovered: boolean): string {
  if (status === "selected") return "#0ea5e9";
  if (status === "sold" || status === "pending") return "#525252";
  if (status === "unavailable") return "#737373";
  if (hovered) return "#5eead4";
  return "#14b8a6";
}

function CameraRig({
  hall,
  viewSeatId,
}: {
  hall: Hall3DModel;
  viewSeatId: string | null;
}) {
  const { camera } = useThree();
  const prevView = useRef<string | null>(null);

  useFrame((_, dt) => {
    const seat = viewSeatId
      ? hall.seats.find((s) => s.id === viewSeatId)
      : null;

    if (!seat) {
      if (prevView.current) {
        camera.position.set(...hall.overviewPosition);
        camera.lookAt(...hall.overviewTarget);
        prevView.current = null;
      }
      return;
    }

    prevView.current = viewSeatId;
    const targetPos = new THREE.Vector3(...seat.eye);
    const alpha = 1 - Math.exp(-dt * 4);
    camera.position.lerp(targetPos, alpha);
    const desired = new THREE.Matrix4().lookAt(
      camera.position,
      new THREE.Vector3(...seat.lookAt),
      new THREE.Vector3(0, 1, 0)
    );
    const desiredQuat = new THREE.Quaternion().setFromRotationMatrix(desired);
    camera.quaternion.slerp(desiredQuat, alpha);
  });

  return null;
}

function SeatMesh({
  pose,
  status,
  onSelect,
  onView,
}: {
  pose: SeatWorldPose;
  status: SeatSaleStatus;
  onSelect: () => void;
  onView: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const selectable = status === "available" || status === "selected";
  const color = seatColor(status, hovered);

  return (
    <group
      position={pose.position}
      rotation={[0, -pose.yaw, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (selectable) {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!selectable) return;
        onSelect();
        onView();
      }}
    >
      {/* Seat cushion */}
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[0.52, 0.16, 0.52]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Backrest */}
      <mesh castShadow position={[0, 0.28, 0.22]}>
        <boxGeometry args={[0.52, 0.4, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Hit area */}
      <mesh visible={false} position={[0, 0.2, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
      </mesh>
    </group>
  );
}

function HallScene({
  hall,
  selectedIds,
  occupancy,
  viewSeatId,
  onToggleSeat,
  onViewSeat,
}: {
  hall: Hall3DModel;
  selectedIds: string[];
  occupancy?: SeatingHall3DProps["occupancy"];
  viewSeatId: string | null;
  onToggleSeat: SeatingHall3DProps["onToggleSeat"];
  onViewSeat: (id: string | null) => void;
}) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <>
      <color attach="background" args={["#0c1222"]} />
      <fog attach="fog" args={["#0c1222", 28, 70]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[8, 18, 10]}
        intensity={1.15}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#94a3b8", "#1e293b", 0.35]} />

      <PerspectiveCamera
        makeDefault
        position={hall.overviewPosition}
        fov={50}
        near={0.1}
        far={200}
      />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={55}
        maxPolarAngle={Math.PI * 0.48}
        target={hall.overviewTarget}
        enabled={!viewSeatId}
      />
      <CameraRig hall={hall} viewSeatId={viewSeatId} />

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, hall.depth * 0.12]}
        receiveShadow
      >
        <planeGeometry args={hall.floorSize} />
        <meshStandardMaterial color="#1a2336" roughness={0.9} />
      </mesh>

      {/* Stage */}
      <mesh castShadow receiveShadow position={hall.stageCenter}>
        <boxGeometry args={hall.stageSize} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Curtain / backdrop */}
      <mesh position={[0, 3.2, hall.stageCenter[2] - hall.stageSize[2] * 0.45]}>
        <boxGeometry args={[hall.stageSize[0] * 1.05, 5.5, 0.25]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>
      {/* Soft stage glow */}
      <pointLight
        position={[0, 3.5, hall.stageCenter[2]]}
        intensity={2.2}
        distance={18}
        color="#fbbf24"
      />

      {hall.seats.map((pose) => {
        const selected = selectedSet.has(pose.id);
        const status = resolveStatus(pose.cell, selected, occupancy);
        return (
          <SeatMesh
            key={pose.id}
            pose={pose}
            status={status}
            onSelect={() => onToggleSeat(pose.id, pose.cell)}
            onView={() => onViewSeat(pose.id)}
          />
        );
      })}
    </>
  );
}

export default function SeatingHall3D({
  layout,
  selectedIds,
  onToggleSeat,
  occupancy,
  className,
}: SeatingHall3DProps) {
  const hall = useMemo(() => buildHall3D(layout), [layout]);
  const [viewSeatId, setViewSeatId] = useState<string | null>(null);
  const viewSeat = hall.seats.find((s) => s.id === viewSeatId);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <div className="h-[min(68vh,560px)] w-full bg-[#0c1222]">
        <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <HallScene
              hall={hall}
              selectedIds={selectedIds}
              occupancy={occupancy}
              viewSeatId={viewSeatId}
              onToggleSeat={onToggleSeat}
              onViewSeat={setViewSeatId}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <p className="rounded-lg bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur-sm">
          {viewSeat
            ? `نمای صحنه از صندلی ${viewSeat.cell.label}`
            : "بچرخانید · روی صندلی خالی کلیک کنید تا از زاویه آن صحنه را ببینید"}
        </p>
        {viewSeatId ? (
          <button
            type="button"
            className="pointer-events-auto rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-neutral-900 shadow"
            onClick={() => setViewSeatId(null)}
          >
            بازگشت به نمای کلی
          </button>
        ) : null}
      </div>
    </div>
  );
}
