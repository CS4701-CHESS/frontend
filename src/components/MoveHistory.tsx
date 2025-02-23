import React from "react";
import { RotateCw, RefreshCw } from "lucide-react";

interface MoveHistory {
  white: string;
  black: string;
  moveNumber: number;
}

interface MoveHistoryProps {
  moves: MoveHistory[];
  height: number;
  onFlipBoard: () => void;
  onNewGame: () => void;
  currentTurn: "white" | "black";
}

const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  height,
  onFlipBoard,
  onNewGame,
  currentTurn,
}) => {
  const historyHeight = height - 64; // Account for buttons height and gap

  return (
    <div className="flex flex-col gap-4 min-w-[256px] translate-y-[52px]">
      {/* Move History Box */}
      <div
        className="bg-gray-800 p-4 rounded-lg overflow-auto"
        style={{ height: historyHeight }}
      >
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="font-semibold text-gray-300">#</div>
          <div className="font-semibold text-gray-300">White</div>
          <div className="font-semibold text-gray-300">Black</div>

          {/* Complete moves */}
          {moves.map((move, index) => (
            <React.Fragment key={move.moveNumber}>
              <div className="text-gray-400">{move.moveNumber}.</div>
              <div className="font-mono text-gray-200">{move.white}</div>
              <div className="font-mono text-gray-200">
                {/* Only show Black's move if it exists */}
                {move.black ||
                  (currentTurn === "black" && index === moves.length - 1
                    ? "..."
                    : "")}
              </div>
            </React.Fragment>
          ))}

          {/* Show next move number and "..." only when it's White's turn and either:
               1. There are no moves yet
               2. The last move is complete (has both white and black moves) */}
          {currentTurn === "white" &&
            (moves.length === 0 || moves[moves.length - 1]?.black) && (
              <React.Fragment key="next-move">
                <div className="text-gray-400">{(moves.length || 0) + 1}.</div>
                <div className="font-mono text-gray-200">...</div>
                <div className="font-mono text-gray-200"></div>
              </React.Fragment>
            )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          onClick={onFlipBoard}
        >
          <RotateCw size={18} />
          <span>Flip</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          onClick={onNewGame}
        >
          <RefreshCw size={18} />
          <span>New</span>
        </button>
      </div>
    </div>
  );
};

export default MoveHistory;
