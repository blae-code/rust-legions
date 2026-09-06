import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import useCallsign from "@/hooks/useCallsign";
import { scenarioById } from "@/lib/skirmish/scenarios";
import { saveSkirmish } from "@/lib/skirmish/session";
import { mySeat, withSeat, withoutSeat, sideSpent, fieldBlock, orderFromLobby } from "@/lib/skirmish/lobby";
import LobbyHeader from "@/components/skirmish/lobby/LobbyHeader";
import SideColumn from "@/components/skirmish/lobby/SideColumn";
import SeatRequisition from "@/components/skirmish/lobby/SeatRequisition";
import HostControls from "@/components/skirmish/lobby/HostControls";
import GameChat from "@/components/game/chat/GameChat";

// The muster roll for one skirmish. Every seated commander sees the same roll
// live; when the host fields it, each of them is carried into the same arena.
export default function SkirmishLobby() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const callsign = useCallsign();
  const [lobby, setLobby] = useState(null);

  const load = () => base44.entities.SkirmishLobby.get(lobbyId).then(setLobby);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.SkirmishLobby.subscribe((ev) => {
      if (ev.id === lobbyId || ev.data?.id === lobbyId) load();
    });
    const tick = setInterval(load, 6000);
    return () => { unsubscribe(); clearInterval(tick); };
  }, [lobbyId]);

  // The host's order fields everyone: build my copy and march.
  useEffect(() => {
    if (!lobby || !user) return;
    if (lobby.status === "fielded") {
      saveSkirmish(orderFromLobby(lobby, scenarioById(lobby.scenarioId), user.id));
      navigate("/tactical-preview");
    }
    if (lobby.status === "closed") navigate("/skirmish");
  }, [lobby?.status, user?.id]);

  if (!lobby || !user) {
    return <p className="font-mono text-[10px] tracking-widest text-muted-foreground p-6">RAISING THE MUSTER ROLL…</p>;
  }

  const scenario = scenarioById(lobby.scenarioId);
  const me = mySeat(lobby, user.id);
  const isHost = lobby.hostUserId === user.id;
  const save = (patch) => base44.entities.SkirmishLobby.update(lobbyId, patch).then(load);

  const join = (side) =>
    save({ seats: withSeat(lobby, { userId: user.id, callsign: callsign || "Commander", side, force: me?.side === side ? me.force : [], ready: false }) });
  const patchMe = (fields) => save({ seats: withSeat(lobby, { ...me, ...fields }) });
  const leave = () => save({ seats: withoutSeat(lobby, user.id) }).then(() => navigate("/skirmish"));

  return (
    <div className="cq-page-in space-y-4">
      <LobbyHeader
        lobby={lobby}
        scenario={scenario}
        isHost={isHost}
        onDisband={() => save({ status: "closed" })}
        onLeave={leave}
      />
      <div className="grid xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {["attacker", "defender"].map((side) => (
              <SideColumn key={side} side={side} lobby={lobby} scenario={scenario} me={me} onJoin={join} />
            ))}
          </div>
          {me ? (
            <SeatRequisition
              seat={me}
              points={scenario.points}
              sideLeft={scenario.points - sideSpent(lobby, me.side)}
              onForce={(force) => patchMe({ force, ready: false })}
              onReady={(ready) => patchMe({ ready })}
            />
          ) : (
            <div className="cq-panel p-4">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
                TAKE A SEAT ON EITHER SIDE TO REQUISITION A FORCE
              </p>
            </div>
          )}
        </div>
        <aside className="sticky top-20 space-y-4">
          <GameChat gameId={lobbyId} myName={callsign || "Commander"} />
          {isHost ? (
            <HostControls
              lobby={lobby}
              block={fieldBlock(lobby, scenario)}
              onDoctrine={(doctrine) => save({ doctrine })}
              onLaunch={() => save({ status: "fielded" })}
            />
          ) : (
            <div className="cq-slip p-3">
              <p className="cq-label text-rust">Awaiting Host</p>
              <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
                {fieldBlock(lobby, scenario) || "ALL SEATS READY — HOST MAY FIELD"}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}