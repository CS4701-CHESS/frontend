import React, { useEffect, useState, useRef } from "react";
import { Zap } from "lucide-react";

interface BestMoveProps {
  fen: string;
  visible: boolean;
  onMoveSuggestion?: (from: string, to: string) => void;
}

interface BestMoveResponse {
  text: string;
  eval: number;
  move: string;
  depth: number;
  winChance: number;
  continuationArr: string[];
  mate: number | null;
  centipawns: string;
  san: string;
  lan: string;
  from: string;
  to: string;
  type: string;
}

const BestMove: React.FC<BestMoveProps> = ({ fen, visible, onMoveSuggestion }) => {
  const [bestMove, setBestMove] = useState<BestMoveResponse | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!visible) return;
    
    // Initialize WebSocket connection
    ws.current = new WebSocket("wss://chess-api.com/v1");

    ws.current.onopen = () => {
      // Send initial position when connection is established
      if (ws.current && fen) {
        ws.current.send(
          JSON.stringify({
            fen,
            depth: 18,
            variants: 1,
          })
        );
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "move" || data.type === "bestmove") {
        setBestMove(data);
        
        // Notify parent about the suggested move to draw arrow
        if (onMoveSuggestion && data.from && data.to) {
          onMoveSuggestion(data.from, data.to);
        }
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [visible]);

  // Send new position to WebSocket when FEN changes
  useEffect(() => {
    if (!visible) return;
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN && fen) {
      ws.current.send(
        JSON.stringify({
          fen,
          depth: 18,
          variants: 1,
        })
      );
    }
  }, [fen, visible]);

  if (!visible || !bestMove) return null;

  return (
    <div className="absolute bottom-20 left-4 z-20 bg-gray-800 text-white p-3 rounded-md shadow-md border border-amber-500">
      <div className="flex items-center gap-2 font-medium mb-1">
        <Zap size={18} className="text-amber-400" />
        <span>Best Move</span>
      </div>
      <div className="text-sm">
        <p className="mb-1">
          <span className="font-semibold">Move: </span>
          <span className="font-mono">{bestMove.from} → {bestMove.to} ({bestMove.san})</span>
        </p>
        <p className="mb-1">
          <span className="font-semibold">Evaluation: </span>
          <span className="font-mono">{bestMove.eval.toFixed(2)}</span>
        </p>
        <p>
          <span className="font-semibold">Depth: </span>
          <span className="font-mono">{bestMove.depth}</span>
        </p>
      </div>
    </div>
  );
};

export default BestMove;