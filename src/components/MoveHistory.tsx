import React from "react";
import { RotateCw, RefreshCw, Eye, EyeOff, Zap } from "lucide-react";

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
  onToggleEvalBar?: (visible: boolean) => void;
  onToggleBestMove?: (visible: boolean) => void;
  showEvalBar?: boolean;
  showBestMove?: boolean;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  height,
  onFlipBoard,
  onNewGame,
  currentTurn,
  onToggleEvalBar = () => {},
  onToggleBestMove = () => {},
  showEvalBar = true,
  showBestMove = false,
}) => {
  // Reduce history height to account for all buttons (original buttons + new toggle buttons)
  const historyHeight = height - 110; // Account for buttons height and gap

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

      {/* Common button style base */}
      {/* Both button rows */}
      <div className="flex gap-3 mb-2">
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap text-sm
            ${showEvalBar 
              ? "bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" 
              : "bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"} 
            text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95`}
          onClick={() => onToggleEvalBar(!showEvalBar)}
        >
          {showEvalBar ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>Eval</span>
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap text-sm
            ${showBestMove 
              ? "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
              : "bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"} 
            text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95`}
          onClick={() => onToggleBestMove(!showBestMove)}
        >
          <Zap size={16} />
          <span>Best</span>
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap text-sm bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          onClick={onFlipBoard}
        >
          <RotateCw size={16} />
          <span>Flip</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap text-sm bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          onClick={onNewGame}
        >
          <RefreshCw size={16} />
          <span>New</span>
        </button>
      </div>
    </div>
  );
};

export default MoveHistory;
