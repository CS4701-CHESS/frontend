import React, { useEffect, useState, useRef } from "react";

interface EvaluationBarProps {
  fen: string;
  height: number;
  orientation: "white" | "black";
}

interface EvalResponse {
  type: string;
  eval?: number;
  mate?: number;
  winChance: number;
  depth: number;
}

const EvaluationBar: React.FC<EvaluationBarProps> = ({
  fen,
  height,
  orientation,
}) => {
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [isMate, setIsMate] = useState<number | null>(null);
  const [winChance, setWinChance] = useState<number>(50);
  const ws = useRef<WebSocket | null>(null);
  const [depth, setDepth] = useState<number>(0);

  useEffect(() => {
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
      const data: EvalResponse = JSON.parse(event.data);

      if (data.type === "bestmove" || data.type === "move") {
        if (data.mate !== null && data.mate !== undefined) {
          setIsMate(data.mate);
          setEvaluation(null);
        } else if (data.eval !== undefined) {
          setEvaluation(data.eval);
          setIsMate(null);
        }

        setWinChance(data.winChance);
        setDepth(data.depth);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Try to reconnect on error
      if (ws.current) {
        ws.current.close();
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Reset evaluation when FEN changes to provide immediate feedback
  useEffect(() => {
    // Optional: Reset or adjust evaluation values when position changes
    // This provides visual feedback while waiting for the new evaluation
    setDepth(0); // Reset depth to show calculation is in progress
  }, [fen]);

  // Send new position to WebSocket when FEN changes
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && fen) {
      try {
        ws.current.send(
          JSON.stringify({
            fen,
            depth: 18,
            variants: 1,
          })
        );
      } catch (error) {
        console.error("Error sending position to WebSocket:", error);
        // Attempt to reconnect
        ws.current = new WebSocket("wss://chess-api.com/v1");
      }
    } else if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
      // Connection was closed, try to reopen
      ws.current = new WebSocket("wss://chess-api.com/v1");
    }
  }, [fen]);

  // Calculate the height of the white portion of the bar
  const whiteBarHeight = Math.min(100, Math.max(0, winChance));
  const displayedEval =
    orientation === "white" ? evaluation : evaluation ? -evaluation : null;

  return (
    <div
      className="flex flex-col items-center mr-4 translate-y-[52px]"
      style={{ height }}
    >
      <div className="relative w-8 flex-1 rounded overflow-hidden">
        <div
          className="absolute w-full bg-black transition-all duration-300"
          style={{
            height: "100%",
            bottom: 0,
          }}
        />
        <div
          className="absolute w-full bg-white transition-all duration-300"
          style={{
            height: `${whiteBarHeight}%`,
            bottom: 0,
          }}
        />
      </div>
      <div className="mt-2 text-sm font-mono">
        {isMate !== null ? (
          <span className="font-bold text-red-500">M{Math.abs(isMate)}</span>
        ) : evaluation !== null ? (
          <span
            className={
              displayedEval && displayedEval > 0
                ? "text-white"
                : "text-gray-400"
            }
          >
            {displayedEval ? displayedEval.toFixed(1) : "0.0"}
          </span>
        ) : (
          "0.0"
        )}
      </div>
      <div className="text-xs text-gray-500">d{depth}</div>
    </div>
  );
};

export default EvaluationBar;
